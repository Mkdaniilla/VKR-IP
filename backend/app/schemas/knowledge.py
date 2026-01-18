from pydantic import BaseModel


# --- Category ---
class KnowledgeCategoryBase(BaseModel):
    title: str


class KnowledgeCategoryCreate(KnowledgeCategoryBase):
    pass


class KnowledgeCategoryOut(KnowledgeCategoryBase):
    id: int

    class Config:
        from_attributes = True


# --- Article ---
class KnowledgeArticleBase(BaseModel):
    title: str
    content: str


class KnowledgeArticleCreate(KnowledgeArticleBase):
    category_id: int


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category_id: int | None = None


class KnowledgeArticleOut(KnowledgeArticleBase):
    id: int
    category: KnowledgeCategoryOut

    class Config:
        from_attributes = True


# --- Chat Agent ---
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]  # list of {id, title}
