const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");   // 🔑 OAuth — sesión de Passport
const passport = require("passport");          // 🔑 OAuth — Passport
require("dotenv").config();
require("./config/passport");                  // 🔑 OAuth — carga la estrategia Google
const router = require("./routes");
const errorHandler = require("./utils/errorHandler");
const { rateLimitAPI } = require("./middlewares/rateLimit.middleware");

const app = express();

// ─── CORS — Lista blanca de orígenes permitidos ─────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://192.168.1.7:5173",
  "http://172.16.0.1:5173",
  "https://ectyre.com", // Origen de producción original
  "https://www.ectyre.com", // Origen con subdominio www
  "https://ectyresa-com.vercel.app" // Origen de producción de Vercel
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(",").forEach(o => ALLOWED_ORIGINS.push(o.trim()));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir si el origin está en la lista blanca explícita, o si estamos en desarrollo
    if (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    return callback(
      Object.assign(new Error("Origen no permitido por la política CORS"), {
        statusCode: 403,
      })
    );
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Se agregaron más cabeceras comúnmente necesarias para peticiones preflight (incluyendo "Accept", "X-Requested-With", "Origin", y dejando Content-Type y Authorization)
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  credentials: true,
  maxAge: 86400, // Cache preflight 24 h
};

// ─── Helmet — Headers de seguridad HTTP ────────────────────────────
const helmetOptions = {
  // Content Security Policy: sólo APIs necesitan esto relajado
  contentSecurityPolicy: false,
  // Evitar exponer que el servidor es Express/Node
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Evitar iframes de dominios externos
  frameguard: { action: "deny" },
  // Forzar HTTPS en browsers (1 año)
  hsts:
    process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  // Ocultar el header X-Powered-By
  hidePoweredBy: true,
  // Prevenir MIME-sniffing
  noSniff: true,
  // Evitar cachear respuestas en navegadores
  noCache: false,
  // Protección XSS filtro (legacy browsers)
  xssFilter: true,
};

// ─── Middlewares globales ───────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));       // 🔒 Reducido de 10mb → 1mb para evitar abusos
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// ─── Rate limit global (antes de las rutas) ─────────────────────────
// Aplicado a TODAS las rutas /api/v1
app.use("/api/v1", rateLimitAPI);

// ─── Google OAuth — Session + Passport ──────────────────────────────
// ⚠️ ORDEN CRÍTICO: session ANTES de passport, passport ANTES del router
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ─── Rutas ─────────────────────────────────────────────────────────
app.use("/api/v1", router);

// Ruta raíz de bienvenida / health check
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Bienvenido a API Ectyre",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      llantas: "/api/v1/llantas",
      clientes: "/api/v1/clientes",
      carrito: "/api/v1/carrito",
      pedidos: "/api/v1/pedidos",
      direcciones: "/api/v1/direcciones",
      vehiculos: "/api/v1/vehiculos",
      admin: "/api/v1/admin",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  return res.status(200).json({ success: true, status: "OK", timestamp: new Date().toISOString() });
});

// Ruta no encontrada (404) — nunca exponer la ruta exacta en producción
app.use((req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  return res.status(404).json({
    success: false,
    message: isProduction
      ? "Recurso no encontrado"
      : `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error handler global ────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
