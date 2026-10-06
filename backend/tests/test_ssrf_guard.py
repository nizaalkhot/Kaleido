import pytest
from unittest.mock import patch
from backend.agents.ingest_pipeline import validate_safe_url, SSRFSecurityError

def test_reject_invalid_schemes():
    with pytest.raises(SSRFSecurityError):
        validate_safe_url("ftp://example.com/file.txt")
    with pytest.raises(SSRFSecurityError):
        validate_safe_url("file:///etc/passwd")

def test_reject_loopback_and_internal_ips():
    with pytest.raises(SSRFSecurityError):
        validate_safe_url("http://127.0.0.1/admin")
    with pytest.raises(SSRFSecurityError):
        validate_safe_url("http://localhost:8000/api")

def test_accept_public_domain():
    # Mock DNS lookup so unit tests do not depend on external network DNS
    with patch("socket.gethostbyname_ex", return_value=("example.com", [], ["93.184.216.34"])):
        # Should not raise for valid public IPs
        validate_safe_url("https://example.com/article")
