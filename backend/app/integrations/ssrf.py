"""SSRF (Server-Side Request Forgery) protection and safe outbound HTTP client."""

import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from app.core.exceptions import SSRFError

# Blocked IP networks
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),         # RFC 1918 Private
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (CGNAT)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / AWS / GCP / Azure metadata
    ipaddress.ip_network("172.16.0.0/12"),      # RFC 1918 Private
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.88.99.0/24"),     # 6to4 Relay Anycast
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("198.18.0.0/15"),      # Network Interconnect Device Benchmark Testing
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved for future use
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    # IPv6 blocked
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::ffff:0:0/96"),      # IPv4-mapped IPv6
    ipaddress.ip_network("100::/64"),           # Discard-only
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
    ipaddress.ip_network("fc00::/7"),           # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

# Blocked hostnames (cloud metadata, localhost aliases)
BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254",
}


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to any blocked / private / internal range."""
    # Also check built-in properties
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return True
    return any(ip in network for network in BLOCKED_NETWORKS)


def validate_url(url: str) -> tuple[str, list[str]]:
    """
    Validate a URL against SSRF attacks.
    Returns (normalized_url, resolved_ips).
    Raises SSRFError if validation fails.
    """
    if not url:
        raise SSRFError("URL cannot be empty")

    try:
        parsed = urlparse(url.strip())
    except Exception as e:
        raise SSRFError(f"Invalid URL structure: {e}") from e

    # 1. Enforce scheme (http or https only)
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFError(f"Unsupported scheme '{parsed.scheme}'. Only http and https are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFError("URL must contain a valid hostname")

    # 2. Block known sensitive hostnames
    if hostname.lower() in BLOCKED_HOSTNAMES:
        raise SSRFError(f"Hostname '{hostname}' is not permitted")

    # 3. If hostname is directly an IP address, validate it
    try:
        ip_obj = ipaddress.ip_address(hostname)
        if is_ip_blocked(ip_obj):
            raise SSRFError(f"IP address '{hostname}' is not permitted (private/reserved)")
        return url, [str(ip_obj)]
    except ValueError:
        pass  # It's a domain name, proceed to DNS resolution

    # 4. Resolve DNS and validate ALL resolved IP addresses
    resolved_ips: list[str] = []
    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
        for item in addr_info:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip_obj):
                raise SSRFError(f"Resolved destination IP '{ip_str}' is in a restricted range")
            if ip_str not in resolved_ips:
                resolved_ips.append(ip_str)
    except socket.gaierror as e:
        raise SSRFError(f"DNS resolution failed for '{hostname}': {e}") from e

    if not resolved_ips:
        raise SSRFError(f"No IP addresses could be resolved for '{hostname}'")

    return url, resolved_ips


async def safe_http_request(
    url: str,
    method: str = "GET",
    headers: dict | None = None,
    json_data: dict | None = None,
    timeout: float = 10.0,
) -> httpx.Response:
    """
    Make a safe outbound HTTP request with pre-validation against SSRF and strict timeouts.
    Disallows automatic redirect following to prevent redirect-based SSRF / rebinding.
    """
    validate_url(url)

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(timeout, connect=5.0),
        follow_redirects=False,
    ) as client:
        response = await client.request(
            method=method.upper(),
            url=url,
            headers=headers,
            json=json_data,
        )
        # If redirected, revalidate destination URL
        if response.is_redirect:
            redirect_url = response.headers.get("location")
            if redirect_url:
                validate_url(redirect_url)
        return response

