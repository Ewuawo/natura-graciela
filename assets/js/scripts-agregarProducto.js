document.addEventListener("DOMContentLoaded", function () {
  const API = "http://localhost:3000";
  const $form = document.getElementById("formProducto");

  if ($form) {
    $form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const nombre = document.getElementById("nombreProducto").value.trim();
      const detalle = document.getElementById("detalleProducto").value.trim();
      const pCosto = parseFloat(document.getElementById("pCosto").value);
      const pVenta = parseFloat(document.getElementById("pVenta").value);
      const vencimiento = document.getElementById("vencimientoProducto").value; // YYYY-MM-DD
      const cantidad = parseInt(
        document.getElementById("cantidadProducto").value,
        10
      );

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

      try {
        const r = await fetch(`${API}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            detalle,
            pCosto,
            pVenta,
            fechaVencimiento: vencimiento,
            cantidad,
          }),
        });
        if (!r.ok) throw new Error(`Status ${r.status}`);
        alert("Producto agregado exitosamente.");
        window.location.href = "productos.html";
      } catch (e) {
        console.error(e);
        alert("No se pudo crear el producto.");
      }
    });

    // Cancelar → vuelve al listado
    $form.addEventListener("reset", function (event) {
      event.preventDefault();
      location.href = "productos.html";
    });
  }
});
