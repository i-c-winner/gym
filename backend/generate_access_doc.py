"""
Генерация PDF-документа: структура доступа по ролям.
Запуск: .venv/bin/python3 generate_access_doc.py
"""

from fpdf import FPDF, XPos, YPos

FONT_REGULAR = "/Library/Fonts/Arial Unicode.ttf"
FONT_BOLD    = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

PRIMARY   = (60,  90,  60)   # тёмно-зелёный
SECONDARY = (140, 100, 80)   # золотисто-коричневый
DARK      = (30,  30,  30)
LIGHT_BG  = (245, 242, 236)
ROW_ALT   = (235, 231, 222)
WHITE     = (255, 255, 255)
RED_LIGHT = (252, 228, 228)
GREEN_LIGHT = (224, 240, 224)
GREY_LIGHT  = (235, 235, 235)


class Doc(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.add_font("arial",  "", FONT_REGULAR, uni=True)
        self.add_font("arial",  "B", FONT_BOLD,    uni=True)
        self.set_margins(20, 20, 20)
        self.set_auto_page_break(True, margin=18)

    # ── helpers ────────────────────────────────────────────────────────────

    def h1(self, text: str) -> None:
        self.set_font("arial", "B", 18)
        self.set_text_color(*PRIMARY)
        self.ln(4)
        self.multi_cell(0, 9, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*SECONDARY)
        self.set_line_width(0.6)
        self.line(self.get_x(), self.get_y(), self.get_x() + 170, self.get_y())
        self.ln(4)
        self.set_text_color(*DARK)

    def h2(self, text: str) -> None:
        self.set_font("arial", "B", 13)
        self.set_text_color(*PRIMARY)
        self.ln(3)
        self.multi_cell(0, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)
        self.set_text_color(*DARK)

    def h3(self, text: str) -> None:
        self.set_font("arial", "B", 11)
        self.set_text_color(*SECONDARY)
        self.ln(2)
        self.multi_cell(0, 6, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*DARK)

    def body(self, text: str, indent: int = 0) -> None:
        self.set_font("arial", "", 10)
        self.set_text_color(*DARK)
        if indent:
            self.set_x(self.get_x() + indent)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def bullet(self, text: str, indent: int = 6) -> None:
        self.set_font("arial", "", 10)
        x = self.l_margin + indent
        self.set_x(x - 4)
        self.cell(4, 5.5, "•")
        self.set_x(x)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def note(self, text: str) -> None:
        self.set_fill_color(*LIGHT_BG)
        self.set_font("arial", "", 9.5)
        self.set_text_color(80, 70, 60)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True, border=0)
        self.set_text_color(*DARK)
        self.ln(1)

    def spacer(self, h: float = 4) -> None:
        self.ln(h)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[float]) -> None:
        self.set_font("arial", "B", 9.5)
        self.set_fill_color(*PRIMARY)
        self.set_text_color(*WHITE)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, border=0, fill=True, align="C")
        self.ln()

        self.set_font("arial", "", 9.5)
        self.set_text_color(*DARK)
        for r_idx, row in enumerate(rows):
            fill_color = ROW_ALT if r_idx % 2 == 0 else WHITE
            self.set_fill_color(*fill_color)
            # measure max lines in row
            max_lines = 1
            for i, cell in enumerate(row):
                lines = self._estimate_lines(cell, col_widths[i] - 2, 9.5)
                max_lines = max(max_lines, lines)
            row_h = max_lines * 5.5 + 2

            y_start = self.get_y()
            x_start = self.l_margin
            # draw background
            self.rect(x_start, y_start, sum(col_widths), row_h, style="F")
            # draw cells
            x = x_start
            for i, cell in enumerate(row):
                self.set_xy(x, y_start)
                self.multi_cell(col_widths[i], row_h / max(max_lines, 1), cell,
                                border=0, fill=False,
                                new_x=XPos.RIGHT, new_y=YPos.TOP)
                x += col_widths[i]
            self.set_xy(x_start, y_start + row_h)

        # bottom border
        self.set_draw_color(200, 195, 185)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.l_margin + sum(col_widths), self.get_y())
        self.ln(3)

    def _estimate_lines(self, text: str, width_mm: float, font_size: float) -> int:
        chars_per_line = int(width_mm / (font_size * 0.38))
        if chars_per_line <= 0:
            return len(text)
        lines = 0
        for part in text.split("\n"):
            lines += max(1, -(-len(part) // chars_per_line))
        return lines

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("arial", "", 8)
        self.set_text_color(150, 140, 130)
        self.set_y(8)
        self.cell(0, 5, "Gym — Структура доступа по ролям", align="L")
        self.cell(0, 5, f"стр. {self.page_no()}", align="R")
        self.set_draw_color(200, 195, 185)
        self.line(20, 14, 190, 14)
        self.set_y(18)
        self.set_text_color(*DARK)

    def footer(self):
        self.set_y(-12)
        self.set_font("arial", "", 8)
        self.set_text_color(170, 160, 145)
        self.cell(0, 5, "Gym Backend — Внутренняя документация", align="C")


# ── cover page ──────────────────────────────────────────────────────────────

def cover(doc: Doc) -> None:
    doc.add_page()
    doc.set_fill_color(*PRIMARY)
    doc.rect(0, 0, 210, 80, style="F")

    doc.set_y(22)
    doc.set_font("arial", "B", 28)
    doc.set_text_color(*WHITE)
    doc.cell(0, 12, "Gym", align="C")
    doc.ln(10)
    doc.set_font("arial", "B", 16)
    doc.cell(0, 8, "Структура доступа по ролям", align="C")
    doc.ln(6)
    doc.set_font("arial", "", 11)
    doc.cell(0, 6, "и управление ресурсами", align="C")

    doc.set_y(88)
    doc.set_text_color(*DARK)
    doc.set_font("arial", "", 10)
    doc.cell(0, 6, "Версия 1.0  ·  2026", align="C")


# ── section 1 — roles ────────────────────────────────────────────────────────

def section_roles(doc: Doc) -> None:
    doc.add_page()
    doc.h1("1. Роли пользователей")

    doc.body(
        "В системе определены три роли. Роль назначается пользователю при регистрации "
        "или изменяется администратором через API. Роль хранится в таблице users.role."
    )
    doc.spacer()

    roles = [
        ["user", "USER", "Обычный клиент. Покупает доступ к ресурсам и занятиям, управляет своим профилем."],
        ["trainer", "TRAINER", "Тренер. Читает расписание, ведёт занятия, проставляет посещаемость."],
        ["admin", "ADMIN", "Администратор. Полный доступ ко всем операциям системы."],
    ]
    doc.table(
        ["Значение в БД", "Enum", "Описание"],
        roles,
        [38, 35, 97],
    )

    doc.h2("Изменение роли")
    doc.body("Роль меняется через защищённый эндпоинт:")
    doc.note("PATCH /api/v1/admin/users/{user_id}/role\n"
             "Заголовок: X-Admin-Secret: <admin_secret>")
    doc.body("Эндпоинт защищён секретным заголовком (не сессией), "
             "чтобы позволить первоначальную настройку без авторизованного администратора.")


# ── section 2 — authn ─────────────────────────────────────────────────────────

def section_auth(doc: Doc) -> None:
    doc.add_page()
    doc.h1("2. Аутентификация и сессии")

    doc.h2("Механизм")
    doc.bullet("Сессия хранится в Redis, идентифицируется cookie sid.")
    doc.bullet("При каждом запросе бэкенд проверяет наличие и актуальность сессии.")
    doc.bullet("CSRF-токен передаётся в заголовке X-CSRF-Token для всех мутирующих запросов.")
    doc.bullet("Refresh-токен позволяет продлить сессию без повторного входа.")
    doc.spacer()

    doc.h2("Жизненный цикл сессии")
    steps = [
        ["1", "Вход / регистрация", "POST /auth/login или /auth/register возвращает csrf_token и устанавливает cookies sid, refresh_token."],
        ["2", "Запрос к API", "Каждый запрос несёт cookie sid. Бэкенд извлекает session_data из Redis."],
        ["3", "CSRF-проверка", "Для POST/PATCH/DELETE: заголовок X-CSRF-Token должен совпадать с токеном в сессии."],
        ["4", "Обновление", "POST /auth/refresh (X-CSRF-Token) ротирует оба токена."],
        ["5", "Выход", "POST /auth/logout отзывает сессию в Redis и очищает cookies."],
    ]
    doc.table(["Шаг", "Действие", "Описание"], steps, [12, 42, 116])

    doc.h2("Dev-режим (только для разработки)")
    doc.note(
        "Когда переменная DEV_SECRET задана в .env, бэкенд принимает заголовок X-Dev-Auth: <DEV_SECRET>.\n"
        "При его наличии сессионная проверка пропускается — возвращается виртуальный Admin-пользователь.\n"
        "В production DEV_SECRET НЕ устанавливается."
    )

    doc.h2("Admin Login (bypass)")
    doc.body(
        "GET /api/v1/auth/admin-login?status=<ADMIN_SECRET>&telegram_id=<id>\n"
        "Создаёт реальную сессию от имени любого пользователя. Используется только в dev/staging."
    )


# ── section 3 — resource access ───────────────────────────────────────────────

def section_resource_access(doc: Doc) -> None:
    doc.add_page()
    doc.h1("3. Доступ к ресурсам")

    doc.body(
        "Ресурс (Resource) — это контент-единица системы (программа, курс). "
        "Доступ к ресурсу предоставляется одним из двух способов в зависимости от типа тарифа."
    )
    doc.spacer()

    doc.h2("3.1 Типы тарифов (Plan)")
    doc.table(
        ["plan_type", "Что создаётся при оплате", "Как проверяется доступ"],
        [
            ["online", "AccessGrant (запись в таблице access_grants)", "Проверка по user_id + resource_id + временной диапазон"],
            ["attendance", "Subscription (запись в таблице subscriptions)", "Проверка активного абонемента с classes_remaining > 0"],
        ],
        [32, 68, 70],
    )

    doc.h2("3.2 AccessGrant — онлайн-доступ")
    doc.bullet("Создаётся автоматически при успешной оплате заказа (OrderStatus.PAID).")
    doc.bullet("Содержит: user_id, resource_id, order_id, starts_at, expires_at, is_lifetime.")
    doc.bullet("Admin автоматически имеет доступ ко всем ресурсам (без записи в таблице).")
    doc.bullet("Отозвать: POST /api/v1/admin/revoke-access (X-CSRF-Token, роль admin).")
    doc.spacer()

    doc.h2("3.3 Subscription — абонемент для занятий")
    grants = [
        ["classes_total", "Общее количество занятий по тарифу"],
        ["classes_remaining", "Оставшихся занятий (убывает при записи)"],
        ["max_extensions", "Максимум переносов (из тарифа)"],
        ["extensions_used", "Использовано переносов"],
        ["expires_at", "Дата окончания действия абонемента"],
        ["status", "active / exhausted / expired / cancelled"],
    ]
    doc.table(["Поле", "Значение"], grants, [55, 115])

    doc.h2("3.4 Логика проверки доступа (require_resource_access)")
    doc.note(
        "1. Если user.role == ADMIN → доступ разрешён без проверки.\n"
        "2. Если есть активная запись в access_grants (online-доступ) → разрешён.\n"
        "3. Если есть активный Subscription с classes_remaining > 0 → разрешён.\n"
        "4. Иначе → 403 Forbidden."
    )


# ── section 4 — schedule ──────────────────────────────────────────────────────

def section_schedule(doc: Doc) -> None:
    doc.add_page()
    doc.h1("4. Расписание занятий")

    doc.h2("4.1 Сущности")
    entities = [
        ["TrainingEvent", "Занятие в расписании. Привязано к тренеру и ресурсу."],
        ["Enrollment", "Запись пользователя на конкретное занятие."],
        ["SubscriptionAuditLog", "Журнал всех изменений абонемента."],
    ]
    doc.table(["Таблица", "Назначение"], entities, [55, 115])

    doc.h2("4.2 Статусы занятия (TrainingEvent)")
    doc.table(
        ["Статус", "Описание"],
        [
            ["scheduled", "Запланировано. Открыто для записи."],
            ["completed", "Завершено. Тренер проставил посещаемость."],
            ["cancelled", "Отменено. Все записавшиеся получили возврат занятия."],
        ],
        [40, 130],
    )

    doc.h2("4.3 Статусы записи (Enrollment)")
    doc.table(
        ["Статус", "Описание"],
        [
            ["enrolled", "Пользователь записан. classes_remaining уменьшен на 1."],
            ["notified_absent", "Пользователь заранее уведомил об отсутствии."],
            ["attended", "Тренер подтвердил посещение."],
            ["absent_extended", "Отсутствовал + уведомил заранее → classes_remaining +1, extensions_used +1."],
            ["missed", "Отсутствовал без уведомления или лимит переносов исчерпан → занятие сгорает."],
            ["cancelled", "Запись отменена до дедлайна. classes_remaining возвращается без расхода переносов."],
        ],
        [40, 130],
    )

    doc.h2("4.4 Дедлайн уведомления")
    doc.body(
        "Уведомление об отсутствии и отмена записи принимаются только если до начала занятия "
        "остаётся более ABSENCE_NOTICE_HOURS часов (по умолчанию 24 ч, настраивается в .env)."
    )

    doc.h2("4.5 Продление абонемента")
    doc.note(
        "Продление выдаётся автоматически при выполнении ОБОИХ условий:\n"
        "  1. Пользователь уведомил об отсутствии заранее (Enrollment.notified_at IS NOT NULL).\n"
        "  2. Тренер подтвердил отсутствие после занятия.\n\n"
        "Если extensions_used >= max_extensions — продление НЕ выдаётся, статус = missed."
    )


# ── section 5 — permissions matrix ────────────────────────────────────────────

def section_matrix(doc: Doc) -> None:
    doc.add_page()
    doc.h1("5. Матрица прав доступа")

    doc.h2("5.1 Управление пользователями и ролями")
    doc.table(
        ["Операция", "user", "trainer", "admin"],
        [
            ["Просмотр своего профиля (GET /me)", "✓", "✓", "✓"],
            ["Редактирование своего профиля (PATCH /me)", "✓", "✓", "✓"],
            ["Список всех пользователей (GET /admin/users)", "✗", "✗", "✓"],
            ["Список тренеров (GET /admin/trainers)", "✗", "✗", "✓"],
            ["Изменение роли пользователя (PATCH /admin/users/{id}/role)", "✗", "✗", "✓ + Admin-Secret"],
        ],
        [100, 22, 22, 26],
    )

    doc.h2("5.2 Ресурсы и тарифы")
    doc.table(
        ["Операция", "user", "trainer", "admin"],
        [
            ["Просмотр списка ресурсов", "✓", "✓", "✓"],
            ["Просмотр тарифов ресурса", "✓", "✓", "✓"],
            ["Доступ к контенту ресурса", "по гранту/абонементу", "по гранту/абонементу", "✓"],
            ["Отзыв доступа (POST /admin/revoke-access)", "✗", "✗", "✓"],
        ],
        [100, 32, 32, 26],
    )

    doc.h2("5.3 Заказы и оплата")
    doc.table(
        ["Операция", "user", "trainer", "admin"],
        [
            ["Создание заказа", "✓", "✓", "✓"],
            ["Просмотр своих заказов", "✓", "✓", "✓"],
            ["Webhook от платёжной системы", "✗ (только сервис)", "✗", "✗"],
        ],
        [100, 22, 22, 26],
    )

    doc.h2("5.4 Расписание занятий")
    doc.table(
        ["Операция", "user", "trainer", "admin"],
        [
            ["Просмотр расписания (GET /schedule)", "✓", "✓", "✓"],
            ["Создание занятия (POST /schedule)", "✗", "✗", "✓"],
            ["Изменение занятия (PATCH /schedule/{id})", "✗", "✗", "✓"],
            ["Отмена занятия (DELETE /schedule/{id})", "✗", "✗", "✓"],
            ["Список записей на занятие", "✗", "только свои занятия", "✓"],
            ["Запись на занятие (POST /schedule/{id}/enroll)", "✓", "✗", "✗"],
            ["Отмена записи до дедлайна", "только свою", "✗", "✗"],
            ["Уведомление об отсутствии", "только свою", "✗", "✗"],
            ["Подтверждение посещаемости", "✗", "только свои занятия", "✓"],
        ],
        [100, 22, 32, 26],
    )

    doc.h2("5.5 Абонементы")
    doc.table(
        ["Операция", "user", "trainer", "admin"],
        [
            ["Просмотр своих абонементов (GET /me/subscriptions)", "✓", "✓", "✓"],
            ["Просмотр всех абонементов", "✗", "✗", "✓"],
        ],
        [100, 22, 22, 26],
    )


# ── section 6 — endpoints ─────────────────────────────────────────────────────

def section_endpoints(doc: Doc) -> None:
    doc.add_page()
    doc.h1("6. Справочник API эндпоинтов")

    groups = [
        ("Аутентификация (/auth)", [
            ("POST", "/auth/register", "Регистрация + старт сессии", "—"),
            ("POST", "/auth/login", "Вход + старт сессии", "—"),
            ("POST", "/auth/logout", "Завершение сессии", "X-CSRF-Token"),
            ("POST", "/auth/refresh", "Ротация токенов", "X-CSRF-Token"),
            ("GET",  "/auth/admin-login", "Dev/staging bypass входа", "?status=ADMIN_SECRET"),
        ]),
        ("Пользователи", [
            ("GET",   "/me", "Текущий пользователь", "session"),
            ("PATCH", "/me", "Обновить профиль", "X-CSRF-Token"),
            ("GET",   "/me/accesses", "Мои online-доступы", "session"),
            ("GET",   "/me/subscriptions", "Мои абонементы", "session"),
        ]),
        ("Расписание (/schedule)", [
            ("GET",    "/schedule", "Список занятий (фильтры: trainer_id, resource_id, start, end)", "session"),
            ("POST",   "/schedule", "Создать занятие", "admin + CSRF"),
            ("PATCH",  "/schedule/{id}", "Изменить занятие", "admin + CSRF"),
            ("DELETE", "/schedule/{id}", "Отменить занятие", "admin + CSRF"),
            ("GET",    "/schedule/{id}", "Детали занятия", "session"),
            ("GET",    "/schedule/{id}/enrollments", "Список записей", "trainer/admin"),
            ("POST",   "/schedule/{id}/enroll", "Записаться на занятие", "user + CSRF"),
            ("DELETE", "/schedule/{id}/enroll", "Отменить запись", "user + CSRF"),
            ("POST",   "/schedule/{id}/absence", "Уведомить об отсутствии", "user + CSRF"),
            ("POST",   "/schedule/{id}/attendance", "Проставить посещаемость", "trainer + CSRF"),
        ]),
        ("Администрирование (/admin)", [
            ("GET",   "/admin/users", "Список всех пользователей", "admin"),
            ("GET",   "/admin/trainers", "Список тренеров", "admin"),
            ("PATCH", "/admin/users/{id}/role", "Изменить роль", "X-Admin-Secret"),
            ("POST",  "/admin/revoke-access", "Отозвать online-доступ", "admin + CSRF"),
        ]),
    ]

    for group_name, endpoints in groups:
        doc.h3(group_name)
        doc.table(
            ["Метод", "Путь", "Описание", "Доступ"],
            endpoints,
            [20, 70, 64, 36],
        )


# ── section 7 — audit ─────────────────────────────────────────────────────────

def section_audit(doc: Doc) -> None:
    doc.add_page()
    doc.h1("7. Аудит действий")

    doc.body(
        "Все изменения баланса занятий и переносов фиксируются в таблице subscription_audit_logs."
    )
    doc.spacer()

    doc.table(
        ["Действие (action)", "Когда записывается"],
        [
            ["enrolled", "Пользователь записался на занятие (-1 занятие)"],
            ["cancelled", "Запись отменена до дедлайна (+1 занятие)"],
            ["notified", "Пользователь уведомил об отсутствии"],
            ["confirmed_attended", "Тренер подтвердил посещение"],
            ["confirmed_absent", "Тренер подтвердил отсутствие (без продления)"],
            ["extended", "Выдано продление (+1 занятие, +1 перенос)"],
            ["expired", "Абонемент истёк по времени"],
            ["exhausted", "Занятия исчерпаны"],
        ],
        [55, 115],
    )

    doc.h2("Поля записи аудита")
    doc.table(
        ["Поле", "Описание"],
        [
            ["subscription_id", "Идентификатор абонемента"],
            ["actor_id", "Кто совершил действие (user или trainer)"],
            ["enrollment_id", "Связанная запись на занятие (если применимо)"],
            ["classes_before / classes_after", "Баланс до и после операции"],
            ["extensions_before / extensions_after", "Переносы до и после операции"],
            ["note", "Дополнительная информация (причина, если перенос не выдан)"],
        ],
        [60, 110],
    )


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    doc = Doc()
    cover(doc)
    section_roles(doc)
    section_auth(doc)
    section_resource_access(doc)
    section_schedule(doc)
    section_matrix(doc)
    section_endpoints(doc)
    section_audit(doc)

    out = "/Users/dmitriy/Projects/work/gym/access_structure.pdf"
    doc.output(out)
    print(f"PDF сохранён: {out}")


if __name__ == "__main__":
    main()
