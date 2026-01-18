from sqlalchemy import Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KnowledgeCategory(Base):
    __tablename__ = "knowledge_categories"
    # У каждого пользователя свои категории, но названия могут совпадать между пользователями
    __table_args__ = (
        UniqueConstraint("user_id", "title", name="uq_knowledge_category_user_title"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    articles = relationship(
        "KnowledgeArticle",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    owner = relationship("User", back_populates="knowledge_categories")


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    __table_args__ = (
        UniqueConstraint("user_id", "title", name="uq_knowledge_article_user_title"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_categories.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # Markdown/HTML

    category = relationship("KnowledgeCategory", back_populates="articles")
    owner = relationship("User", back_populates="knowledge_articles")
