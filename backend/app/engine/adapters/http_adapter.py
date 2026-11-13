"""HTTP target adapter with robust SSRF protections, timeout enforcement, and response normalization."""

import ipaddress
import socket
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.engine.adapters.base import AdapterRequest, AdapterResponse, BaseAdapter

BLOCKED_IP_RANGES = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata AWS/GCP/Azure
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


class HttpAdapter(BaseAdapter):
    """HTTP client adapter for evaluating remote AI targets."""

    @staticmethod
    def validate_destination_ip(hostname: str) -> tuple[bool, str | None]:
        """Validate destination IP address to prevent SSRF against internal/cloud networks."""
        if settings.SSRF_ALLOW_PRIVATE_IPS:
            return True, None

        # 1. Direct IP check (fast path, avoids DNS network timeouts)
        try:
            ip_obj = ipaddress.ip_address(hostname)
            for blocked_range in BLOCKED_IP_RANGES:
                if ip_obj in blocked_range:
                    return (
                        False,
                        f"SSRF blocked: destination IP {hostname} resolves to restricted private/cloud metadata range ({blocked_range})",
                    )
            return True, None
        except ValueError:
            pass

        # 2. Hostname DNS resolution check
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)

                for blocked_range in BLOCKED_IP_RANGES:
                    if ip_obj in blocked_range:
                        return (
                            False,
                            f"SSRF blocked: destination IP {ip_str} resolves to restricted private/cloud metadata range ({blocked_range})",
                        )
            return True, None
        except socket.gaierror as e:
            return False, f"DNS resolution failed for hostname '{hostname}': {e}"
        except Exception as e:
            return False, f"Destination validation failed: {e}"

    def validate_configuration(self, config: dict[str, Any]) -> tuple[bool, str | None]:
        base_url = config.get("base_url")
        if not base_url:
            return False, "Target configuration missing 'base_url'"

        parsed = urlparse(base_url)
        if parsed.scheme not in ("http", "https"):
            return False, f"Unsupported URL protocol '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid base_url: missing hostname"

        is_safe, reason = self.validate_destination_ip(hostname)
        if not is_safe:
            return False, reason

        return True, None

    def get_capabilities(self) -> list[str]:
        return ["CHAT_API", "COMPLETION_API", "HTTP_REST", "CUSTOM"]

    async def execute(self, request: AdapterRequest) -> AdapterResponse:
        start_time = time.perf_counter()
        config = request.target_config
        base_url = config.get("base_url", "").rstrip("/")
        endpoint = config.get("endpoint", "")
        if endpoint and not endpoint.startswith("/"):
            endpoint = "/" + endpoint
        full_url = f"{base_url}{endpoint}"

        # 1. SSRF validation on destination
        parsed = urlparse(full_url)
        if not parsed.hostname:
            return AdapterResponse(
                raw_text="",
                status_code=400,
                latency_ms=0,
                is_success=False,
                error_message="Invalid destination URL",
            )

        is_safe, reason = self.validate_destination_ip(parsed.hostname)
        if not is_safe:
            return AdapterResponse(
                raw_text="",
                status_code=403,
                latency_ms=0,
                is_success=False,
                error_message=reason or "SSRF check failed",
            )

        # 2. Prepare HTTP method, headers, and body
        http_method = config.get("http_method", "POST").upper()
        headers = dict(config.get("headers_config") or {})
        headers.setdefault("User-Agent", "PromptFence-Security-Scanner/1.0")
        headers.setdefault("Content-Type", "application/json")

        # Handle Auth headers
        auth_type = config.get("authentication_type", "NONE")
        if auth_type == "BEARER" and config.get("auth_token"):
            headers["Authorization"] = f"Bearer {config.get('auth_token')}"
        elif auth_type == "API_KEY" and config.get("api_key"):
            key_name = config.get("api_key_header", "X-API-Key")
            headers[key_name] = config.get("api_key")

        # 3. Payload template substitution
        request_template = config.get("request_template")
        if request_template:
            # Deep string substitution of {prompt}
            import json
            template_str = json.dumps(request_template)
            # Escape prompt for JSON injection safety
            clean_prompt = request.prompt.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
            substituted = template_str.replace("{prompt}", clean_prompt)
            try:
                json_body = json.loads(substituted)
            except Exception:
                json_body = {"prompt": request.prompt}
        else:
            json_body = {"prompt": request.prompt}

        timeout = min(request.timeout_seconds, 60)
        max_bytes = settings.EXECUTION_MAX_RESPONSE_BYTES

        try:
            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=False,  # Prevent redirect-based SSRF bypass
                verify=True,
            ) as client:
                resp = await client.request(
                    method=http_method,
                    url=full_url,
                    headers=headers,
                    json=json_body if http_method in ("POST", "PUT", "PATCH") else None,
                )

                content_len = len(resp.content)
                if content_len > max_bytes:
                    return AdapterResponse(
                        raw_text=resp.text[:2000] + "... [TRUNCATED DUE TO SIZE LIMIT]",
                        status_code=resp.status_code,
                        latency_ms=int((time.perf_counter() - start_time) * 1000),
                        is_success=False,
                        error_message=f"Target response size ({content_len} bytes) exceeded maximum permitted {max_bytes} bytes",
                    )

                latency = int((time.perf_counter() - start_time) * 1000)
                return AdapterResponse(
                    raw_text=resp.text,
                    status_code=resp.status_code,
                    latency_ms=latency,
                    is_success=resp.is_success,
                    error_message=None if resp.is_success else f"HTTP {resp.status_code}: {resp.reason_phrase}",
                )

        except httpx.TimeoutException:
            latency = int((time.perf_counter() - start_time) * 1000)
            return AdapterResponse(
                raw_text="",
                status_code=504,
                latency_ms=latency,
                is_success=False,
                error_message=f"Connection timed out after {timeout} seconds",
            )
        except Exception as e:
            latency = int((time.perf_counter() - start_time) * 1000)
            return AdapterResponse(
                raw_text="",
                status_code=502,
                latency_ms=latency,
                is_success=False,
                error_message=f"HTTP Adapter request failed: {str(e)}",
            )

    async def health_check(self, target_config: dict[str, Any]) -> tuple[bool, int, int, str]:
        start_time = time.perf_counter()
        base_url = target_config.get("base_url", "").rstrip("/")
        endpoint = target_config.get("endpoint", "")
        if endpoint and not endpoint.startswith("/"):
            endpoint = "/" + endpoint
        full_url = f"{base_url}{endpoint}"

        parsed = urlparse(full_url)
        if not parsed.hostname:
            return False, 400, 0, "Invalid target URL"

        is_safe, reason = self.validate_destination_ip(parsed.hostname)
        if not is_safe:
            return False, 403, 0, reason or "SSRF check failed"

        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
                resp = await client.get(full_url)
                latency = int((time.perf_counter() - start_time) * 1000)
                return resp.is_success, resp.status_code, latency, f"HTTP {resp.status_code} ({resp.reason_phrase})"
        except Exception as e:
            latency = int((time.perf_counter() - start_time) * 1000)
            return False, 0, latency, f"Health check failed: {str(e)}"
