from fastapi.testclient import TestClient


def make_payload(**overrides):
    payload = {
        "title": "Unable to complete payment",
        "description": "Customer sees an error after submitting the payment form.",
        "customerName": "Jane Smith",
        "customerEmail": "jane@example.com",
        "priority": "high",
    }
    payload.update(overrides)
    return payload


def test_create_ticket_defaults_to_open(client: TestClient):
    response = client.post("/api/v1/tickets", json=make_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] > 0
    assert body["status"] == "open"
    assert body["customerName"] == "Jane Smith"
    assert body["createdAt"] and body["updatedAt"]


def test_create_requires_title(client: TestClient):
    response = client.post("/api/v1/tickets", json=make_payload(title="   "))
    assert response.status_code == 422


def test_create_rejects_invalid_email(client: TestClient):
    response = client.post("/api/v1/tickets", json=make_payload(customerEmail="not-an-email"))
    assert response.status_code == 422


def test_status_update_persists(client: TestClient):
    created = client.post("/api/v1/tickets", json=make_payload()).json()
    ticket_id = created["id"]

    patched = client.patch(f"/api/v1/tickets/{ticket_id}", json={"status": "in_progress"})
    assert patched.status_code == 200
    assert patched.json()["status"] == "in_progress"

    refetched = client.get(f"/api/v1/tickets/{ticket_id}")
    assert refetched.json()["status"] == "in_progress"


def test_get_missing_ticket_returns_404(client: TestClient):
    assert client.get("/api/v1/tickets/999999").status_code == 404


def test_empty_update_is_rejected(client: TestClient):
    created = client.post("/api/v1/tickets", json=make_payload()).json()
    assert client.patch(f"/api/v1/tickets/{created['id']}", json={}).status_code == 400


def test_filter_by_status(client: TestClient):
    open_one = client.post("/api/v1/tickets", json=make_payload(title="Open one")).json()
    resolved = client.post("/api/v1/tickets", json=make_payload(title="Resolved one")).json()
    client.patch(f"/api/v1/tickets/{resolved['id']}", json={"status": "resolved"})

    response = client.get("/api/v1/tickets", params={"status": "open"})
    assert response.status_code == 200
    ids = [ticket["id"] for ticket in response.json()]
    assert open_one["id"] in ids
    assert resolved["id"] not in ids


def test_filter_by_multiple_statuses(client: TestClient):
    open_one = client.post("/api/v1/tickets", json=make_payload(title="Open one")).json()
    progress = client.post("/api/v1/tickets", json=make_payload(title="In progress one")).json()
    client.patch(f"/api/v1/tickets/{progress['id']}", json={"status": "in_progress"})
    resolved = client.post("/api/v1/tickets", json=make_payload(title="Resolved one")).json()
    client.patch(f"/api/v1/tickets/{resolved['id']}", json={"status": "resolved"})

    response = client.get("/api/v1/tickets", params={"status": ["open", "in_progress"]})
    assert response.status_code == 200
    ids = [ticket["id"] for ticket in response.json()]
    assert open_one["id"] in ids
    assert progress["id"] in ids
    assert resolved["id"] not in ids
