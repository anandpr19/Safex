def format_findings_for_users(findings: list[dict], score: int) -> dict:
    critical_findings = [f for f in findings if f.get("severity") == "critical"]
    high_findings = [f for f in findings if f.get("severity") == "high"]
    medium_findings = [f for f in findings if f.get("severity") == "medium"]
    low_findings = [f for f in findings if f.get("severity") == "low"]
    
    if score >= 80:
        overall_risk = "Low Risk"
        recommendation = "This extension appears safe for general daily use."
    elif score >= 60:
        overall_risk = "Moderate Risk"
        recommendation = "Review requested permissions carefully before installing."
    elif score >= 40:
        overall_risk = "High Risk"
        recommendation = "Exercise caution. This extension requests powerful browser permissions."
    else:
        overall_risk = "Critical Risk"
        recommendation = "Installation not recommended due to severe potential security risks."

    return {
        "score": score,
        "overallRisk": overall_risk,
        "recommendation": recommendation,
        "summaryStats": {
            "totalIssues": len([f for f in findings if f.get("severity") != "good"]),
            "criticalCount": len(critical_findings),
            "highCount": len(high_findings),
            "mediumCount": len(medium_findings),
            "lowCount": len(low_findings)
        },
        "criticalFindings": critical_findings,
        "highFindings": high_findings,
        "mediumFindings": medium_findings,
        "lowFindings": low_findings
    }
