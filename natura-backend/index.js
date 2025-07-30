const productosRouter = require("./routes/productos");


const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/productos", productosRouter);

//Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor Natura Graciela funcionando!");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
});

