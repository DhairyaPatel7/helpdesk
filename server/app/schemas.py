from datetime import UTC, datetime
from enum import Enum, StrEnum

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, Field, field_serializer, field_validator

from .models import Ticket, User


class TicketStatus(StrEnum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class TicketPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class TicketSort(StrEnum):
    newest = "newest"
    oldest = "oldest"
    priority = "priority"


def _require_non_blank(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("This field is required")
    return cleaned


def _normalize_email(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        return validate_email(value, check_deliverability=False).normalized
    except EmailNotValidError as exc:
        raise ValueError("Enter a valid email address") from exc


class TicketCreate(BaseModel):
    title: str = Field(max_length=200)
    description: str = Field(max_length=5000)
    customerName: str = Field(max_length=120)
    customerEmail: str
    priority: TicketPriority

    @field_validator("title", "description", "customerName")
    @classmethod
    def not_blank(cls, value: str) -> str:
        return _require_non_blank(value)

    @field_validator("customerEmail")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return _normalize_email(value)


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    customerName: str | None = Field(default=None, max_length=120)
    customerEmail: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None

    @field_validator("title", "description", "customerName")
    @classmethod
    def not_blank(cls, value: str | None) -> str | None:
        return _require_non_blank(value)

    @field_validator("customerEmail")
    @classmethod
    def valid_email(cls, value: str | None) -> str | None:
        return _normalize_email(value)

    def column_updates(self) -> dict[str, object]:
        columns = {"customerName": "customer_name", "customerEmail": "customer_email"}
        updates: dict[str, object] = {}
        for field, value in self.model_dump(exclude_unset=True).items():
            if isinstance(value, Enum):
                value = value.value
            updates[columns.get(field, field)] = value
        return updates


class TicketRead(BaseModel):
    id: int
    title: str
    description: str
    customerName: str
    customerEmail: str
    status: TicketStatus
    priority: TicketPriority
    createdAt: datetime
    updatedAt: datetime

    @field_serializer("createdAt", "updatedAt")
    def serialize_datetime(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    @classmethod
    def from_ticket(cls, ticket: Ticket) -> "TicketRead":
        return cls(
            id=ticket.id,
            title=ticket.title,
            description=ticket.description,
            customerName=ticket.customer_name,
            customerEmail=ticket.customer_email,
            status=TicketStatus(ticket.status),
            priority=TicketPriority(ticket.priority),
            createdAt=ticket.created_at,
            updatedAt=ticket.updated_at,
        )


class TicketPage(BaseModel):
    items: list[TicketRead]
    total: int
    limit: int
    offset: int


class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        try:
            return validate_email(value, check_deliverability=False).normalized.lower()
        except EmailNotValidError as exc:
            raise ValueError("Enter a valid email address") from exc


class UserLogin(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    id: int
    email: str
    createdAt: datetime

    @field_serializer("createdAt")
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    @classmethod
    def from_user(cls, user: User) -> "UserRead":
        return cls(id=user.id, email=user.email, createdAt=user.created_at)


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserRead
