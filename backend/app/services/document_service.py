from jinja2 import Environment, FileSystemLoader
from docx import Document
from io import BytesIO
import os

from jinja2 import Environment, FileSystemLoader
from docx import Document
from io import BytesIO
import os

# 📂 Папка с шаблонами документов
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

def render_document(template_name: str, context: dict) -> BytesIO:
    """
    Рендерим DOCX-документ из Jinja-шаблона.
    - template_name: имя файла шаблона (например, "pretension.docx.jinja")
    - context: словарь с данными (ip_object, counterparty и т.д.)
    """
    try:
        template = env.get_template(template_name)
    except Exception as e:
        raise FileNotFoundError(
            f"❌ Шаблон {template_name} не найден в {TEMPLATE_DIR}"
        ) from e

    # Подставляем переменные в шаблон → текст
    rendered_text = template.render(**context)

    # Создаём DOCX и добавляем текст построчно
    doc = Document()
    for line in rendered_text.split("\n"):
        if line.strip():
            doc.add_paragraph(line.strip())

    # Возвращаем как поток байтов
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
