# SSRF Protection Specifications — PromptFence

## Overview
PromptFence allows security researchers to define target application URLs (e.g. `https://api.myllm.com/chat`). Because outbound HTTP requests are dispatched to validate connectivity, an unrestricted proxy vulnerability (SSRF) could compromise internal infrastructure.

## Outbound Restrictions Architecture

### 1. Scheme Enforcement
Only `http` and `https` schemes are accepted. All other protocols (`ftp:`, `file:`, `gopher:`, `dict:`, `ldap:`) trigger an immediate `SSRFError`.

### 2. Forbidden Hostnames
Direct access to known cloud metadata endpoints is blocked prior to DNS resolution:
- `169.254.169.254` (AWS, GCP, Azure, DigitalOcean)
- `metadata.google.internal` (GCP)
- `metadata.internal`
- `instance-data`
- `localhost`

### 3. IP Blocklist (IPv4 and IPv6)
Any resolved address matching the following ranges is rejected:
- `127.0.0.0/8` (Loopback)
- `10.0.0.0/8` (Private RFC 1918)
- `172.16.0.0/12` (Private RFC 1918)
- `192.168.0.0/16` (Private RFC 1918)
- `169.254.0.0/16` (Link-local)
- `100.64.0.0/10` (Carrier-grade NAT)
- `::1/128` (IPv6 Loopback)
- `fc00::/7` (Unique Local Address)
- `fe80::/10` (IPv6 Link-local)

### 4. DNS Rebinding Mitigation
- DNS resolution is performed upfront on all resolved addresses.
- HTTP clients execute with `follow_redirects=False`.
- Redirect locations (`Location` header) must be independently revalidated before being followed.
- Outbound timeout is clamped to a strict maximum of 10 seconds.

