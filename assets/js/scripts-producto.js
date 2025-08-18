document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";
  const tabla = document.getElementById("tabla-productos");
  const buscador = document.getElementById("buscar");

  function formatearFecha(fecha) {
    if (!fecha || typeof fecha !== "string") return "—";
    const soloFecha = fecha.split("T")[0];
    const [yyyy, mm, dd] = soloFecha.split("-");
    if (!yyyy || !mm || !dd) return soloFecha;
    return `${dd}-${mm}-${yyyy}`;
  }

  function cargarProductos(filtro = "") {
    tabla.innerHTML = "";
    fetch(`${API}/productos`)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((lista) => {
        lista
          .filter(
            (p) =>
              p.nombre.toLowerCase().includes(filtro) ||
              p.detalle.toLowerCase().includes(filtro)
          )
          .forEach((p) => {
            const tr = document.createElement("tr");
            tr.dataset.id = p.id;
            tr.innerHTML = `
              <td>${p.id}</td>
              <td>${p.nombre}</td>
              <td>${p.detalle}</td>
              <td>${Number(p.pCosto).toFixed(2)}</td>
              <td>${Number(p.pVenta).toFixed(2)}</td>
              <td>${formatearFecha(p.fechaVencimiento)}</td>
              <td>${p.cantidad > 0 ? p.cantidad : "SIN STOCK"}</td>
              <td>
                <button class="editarProducto">Editar</button>
                <button class="boton-eliminar">Eliminar</button>
              </td>`;
            tabla.appendChild(tr);
          });
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        alert("Ocurrió un error al obtener los productos:\n" + err.message);
      });
  }

  // carga inicial
  cargarProductos();

  // buscar
  buscador?.addEventListener("input", (e) => {
    cargarProductos(e.target.value.toLowerCase());
  });

  // acciones de la tabla
  tabla.addEventListener("click", async (e) => {
    const btn = e.target;

    // Editar → ir a la página con ?id=...
    if (btn.classList.contains("editarProducto")) {
      const id = btn.closest("tr").dataset.id;
      window.location.href = `editarProductos.html?id=${id}`;
      return;
    }

    // Eliminar (con soporte a soft-delete del backend)
    if (btn.classList.contains("boton-eliminar")) {
      const id = btn.closest("tr").dataset.id;
      if (!confirm("¿Eliminar este producto?")) return;

      try {
        const r = await fetch(`${API}/productos/${id}`, { method: "DELETE" });
        // el backend devuelve JSON tanto para soft-delete como para delete real
        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
          alert(
            data.error || data.message || "No se pudo eliminar el producto"
          );
          return;
        }

        if (data.softDeleted) {
          alert(
            data.message ||
              "El producto tiene ventas asociadas. Se marcó como INACTIVO."
          );
        }

        // refrescar con el filtro actual
        cargarProductos(buscador.value.toLowerCase());
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el producto");
      }
    }
  });
});
