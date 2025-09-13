from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.deadline import Deadline
from app.models.notification import Notification

scheduler = BackgroundScheduler()

def check_deadlines():
    with SessionLocal() as db:
        today = date.today()
        upcoming = db.query(Deadline).filter(Deadline.due_date <= today + timedelta(days=14),
                                             Deadline.due_date >= today).all()
        for d in upcoming:
            # создаём внутр. уведомление владельцу объекта
            user_id = d.ip.owner_id
            text = f"Срок '{d.kind}' по {d.ip.title} на {d.due_date.isoformat()}"
            db.add(Notification(user_id=user_id, text=text))
        db.commit()

def init_scheduler():
    scheduler.add_job(check_deadlines, "interval", hours=12, id="check_deadlines", replace_existing=True)
    scheduler.start()
