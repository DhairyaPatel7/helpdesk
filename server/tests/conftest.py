import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlmodel import Session, SQLModel

from app.auth import get_current_user
from app.database import get_session
from app.main import app
from app.models import User

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://tickets:tickets@localhost:5432/tickets_test",
)


def _ensure_database(url: str) -> None:
    name = url.rsplit("/", 1)[1].split("?")[0]
    admin_url = f"{url.rsplit('/', 1)[0]}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": name}
            ).first()
            if exists is None:
                conn.execute(text(f'CREATE DATABASE "{name}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session")
def engine():
    _ensure_database(TEST_DATABASE_URL)
    engine = create_engine(TEST_DATABASE_URL)
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(session):
    """Authenticated client — the auth dependency is stubbed so ticket tests stay focused."""
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1, email="tester@example.com", hashed_password="x"
    )
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def anon_client(session):
    """Unauthenticated client for exercising the real auth flow."""
    app.dependency_overrides[get_session] = lambda: session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
