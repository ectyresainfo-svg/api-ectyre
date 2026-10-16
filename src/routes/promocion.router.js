"use strict";

const express = require("express");
const { getAll, getById, create, update, remove, toggleActivo } = require("../controllers/promocion.controllers");
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");
const { uploadImagenPromocion: uploadPromocion } = require("../middlewares/upload.middleware");

const router = express.Router();

// Este router se monta en /api/v1/admin/promociones (routes/index.js) — todo
// aquí es para el panel admin. El catálogo público vive en promocion.public.router.js.
router.get("/", verifyJWT, isAdmin, getAll);
router.get("/:id", verifyJWT, isAdmin, getById);

// 🔒 Escritura — antes solo pedían verifyJWT: cualquier cliente logueado
// podía crear, editar, borrar o activar/desactivar promociones.
router.post("/", verifyJWT, isAdmin, uploadPromocion, create);
router.put("/:id", verifyJWT, isAdmin, uploadPromocion, update);
router.delete("/:id", verifyJWT, isAdmin, remove);
router.patch("/:id/toggle", verifyJWT, isAdmin, toggleActivo);

module.exports = router;
