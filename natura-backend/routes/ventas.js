// routes/ventas.js
const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

/* ============== utils ============== */
const NOMBRE_COMPLETO_EXPR =
  "LTRIM(RTRIM(ISNULL(cl.apellido,'') + ' ' + ISNULL(cl.nombre,'')))";

function toDateOnly(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v + "T00:00:00");
  if (isNaN(d)) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

async function hasTable(pool, name) {
  const r = await pool
    .request()
    .input("n", sql.NVarChar(256), name)
    .query("SELECT IIF(OBJECT_ID(@n,'U') IS NULL,0,1) ok");
  return r.recordset[0].ok === 1;
}

async function hasColumn(pool, tableFullName, col) {
  const r = await pool
    .request()
    .input("t", sql.NVarChar(256), tableFullName)
    .input("c", sql.NVarChar(128), col)
    .query(
      "SELECT COUNT(*) n FROM sys.columns WHERE object_id = OBJECT_ID(@t) AND name = @c"
    );
  return r.recordset[0].n > 0;
}

let ITEMS_TABLE; // cacheada
async function resolveItemsTable(pool) {
  if (ITEMS_TABLE !== undefined) return ITEMS_TABLE;
  if (await hasTable(pool, "dbo.VentaItems"))
    return (ITEMS_TABLE = "dbo.VentaItems");
  if (await hasTable(pool, "dbo.Ventaltems"))
    return (ITEMS_TABLE = "dbo.Ventaltems"); // compat con nombre mal tipeado
  return (ITEMS_TABLE = null);
}

async function resolveItemColumns(pool, itemsTable) {
  const hasPUnit = itemsTable && (await hasColumn(pool, itemsTable, "pUnit"));
  const hasPUnit2 =
    itemsTable && (await hasColumn(pool, itemsTable, "precioUnitario"));
  const hasSub1 = itemsTable && (await hasColumn(pool, itemsTable, "subTotal"));
  const hasSub2 = itemsTable && (await hasColumn(pool, itemsTable, "subtotal"));
  const pUnitCol = hasPUnit ? "pUnit" : hasPUnit2 ? "precioUnitario" : null;
  const subTotalCol = hasSub1 ? "subTotal" : hasSub2 ? "subtotal" : null;
  return {
    pUnitCol,
    subTotalCol,
    pUnitExpr: pUnitCol ? `i.${pUnitCol}` : "NULL",
    subTotalExpr: subTotalCol ? `i.${subTotalCol}` : "NULL",
  };
}

// Detecta nombre de columna de stock en Productos
async function resolveProductoStockColumn(pool) {
  const table = "dbo.Productos";
  const candidatos = [
    "stock",
    "cantidad",
    "existencia",
    "existencias",
    "stockActual",
  ];
  for (const c of candidatos) {
    // eslint-disable-next-line no-await-in-loop
    if (await hasColumn(pool, table, c)) return { table, col: c };
  }
  return { table, col: null };
}

/* ============== GET /ventas (listado) ============== */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const itemsTable = await resolveItemsTable(pool);

    const prodSub = itemsTable
      ? `(SELECT TOP 1 p.nombre FROM ${itemsTable} i
            LEFT JOIN dbo.Productos p ON p.id = i.productoId
            WHERE i.ventaId = v.id ORDER BY i.id)`
      : `NULL`;
    const cantSub = itemsTable
      ? `(SELECT TOP 1 i.cantidad FROM ${itemsTable} i
            WHERE i.ventaId = v.id ORDER BY i.id)`
      : `NULL`;

    const hasPUnit = itemsTable && (await hasColumn(pool, itemsTable, "pUnit"));
    const hasPU2 =
      itemsTable && (await hasColumn(pool, itemsTable, "precioUnitario"));
    const punitSub = itemsTable
      ? `(SELECT TOP 1 ${
          hasPUnit ? "i.pUnit" : hasPU2 ? "i.precioUnitario" : "NULL"
        } FROM ${itemsTable} i WHERE i.ventaId = v.id ORDER BY i.id)`
      : `NULL`;

    // filtro opcional por cliente
    const rq = pool.request();
    let where = "";
    if (req.query.clienteId) {
      const cliId = parseInt(req.query.clienteId, 10);
      if (!Number.isNaN(cliId)) {
        rq.input("cli", sql.Int, cliId);
        where = "WHERE v.clienteId = @cli";
      }
    }

    const rs = await rq.query(`
      SELECT v.id, v.fecha, v.total, v.esCredito, v.cuotasTotal,
             v.clienteId, ${NOMBRE_COMPLETO_EXPR} AS nombreCompleto,
             ${prodSub}  AS primerProducto,
             ${cantSub}  AS primerCantidad,
             ${punitSub} AS primerPUnit
      FROM dbo.Ventas v
      LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
      ${where}
      ORDER BY v.fecha DESC, v.id DESC
    `);

    res.json(rs.recordset);
  } catch (e) {
    console.error("GET /ventas:", e?.originalError?.info?.message || e.message);
    res.status(500).json({ error: "Error al listar ventas" });
  }
});

/* ============== GET /ventas/:id/detalle ============== */
router.get("/:id/detalle", async (req, res) => {
  try {
    const ventaId = parseInt(req.params.id, 10);
    const pool = await poolPromise;
    const itemsTable = await resolveItemsTable(pool);
    const { pUnitExpr, subTotalExpr } = await resolveItemColumns(
      pool,
      itemsTable
    );

    const cab = await pool.request().input("ventaId", sql.Int, ventaId).query(`
      SELECT v.id, v.fecha, v.total, v.esCredito, v.cuotasTotal,
             v.clienteId, ${NOMBRE_COMPLETO_EXPR} AS nombreCompleto
      FROM dbo.Ventas v
      LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
      WHERE v.id = @ventaId
    `);
    if (!cab.recordset.length)
      return res.status(404).json({ error: "No encontrada" });

    let items = { recordset: [] };
    if (itemsTable) {
      items = await pool.request().input("ventaId", sql.Int, ventaId).query(`
        SELECT i.id, i.productoId, p.nombre AS producto, i.cantidad,
               ${pUnitExpr} AS precioUnitario, ${subTotalExpr} AS subTotal
        FROM ${itemsTable} i
        LEFT JOIN dbo.Productos p ON p.id = i.productoId
        WHERE i.ventaId = @ventaId
        ORDER BY i.id
      `);
    }

    // cuotas
    const cuotasRS = await pool.request().input("ventaId", sql.Int, ventaId)
      .query(`
      SELECT id, numero AS nro, venceEl AS vencimiento, importe AS monto, pagada, pagadaEl
      FROM dbo.Cuotas WHERE ventaId = @ventaId ORDER BY numero
    `);
    let cuotas = cuotasRS.recordset;

    // pagos por cuota (si existe la tabla)
    if (await hasTable(pool, "dbo.CuotaPagos")) {
      const pagosRS = await pool.request().input("ventaId", sql.Int, ventaId)
        .query(`
        SELECT p.id, p.cuotaId, p.fecha, p.monto
        FROM dbo.CuotaPagos p
        JOIN dbo.Cuotas c ON c.id = p.cuotaId
        WHERE c.ventaId = @ventaId
        ORDER BY p.fecha ASC, p.id ASC
      `);
      const byCuota = pagosRS.recordset.reduce((acc, row) => {
        (acc[row.cuotaId] ||= []).push({ fecha: row.fecha, monto: row.monto });
        return acc;
      }, {});
      cuotas = cuotas.map((c) => ({ ...c, pagos: byCuota[c.id] || [] }));
    }

    res.json({
      venta: cab.recordset[0],
      items: items.recordset,
      cuotas,
    });
  } catch (e) {
    console.error(
      "GET /ventas/:id/detalle:",
      e?.originalError?.info?.message || e.message
    );
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});

/* === GET /ventas/stock/:productoId (usado por el formulario de ventas) === */
router.get("/stock/:productoId", async (req, res) => {
  try {
    const productoId = parseInt(req.params.productoId, 10);
    const pool = await poolPromise;
    const { table, col } = await resolveProductoStockColumn(pool);
    if (!col) return res.json({ productoId, stock: null }); // no hay columna de stock
    const rs = await pool
      .request()
      .input("id", sql.Int, productoId)
      .query(`SELECT ${col} AS stock FROM ${table} WHERE id = @id`);
    res.json({ productoId, stock: rs.recordset[0]?.stock ?? null });
  } catch (e) {
    console.error("GET /ventas/stock/:productoId:", e.message);
    res.status(500).json({ error: "No se pudo obtener stock" });
  }
});

/* ============== POST /ventas (registrar venta) ============== */
router.post("/", async (req, res) => {
  const {
    clienteId,
    fecha, // 'YYYY-MM-DD'
    items = [], // [{productoId, cantidad, precioUnitario}]
    esCredito = false,
    entregaInicial = 0,
    interesPct = 0,
    cuotas = [], // [{nro, monto, vencimiento}]
  } = req.body || {};

  if (!clienteId || !fecha || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const tx = new sql.Transaction(await poolPromise);

  try {
    await tx.begin();
    const t = new sql.Request(tx);

    const fechaSQL = toDateOnly(fecha);
    if (!fechaSQL) throw new Error("Fecha inválida");

    const totalCalc = items.reduce(
      (acc, it) =>
        acc + (Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0),
      0
    );

    // cabecera
    const cab = await t
      .input("clienteId", sql.Int, clienteId)
      .input("fecha", sql.Date, fechaSQL)
      .input("total", sql.Decimal(12, 2), totalCalc)
      .input("esCredito", sql.Bit, esCredito ? 1 : 0)
      .input("cuotasTotal", sql.Int, esCredito ? cuotas?.length || null : null)
      .input("entregaInicial", sql.Decimal(12, 2), entregaInicial || 0)
      .input("interesPct", sql.Decimal(5, 2), interesPct || 0).query(`
        INSERT INTO dbo.Ventas
          (clienteId, fecha, total, esCredito, cuotasTotal, entregaInicial, interesPct, creadoEn)
        OUTPUT INSERTED.id
        VALUES
          (@clienteId, @fecha, @total, @esCredito, @cuotasTotal, @entregaInicial, @interesPct, SYSDATETIME())
      `);
    const ventaId = cab.recordset[0].id;

    // items (sin subtotal)
    const pool = await poolPromise;
    const itemsTable = await resolveItemsTable(pool);
    if (!itemsTable)
      throw new Error("No existe la tabla de items (VentaItems).");
    const { pUnitCol } = await resolveItemColumns(pool, itemsTable);

    const cols = ["ventaId", "productoId", "cantidad"];
    if (pUnitCol) cols.push(pUnitCol);

    const insItemsSQL = `
      INSERT INTO ${itemsTable} (${cols.join(",")})
      VALUES ${items
        .map(
          (_it, i) =>
            `(@ventaId, @p${i}Prod, @p${i}Cant${
              pUnitCol ? `, @p${i}PUnit` : ""
            })`
        )
        .join(",")}
    `;
    const ti = new sql.Request(tx).input("ventaId", sql.Int, ventaId);
    items.forEach((it, i) => {
      const cant = Number(it.cantidad) || 0;
      const pU = Number(it.precioUnitario) || 0;
      ti.input(`p${i}Prod`, sql.Int, it.productoId);
      ti.input(`p${i}Cant`, sql.Int, cant);
      if (pUnitCol) ti.input(`p${i}PUnit`, sql.Decimal(12, 2), pU);
    });
    await ti.query(insItemsSQL);

    // descontar stock si existe columna
    const { table: prodTable, col: stockCol } =
      await resolveProductoStockColumn(pool);
    if (stockCol) {
      for (let i = 0; i < items.length; i += 1) {
        const it = items[i];
        const cant = Number(it.cantidad) || 0;
        if (cant <= 0) continue;

        const q = await new sql.Request(tx)
          .input("id", sql.Int, it.productoId)
          .query(
            `SELECT ${stockCol} AS stock FROM ${prodTable} WITH (UPDLOCK, ROWLOCK) WHERE id = @id`
          );
        const stockActual = Number(q.recordset[0]?.stock ?? 0);
        if (stockActual < cant) {
          throw new Error(
            `Stock insuficiente para producto ${it.productoId} (stock ${stockActual}, requerido ${cant})`
          );
        }
        await new sql.Request(tx)
          .input("id", sql.Int, it.productoId)
          .input("cant", sql.Int, cant)
          .query(
            `UPDATE ${prodTable} SET ${stockCol} = ${stockCol} - @cant WHERE id = @id`
          );
      }
    }

    // cuotas (si aplica)
    if (
      esCredito &&
      Array.isArray(cuotas) &&
      cuotas.length > 0 &&
      (await hasTable(pool, "dbo.Cuotas"))
    ) {
      const insC = new sql.Request(tx).input("ventaId", sql.Int, ventaId);
      const insSQL = `
        INSERT INTO dbo.Cuotas (ventaId, numero, venceEl, importe, pagada)
        VALUES ${cuotas
          .map((_c, i) => `(@ventaId, @c${i}Nro, @c${i}Vence, @c${i}Monto, 0)`)
          .join(",")}
      `;
      cuotas.forEach((c, i) => {
        insC.input(`c${i}Nro`, sql.Int, Number(c.nro) || i + 1);
        insC.input(`c${i}Monto`, sql.Decimal(12, 2), Number(c.monto) || 0);
        const vto = toDateOnly(c.vencimiento);
        insC.input(`c${i}Vence`, sql.Date, vto || toDateOnly(fecha));
      });
      await insC.query(insSQL);
    }

    await tx.commit();
    res.status(201).json({ ventaId });
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    console.error(
      "POST /ventas:",
      e?.originalError?.info?.message || e.message
    );
    res
      .status(500)
      .json({ error: e.message || "No se pudo registrar la venta" });
  }
});

/* ============== POST /ventas/:id/pagos (aplicar pago) ============== */
// Aplica un pago a las cuotas pendientes (en orden ascendente) y registra cada aplicación.
// Además, valida que el monto no supere el saldo actual (400 si lo supera).
router.post("/:id/pagos", async (req, res) => {
  let tx;
  try {
    const ventaId = parseInt(req.params.id, 10);
    const monto = Number(req.body?.monto);
    if (!ventaId || !(monto > 0)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const pool = await poolPromise;
    const tieneTablaPagos = await hasTable(pool, "dbo.CuotaPagos");

    tx = new sql.Transaction(await poolPromise);
    await tx.begin();

    // ❗ Validación server-side: monto <= saldo
    const saldoQ = await new sql.Request(tx)
      .input("ventaId", sql.Int, ventaId)
      .query(
        `SELECT ISNULL(SUM(importe),0) AS saldo FROM dbo.Cuotas WHERE ventaId=@ventaId`
      );
    const saldoSrv = Number(saldoQ.recordset[0]?.saldo || 0);
    if (monto > saldoSrv) {
      await tx.rollback();
      return res.status(400).json({
        error: `El monto supera el saldo actual ($${saldoSrv.toFixed(2)})`,
      });
    }

    // cuotas pendientes con LOCK
    const sel = await new sql.Request(tx).input("ventaId", sql.Int, ventaId)
      .query(`
        SELECT id, numero, importe
        FROM dbo.Cuotas WITH (UPDLOCK, ROWLOCK)
        WHERE ventaId = @ventaId AND (pagada = 0 OR importe > 0)
        ORDER BY numero
      `);

    let restante = monto;

    for (const c of sel.recordset) {
      if (restante <= 0) break;

      const aplica = Math.min(restante, Number(c.importe));
      const nuevoSaldo = Math.max(Number(c.importe) - aplica, 0);
      const pagada = nuevoSaldo <= 0 ? 1 : 0;
      const fechaPago = pagada ? new Date() : null;

      // Registrar el pago si existe la tabla
      if (tieneTablaPagos && aplica > 0) {
        await new sql.Request(tx)
          .input("cuotaId", sql.Int, c.id)
          .input("fecha", sql.DateTime2, new Date())
          .input("monto", sql.Decimal(12, 2), aplica)
          .query(
            `INSERT INTO dbo.CuotaPagos (cuotaId, fecha, monto)
             VALUES (@cuotaId, @fecha, @monto)`
          );
      }

      // Actualizar cuota (saldo y, si corresponde, fecha de cancelación)
      await new sql.Request(tx)
        .input("id", sql.Int, c.id)
        .input("importe", sql.Decimal(12, 2), nuevoSaldo)
        .input("pagada", sql.Bit, pagada)
        .input("pagadaEl", sql.DateTime2, fechaPago).query(`
          UPDATE dbo.Cuotas
             SET importe = @importe,
                 pagada  = @pagada,
                 pagadaEl = @pagadaEl
           WHERE id = @id
        `);

      restante -= aplica;
    }

    // saldo actual
    const saldoRS = await new sql.Request(tx)
      .input("ventaId", sql.Int, ventaId)
      .query(
        `SELECT ISNULL(SUM(importe),0) AS saldo FROM dbo.Cuotas WHERE ventaId=@ventaId`
      );

    await tx.commit();

    res.json({
      ok: true,
      montoAplicado: monto - Math.max(restante, 0),
      saldo: Number(saldoRS.recordset[0]?.saldo || 0),
    });
  } catch (e) {
    try {
      await tx?.rollback();
    } catch {}
    console.error("POST /ventas/:id/pagos:", e);
    res.status(500).json({ error: "Error registrando pago" });
  }
});

/* ============== PUT /ventas/:id/cuotas/:nro (editar importe) ============== */
router.put("/:id/cuotas/:nro", async (req, res) => {
  try {
    const ventaId = parseInt(req.params.id, 10);
    const nro = parseInt(req.params.nro, 10);
    const importe = Number(req.body?.importe);
    if (!ventaId || !nro || importe < 0 || Number.isNaN(importe)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    const pool = await poolPromise;

    const upd = await pool
      .request()
      .input("ventaId", sql.Int, ventaId)
      .input("nro", sql.Int, nro)
      .input("importe", sql.Decimal(12, 2), importe)
      .input("pagada", sql.Bit, importe === 0 ? 1 : 0)
      .input("pagadaEl", sql.DateTime, importe === 0 ? new Date() : null)
      .query(
        `UPDATE dbo.Cuotas
           SET importe=@importe,
               pagada=@pagada,
               pagadaEl=@pagadaEl
         WHERE ventaId=@ventaId AND numero=@nro;
         SELECT id, numero AS nro, venceEl AS vencimiento, importe AS monto, pagada, pagadaEl
         FROM dbo.Cuotas WHERE ventaId=@ventaId AND numero=@nro;`
      );

    if (!upd.recordset.length)
      return res.status(404).json({ error: "Cuota no encontrada" });

    // saldo actual
    const saldoRS = await pool
      .request()
      .input("ventaId", sql.Int, ventaId)
      .query(
        `SELECT ISNULL(SUM(importe),0) AS saldo FROM dbo.Cuotas WHERE ventaId=@ventaId`
      );

    res.json({
      ok: true,
      cuota: upd.recordset[0],
      saldo: Number(saldoRS.recordset[0]?.saldo || 0),
    });
  } catch (e) {
    console.error("PUT /ventas/:id/cuotas/:nro:", e.message);
    res.status(500).json({ error: "Error actualizando cuota" });
  }
});

module.exports = router;
