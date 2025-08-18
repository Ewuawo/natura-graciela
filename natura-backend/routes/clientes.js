const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// helper para armar nombreCompleto
const nomComp = (nombre, apellido) =>
  String([nombre || "", apellido || ""].join(" ").replace(/\s+/g, " ").trim());

// LISTAR
router.get("/", async (_req, res) => {
  try {
    const pool = await poolPromise;
    const rs = await pool.request().query(`
      SELECT
        id,
        nombre,
        apellido,
        telefono,
        direccion,
        nombreCompleto,
        creadoEn,
        actualizadoEn
      FROM dbo.Clientes
      ORDER BY id DESC
    `);
    res.json(rs.recordset);
  } catch (err) {
    console.error("GET /clientes:", err);
    res.status(500).json({ error: "Error al listar clientes" });
  }
});

// OBTENER POR ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });
    const pool = await poolPromise;
    const rs = await pool.request().input("id", sql.Int, id).query(`
        SELECT id, nombre, apellido, telefono, direccion, nombreCompleto,
               creadoEn, actualizadoEn
        FROM dbo.Clientes WHERE id=@id
      `);
    if (!rs.recordset.length)
      return res.status(404).json({ error: "No encontrado" });
    res.json(rs.recordset[0]);
  } catch (err) {
    console.error("GET /clientes/:id:", err);
    res.status(500).json({ error: "Error al obtener cliente" });
  }
});

// CREAR
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion } = req.body || {};
    if (!nombre || !apellido)
      return res
        .status(400)
        .json({ error: "nombre y apellido son requeridos" });

    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("apellido", sql.NVarChar(100), apellido)
      .input("telefono", sql.NVarChar(50), telefono ?? null)
      .input("direccion", sql.NVarChar(200), direccion ?? null)
      .input("nombreCompleto", sql.NVarChar(210), nomComp(nombre, apellido))
      .query(`
        INSERT INTO dbo.Clientes (nombre, apellido, telefono, direccion, nombreCompleto)
        OUTPUT INSERTED.*
        VALUES (@nombre, @apellido, @telefono, @direccion, @nombreCompleto)
      `);

    res.status(201).json(rs.recordset[0]);
  } catch (err) {
    console.error("POST /clientes:", err);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

// ACTUALIZAR
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const { nombre, apellido, telefono, direccion } = req.body || {};
    const pool = await poolPromise;
    const rq = pool.request().input("id", sql.Int, id);
    const sets = [];

    if (nombre !== undefined) {
      sets.push("nombre=@nombre");
      rq.input("nombre", sql.NVarChar(100), nombre);
    }
    if (apellido !== undefined) {
      sets.push("apellido=@apellido");
      rq.input("apellido", sql.NVarChar(100), apellido);
    }
    if (telefono !== undefined) {
      sets.push("telefono=@telefono");
      rq.input("telefono", sql.NVarChar(50), telefono ?? null);
    }
    if (direccion !== undefined) {
      sets.push("direccion=@direccion");
      rq.input("direccion", sql.NVarChar(200), direccion ?? null);
    }

    // si cambia nombre o apellido, recalculamos nombreCompleto
    if (nombre !== undefined || apellido !== undefined) {
      sets.push("nombreCompleto=@nc");
      rq.input(
        "nc",
        sql.NVarChar(210),
        nomComp(
          nombre !== undefined ? nombre : null,
          apellido !== undefined ? apellido : null
        )
      );
    }

    if (!sets.length)
      return res.status(400).json({ error: "Nada para actualizar" });

    const rs = await rq.query(`
      UPDATE dbo.Clientes
      SET ${sets.join(", ")}, actualizadoEn=SYSUTCDATETIME()
      WHERE id=@id;
      SELECT * FROM dbo.Clientes WHERE id=@id;
    `);

    if (!rs.recordset[0])
      return res.status(404).json({ error: "No encontrado" });
    res.json(rs.recordset[0]);
  } catch (err) {
    console.error("PUT /clientes/:id:", err);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

// ELIMINAR
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id inválido" });

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM dbo.Clientes WHERE id=@id`);
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /clientes/:id:", err);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

module.exports = router;
