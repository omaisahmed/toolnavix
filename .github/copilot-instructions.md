# Project Guidelines

## Code Style
- Laravel: PSR-12 standards, use attributes syntax for model properties (e.g., `#[Fillable]`, `#[Hidden]`)
- Next.js: ESLint enabled, follow React best practices

## Architecture
- Monorepo with separate backend (Laravel 13) and frontend (Next.js 16) applications
- Backend serves HTML via Blade templates; frontend is standalone Next.js app
- Database: SQLite for development (configurable to MySQL)
- Sessions, cache, and queues are database-backed

## Build and Test
- Backend: `composer install`, `composer dev` (runs server, queue, Vite concurrently), `composer test`
- Frontend: `npm install`, `npm run dev`, `npm run build`
- Ensure Laragon is running for PHP/MySQL; run `php artisan migrate` after setup

## Conventions
- Use `composer setup` for initial backend setup (install dependencies, generate key, migrate database, build assets)
- Frontend and backend are independent; no shared build process
- Database migrations required before running tests or server
- Potential port conflicts: Laravel (8000), Next.js (3000), Vite (5173)
- PowerShell execution policy may block npm commands; use `powershell -ExecutionPolicy Bypass -Command` if needed

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for basic setup instructions.