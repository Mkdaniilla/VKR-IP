from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime as dt
from app.database import get_db
from app.core.security import get_current_user
from app.models.monitoring import MonitoringTask
# from app.models.ip import IPObject

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.post("/tasks")
def create_task(ip_object_id: int, query: str, db: Session = Depends(get_db), current=Depends(get_current_user)):
    ip = db.query(IPObject).filter_by(id=ip_object_id, owner_id=current.id).first()
    if not ip: raise HTTPException(404, "IP object not found")
    t = MonitoringTask(ip_object_id=ip.id, query=query)
    db.add(t); db.commit(); db.refresh(t)
    return t

@router.get("/tasks")
def list_tasks(db: Session = Depends(get_db), current=Depends(get_current_user)):
    return db.query(MonitoringTask)\
             .join(IPObject, MonitoringTask.ip_object_id == IPObject.id)\
             .filter(IPObject.owner_id == current.id).all()

@router.post("/tasks/{task_id}/run")
def run_task(task_id: int, db: Session = Depends(get_db), current=Depends(get_current_user)):
    t = db.query(MonitoringTask).get(task_id)
    if not t: raise HTTPException(404, "Task not found")
    # здесь может быть реальный сканер; пока имитация
    t.status = "done"
    t.last_run_at = dt.datetime.utcnow()
    t.result_summary = {"matches": [], "checked": True}
    db.commit(); db.refresh(t)
    return t
