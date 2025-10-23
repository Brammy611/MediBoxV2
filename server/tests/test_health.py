from unittest import mock


def test_health_check_persists_and_returns_summary(client):
    payload = {
        "box_id": "box-002",
        "user_id": "user-health",
        "missed_rate": 0.3,
    }

    with mock.patch("routes.health.requests.post") as mock_post:
        mock_post.side_effect = RuntimeError("AI Hub unavailable")
        response = client.post("/api/health/check", json=payload)

    assert response.status_code == 200
    body = response.get_json()
    assert body["adherence_risk"] in {"medium", "high", "low"}
    assert isinstance(body["recommendation"], list)

    reports_resp = client.get(
        "/api/health/reports",
        query_string={"box_id": "box-002", "limit": 1},
    )
    assert reports_resp.status_code == 200
    reports = reports_resp.get_json()
    assert len(reports) == 1
    report = reports[0]
    assert report["box_id"] == "box-002"
    assert "captured_at" in report
