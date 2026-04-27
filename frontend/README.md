# Frontend

Минимальный scaffold для frontend-приложения на `Next.js + React + TypeScript + MUI`.

## Структура

- `src/app` — App Router и глобальные стили.
- `src/pages` — FSD page-layer.
- `src/widgets` — UI-композиции верхнего уровня.
- `src/features` — feature-layer.
- `src/entities` — entity-layer.
- `src/shared` — theme, providers и общие зависимости.

## Запуск

```bash
npm install
npm run dev
```

Для локальной конфигурации можно создать `.env.local` на основе шаблона:

```bash
cp .env.local.example .env.local
```

По умолчанию frontend проксирует `/api/v1/*` на `http://127.0.0.1:8000/api/v1/*`.
Если backend запущен на другом адресе, укажите:

```bash
API_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
```

## Mock Auth для UI-разработки

Если нужно разрабатывать интерфейс без реальной авторизации, включите mock auth:

```bash
cp .env.local.example .env.local
npm run dev
```

В этом режиме frontend:

- не требует реального логина или регистрации;
- сразу считает пользователя авторизованным;
- не зависит от backend для `/me`, `login`, `register`, `refresh`.
