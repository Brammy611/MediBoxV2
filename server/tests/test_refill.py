def test_refill_request_workflow(client, auth_headers):
    create_resp = client.post(
        "/api/refill/requests",
        json={
            "medicineName": "Metformin",
            "quantity": 2,
            "box_id": "box-003",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    request_body = create_resp.get_json()
    request_id = request_body["id"]

    approve_resp = client.post(
        f"/api/refill/requests/{request_id}/approve",
        json={"notes": "Ready for pickup"},
        headers=auth_headers,
    )
    assert approve_resp.status_code == 200
    approved_data = approve_resp.get_json()
    assert approved_data["status"] == "approved"
    assert approved_data.get("notes") == "Ready for pickup"

    list_resp = client.get(
        "/api/refill/requests",
        query_string={"scope": "managed", "limit": 10},
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    requests = list_resp.get_json()
    assert any(item["id"] == request_id for item in requests)
