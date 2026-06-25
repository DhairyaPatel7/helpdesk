from datetime import UTC, datetime

from sqlmodel import Session, select

from .database import engine
from .models import Ticket


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


def seed() -> None:
    with Session(engine) as session:
        if session.exec(select(Ticket)).first() is not None:
            print("Tickets already present — skipping seed.")
            return
        tickets = _sample_tickets()
        session.add_all(tickets)
        session.commit()
        print(f"Seeded {len(tickets)} tickets.")


if __name__ == "__main__":
    seed()
