import sqlite3

DB_PATH = "dev.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("DROP TABLE IF EXISTS knowledge_articles__new")
cur.execute("DROP TABLE IF EXISTS knowledge_categories__new")
cur.execute("DROP TABLE IF EXISTS _alembic_tmp_knowledge_articles")
cur.execute("DROP TABLE IF EXISTS _alembic_tmp_knowledge_categories")

cur.execute("DROP INDEX IF EXISTS ix_knowledge_articles_category_id")
cur.execute("DROP INDEX IF EXISTS ix_knowledge_articles_user_id")
cur.execute("DROP INDEX IF EXISTS ix_knowledge_categories_user_id")

conn.commit()
conn.close()

print("cleanup ok:", DB_PATH)
