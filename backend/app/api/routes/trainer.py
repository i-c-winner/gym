from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_trainer
from app.db.session import get_db
from app.models.user import User
from app.schemas.absence_request import AbsenceDecisionIn, AbsenceRequestOut
from app.schemas.booking import BookingOut, BookingWithUserOut
from app.schemas.class_session import AttendanceMarkIn, ClassSessionOut
from app.services.absence_service import absence_service
from app.services.booking_service import booking_service
from app.services.class_session_service import class_session_service

router = APIRouter(prefix="/gym/trainer", tags=["gym-trainer"])


@router.get("/sessions/upcoming", response_model=list[ClassSessionOut])
async def get_upcoming_sessions(
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> list[ClassSessionOut]:
    sessions = await class_session_service.list_upcoming(db, trainer_id=trainer.id)
    return [ClassSessionOut.model_validate(s) for s in sessions]


@router.get("/sessions/past", response_model=list[ClassSessionOut])
async def get_past_sessions(
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> list[ClassSessionOut]:
    sessions = await class_session_service.list_past_for_trainer(db, trainer.id)
    return [ClassSessionOut.model_validate(s) for s in sessions]


@router.get("/sessions/{class_session_id}/participants", response_model=list[BookingWithUserOut])
async def get_session_participants(
    class_session_id: str,
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> list[BookingWithUserOut]:
    from app.models.class_session import ClassSession
    sess = await db.get(ClassSession, class_session_id)
    if not sess or sess.trainer_id != trainer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    bookings = await booking_service.list_for_session(db, class_session_id)
    result = []
    for b in bookings:
        out = BookingWithUserOut.model_validate(b)
        if b.user:
            out.user_first_name = b.user.first_name
            out.user_last_name = b.user.last_name
            out.user_telephone = b.user.telephone
        result.append(out)
    return result


@router.post("/sessions/{class_session_id}/attendance", response_model=list[BookingOut])
async def mark_attendance(
    class_session_id: str,
    marks: list[AttendanceMarkIn],
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> list[BookingOut]:
    from app.models.class_session import ClassSession, ClassSessionStatus
    sess = await db.get(ClassSession, class_session_id)
    if not sess or sess.trainer_id != trainer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    if sess.status != ClassSessionStatus.COMPLETED:
        sess.status = ClassSessionStatus.COMPLETED

    results = []
    for mark in marks:
        b = await booking_service.mark_attendance(db, mark.booking_id, mark.attended, trainer.id)
        results.append(BookingOut.model_validate(b))
    await db.commit()
    return results


@router.get("/absence-requests", response_model=list[AbsenceRequestOut])
async def get_absence_queue(
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> list[AbsenceRequestOut]:
    reqs = await absence_service.list_pending_for_trainer(db, trainer.id)
    return [AbsenceRequestOut.model_validate(r) for r in reqs]


@router.post("/absence-requests/{request_id}/decide", response_model=AbsenceRequestOut)
async def decide_absence(
    request_id: str,
    payload: AbsenceDecisionIn,
    db: AsyncSession = Depends(get_db),
    trainer: User = Depends(require_trainer),
) -> AbsenceRequestOut:
    req = await absence_service.decide(db, request_id, trainer.id, payload.approved)
    await db.commit()
    return AbsenceRequestOut.model_validate(req)