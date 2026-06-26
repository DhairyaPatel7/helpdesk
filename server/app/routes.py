from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_
from sqlmodel import Session, select

from .auth import get_current_user
from .database import get_session
from .models import Ticket, utcnow
from .schemas import (
    TicketCreate,
    TicketPage,
    TicketPriority,
    TicketRead,
    TicketReorder,
    TicketSort,
    TicketStatus,
    TicketUpdate,
)

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=TicketPage)
def list_tickets(
    status: list[TicketStatus] | None = Query(default=None),
    priority: list[TicketPriority] | None = Query(default=None),
    search: str | None = Query(default=None, description="Match title or customer name"),
    sort: TicketSort = Query(default=TicketSort.newest),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> TicketPage:
    conditions = []
    if status:
        conditions.append(Ticket.status.in_([item.value for item in status]))
    if priority:
        conditions.append(Ticket.priority.in_([item.value for item in priority]))
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(or_(Ticket.title.ilike(term), Ticket.customer_name.ilike(term)))

    count_statement = select(func.count()).select_from(Ticket)
    statement = select(Ticket)
    for condition in conditions:
        count_statement = count_statement.where(condition)
        statement = statement.where(condition)

    if sort is TicketSort.oldest:
        statement = statement.order_by(Ticket.created_at.asc())
    elif sort is TicketSort.priority:
        rank = case({"high": 3, "medium": 2, "low": 1}, value=Ticket.priority, else_=0)
        statement = statement.order_by(rank.desc(), Ticket.created_at.desc())
    else:
        statement = statement.order_by(Ticket.created_at.desc())

    total = session.exec(count_statement).one()
    tickets = session.exec(statement.offset(offset).limit(limit)).all()
    return TicketPage(
        items=[TicketRead.from_ticket(ticket) for ticket in tickets],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/reorder", response_model=list[TicketRead])
def reorder_tickets(
    payload: TicketReorder, session: Session = Depends(get_session)
) -> list[TicketRead]:
    if not payload.orderedIds:
        raise HTTPException(status_code=400, detail="No tickets to reorder")

    tickets = session.exec(select(Ticket).where(Ticket.id.in_(payload.orderedIds))).all()
    by_id = {ticket.id: ticket for ticket in tickets}
    if any(ticket_id not in by_id for ticket_id in payload.orderedIds):
        raise HTTPException(status_code=404, detail="Ticket not found")

    target = payload.status.value
    for index, ticket_id in enumerate(payload.orderedIds):
        ticket = by_id[ticket_id]
        if ticket.status != target:
            ticket.status = target
            ticket.updated_at = utcnow()
        ticket.position = index
        session.add(ticket)
    session.commit()

    column = session.exec(
        select(Ticket).where(Ticket.status == target).order_by(Ticket.position.asc())
    ).all()
    return [TicketRead.from_ticket(ticket) for ticket in column]


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, session: Session = Depends(get_session)) -> TicketRead:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketRead.from_ticket(ticket)


@router.post("", response_model=TicketRead, status_code=201)
def create_ticket(payload: TicketCreate, session: Session = Depends(get_session)) -> TicketRead:
    top = session.exec(
        select(func.min(Ticket.position)).where(Ticket.status == TicketStatus.open.value)
    ).one()
    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        customer_name=payload.customerName,
        customer_email=payload.customerEmail,
        priority=payload.priority.value,
        status=TicketStatus.open.value,
        position=(top - 1) if top is not None else 0,
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return TicketRead.from_ticket(ticket)


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    session: Session = Depends(get_session),
) -> TicketRead:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    updates = payload.column_updates()
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    for column, value in updates.items():
        setattr(ticket, column, value)
    ticket.updated_at = utcnow()

    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return TicketRead.from_ticket(ticket)
