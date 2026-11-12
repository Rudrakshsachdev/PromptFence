"""Unit tests for SSRF validation and destination restrictions."""

import pytest

from app.core.exceptions import SSRFError
from app.integrations.ssrf import validate_url


def test_ssrf_rejects_loopback_ips():
    with pytest.raises(SSRFError):
        validate_url("http://127.0.0.1:8080/api")

    with pytest.raises(SSRFError):
        validate_url("http://127.0.0.2/test")


def test_ssrf_rejects_private_networks():
    with pytest.raises(SSRFError):
        validate_url("http://10.0.0.1/admin")

    with pytest.raises(SSRFError):
        validate_url("http://192.168.1.1/router")

    with pytest.raises(SSRFError):
        validate_url("http://172.16.0.5/api")


def test_ssrf_rejects_cloud_metadata():
    with pytest.raises(SSRFError):
        validate_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(SSRFError):
        validate_url("http://metadata.google.internal/computeMetadata/v1/")


def test_ssrf_rejects_localhost_hostname():
    with pytest.raises(SSRFError):
        validate_url("http://localhost:3000/")


def test_ssrf_rejects_unsupported_schemes():
    with pytest.raises(SSRFError):
        validate_url("ftp://ftp.example.com/file")

    with pytest.raises(SSRFError):
        validate_url("file:///etc/passwd")

    with pytest.raises(SSRFError):
        validate_url("gopher://example.com/")


from unittest.mock import patch

def test_ssrf_allows_public_https_domains():
    # Test with public IP directly
    url, ips = validate_url("http://93.184.216.34/api")
    assert url == "http://93.184.216.34/api"
    assert "93.184.216.34" in ips

    # Test with mocked DNS resolution for public domain
    mock_addr = [(2, 1, 6, "", ("93.184.216.34", 443))]
    with patch("socket.getaddrinfo", return_value=mock_addr):
        url, ips = validate_url("https://example.com")
        assert url == "https://example.com"
        assert "93.184.216.34" in ips
