const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// ping del router
router.get("/ping", (_req, res) => res.send("alertas OK"));

/** Productos que vencen en N días (default 30) */
router.get("/productos", async (req, res) => {
  try {
    const days = Math.max(0, parseInt(req.query.days || "30", 10));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + days);

    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("hoy", sql.Date, hoy)
      .input("hasta", sql.Date, hasta).query(`
        SELECT id, nombre, detalle, pVenta, fechaVencimiento, cantidad
        FROM dbo.Productos
        WHERE fechaVencimiento IS NOT NULL
          AND fechaVencimiento BETWEEN @hoy AND @hasta
          AND cantidad > 0
        ORDER BY fechaVencimiento ASC, nombre ASC
      `);

    res.json(rs.recordset);
  } catch (e) {
    console.error("Error /alertas/productos:", e);
    res.status(500).json({ error: "Error al obtener productos por vencer" });
  }
});

/** Cuotas no pagadas que vencen en N días (default 7) */
router.get("/cuotas", async (req, res) => {
  try {
    const days = Math.max(0, parseInt(req.query.days || "7", 10));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + days);

    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("hoy", sql.Date, hoy)
      .input("hasta", sql.Date, hasta).query(`
        SELECT 
          c.id AS cuotaId, c.ventaId, c.numero AS nroCuota, c.venceEl, c.importe, c.pagada,
          v.clienteId, cl.nombreCompleto
        FROM dbo.Cuotas c
        JOIN dbo.Ventas v   ON v.id = c.ventaId
        LEFT JOIN dbo.Clientes cl ON cl.id = v.clienteId
        WHERE c.pagada = 0
          AND c.venceEl BETWEEN @hoy AND @hasta
        ORDER BY c.venceEl ASC, c.ventaId ASC, c.numero ASC
      `);

    res.json(rs.recordset);
  } catch (e) {
    console.error("Error /alertas/cuotas:", e);
    res
      .status(500)
      .json({ error: "Error al obtener cuotas próximas a vencer" });
  }
});

module.exports = router;
