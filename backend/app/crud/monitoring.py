from __future__ import annotations
from typing import List, Optional, Dict, Any

from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import select, join

from app.models.monitoring import MonitoringTask, MonitoringStatus
from app.models.ip import IPObject
from app.schemas.monitoring import MonTaskCreate


def create_task(db: Session, owner_id: int, data: MonTaskCreate) -> MonitoringTask:
    # Проверяем, что IPObject принадлежит пользователю
    ip_obj = db.get(IPObject, data.ip_object_id)
    if not ip_obj or ip_obj.owner_id != owner_id or not ip_obj.is_active:
        raise PermissionError("IP object not found or access denied")

    task = MonitoringTask(
        ip_object_id=data.ip_object_id,
        query=data.query,
        status=MonitoringStatus.pending,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(db: Session, owner_id: int, skip: int = 0, limit: int = 20) -> List[MonitoringTask]:
    # Возвращаем только задачи, принадлежащие IP объектов пользователя
    stmt = (
        select(MonitoringTask)
        .join(IPObject, IPObject.id == MonitoringTask.ip_object_id)
        .where(IPObject.owner_id == owner_id, IPObject.is_active.is_(True))
        .order_by(MonitoringTask.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def get_task_for_owner(db: Session, owner_id: int, task_id: int) -> Optional[MonitoringTask]:
    stmt = (
        select(MonitoringTask)
        .join(IPObject, IPObject.id == MonitoringTask.ip_object_id)
        .where(MonitoringTask.id == task_id, IPObject.owner_id == owner_id, IPObject.is_active.is_(True))
    )
    return db.execute(stmt).scalar_one_or_none()


def delete_task(db: Session, task: MonitoringTask) -> None:
    db.delete(task)
    db.commit()


def run_task(db: Session, task: MonitoringTask) -> MonitoringTask:
    # Простейший синхронный "ран": статус -> running -> done + мок-результат
    task.status = MonitoringStatus.running
    db.add(task)
    db.commit()
    db.refresh(task)

    # Здесь будет реальная логика мониторинга (поиск совпадений, внешние API и т.п.)
    now = datetime.now(timezone.utc)
    mock_result: Dict[str, Any] = {
        "found": 0,
        "sample": [],
        "notes": "Demo run: интеграции пока отключены.",
        "ran_at": now.isoformat(),
    }

    task.status = MonitoringStatus.done
    task.last_run_at = now
    task.result_summary = mock_result

    db.add(task)
    db.commit()
    db.refresh(task)
    return task
