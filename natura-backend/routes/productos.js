const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Productos");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).send("Error al obtener productos");
  }
});

//boton eliminar
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Productos WHERE id = @id");

    res.status(200).json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

//Crear nuevo producto
router.post("/", async (req, res) => {
  try {
    const { nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad } =
      req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("nombre", sql.VarChar, nombre)
      .input("detalle", sql.VarChar, detalle)
      .input("pCosto", sql.Decimal(10, 2), pCosto)
      .input("pVenta", sql.Decimal(10, 2), pVenta)
      .input("fechaVencimiento", sql.Date, fechaVencimiento)
      .input("cantidad", sql.Int, cantidad).query(`
        INSERT INTO Productos (nombre, detalle, pCosto, pVenta, fechaVencimiento, cantidad)
        VALUES (@nombre, @detalle, @pCosto, @pVenta, @fechaVencimiento, @cantidad)
        `);

    res.status(201).json({ mensaje: "Producto creado correctamente" });
  } catch (err) {
    console.error("Error al crear el producto:", err);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});
module.exports = router;
