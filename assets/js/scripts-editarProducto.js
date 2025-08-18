document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";
  const params = new URLSearchParams(window.location.search);
  const idProducto = params.get("id");

  if (!idProducto) {
    alert("No se encontró el ID del producto para editar.");
    return;
  }

  // Pre-cargar datos
  fetch(`${API}/productos/${idProducto}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then((data) => {
      document.getElementById("nombre").value = data.nombre || "";
      document.getElementById("detalle").value = data.detalle || "";
      document.getElementById("pCosto").value = data.pCosto ?? "";
      document.getElementById("pVenta").value = data.pVenta ?? "";
      document.getElementById("vencimiento").value = data.fechaVencimiento
        ? String(data.fechaVencimiento).split("T")[0]
        : "";
      document.getElementById("cantidad").value = data.cantidad ?? "";
    })
    .catch((error) => {
      console.error("Error al obtener el producto:", error);
      alert("No se pudo cargar el producto.");
    });

  // Guardar cambios
  document
    .getElementById("eProducto")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const nombre = document.getElementById("nombre").value.trim();
      const detalle = document.getElementById("detalle").value.trim();
      const pCosto = parseFloat(document.getElementById("pCosto").value);
      const pVenta = parseFloat(document.getElementById("pVenta").value);
      const vencimiento = document.getElementById("vencimiento").value;
      const cantidad = parseInt(document.getElementById("cantidad").value, 10);

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

      try {
        const r = await fetch(`${API}/productos/${idProducto}`, {
          method: "PUT",
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
        alert("Producto actualizado");
        window.location.href = "productos.html";
      } catch (err) {
        console.error("Error:", err);
        alert("Hubo un problema al conectarse con el servidor");
      }
    });
});
