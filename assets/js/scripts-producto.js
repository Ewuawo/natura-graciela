document.addEventListener("DOMContentLoaded", function () {
 
  //Agregar productos
  if (document.getElementById("formProducto")) {
    document
      .getElementById("formProducto")
      .addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = document.getElementById("nombreProducto").value.trim();
        const detalle = document.getElementById("detalleProducto").value.trim();
        const precio = parseFloat(
          document.getElementById("precioProducto").value.trim()
        );
        const vencimiento = document
          .getElementById("vencimientoProducto")
          .value.trim();
        const cantidad = parseInt(
          document.getElementById("cantidadProducto").value.trim()
        );

        if (
          !nombre ||
          !detalle ||
          isNaN(precio) ||
          !vencimiento ||
          isNaN(cantidad)
        ) {
          alert("Por favor, complete todos los campos correctamente.");
          return;
        }

        const nuevoProducto = {
          nombre,
          detalle,
          precio,
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
  //cambiar formato fecha
  function formatearFecha(fecha) {
    const partes = fecha.split("-");
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  //Cancelar agregar producto q redirige a productos.html
  if (document.getElementById("formProducto")) {
    document
      .getElementById("formProducto")
      .addEventListener("reset", function (event) {
        event.preventDefault();
        location.href = "index.html"; 
      });
  }

  //Tabla de productos
  if (document.getElementById("tabla-productos")) {
    const listaProductos =
      JSON.parse(localStorage.getItem("listaProductos")) || [];
    const tabla = document.getElementById("tabla-productos");

    listaProductos.forEach((producto, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${producto.nombre}</td>
            <td>${producto.detalle}</td>
            <td>${
              isNaN(Number(producto.precio))
                ? "0.00"
                : Number(producto.precio).toFixed(2)
            }</td>
            <td>${formatearFecha(producto.vencimiento)}</td>
            <td>${producto.cantidad}</td>
            <td>
                <button class="editarProducto">Editar</button>
                <button class="boton-eliminar">Eliminar</button>
            </td>
        `;

      tabla.appendChild(fila);
    });
  }
  //Eliminar productos
  if (document.querySelectorAll(".boton-eliminar").length > 0) {
    document.querySelectorAll(".boton-eliminar").forEach((boton, index) => {
      boton.addEventListener("click", function () {
        const listaProductos =
          JSON.parse(localStorage.getItem("listaProductos")) || [];
        if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
          listaProductos.splice(index, 1);
          localStorage.setItem(
            "listaProductos",
            JSON.stringify(listaProductos)
          );
          location.reload(); // Recargar la página para reflejar los cambios
        }
      });
    });
  }

  //Editar productos
  if (document.querySelectorAll(".editarProducto").length > 0) {
    document.querySelectorAll(".editarProducto").forEach((boton, index) => {
      boton.addEventListener("click", function () {
        const listaProductos =
          JSON.parse(localStorage.getItem("listaProductos")) || [];
        const producto = listaProductos[index];

        localStorage.setItem("productoEditar", JSON.stringify(producto));
        localStorage.setItem("indiceEditar", index);

        location.href = "editarProductos.html";
      });
    });
  }

  if (document.getElementById("eProducto")) {
    const producto = JSON.parse(localStorage.getItem("productoEditar"));
    if (producto) {
      document.getElementById("nombre").value = producto.nombre;
      document.getElementById("detalle").value = producto.detalle;
      document.getElementById("precio").value = producto.precio;
      document.getElementById("vencimiento").value = producto.vencimiento;
      document.getElementById("cantidad").value = producto.cantidad;
    }
  }

  if (document.getElementById("eProducto")) {
    document
      .getElementById("eProducto")
      .addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const detalle = document.getElementById("detalle").value.trim();
        const precio = parseFloat(
          document.getElementById("precio").value.trim()
        );
        const vencimiento = document.getElementById("vencimiento").value.trim();
        const cantidad = parseInt(
          document.getElementById("cantidad").value.trim()
        );

        if (
          !nombre ||
          !detalle ||
          isNaN(precio) ||
          !vencimiento ||
          isNaN(cantidad)
        ) {
          alert("Por favor, complete todos los campos correctamente.");
          return;
        }

        const indiceEditar = localStorage.getItem("indiceEditar");
        let listaProductos =
          JSON.parse(localStorage.getItem("listaProductos")) || [];

        listaProductos[indiceEditar] = {
          nombre,
          detalle,
          precio,
          vencimiento,
          cantidad,
        };
        localStorage.setItem("listaProductos", JSON.stringify(listaProductos));

        alert("Producto editado exitosamente.");
        location.href = "productos.html"; // Redirigir a la página de productos
      });
  }

  if (document.getElementById("eProducto")) {
    document
      .getElementById("eProducto")
      .addEventListener("reset", function (event) {
        event.preventDefault();
        location.href = "productos.html"; // Redirigir a la página de productos
      });
  }
});
