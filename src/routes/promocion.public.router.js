"use strict";

const express = require("express");
const { getAllPublicas, getByIdPublico } = require("../controllers/promocion.controllers");

const router = express.Router();

// 🌍 Catálogo público de promociones — solo las activas.
// Montado en /api/v1/promociones (routes/index.js). El CRUD del panel admin
// vive por separado en /api/v1/admin/promociones (promocion.router.js).
router.get("/", getAllPublicas);
router.get("/:id", getByIdPublico);

module.exports = router;
