"use strict";

const express = require("express");
const {
  getAllMedia,
  uploadSingleMedia,
  uploadMultipleMedia,
  deleteMediaItem,
} = require("../controllers/media.controllers");
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");
const {
  uploadMediaSingle,
  uploadMediaMultiple,
} = require("../middlewares/upload.middleware");

const router = express.Router();

// Rutas protegidas para administración de Media
router.use(verifyJWT, isAdmin);

// GET /api/v1/admin/media
router.get("/", getAllMedia);

// POST /api/v1/admin/media (subir 1 imagen)
router.post("/", uploadMediaSingle, uploadSingleMedia);

// POST /api/v1/admin/media/multiple (subir hasta 10 imágenes)
router.post("/multiple", uploadMediaMultiple, uploadMultipleMedia);

// DELETE /api/v1/admin/media/:id
router.delete("/:id", deleteMediaItem);

module.exports = router;
