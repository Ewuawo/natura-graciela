document.addEventListener("DOMContentLoaded", function(){

    //Agregar productos
  if (document.getElementById("formProducto")) {
    document
      .getElementById("formProducto")
      .addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = document.getElementById("nombreProducto").value.trim();
        const detalle = document.getElementById("detalleProducto").value.trim();
        const pCosto = parseFloat(document.getElementById("pCosto").value.trim());
        const pVenta = parseFloat(document.getElementById("pVenta").value.trim());
        const vencimiento = document.getElementById("vencimientoProducto").value.trim();
        const cantidad = parseInt(document.getElementById("cantidadProducto").value.trim());

        if (
          !nombre ||
          !detalle ||
          isNaN(pCosto) ||
          isNaN(pVenta) ||
          !vencimiento ||
          isNaN(cantidad)
        ) {
          alert("Por favor, complete todos los campos correctamente.");
          return;
        }

        const nuevoProducto = {
          nombre,
          detalle,
          pCosto,
          pVenta,
          vencimiento,
          cantidad,
        };

        let listaProductos =
          JSON.parse(localStorage.getItem("listaProductos")) || [];
        listaProductos.push(nuevoProducto);
        localStorage.setItem("listaProductos", JSON.stringify(listaProductos));

        alert("Producto agregado exitosamente.");
        this.reset(); // Resetea el formulario
        document.getElementById("formProducto").reset();
      });
  }

 //Cancelar agregar producto q redirige a productos.html
  if (document.getElementById("formProducto")) {
    document
      .getElementById("formProducto")
      .addEventListener("reset", function (event) {
        event.preventDefault();
        location.href = "productos.html"; 
      });
  }










})