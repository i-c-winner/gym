from fpdf import FPDF
from fpdf.enums import XPos, YPos

FONT_REGULAR = "/Library/Fonts/Arial Unicode.ttf"
FONT_MONO    = "/System/Library/Fonts/SFNSMono.ttf"

class PDF(FPDF):
    def header(self):
        self.set_font("arial", size=12)
        self.set_fill_color(47, 42, 36)
        self.set_text_color(255, 253, 248)
        self.cell(0, 13, "  Как работает доступ к ресурсу", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("arial", size=8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Страница {self.page_no()}", align="C")

    def section_title(self, title: str):
        self.ln(3)
        self.set_font("arial", size=12)
        self.set_fill_color(184, 159, 116)
        self.set_text_color(255, 255, 255)
        self.cell(0, 9, f"  {title}", fill=True,
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)
        self.ln(3)

    def body(self, text: str):
        self.set_font("arial", size=10)
        self.multi_cell(0, 6, text)
        self.ln(1)

    def mono(self, text: str):
        self.set_font("mono", size=8)
        self.set_fill_color(245, 243, 238)
        for line in text.split("\n"):
            self.cell(0, 5.2, line, fill=True,
                      new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("arial", size=10)
        self.ln(3)

    def table(self, headers: list, rows: list):
        col_w = 190 / len(headers)
        self.set_font("arial", size=9)
        self.set_fill_color(215, 205, 190)
        for h in headers:
            self.cell(col_w, 7, h, border=1, fill=True)
        self.ln()
        for i, row in enumerate(rows):
            self.set_fill_color(250, 248, 244 if i % 2 == 0 else 255)
            for cell in row:
                self.cell(col_w, 6.5, cell, border=1, fill=True)
            self.ln()
        self.ln(3)


pdf = PDF()
pdf.add_font("arial", fname=FONT_REGULAR)
pdf.add_font("mono",  fname=FONT_MONO)
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=20)

# 1
pdf.section_title("1. Модели данных")
pdf.body("Четыре ключевые сущности формируют цепочку доступа:\nResource → Plan → Order → AccessGrant")
pdf.table(
    ["Модель", "Роль"],
    [
        ["Resource",     "Контент (slug, title, description, content_url)"],
        ["Plan",         "Тариф ресурса (1m / 3m / 6m / lifetime, цена)"],
        ["Order",        "Заявка на покупку: pending → paid"],
        ["AccessGrant",  "Право доступа (user_id + resource_id + даты)"],
    ]
)

# 2
pdf.section_title("2. Флоу покупки")
pdf.mono(
    "/programs/{slug}\n"
    "  → пользователь выбирает план\n"
    "  → /programs/{slug}/buy?plan={planId}\n"
    "      → POST /orders           → Order (status=pending)\n"
    "      → POST /payments/simulate\n"
    "          → asyncio.sleep(5) в фоне\n"
    "          → mark_order_paid_and_grant_access()\n"
    "              → Order.status = \"paid\"\n"
    "              → AccessGrant создаётся в БД"
)

# 3
pdf.section_title("3. Проверка доступа (backend)")
pdf.body("GET /resources/{slug}/content — единственный защищённый эндпоинт.")
pdf.mono(
    "# deps.py\n"
    "async def require_resource_access(user, resource, db):\n"
    "\n"
    "    # Bypass для администраторов\n"
    "    if user.telegram_id in settings.admin_telegram_ids:\n"
    "        return resource\n"
    "\n"
    "    # Проверка гранта в БД\n"
    "    await access_service.require_access(db, user.id, resource)"
)
pdf.mono(
    "-- SQL (access_service.py)\n"
    "SELECT id FROM access_grants\n"
    "WHERE user_id = ?\n"
    "  AND resource_id = ?\n"
    "  AND starts_at <= now()\n"
    "  AND (is_lifetime = true OR expires_at > now())"
)
pdf.body("Нет гранта → 403 Forbidden\nНет сессии → 401 Unauthorized")

# 4
pdf.section_title("4. Флоу на фронтенде")
pdf.mono(
    "/account/programs/{slug}  (Program.tsx)\n"
    "  → GET /resources/{slug}/content\n"
    "      200 → показать программу\n"
    "      401 → редирект на /\n"
    "      403 → редирект на /programs/{slug}\n"
    "      404 → \"Программа не найдена\"\n"
    "\n"
    "/programs/{slug}/buy  (ProgramBuyPage.tsx)\n"
    "  → кнопка \"Перейти к программе\":\n"
    "      GET /resources/{slug}/content\n"
    "        200 → перейти на /account/programs/{slug}\n"
    "        403 → создать Order + simulate → перейти\n"
    "               (ошибка → modal)"
)

# 5
pdf.section_title("5. Список «Мои программы»")
pdf.mono(
    "GET /me/accesses → [{ resource_id, is_lifetime, expires_at }]\n"
    "GET /resources   → [{ id, slug, title }]\n"
    "\n"
    "пересечение по resource_id → список доступных ресурсов"
)
pdf.body(
    "Для администраторов (ADMIN_TELEGRAM_IDS):\n"
    "• GET /me/accesses возвращает синтетические lifetime-гранты для всех ресурсов\n"
    "• GET /resources/{slug}/content пропускает проверку гранта"
)

# 6
pdf.section_title("6. Типы грантов")
pdf.table(
    ["duration_type", "is_lifetime", "expires_at"],
    [
        ["1m",       "false", "now + 1 месяц"],
        ["3m",       "false", "now + 3 месяца"],
        ["6m",       "false", "now + 6 месяцев"],
        ["lifetime", "true",  "null (бессрочно)"],
    ]
)

out = "/Users/dmitriy/Projects/work/gym/access_explained.pdf"
pdf.output(out)
print(f"Готово: {out}")