"""
Pytest configuration for integration tests.

These tests are designed to run against a real PostgreSQL database.
The database should be seeded with test data before running.

Usage:
    # Start the database via docker-compose
    docker compose up -d db

    # Run migrations
    docker compose run --rm backend alembic upgrade head

    # Run tests against local docker database
    DATABASE_URL="postgresql+asyncpg://salonapp:salonapp_secret@localhost:5432/salonapp" \\
    SECRET_KEY="test-secret" \\
    pytest tests/integration/test_full_api.py -v

    # Or run against the deployed server
    # (Requires VPN and test database on 10.0.2.144)
"""

import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated client."""
    from src.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def admin_client(client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated admin client."""
    from src.main import app

    response = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        cookies=response.cookies
    ) as ac:
        yield ac


@pytest.fixture
async def secretary_client(client: AsyncClient, admin_client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated secretary client (creates user if needed)."""
    from src.main import app
    from uuid import uuid4

    # Check if secretary role exists
    roles_resp = await admin_client.get("/api/v1/roles")
    roles = roles_resp.json().get("roles", [])
    secretary_role = next((r for r in roles if r["name"] == "Secrétaire"), None)

    if not secretary_role:
        # Create secretary role
        role_resp = await admin_client.post("/api/v1/roles", json={
            "name": "Secrétaire",
            "permissions": ["patients.view", "patients.edit", "sessions.view",
                          "pre_consultations.view", "pre_consultations.create",
                          "pre_consultations.edit", "zones.view"]
        })
        secretary_role = role_resp.json()

    # Create unique secretary user for this test run
    username = f"secretary_{uuid4().hex[:8]}"
    await admin_client.post("/api/v1/users", json={
        "username": username,
        "password": "test123",
        "nom": "Test",
        "prenom": "Secretary",
        "role_id": secretary_role["id"]
    })

    # Login as secretary
    response = await client.post("/api/v1/auth/login", json={
        "username": username,
        "password": "test123"
    })
    assert response.status_code == 200, f"Secretary login failed: {response.text}"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        cookies=response.cookies
    ) as ac:
        yield ac


@pytest.fixture
async def practitioner_client(client: AsyncClient, admin_client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated practitioner client (creates user if needed)."""
    from src.main import app
    from uuid import uuid4

    # Check if practitioner role exists
    roles_resp = await admin_client.get("/api/v1/roles")
    roles = roles_resp.json().get("roles", [])
    practitioner_role = next((r for r in roles if r["name"] == "Praticien"), None)

    if not practitioner_role:
        role_resp = await admin_client.post("/api/v1/roles", json={
            "name": "Praticien",
            "permissions": ["patients.view", "sessions.view", "sessions.create",
                          "boxes.view", "boxes.assign"]
        })
        practitioner_role = role_resp.json()

    # Create unique practitioner user for this test run
    username = f"practitioner_{uuid4().hex[:8]}"
    await admin_client.post("/api/v1/users", json={
        "username": username,
        "password": "test123",
        "nom": "Test",
        "prenom": "Practitioner",
        "role_id": practitioner_role["id"]
    })

    response = await client.post("/api/v1/auth/login", json={
        "username": username,
        "password": "test123"
    })
    assert response.status_code == 200, f"Practitioner login failed: {response.text}"

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        cookies=response.cookies
    ) as ac:
        yield ac
