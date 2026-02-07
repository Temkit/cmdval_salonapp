"""
Pytest configuration for integration tests.

These tests run against the live running server via HTTP.

Usage:
    # Start the full stack
    docker compose up -d

    # Run tests against localhost
    TEST_BASE_URL="http://localhost" pytest tests/integration/test_full_api.py -v

    # Or run against deployed server (requires VPN)
    TEST_BASE_URL="http://10.0.2.144" pytest tests/integration/test_full_api.py -v
"""

import asyncio
import os
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient

# Default to localhost if not specified
BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost")


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated HTTP client."""
    async with AsyncClient(base_url=BASE_URL, timeout=30.0) as ac:
        yield ac


# Store session token at module level to avoid repeated logins
_admin_token = None
_secretary_data = None
_practitioner_data = None


async def get_admin_token() -> str:
    """Get or create admin session token."""
    global _admin_token
    if _admin_token is None:
        async with AsyncClient(base_url=BASE_URL, timeout=30.0) as temp:
            response = await temp.post("/api/v1/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            assert response.status_code == 200, f"Admin login failed: {response.text}"
            _admin_token = response.cookies.get("session_token")
            assert _admin_token, "No session_token cookie returned"
    return _admin_token


@pytest.fixture
async def admin_client() -> AsyncGenerator[AsyncClient, None]:
    """Authenticated admin client (session cached)."""
    token = await get_admin_token()
    async with AsyncClient(
        base_url=BASE_URL,
        timeout=30.0,
        headers={"Cookie": f"session_token={token}"}
    ) as ac:
        yield ac


@pytest.fixture
async def secretary_client(admin_client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated secretary client (creates user once per session)."""
    global _secretary_data
    from uuid import uuid4

    if _secretary_data is None:
        # Check if secretary role exists - use 'nom' not 'name'
        roles_resp = await admin_client.get("/api/v1/roles")
        roles = roles_resp.json().get("roles", [])
        secretary_role = next((r for r in roles if r["nom"] == "Secrétaire"), None)

        if not secretary_role:
            role_resp = await admin_client.post("/api/v1/roles", json={
                "nom": "Secrétaire",  # Use 'nom' not 'name'
                "permissions": ["patients.view", "patients.edit", "patients.create",
                              "sessions.view",
                              "pre_consultations.view", "pre_consultations.create",
                              "pre_consultations.edit", "zones.view"]
            })
            secretary_role = role_resp.json()

        # Create unique secretary user - use 'email' not 'username'
        email = f"test_secretary_{uuid4().hex[:8]}@test.com"
        await admin_client.post("/api/v1/users", json={
            "email": email,  # Use 'email' not 'username'
            "password": "test123",
            "nom": "Test",
            "prenom": "Secretary",
            "role_id": secretary_role["id"]
        })

        # Login as secretary
        async with AsyncClient(base_url=BASE_URL, timeout=30.0) as temp:
            response = await temp.post("/api/v1/auth/login", json={
                "username": email,  # Login still uses 'username' field
                "password": "test123"
            })
            assert response.status_code == 200, f"Secretary login failed: {response.text}"
            _secretary_data = response.cookies.get("session_token")

    async with AsyncClient(
        base_url=BASE_URL,
        timeout=30.0,
        headers={"Cookie": f"session_token={_secretary_data}"}
    ) as ac:
        yield ac


@pytest.fixture
async def practitioner_client(admin_client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated practitioner client (creates user once per session)."""
    global _practitioner_data
    from uuid import uuid4

    if _practitioner_data is None:
        # Check if practitioner role exists - use 'nom' not 'name'
        roles_resp = await admin_client.get("/api/v1/roles")
        roles = roles_resp.json().get("roles", [])
        practitioner_role = next((r for r in roles if r["nom"] == "Praticien"), None)

        if not practitioner_role:
            role_resp = await admin_client.post("/api/v1/roles", json={
                "nom": "Praticien",  # Use 'nom' not 'name'
                "permissions": ["patients.view", "sessions.view", "sessions.create",
                              "boxes.view", "boxes.assign", "zones.view"]
            })
            practitioner_role = role_resp.json()

        # Create unique practitioner user - use 'email' not 'username'
        email = f"test_practitioner_{uuid4().hex[:8]}@test.com"
        await admin_client.post("/api/v1/users", json={
            "email": email,  # Use 'email' not 'username'
            "password": "test123",
            "nom": "Test",
            "prenom": "Practitioner",
            "role_id": practitioner_role["id"]
        })

        # Login as practitioner
        async with AsyncClient(base_url=BASE_URL, timeout=30.0) as temp:
            response = await temp.post("/api/v1/auth/login", json={
                "username": email,  # Login still uses 'username' field
                "password": "test123"
            })
            assert response.status_code == 200, f"Practitioner login failed: {response.text}"
            _practitioner_data = response.cookies.get("session_token")

    async with AsyncClient(
        base_url=BASE_URL,
        timeout=30.0,
        headers={"Cookie": f"session_token={_practitioner_data}"}
    ) as ac:
        yield ac
