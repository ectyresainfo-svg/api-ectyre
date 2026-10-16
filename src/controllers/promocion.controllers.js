"use strict";

const promocionService = require("../services/promocion.services");
const catchError = require("../utils/catchError");

const getAll = catchError(async (req, res) => {
  const items = await promocionService.getAll();
  res.json({ success: true, message: "Promociones obtenidas", data: items });
});

// 🌍 GET /api/v1/promociones — catálogo público, solo promociones activas
const getAllPublicas = catchError(async (req, res) => {
  const items = await promocionService.getAllPublicas();
  res.json({ success: true, message: "Promociones obtenidas", data: items });
});

const getById = catchError(async (req, res) => {
  const item = await promocionService.getById(req.params.id);
  res.json({ success: true, message: "Promoción obtenida", data: item });
});

// 🌍 GET /api/v1/promociones/:id — detalle público, nunca una desactivada
const getByIdPublico = catchError(async (req, res) => {
  const item = await promocionService.getByIdPublico(req.params.id);
  res.json({ success: true, message: "Promoción obtenida", data: item });
});

const create = catchError(async (req, res) => {
  const { nombre } = req.body;
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No se envió ninguna imagen" });
  }
  const item = await promocionService.create({
    urlImagen: req.file.path,
    nombre,
  });
  res.status(201).json({ success: true, message: "Promoción creada", data: item });
});

const update = catchError(async (req, res) => {
  const data = {};
  if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
  if (req.body.activo !== undefined) data.activo = req.body.activo === "true" || req.body.activo === true;
  if (req.file) {
    data.urlImagen = req.file.path;
  }
  const item = await promocionService.update(req.params.id, data);
  res.json({ success: true, message: "Promoción actualizada", data: item });
});

const remove = catchError(async (req, res) => {
  const result = await promocionService.delete(req.params.id);
  res.json({ success: true, message: result.message });
});

const toggleActivo = catchError(async (req, res) => {
  const item = await promocionService.toggleActivo(req.params.id);
  res.json({ success: true, message: "Estado cambiado", data: item });
});

module.exports = { getAll, getAllPublicas, getById, getByIdPublico, create, update, remove, toggleActivo };
