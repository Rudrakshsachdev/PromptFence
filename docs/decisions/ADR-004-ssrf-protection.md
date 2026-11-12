# ADR-004: Multi-Layered SSRF Protection for Target Endpoints

## Status
Accepted

## Context
PromptFence allows security researchers to register external AI API endpoints (Targets) and will dispatch HTTP requests against them during test execution. Without stringent validation, malicious or compromised users could submit internal URLs (e.g. `http://169.254.169.254/latest/meta-data/`, `http://localhost:5432`, `http://10.0.0.1/admin`) to execute Server-Side Request Forgery (SSRF) against internal cloud infrastructure, orchestration networks, or loopback services.

## Decision
We enforce multi-stage, defense-in-depth SSRF protection implemented in `app/integrations/ssrf.py`:
1. **Scheme Validation**:
   - Only `http` and `https` schemes are permitted. Schemes like `file://`, `gopher://`, `ftp://` are rejected.
2. **FQDN and Hostname Validation**:
   - Hostnames are resolved to IP addresses via DNS.
   - Hostnames matching cloud metadata domains (e.g., `metadata.google.internal`, `169.254.169.254`) are blocked prior to resolution.
3. **IP Range and Subnet Blocking**:
   - Resolved IPs are checked using Python's `ipaddress` library against:
     - `127.0.0.0/8` and `::1` (Loopback)
     - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
     - `169.254.0.0/16` and `fe80::/10` (Link-local & Cloud Metadata)
     - `100.64.0.0/10` (Carrier-Grade NAT)
     - `0.0.0.0/8`, `224.0.0.0/4`, `240.0.0.0/4` (Reserved, Multicast)
4. **DNS Rebinding Prevention**:
   - Both target registration and test execution resolve DNS and validate destination IP before establishing socket connections.

## Consequences
### Positive
- Prevents exfiltration of cloud instance identity tokens, database credentials, and container metadata.
- Safe to run in multi-tenant SaaS environments or corporate private clouds.

### Negative / Trade-offs
- Legitimate local testing against `localhost` requires explicitly running in a designated `DEBUG_ALLOW_LOCAL_TARGETS=true` development mode.
- Slight DNS resolution latency during target registration.

