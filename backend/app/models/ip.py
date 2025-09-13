from __future__ import annotations

import enum


class IPType(str, enum.Enum):
    trademark = "trademark"
    patent = "patent"
    copyright = "copyright"
    other = "other"
    commercial_designation = "commercial_designation"  # если используется


class IPStatus(str, enum.Enum):
    draft = "draft"
    filed = "filed"
    registered = "registered"
    expired = "expired"
