"""add ticket position

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-26

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute(
        """
        UPDATE tickets AS t
        SET position = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY status ORDER BY created_at DESC, id DESC
            ) - 1 AS rn
            FROM tickets
        ) AS sub
        WHERE t.id = sub.id
        """
    )
    op.alter_column("tickets", "position", server_default=None)
    op.create_index("ix_tickets_position", "tickets", ["position"])


def downgrade() -> None:
    op.drop_index("ix_tickets_position", table_name="tickets")
    op.drop_column("tickets", "position")
