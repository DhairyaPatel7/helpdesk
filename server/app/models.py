from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(max_length=5000)
    customer_name: str = Field(max_length=120)
    customer_email: str = Field(max_length=255)
    status: str = Field(default="open", max_length=20, index=True)
    priority: str = Field(max_length=20, index=True)
    created_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=utcnow, sa_type=DateTime(timezone=True))
