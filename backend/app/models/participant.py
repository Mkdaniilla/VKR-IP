from sqlalchemy import Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.user import Role
import enum

class ProjectRole(str, enum.Enum):
    owner = "owner"
    lawyer = "lawyer"
    client = "client"
    partner = "partner"
    viewer = "viewer"

class Participant(Base):
    __tablename__ = "participants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_id: Mapped[int] = mapped_column(ForeignKey("ip_objects.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[ProjectRole] = mapped_column(Enum(ProjectRole))
    __table_args__ = (UniqueConstraint("ip_id", "user_id", name="uq_ip_user"),)
