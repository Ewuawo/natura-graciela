// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Usamos el pool centralizado de ./db
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
const alertasRouter = require("./routes/alertas");

app.use("/ventas", ventasRouter);
app.use("/clientes", clientesRouter);
app.use("/productos", productosRouter);
app.use("/alertas", alertasRouter);

// Ruta raíz opcional para evitar "Cannot GET /"
app.get("/", (req, res) => {
  res.send(
    "API Natura corriendo 🚀 - Endpoints: /productos, /clientes, /ventas, /alertas"
  );
});

// Arranque del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
