def test_reminder_lifecycle(client, auth_headers):
    register_box_resp = client.post(
        "/api/mediboxes/register",
        json={"box_id": "box-001", "metadata": {"label": "Primary"}},
        headers=auth_headers,
    )
    assert register_box_resp.status_code == 201

    create_resp = client.post(
        "/api/reminders",
        json={
            "box_id": "box-001",
            "medicineName": "Vitamin D",
            "time": "08:00",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    reminder = create_resp.get_json()
    assert reminder["name"] == "Vitamin D"

    list_resp = client.get(
        "/api/reminders",
        query_string={"scope": "active", "limit": 5},
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    reminders = list_resp.get_json()
    assert len(reminders) == 1

    intake_resp = client.post(
        "/api/intake/logs",
        json={
            "medicineId": reminder["id"],
            "confirmed": True,
            "box_id": "box-001",
        },
        headers=auth_headers,
    )
    assert intake_resp.status_code == 201

    adherence_resp = client.get(
        "/api/adherence/logs",
        query_string={"limit": 10, "box_id": "box-001"},
        headers=auth_headers,
    )
    assert adherence_resp.status_code == 200
    adherence_entries = adherence_resp.get_json()
    assert len(adherence_entries) >= 1
    assert adherence_entries[0]["status"] == "taken"
