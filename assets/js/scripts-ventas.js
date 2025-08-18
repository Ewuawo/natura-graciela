// assets/js/scripts-ventas.js
document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";
  const tbody =
    document.getElementById("tabla-ventas") || document.querySelector("tbody");
  const inputBuscar =
    document.getElementById("buscar") ||
    document.querySelector('input[placeholder*="Buscar"]');

  const money = (v) =>
    Number(v ?? 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-AR") : "—");

  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }

  async function cargarVentas() {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">Cargando...</td></tr>`;
    try {
      let ventas = await getJSON(`${API}/ventas`);
      const f = (inputBuscar?.value || "").toLowerCase();
      if (f)
        ventas = ventas.filter((v) =>
          String(v.nombreCompleto || "")
            .toLowerCase()
            .includes(f)
        );

      const rows = ventas
        .map(
          (v) => `
        <tr data-id="${v.id}">
          <td>${v.id}</td>
          <td>${v.nombreCompleto ?? ""}</td>
          <td>${v.primerProducto ?? "—"}</td>
          <td>${fmtDate(v.fecha)}</td>
          <td>${v.esCredito ? "Crédito" : "Contado"}</td>
          <td style="text-align:right">${v.primerCantidad ?? "—"}</td>
          <td style="text-align:right">${
            v.primerPUnit != null ? money(v.primerPUnit) : "—"
          }</td>
          <td style="text-align:right">${money(v.total)}</td>
          <td><button class="btn-detalle">Ver detalle</button></td>
        </tr>
      `
        )
        .join("");

      tbody.innerHTML =
        rows ||
        `<tr><td colspan="9" style="text-align:center">Sin ventas</td></tr>`;
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">Error cargando ventas</td></tr>`;
    }
  }

  // Ver detalle sólo al hacer clic (si querés mantenerlo)
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-detalle");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    const next = tr.nextElementSibling;
    if (next && next.classList.contains("venta-detalle")) {
      next.remove(); // toggle
      return;
    }

    try {
      const det = await getJSON(`${API}/ventas/${id}/detalle`);

      const money = (v) =>
        Number(v ?? 0).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("es-AR") : "—";

      const itemsRows =
        (det.items || [])
          .map(
            (it) => `
        <tr>
          <td>${it.producto ?? `#${it.productoId}`}</td>
          <td style="text-align:right">${it.cantidad}</td>
          <td style="text-align:right">${money(it.pUnit)}</td>
          <td style="text-align:right">${money(it.subTotal)}</td>
        </tr>`
          )
          .join("") ||
        `<tr><td colspan="4" style="text-align:center">-</td></tr>`;

      const cuotasRows =
        (det.cuotas || [])
          .map(
            (c) => `
        <tr>
          <td>#${c.numero}</td>
          <td>${fmtDate(c.venceEl)}</td>
          <td style="text-align:right">${money(c.importe)}</td>
          <td>${c.pagada ? "Sí" : "No"}</td>
        </tr>`
          )
          .join("") ||
        `<tr><td colspan="4" style="text-align:center">-</td></tr>`;

      const detalle = document.createElement("tr");
      detalle.className = "venta-detalle";
      detalle.innerHTML = `
        <td colspan="9">
          <div class="grid cols-2 gap">
            <div>
              <h4>Items</h4>
              <table class="table small">
                <thead><tr><th>Producto</th><th>Cant.</th><th>P.Unit</th><th>Subtotal</th></tr></thead>
                <tbody>${itemsRows}</tbody>
              </table>
            </div>
            <div>
              <h4>Cuotas</h4>
              <table class="table small">
                <thead><tr><th>#</th><th>Vence</th><th>Importe</th><th>Pagada</th></tr></thead>
                <tbody>${cuotasRows}</tbody>
              </table>
            </div>
          </div>
        </td>`;
      tr.after(detalle);
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar el detalle de la venta");
    }
  });

  inputBuscar?.addEventListener("input", () => cargarVentas());
  cargarVentas();
});
