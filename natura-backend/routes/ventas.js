const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

/* ============== helpers ============== */
function toDateOnly(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value + "T00:00:00");
  if (isNaN(d)) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

let ITEMS_TABLE = null; // cache

async function resolveItemsTable(pool) {
  if (ITEMS_TABLE) return ITEMS_TABLE;
  const q1 = await pool
    .request()
    .query(
      "SELECT IIF(OBJECT_ID('dbo.VentaItems','U') IS NOT NULL, 1, 0) AS ok"
    );
  if (q1.recordset[0]?.ok) {
    ITEMS_TABLE = "dbo.VentaItems";
    return ITEMS_TABLE;
  }
  const q2 = await pool
    .request()
    .query(
      "SELECT IIF(OBJECT_ID('dbo.Ventaltems','U') IS NOT NULL, 1, 0) AS ok"
    );
  if (q2.recordset[0]?.ok) {
    ITEMS_TABLE = "dbo.Ventaltems";
    return ITEMS_TABLE;
  }
  throw new Error(
    "No se encontró la tabla de items (dbo.VentaItems ni dbo.Ventaltems)."
  );
}

async function buildVentaDetalle(pool, ventaId) {
  const itemsTable = await resolveItemsTable(pool);

  // Cabecera
  const cab = await pool.request().input("ventaId", sql.Int, ventaId).query(`
      SELECT v.id, v.fecha, v.total, v.esCredito, v.cuotasTotal,
             v.clienteId, cl.nombreCompleto
      FROM dbo.Ventas v
      LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
      WHERE v.id = @ventaId
    `);
  if (!cab.recordset.length) return null;

  // Items
  const items = await pool.request().input("ventaId", sql.Int, ventaId).query(`
      SELECT i.id, i.ventaId, i.productoId, p.nombre AS producto,
             i.cantidad, i.pUnit, i.subTotal
      FROM ${itemsTable} i
      LEFT JOIN dbo.Productos p ON p.id = i.productoId
      WHERE i.ventaId = @ventaId
      ORDER BY i.id ASC
    `);

  // Cuotas
  const cuotas = await pool.request().input("ventaId", sql.Int, ventaId).query(`
      SELECT id, ventaId, numero, venceEl, importe, pagada, pagadaEl
      FROM dbo.Cuotas
      WHERE ventaId = @ventaId
      ORDER BY numero ASC
    `);

  return {
    venta: cab.recordset[0],
    items: items.recordset,
    cuotas: cuotas.recordset,
  };
}

/* ============== endpoints ============== */

// GET /ventas  (trae además el primer producto/cant/pUnit)
router.get("/", async (req, res) => {
  try {
    const clienteId = req.query.clienteId
      ? parseInt(req.query.clienteId, 10)
      : null;
    const desde = toDateOnly(req.query.desde || null);
    const hasta = toDateOnly(req.query.hasta || null); // inclusive
    const pool = await poolPromise;
    const itemsTable = await resolveItemsTable(pool);

    const rq = pool.request();
    let where = "1=1";
    if (clienteId) {
      where += " AND v.clienteId = @clienteId";
      rq.input("clienteId", sql.Int, clienteId);
    }
    if (desde) {
      where += " AND v.fecha >= @desde";
      rq.input("desde", sql.Date, desde);
    }
    if (hasta) {
      const h = new Date(hasta);
      h.setDate(h.getDate() + 1);
      where += " AND v.fecha < @hasta";
      rq.input("hasta", sql.Date, h);
    }

    const rs = await rq.query(`
      SELECT v.id, v.fecha, v.total, v.esCredito, v.cuotasTotal,
             v.clienteId, cl.nombreCompleto,
             (SELECT TOP 1 p.nombre FROM ${itemsTable} i
              LEFT JOIN dbo.Productos p ON p.id = i.productoId
              WHERE i.ventaId = v.id ORDER BY i.id) AS primerProducto,
             (SELECT TOP 1 i.cantidad FROM ${itemsTable} i
              WHERE i.ventaId = v.id ORDER BY i.id) AS primerCantidad,
             (SELECT TOP 1 i.pUnit FROM ${itemsTable} i
              WHERE i.ventaId = v.id ORDER BY i.id) AS primerPUnit
      FROM dbo.Ventas v
      LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
      WHERE ${where}
      ORDER BY v.fecha DESC, v.id DESC
    `);

    res.json(rs.recordset);
  } catch (e) {
    console.error("GET /ventas:", e?.originalError?.info?.message || e.message);
    res.status(500).json({ error: "Error al listar ventas" });
  }
});

// GET /ventas/:id  (cabecera)
router.get("/:id", async (req, res) => {
  try {
    const ventaId = parseInt(req.params.id, 10);
    const pool = await poolPromise;
    const rs = await pool.request().input("ventaId", sql.Int, ventaId).query(`
        SELECT v.id, v.fecha, v.total, v.esCredito, v.cuotasTotal,
               v.clienteId, cl.nombreCompleto
        FROM dbo.Ventas v
        LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
        WHERE v.id = @ventaId
      `);
    if (!rs.recordset.length)
      return res.status(404).json({ error: "No encontrada" });
    res.json(rs.recordset[0]);
  } catch (e) {
    console.error(
      "GET /ventas/:id:",
      e?.originalError?.info?.message || e.message
    );
    res.status(500).json({ error: "Error al obtener la venta" });
  }
});

// GET /ventas/:id/detalle  (cabecera + items + cuotas)
router.get("/:id/detalle", async (req, res) => {
  try {
    const ventaId = parseInt(req.params.id, 10);
    const pool = await poolPromise;
    const det = await buildVentaDetalle(pool, ventaId);
    if (!det) return res.status(404).json({ error: "No encontrada" });
    res.json(det);
  } catch (e) {
    console.error(
      "GET /ventas/:id/detalle:",
      e?.originalError?.info?.message || e.message
    );
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});

// POST /ventas  (creación tolerante)
router.post("/", async (req, res) => {
  const body = req.body || {};

  // Aceptar distintas formas de payload
  let cabecera = body.cabecera || {
    clienteId: body.clienteId,
    fecha: body.fecha,
    total: body.total,
    esCredito: body.esCredito,
    cuotasTotal: body.cuotasTotal,
  };

  let itemsCand = [
    body.items,
    body.detalle,
    body.detalles,
    body.carrito,
    body.itemsVenta,
    body.venta?.items,
    body.venta?.detalles,
  ].find((x) => Array.isArray(x) && x.length);
  const cuotas = Array.isArray(body.cuotas)
    ? body.cuotas
    : Array.isArray(body.venta?.cuotas)
    ? body.venta.cuotas
    : [];

  if (!itemsCand || !itemsCand.length) {
    return res
      .status(400)
      .json({ error: "Datos de venta incompletos (sin items)." });
  }

  // Normalizar items
  const items = itemsCand
    .map((it) => {
      const cantidad = Number(it.cantidad ?? it.cant ?? it.qty ?? 0);
      const pUnit = Number(
        it.pUnit ??
          it.precioUnitario ??
          it.precio ??
          it.pVenta ??
          it.pventa ??
          0
      );
      const subTotal = Number(it.subTotal ?? it.subtotal ?? cantidad * pUnit);
      return {
        productoId: it.productoId ?? it.idProducto ?? null,
        nombre: it.producto ?? it.nombre ?? null,
        cantidad,
        pUnit,
        subTotal,
      };
    })
    .filter((it) => it.cantidad > 0 && Number.isFinite(it.pUnit));

  if (!items.length) {
    return res.status(400).json({ error: "Items inválidos." });
  }

  // Normalizar cabecera
  cabecera = {
    clienteId: cabecera?.clienteId ?? null,
    fecha: toDateOnly(cabecera?.fecha) || new Date(),
    total: Number(
      cabecera?.total ?? items.reduce((a, b) => a + (b.subTotal || 0), 0)
    ),
    esCredito: !!cabecera?.esCredito,
    cuotasTotal: Number(
      cabecera?.cuotasTotal ?? (cabecera?.esCredito ? cuotas.length : 0)
    ),
  };

  const pool = await poolPromise;
  const tx = await pool.transaction();
  try {
    await tx.begin();

    // cabecera
    const cab = await tx
      .request()
      .input("clienteId", sql.Int, cabecera.clienteId || null)
      .input("fecha", sql.Date, cabecera.fecha)
      .input("total", sql.Decimal(10, 2), cabecera.total)
      .input("esCredito", sql.Bit, cabecera.esCredito ? 1 : 0)
      .input("cuotasTotal", sql.Int, cabecera.cuotasTotal || 0).query(`
        INSERT INTO dbo.Ventas (clienteId, fecha, total, esCredito, cuotasTotal, creadoEn)
        OUTPUT INSERTED.id
        VALUES (@clienteId, @fecha, @total, @esCredito, @cuotasTotal, SYSUTCDATETIME())
      `);
    const ventaId = cab.recordset[0].id;

    // items (acepta productoId o nombre)
    const itemsTable = await resolveItemsTable(pool);
    for (const it of items) {
      let pid = it.productoId;
      if (!pid && it.nombre) {
        const p = await tx
          .request()
          .input("nombre", sql.VarChar(200), it.nombre)
          .query(
            `SELECT TOP 1 id FROM dbo.Productos WHERE nombre = @nombre AND (activo = 1 OR activo IS NULL) ORDER BY id`
          );
        if (!p.recordset.length) {
          throw new Error(`Producto no encontrado: ${it.nombre}`);
        }
        pid = p.recordset[0].id;
      }
      if (!pid) throw new Error("Falta productoId/nombre en un item.");

      await tx
        .request()
        .input("ventaId", sql.Int, ventaId)
        .input("productoId", sql.Int, pid)
        .input("cantidad", sql.Int, it.cantidad)
        .input("pUnit", sql.Decimal(10, 2), it.pUnit)
        .input("subTotal", sql.Decimal(10, 2), it.subTotal)
        .query(`INSERT INTO ${itemsTable} (ventaId, productoId, cantidad, pUnit, subTotal)
                VALUES (@ventaId, @productoId, @cantidad, @pUnit, @subTotal)`);

      // baja de stock
      await tx
        .request()
        .input("productoId", sql.Int, pid)
        .input("cantidad", sql.Int, it.cantidad)
        .query(
          `UPDATE dbo.Productos SET cantidad = cantidad - @cantidad WHERE id=@productoId`
        );
    }

    // cuotas
    if (cabecera.esCredito && Array.isArray(cuotas)) {
      for (const c of cuotas) {
        await tx
          .request()
          .input("ventaId", sql.Int, ventaId)
          .input("numero", sql.Int, Number(c.numero ?? c.nro ?? 0))
          .input(
            "venceEl",
            sql.Date,
            toDateOnly(c.venceEl ?? c.fecha ?? c.vencimiento)
          )
          .input(
            "importe",
            sql.Decimal(10, 2),
            Number(c.importe ?? c.monto ?? 0)
          ).query(`
            INSERT INTO dbo.Cuotas (ventaId, numero, venceEl, importe, pagada)
            VALUES (@ventaId, @numero, @venceEl, @importe, 0)
          `);
      }
    }

    await tx.commit();

    const det = await buildVentaDetalle(pool, ventaId);
    res.status(201).json(det);
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    console.error(
      "POST /ventas:",
      e?.originalError?.info?.message || e.message
    );
    res.status(500).json({ error: "Error al registrar la venta" });
  }
});

module.exports = router;
