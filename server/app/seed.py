from datetime import UTC, datetime

from sqlmodel import Session, select

from .database import engine
from .models import Ticket, User
from .security import hash_password

DEMO_EMAIL = "demo@aurexillion.com"
DEMO_PASSWORD = "demo12345"


def _at(year: int, month: int, day: int, hour: int, minute: int) -> datetime:
    return datetime(year, month, day, hour, minute, tzinfo=UTC)


def _sample_tickets() -> list[Ticket]:
    rows = [
        (
            "Unable to complete payment",
            "The customer receives a generic error after submitting the payment "
            "form. It happens consistently with their saved Visa card.",
            "Jane Smith",
            "jane@example.com",
            "open",
            "high",
            _at(2026, 6, 18, 10, 30),
        ),
        (
            "Password reset email never arrives",
            "Requested a reset three times today, no email in inbox or spam.",
            "Marcus Lee",
            "marcus.lee@example.com",
            "in_progress",
            "medium",
            _at(2026, 6, 19, 9, 5),
        ),
        (
            "Invoice shows the wrong currency",
            "Account is set to EUR but the latest invoice was billed in USD.",
            "Sofia Rossi",
            "sofia.rossi@example.com",
            "open",
            "low",
            _at(2026, 6, 20, 14, 42),
        ),
        (
            "Dashboard charts not loading",
            "The analytics dashboard spins indefinitely on Chrome and Safari.",
            "Daniel Okafor",
            "daniel.okafor@example.com",
            "in_progress",
            "high",
            _at(2026, 6, 21, 16, 20),
        ),
        (
            "Feature request: export tickets to CSV",
            "Would like a button to export the current ticket list as a CSV file.",
            "Priya Nair",
            "priya.nair@example.com",
            "open",
            "low",
            _at(2026, 6, 22, 11, 0),
        ),
        (
            "Two-factor codes are delayed",
            "SMS verification codes arrive 5-10 minutes late, often after they expire.",
            "Tom Becker",
            "tom.becker@example.com",
            "resolved",
            "medium",
            _at(2026, 6, 23, 8, 15),
        ),
        (
            "Mobile app crashes on startup",
            "After the latest update the iOS app closes immediately on launch.",
            "Aisha Khan",
            "aisha.khan@example.com",
            "open",
            "high",
            _at(2026, 6, 24, 19, 48),
        ),
        (
            "Cannot upload profile photo",
            "Uploading a JPG larger than 2MB fails silently with no error shown.",
            "Liam Murphy",
            "liam.murphy@example.com",
            "resolved",
            "low",
            _at(2026, 6, 10, 13, 20),
        ),
        (
            "Billing page returns a 500 error",
            "Opening billing settings has shown a server error for the past two days.",
            "Emma Garcia",
            "emma.garcia@example.com",
            "resolved",
            "high",
            _at(2026, 6, 11, 10, 5),
        ),
        (
            "Notifications keep getting marked unread",
            "Read notifications reappear as unread after refreshing the page.",
            "Noah Williams",
            "noah.williams@example.com",
            "in_progress",
            "low",
            _at(2026, 6, 12, 15, 40),
        ),
        (
            "Search returns nothing for valid orders",
            "Searching by order number returns no results even for existing orders.",
            "Olivia Brown",
            "olivia.brown@example.com",
            "open",
            "medium",
            _at(2026, 6, 13, 9, 30),
        ),
        (
            "Wrong timezone on exported reports",
            "Exported PDF reports use UTC instead of the account's local timezone.",
            "Ethan Davis",
            "ethan.davis@example.com",
            "open",
            "low",
            _at(2026, 6, 14, 17, 12),
        ),
        (
            "Team invites expire too quickly",
            "Invitation links expire within an hour, before new members can accept.",
            "Ava Martinez",
            "ava.martinez@example.com",
            "resolved",
            "medium",
            _at(2026, 6, 16, 11, 55),
        ),
        (
            "Hitting the API rate limit on normal usage",
            "We get 429 responses well under the documented request limit.",
            "William Chen",
            "william.chen@example.com",
            "in_progress",
            "high",
            _at(2026, 6, 17, 8, 25),
        ),
    ]
    return [
        Ticket(
            title=title,
            description=description,
            customer_name=customer_name,
            customer_email=customer_email,
            status=status,
            priority=priority,
            created_at=created_at,
            updated_at=created_at,
        )
        for title, description, customer_name, customer_email, status, priority, created_at in rows
    ]


def _seed_tickets(session: Session) -> None:
    existing_titles = set(session.exec(select(Ticket.title)).all())
    tickets = [ticket for ticket in _sample_tickets() if ticket.title not in existing_titles]
    if not tickets:
        return
    session.add_all(tickets)
    session.commit()
    print(f"Seeded {len(tickets)} tickets.")


def _seed_demo_user(session: Session) -> None:
    if session.exec(select(User).where(User.email == DEMO_EMAIL)).first() is not None:
        return
    session.add(User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD)))
    session.commit()
    print(f"Seeded demo user ({DEMO_EMAIL}).")


def seed() -> None:
    with Session(engine) as session:
        _seed_tickets(session)
        _seed_demo_user(session)


if __name__ == "__main__":
    seed()
