const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// Helper fecha
function toDateOnly(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value + "T00:00:00");
  if (isNaN(d)) return null;
  return d;
}

// LISTAR (solo activos)
router.get("/", async (_req, res) => {
  try {
    const pool = await poolPromise;
    const rs = await pool.request().query(`
      SELECT id, nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad
      FROM dbo.Productos
      WHERE activo = 1
      ORDER BY nombre ASC
    `);
    res.json(rs.recordset);
  } catch (err) {
    console.error("GET /productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// OBTENER POR ID (incluye inactivos)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = await poolPromise;
    const rs = await pool.request().input("id", sql.Int, id).query(`
        SELECT id, nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad, activo
        FROM dbo.Productos WHERE id = @id
      `);

    if (!rs.recordset.length)
      return res.status(404).json({ error: "No encontrado" });
    res.json(rs.recordset[0]);
  } catch (err) {
    console.error("GET /productos/:id:", err);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

// CREAR
router.post("/", async (req, res) => {
  try {
    const { nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad } =
      req.body;

    if (
      !nombre ||
      !detalle ||
      pCosto == null ||
      pVenta == null ||
      !fechaVencimiento ||
      cantidad == null
    ) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const fv = toDateOnly(fechaVencimiento);
    if (!fv)
      return res.status(400).json({ error: "fechaVencimiento inválida" });

    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("nombre", sql.VarChar(200), nombre)
      .input("detalle", sql.VarChar(500), detalle)
      .input("pCosto", sql.Decimal(10, 2), Number(pCosto))
      .input("pVenta", sql.Decimal(10, 2), Number(pVenta))
      .input("fechaVencimiento", sql.Date, fv)
      .input("cantidad", sql.Int, Number(cantidad)).query(`
        INSERT INTO dbo.Productos (nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad, activo)
        VALUES (@nombre, @detalle, @pCosto, @pVenta, @fechaVencimiento, @cantidad, 1);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    res.status(201).json({ id: rs.recordset[0].id });
  } catch (err) {
    console.error("POST /productos:", err);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

// ACTUALIZAR
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad } =
      req.body;

    if (
      !nombre ||
      !detalle ||
      pCosto == null ||
      pVenta == null ||
      !fechaVencimiento ||
      cantidad == null
    ) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const fv = toDateOnly(fechaVencimiento);
    if (!fv)
      return res.status(400).json({ error: "fechaVencimiento inválida" });

    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar(200), nombre)
      .input("detalle", sql.VarChar(500), detalle)
      .input("pCosto", sql.Decimal(10, 2), Number(pCosto))
      .input("pVenta", sql.Decimal(10, 2), Number(pVenta))
      .input("fechaVencimiento", sql.Date, fv)
      .input("cantidad", sql.Int, Number(cantidad)).query(`
        UPDATE dbo.Productos
           SET nombre=@nombre, detalle=@detalle, pCosto=@pCosto, pVenta=@pVenta,
               fechaVencimiento=@fechaVencimiento, cantidad=@cantidad
         WHERE id=@id;

        SELECT @@ROWCOUNT AS rows;
      `);

    if (!rs.recordset[0].rows)
      return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /productos/:id:", err);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

// ELIMINAR (físico si no tiene ventas, soft-delete si sí)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = await poolPromise;

    // ¿Tiene ventas asociadas?
    const ref = await pool.request().input("id", sql.Int, id).query(`
        SELECT COUNT(*) AS usos FROM dbo.VentaItems WHERE productoId=@id
      `);

    const usos = ref.recordset[0]?.usos ?? 0;

    if (usos > 0) {
      // soft delete
      const up = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          `UPDATE dbo.Productos SET activo = 0 WHERE id=@id; SELECT @@ROWCOUNT AS rows;`
        );
      if (!up.recordset[0].rows)
        return res.status(404).json({ error: "No encontrado" });
      return res.json({
        ok: true,
        softDeleted: true,
        message: "El producto tiene ventas asociadas. Se marcó como INACTIVO.",
      });
    }

    // borrado físico
    const del = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        `DELETE FROM dbo.Productos WHERE id=@id; SELECT @@ROWCOUNT AS rows;`
      );

    if (!del.recordset[0].rows)
      return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true, softDeleted: false });
  } catch (err) {
    console.error("DELETE /productos/:id:", err);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

module.exports = router;
