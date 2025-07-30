document.addEventListener("DOMContentLoaded", () => {
  const idProducto = localStorage.getItem("idProductoEditar");

  if (!idProducto) {
    alert("No se encontró el ID del producto para editar.");
    return;
  }

  fetch(`http://localhost:3000/productos/${idProducto}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("nombre").value = data.nombre;
      document.getElementById("detalle").value = data.detalle;
      document.getElementById("pCosto").value = data.pCosto;
      document.getElementById("pVenta").value = data.pVenta;
      document.getElementById("vencimiento").value =
        data.fechaVencimiento.split("T")[0];
      document.getElementById("cantidad").value = data.cantidad;
    })
    .catch((error) => {
      console.error("Error al obtener el producto:", error);
      alert("No se pudo cargar el producto.");
    });

  document
    .getElementById("eProducto")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const params = new URLSearchParams(window.location.search);
      const idProducto = params.get("id");

      const nombre = document.getElementById("nombre").value.trim();
      const detalle = document.getElementById("detalle").value.trim();
      const pCosto = parseFloat(document.getElementById("pCosto").value.trim());
      const pVenta = parseFloat(document.getElementById("pVenta").value.trim());
      const vencimiento = document.getElementById("vencimiento").value;
      const cantidad = parseInt(
        document.getElementById("cantidad").value.trim()
      );

      if (
        !nombre ||
        !detalle ||
        isNaN(pCosto) ||
        isNaN(pVenta) ||
        !vencimiento ||
        isNaN(cantidad)
      ) {
        alert("Por favor completa todos los campos correctamente");
        return;
      }

      fetch(`http://localhost:3000/productos/${idProducto}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          detalle,
          pCosto,
          pVenta,
          fechaVencimiento: vencimiento,
          cantidad,
        }),
      })
        .then((res) => {
          if (res.ok) {
            alert("Producto actualizado");
            window.location.href = "productos.html;";
          } else {
            alert("Error al actualizar el producto");
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("Hubo un problema al conectarse con el servidor");
        });
    });
});
