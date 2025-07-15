document.addEventListener("DOMContentLoaded", function() {




//Index tabla de prodcutos



//Productos
//Ver que productos vencen en menos de 30 días
if (document.getElementById("productos-vencer")) {
    const productos = JSON.parse(localStorage.getItem("listadoProductos")) || [];
    const hoy = new Date();
    const productosVencer = productos.filter(producto => {
        const fechaVencimiento = new Date(producto.fechaVencimiento);
        const diferenciaDias = (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24);
        return diferenciaDias <= 30 && diferenciaDias >= 0;
    });
    document.getElementById("productos-vencer").textContent = productosVencer.length;
}
});


