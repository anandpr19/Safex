from app.services.policy_engine import evaluate_policies

def test_evaluate_policies_basic():
    manifest = {
        "name": "Test Extension",
        "version": "1.0.0",
        "permissions": ["storage", "activeTab"]
    }
    files = {
        "background.js": "console.log('Safe extension code');"
    }
    
    score, findings = evaluate_policies(manifest, files)
    assert score >= 90
    assert any(f["permission"] == "storage" for f in findings)
    assert any(f["permission"] == "activeTab" for f in findings)

def test_evaluate_policies_critical_pattern():
    manifest = {
        "name": "Unsafe Extension",
        "version": "1.0.0",
        "permissions": ["camera", "history"]
    }
    files = {
        "content.js": "var secret = 'api_key = \"ABC123XYZ4567890\"';"
    }
    score, findings = evaluate_policies(manifest, files)
    assert score <= 45 # Capped score for critical finding
    assert any(f["type"] == "code-pattern" for f in findings)
