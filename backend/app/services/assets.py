from __future__ import annotations
from typing import Literal, Optional

from sqlalchemy.orm import Session

from app.models.ip import (
    IPEntity, Trademark, Patent,
    AssetType, AssetStatus,
)
from app.services.deadlines import ensure_min_deadlines


class AssetService:
    @staticmethod
    def create_asset(
        db: Session,
        *,
        owner_id: int,
        type_: Literal["TRADEMARK", "PATENT"],
        title: str,
        jurisdiction: Optional[str] = None,
        application_number: Optional[str] = None,
        registration_number: Optional[str] = None,
        filing_date=None,
        registration_date=None,
        expiry_date=None,
        status: AssetStatus = AssetStatus.DRAFT,
        notes: Optional[str] = None,
        # вложенные данные для конкретного типа
        trademark: Optional[dict] = None,
        patent: Optional[dict] = None,
    ) -> IPEntity:
        """
        Создаёт IPEntity + дочернюю запись (Trademark/Patent) и автогенерирует события.
        Возвращает свежий IPEntity с присоединёнными полями.
        """

        # 1) Общая запись
        asset = IPEntity(
            type=AssetType(type_),
            title=title,
            owner_id=owner_id,
            jurisdiction=jurisdiction,
            application_number=application_number,
            registration_number=registration_number,
            filing_date=filing_date,
            registration_date=registration_date,
            expiry_date=expiry_date,
            status=status,
            notes=notes,
        )
        db.add(asset)
        db.flush()  # получим id до commit

        # 2) Дочерняя запись
        if asset.type == AssetType.TRADEMARK:
            tm = Trademark(**(trademark or {}))
            asset.trademark = tm
        elif asset.type == AssetType.PATENT:
            pat = Patent(**(patent or {}))
            asset.patent = pat

        # 3) Коммитим создание
        db.commit()
        db.refresh(asset)

        # 4) Автодедлайны
        events = ensure_min_deadlines(asset)
        if events:
            db.add_all(events)
            db.commit()
            db.refresh(asset)

        return asset
