document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla-productos");
  const buscador = document.getElementById("buscar");

  function formatearFecha(fecha) {
    // Si no hay fecha o no es string, devolvemos un placeholder
    if (!fecha || typeof fecha !== "string") return "—";

    // Si viene con hora tipo ISO, separamos por "T" primero
    const soloFecha = fecha.split("T")[0];

    const partes = soloFecha.split("-");
    // Si no tiene 3 partes, devolvemos la misma cadena
    if (partes.length !== 3) return soloFecha;

    const [yyyy, mm, dd] = partes;
    return `${dd}-${mm}-${yyyy}`;
  }

  function cargarProductos(filtro = "") {
    tabla.innerHTML = "";
    fetch("http://localhost:3000/productos")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((lista) => {
        lista
          .filter(
            (p) =>
              p.nombre.toLowerCase().includes(filtro) ||
              p.detalle.toLowerCase().includes(filtro)
          )
          .forEach((p, i) => {
            const tr = document.createElement("tr");
            tr.dataset.id = p.id;
            const fechaFormateada = formatearFecha(p.fechaVencimiento);
            tr.innerHTML = `
              <td>${i + 1}</td>
              <td>${p.nombre}</td>
              <td>${p.detalle}</td>
              <td>${p.pCosto.toFixed(2)}</td>
              <td>${p.pVenta.toFixed(2)}</td>
              <td>${fechaFormateada}</td>
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

  //  Cargo todo al entrar
  cargarProductos();

  //  vuelvo a cargar al tipear
  buscador.addEventListener("input", (e) => {
    cargarProductos(e.target.value.toLowerCase());
  });
  // Editar producto
  tabla.addEventListener("click", (e) => {
    if (e.target.classList.contains("editarProducto")) {
      const id = e.target.closest("tr").dataset.id;
      window.location.href = `editarProductos.html?id=${id}`;
    }
  });
});
