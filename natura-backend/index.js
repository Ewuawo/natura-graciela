// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Usamos el pool centralizado de ./db (ya maneja MSI\SQLEXPRESS)
const { sql, poolPromise } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Hacemos disponible sql y pool a los routers
app.locals.sql = sql;
app.locals.poolPromise = poolPromise;

// Rutas
const ventasRouter = require("./routes/ventas");
const clientesRouter = require("./routes/clientes");
const productosRouter = require("./routes/productos");
app.use("/ventas", ventasRouter);
app.use("/clientes", clientesRouter);
app.use("/productos", productosRouter);

// Pings
app.get("/alertas/__index_ping", (req, res) => res.json({ ok: true }));
app.get("/alertas/ping", (req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Arranque del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
