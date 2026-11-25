# Cinema API — ДЗ 2 (PostgreSQL + TypeORM)

Серверна частина кінотеатру на NestJS: фільми, зали, сеанси та бронювання місць.
Код ДЗ 1 перенесено з масивів у PostgreSQL: таблиці, сутності TypeORM, репозиторії
та міграції. Додано посторінкову видачу сеансів і транзакційне бронювання.

## Вимоги

- Node.js 20.19+ або 22.13+
- Docker з Docker Compose
- npm 11 (у npm 10 трапляється помилка `Cannot read properties of null (reading 'edgesOut')`;
  оновлення: `npm install -g npm@latest`)

## Запуск з нуля

```bash
# 1. Встановити залежності
npm install

# 2. Створити .env з прикладу
cp .env.example .env

# 3. Підняти PostgreSQL у Docker
docker compose up -d

# 4. Застосувати міграції (створити таблиці)
npm run migration:run

# 5. Засіяти базу тестовими даними (необов'язково)
npm run seed

# 6. Запустити в режимі розробки
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

## Змінні оточення

Приклад `.env` (файл `.env.example`):

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cinema
```

| Змінна | Опис | Зразкове значення |
|--------|------|-------------------|
| `PORT` | Порт HTTP-сервера (необов'язкова, за замовчуванням 3000) | `3000` |
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт PostgreSQL | `5432` |
| `DB_USERNAME` | Користувач бази | `postgres` |
| `DB_PASSWORD` | Пароль | `postgres` |
| `DB_NAME` | Назва бази | `cinema` |

Змінні перевіряються класом `EnvironmentVariables` (`src/config/env.validation.ts`)
з декораторами class-validator. Якщо змінної бракує або вона некоректна, застосунок
не стартує й показує, що саме не так. `docker-compose.yml` бере ті самі значення з `.env`.

## Команди

| Команда | Що робить |
|---------|-----------|
| `npm install` | встановлює залежності |
| `docker compose up -d` | піднімає PostgreSQL |
| `docker compose down` | зупиняє PostgreSQL (дані зберігаються) |
| `docker compose down -v` | зупиняє PostgreSQL і видаляє всі дані |
| `npm run migration:run` | застосовує всі нові міграції |
| `npm run migration:revert` | відкочує останню міграцію |
| `npm run migration:show` | показує, які міграції застосовані |
| `npm run migration:generate -- src/migrations/Name` | генерує нову міграцію зі змін у сутностях |
| `npm run seed` | заповнює базу тестовими даними |
| `npm run start:dev` | запускає застосунок з автоперезапуском |

## Засівання

`npm run seed` (`src/seed.ts`) запускається після міграцій і створює 2 фільми, 2 зали,
4 сеанси в різні дати та 1 бронювання на 2 місця. Кожен запис спершу шукається за
унікальними ознаками (назва фільму, назва залу, фільм + зал + час, заброньоване місце),
тому повторний запуск нічого не дублює.

## Перевірка роботи

Файл `requests.http` у корені містить запити до всіх маршрутів і на кожну помилку.
Відкрийте його у VS Code з розширенням **REST Client** (`humao.rest-client`) і виконуйте
згори вниз. Ідентифікатори підставляються зі змінних. Дані тепер зберігаються в базі,
тому назви залів отримують `{{$timestamp}}` і файл можна проганяти повторно.

## Схема бази

```
films 1──* showings *──1 halls
             │
             1
             │
             * bookings 1──* booking_seats
                                (showing_id, row, seat) UNIQUE
```

- `showings.film_id`, `showings.hall_id`: `NOT NULL`, `ON DELETE RESTRICT`. База не дає
  видалити фільм чи зал, поки на нього посилається сеанс; сервіс перетворює помилку
  `23503` на 409.
- `booking_seats.booking_id`: `ON DELETE CASCADE`. Видалення бронювання видаляє його місця.
- Унікальний індекс `(showing_id, row, seat)` у `booking_seats` гарантує, що одне місце
  на сеансі не продасться двічі, навіть при одночасних запитах. Помилка `23505` стає 409.

Таблиці створюються лише міграціями (`synchronize: false`). Міграції не редагуються
після застосування: зміна схеми означає нову міграцію.

## Що змінилося порівняно з ДЗ 1

- **`GET /showings`** повертає `{ items, total, page, limit }` і приймає `page`
  (від 1, типово 1), `limit` (1–100, типово 20), `sort` (`asc`/`desc`, типово `asc`).
  Фільтри, сортування та `LIMIT/OFFSET` виконуються одним SQL-запитом через Query Builder.
- **`POST /showings/:id/bookings`**: бронювання та всі його місця записуються в одній
  транзакції (`dataSource.transaction`). Якщо хоча б одне місце зайняте, відкочується
  все. Відповідь 409 не містить тексту помилки бази.
- **Єдиний формат помилок** (`src/common/http-exception.filter.ts`):
  `{ "statusCode": 404, "message": "...", "path": "/films/...", "timestamp": "..." }`.
- Циклічна залежність films/halls ↔ showings зникла: перевірку «чи є сеанси» виконує
  зовнішній ключ у базі.

## Структура

```
src/
  config/       валідація змінних оточення, параметри підключення
  common/       фільтр винятків, коди помилок Postgres, валідатор IsFutureDate
  films/        фільми
  halls/        зали, обчислення переліку місць
  showings/     сеанси, фільтрація + пагінація через Query Builder
  bookings/     бронювання (транзакція), схема залу із зайнятістю
  migrations/   міграції схеми
  data-source.ts  підключення для TypeORM CLI і seed
  seed.ts         засівання
```
