<!-- memoria-de-proyecto:inicio ruta=../../frontend/ectyrepage/docs -->
## Memoria del proyecto (léela primero)

Antes de tu primera respuesta en cada sesión, lee **sin preguntar** `../../frontend/ectyrepage/docs/STARTUP.md` y `../../frontend/ectyrepage/docs/CURRENT.md`, y sigue `STARTUP.md`. Después responde con un resumen breve: dónde quedamos, la próxima acción y los pendientes de prioridad alta.

Si no tienes la skill `memoria-de-proyecto` disponible, pide al usuario instalarla una vez con `npx skills add jzaruma1209/skills-privados-paul-zaruma --skill memoria-de-proyecto -a <nombre-de-tu-agente>` (no la instales tú sin permiso). Mientras tanto, sigue leyendo los archivos de arriba.
<!-- memoria-de-proyecto:fin -->


# AGENTS.md — API Ectyre

## Project Overview

Node.js (CommonJS) REST API for an e-commerce platform (tire/llanta sales). Express 4 + Sequelize 6 ORM + PostgreSQL. JWT auth + Google OAuth (Passport). Cloudinary image storage. Helmet, CORS, rate-limiting.

## Build / Run / Test Commands

```bash
# ── Development ──
npm run dev                  # nodemon src/server.js (hot-reload)
npm start                    # node src/server.js (production)

# ── Database ──
npm run db:create            # Create DB via sequelize-cli
npm run db:migrate           # Run all pending migrations
npm run db:migrate:prod      # Run migrations in production (NODE_ENV=production)
npm run db:seed              # Run all seeders
npm run db:seed:prod         # Run seeders in production
npm run reset:migrate        # Undo all migrations then re-migrate (for test reset)

# ── Testing (Jest + Supertest) ──
npm test                     # Full suite: pretest (reset:migrate) → jest --detectOpenHandles
npm run test:watch           # Jest in watch mode

# Run a single test file:
npx jest --detectOpenHandles src/tests/llanta.test.js

# Run tests matching a name:
npx jest --detectOpenHandles -t "GET /api/v1/llantas"

# Run with coverage:
npx jest --detectOpenHandles --coverage

# ── CI ──
# GitHub Actions on push/PR to main/develop. Runs `npm ci` then `node -e "require('./src/app.js')"`.
# No separate lint or typecheck step currently configured.
```

## Code Style Guidelines

### Imports & Module System
- **CommonJS** (`require` / `module.exports`). No ESM.
- Destructure named exports: `const { NotFoundError } = require("../utils/customErrors")`
- Group requires: 3rd-party first, then internal local modules.
- Internal paths use relative imports: `../services/llanta.services`, `../utils/catchError`

### Formatting & Naming
- **Double quotes** for strings. Semicolons required.
- **camelCase** for variables, functions, filenames (controllers, services, routes, middlewares).
- **PascalCase** for classes: `AppError`, `LlantaService`, `NotFoundError`.
- **kebab-case** for some model filenames: `detalle-pedido.js`, `item-carrito.js`, `marca-llanta.js`.
- Sequelize model names are PascalCase (`Llanta`, `MarcaLlanta`), table names are underscored (`llantas`, `marcas_llantas`).
- DB column names use `snake_case` mapped via `field:` in model definitions.

### Project Structure (MVC-like)
```
src/
  app.js               # Express app setup
  server.js            # Entry point
  config/              # 3 files — DB, Cloudinary, Passport (Google OAuth)
  models/              # 15 Sequelize models (incl. index.js with associations)
  migrations/          # 16 migrations (15 tables + 1 alter column)
  seeders/             # 8 seeders (marcas, llantas, imagenes, vehiculos, etc.)
  routes/              # 10 routers — index.js + auth, admin, carrito, cliente, direccion, imagen, llanta, pedido, vehiculo
  controllers/         # 8 request handlers (thin, delegate to services)
  services/            # 8 business logic classes (exported as singletons)
  middlewares/         # 5 files — auth, rateLimit, upload, validation, barrel index
  utils/               # 4 files — catchError, customErrors, errorHandler, connection
  tests/               # 5 Jest test files (*.test.js) + testMigrate helper
```

### API Response Format
Always JSON with this shape:
```js
// Success:
{ success: true, message: "...", data: { ... } }
// Error:
{ success: false, message: "...", errors: [...] }  // validation errors
```
- Controllers return `res.status(2xx).json(...)` with `success: true`.
- Errors return `success: false` — never expose stack traces in production.
- Health check: `GET /health` → `{ success: true, status: "OK", timestamp: "..." }`

### Error Handling
- **Custom error classes** in `src/utils/customErrors.js`: `AppError`, `NotFoundError` (404), `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409).
- **Async controllers** wrapped with `catchError` (`src/utils/catchError.js`) which catches promise rejections and forwards to `next(error)`.
- Services **throw** custom errors: `throw new NotFoundError("Llanta no encontrada")`.
- Global error handler (`src/utils/errorHandler.js`) handles Sequelize errors, JWT errors, CORS errors, and custom `AppError` instances.
- In development mode, error responses include `error.message` and `error.stack`; production hides internals.
- Unused parameters prefixed with underscore: `(error, req, res, _next)`.

### Database (Sequelize)
- Models extend `Model` class, call `Model.init()` with column definitions + config block.
- Timestamps enabled (`timestamps: true`), underscored naming (`underscored: true`).
- Associations in `static associate(models)` using `this.belongsTo`, `this.hasMany`, etc. with explicit `as:` aliases.
- Soft deletes via `activo: false` boolean flag, never hard-delete.
- Composite indexes defined in model config.

### Routes
- `express.Router()` instances. Public routes first, protected routes (with `verifyJWT`) separated by comments.
- Validation middlewares (from `express-validator`) applied inline: `router.post("/", verifyJWT, validateLlantaData, createLlanta)`.
- Carrito routes use **optional auth** — funcionan con JWT o con `sesionId` anónimo (middleware `optionalAuth`).
- All routes mounted under `/api/v1/` in `routes/index.js`.

### Testing (Jest + Supertest)
- Files match `**/tests/**/*.test.js`. Timeout: 30s. `forceExit: true`, `clearMocks: true`.
- Use `describe` + `test` (not `it`). `beforeAll` / `afterAll` for DB setup/teardown.
- Create test data in `beforeAll`, clean up in `afterAll` (destroy in reverse dependency order).
- Call `request(app)` from Supertest, chain `.expect(statusCode)`.
- Assert: `expect(res.body.success).toBe(true)`, `expect(res.body.data).toHaveProperty("idLlanta")`.
- Test DB environment uses `DATABASE_URL_TEST` env var.

### General Conventions
- Prefer `async/await` over raw promises.
- Section headers in comments: `// ─── Section name ──────────────────────────────`
- Security: Helmet (with CSP disabled for API), CORS whitelist, rate limiting on `/api/v1/`, sensitive ops rate-limited separately.
- Environment sensitive via `process.env.NODE_ENV` checks.
- Services exported as singleton: `module.exports = new LlantaService()`.
- Middlewares index barrel file at `src/middlewares/index.js` re-exports everything.
