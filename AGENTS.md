# AGENTS.md

## Обзор Workspace

- Корень репозитория является контейнером рабочего пространства для backend и frontend.
- Основной backend-код находится в `backand/`.
- Каталог `frontend/` зарезервирован под frontend-приложение и сейчас еще не заполнен кодом.
- Каталог `assets/` содержит проектные ассеты и вспомогательные материалы, а не runtime-код приложения.

## Общие Правила Работы

- Перед изменениями сначала изучай существующую структуру и текущий код.
- Держи изменения локальными и целевыми; не расширяй область правок без необходимости.
- Не переименовывай `backand/` в `backend/`, если это явно не запрошено.
- Если задача не требует изменений на уровне всего workspace, старайся не затрагивать корень репозитория.

## Структура Проекта

- Backend root: `backand/`
- Frontend root: `frontend/`
- Assets: `assets/`

## Backend-Стек

- `Python`
- `FastAPI`
- `SQLAlchemy`
- `Alembic`
- `PostgreSQL`
- `Redis`
- `Celery`
- `Pydantic v2`

## Backend-Структура

- Точка входа FastAPI-приложения: `backand/app/main.py`
- API-роуты: `backand/app/api/routes/`
- Зависимости и DI: `backand/app/api/deps.py`
- Конфигурация: `backand/app/core/config.py`
- Модели SQLAlchemy: `backand/app/models/`
- Pydantic-схемы и DTO: `backand/app/schemas/`
- Бизнес-логика: `backand/app/services/`
- Работа с БД и Redis: `backand/app/db/`
- Фоновые задачи: `backand/app/tasks/`
- Миграции: `backand/alembic/`
- Тесты: `backand/tests/`

## Backend-Конвенции

- Сохраняй разделение между `api`, `services`, `models`, `schemas`, `db` и `tasks`.
- Используй Pydantic v2 для всех request/response моделей.
- Используй type hints во всех функциях.
- Для доступа к БД используй стандартный FastAPI Dependency Injection через `get_db`.
- Для runtime-кода придерживайся async-first подхода там, где проект уже использует `AsyncSession` и async Redis.
- Не смешивай HTTP-логику, ORM-логику и бизнес-логику в одном слое.
- При изменении контрактов API синхронизируй схемы, сервисы и тесты.

## Frontend-Стек

- `Next.js`
- `React`
- `TypeScript`
- `MUI`
- `ESLint`
- `FSD` (Feature-Sliced Design)

## Frontend-Ожидания

- Весь frontend-код должен размещаться в `frontend/`.
- Frontend следует строить на `Next.js + React + TypeScript`.
- Архитектурно придерживайся `FSD`: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- Для UI используй `MUI` как основную библиотеку компонентов.
- Для качества кода и единообразия придерживайся `ESLint`.
- Не смешивай frontend-слой представления с backend-логикой.
- Интеграцию с API располагай в frontend-слое данных, например в `shared/api` или в соответствующих `entities/features`.
- Пока `frontend/` пуст, любые scaffold-решения для frontend должны быть минимальными и согласованными с этим стеком.
- При исользовании компонентов Mui если возможно используй тему от Mui. Стили задвай в самом компоненте в крайнем случае.
- При добавлении контекста в компоненте предусматривай использование i18n и перевод на русский, узбекский и казахский языки
## Окружение И Runtime

- Backend-настройки загружаются из `.env`.
- Учитывай, что разрешение `.env` зависит от рабочей директории процесса.
- Для backend по умолчанию ожидаются локальные сервисы `PostgreSQL` и `Redis`.
- К чувствительным настройкам относятся webhook secrets, cookie settings, session TTL и параметры подключения к БД/Redis.
- При запуске backend-команд предпочтительно работать из `backand/`.

## Тестирование

- Backend-тесты находятся в `backand/tests/`.
- При изменении моделей, сервисов, auth, payments, access, sessions или orders обновляй или добавляй pytest-покрытие.
- Сохраняй совместимость тестового слоя при изменении DB-dependent логики.
- Если меняется async DB-слой, следи за согласованностью тестового harness и фикстур.

## Практические Команды

- Установить backend-зависимости из `backand/`: `pip install -e .[dev]`
- Запустить backend из `backand/`: `uvicorn app.main:app --reload`
- Запустить миграции из `backand/`: `alembic upgrade head`
- Запустить backend-тесты из `backand/`: `pytest`

## Ожидания От Агента

- Если задача касается backend, считай `backand/` основным рабочим корнем.
- Если задача касается frontend, считай `frontend/` основным рабочим корнем.
- Если в задаче приложение упоминается в общем виде без уточнений, сначала определяй контекст по формулировке задачи и текущей структуре workspace.
- Сохраняй текущий стиль проекта и существующие границы модулей.
- Не добавляй новые фреймворки, инфраструктуру или крупные перемещения директорий без явного согласования.
- При работе с frontend следуй стеку `Next.js + React + TypeScript + MUI + FSD + ESLint`.
- При работе с backend следуй текущей структуре FastAPI-приложения и принятым разделениям слоев.
