// assets/js/scripts-verClientes.js (backend: lectura + pagos + editar cuota + validación excedente + confirm)
document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";

  const $ = (sel) => document.querySelector(sel);
  const qsp = new URLSearchParams(location.search);
  const idCliente = qsp.get("id");

  const money = (v) =>
    Number(v ?? 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-AR") : "—");
  const getJSON = async (u, opt) => {
    const r = await fetch(u, opt);
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  };

  if (!idCliente) {
    alert("Falta id de cliente");
    location.href = "clientes.html";
    return;
  }

  const el = {
    nombre: $("#nombreCliente"),
    tbody: $("#tabla-compras"),
    panel: $("#detalle-compra"),
    cuotas: $("#tabla-cuotas"),
    detProd: $("#detalle-producto"),
    detMedio: $("#detalle-medio"),
    detTotal: $("#detalle-total"),
    pagoBox: $("#seccion-pago"),
    saldo: $("#saldo-actual"),
    inpMontoPago: $("#monto-pago"),
    modal: $("#modal-editar-cuota"),
    inpMontoCuota: $("#nuevo-monto-cuota"),
    btnGuardarCuota: $("#btn-guardar-cuota"),
  };

  let ventaActual = null; // { id, ... }
  let cuotasActuales = []; // array
  let cuotaSeleccionada = null;
  let saldoActual = 0; // saldo calculado en el detalle

  // 1) Encabezado
  (async () => {
    try {
      const c = await getJSON(`${API}/clientes/${idCliente}`);
      el.nombre.textContent =
        c.nombreCompleto || `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim();
    } catch {
      alert("No se pudo cargar el cliente");
      location.href = "clientes.html";
    }
  })();

  // 2) Historial
  (async () => {
    el.tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">Cargando...</td></tr>`;
    try {
      let ventas = await getJSON(`${API}/ventas?clienteId=${idCliente}`).catch(
        async () => {
          const todas = await getJSON(`${API}/ventas`);
          return todas.filter((v) => String(v.clienteId) === String(idCliente));
        }
      );
      if (!ventas.length) {
        el.tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.7">Sin compras</td></tr>`;
        return;
      }
      el.tbody.innerHTML = ventas
        .map(
          (v) => `
          <tr data-id="${v.id}">
            <td>${fmtDate(v.fecha)}</td>
            <td>${v.primerProducto ?? "—"}</td>
            <td>${v.esCredito ? "Crédito" : "Contado"}</td>
            <td style="text-align:right">${money(v.total)}</td>
            <td><button class="btn-detalle">Ver</button></td>
          </tr>`
        )
        .join("");
    } catch {
      el.tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">Error cargando compras</td></tr>`;
    }
  })();

  // 3) Cargar detalle + pintar UI
  async function cargarDetalle(ventaId) {
    const det = await getJSON(`${API}/ventas/${ventaId}/detalle`); // {venta, items, cuotas}
    ventaActual = det.venta;
    cuotasActuales = det.cuotas || [];

    const itemsTxt =
      (det.items || [])
        .map((it) => `${it.producto ?? `#${it.productoId}`} (x${it.cantidad})`)
        .join(", ") || "—";

    el.panel.style.display = "block";
    el.detProd.textContent = itemsTxt;
    el.detMedio.textContent = ventaActual.esCredito ? "Crédito" : "Contado";
    el.detTotal.textContent = money(ventaActual.total);
    el.pagoBox.style.display = ventaActual.esCredito ? "block" : "none";

    // Saldo actual = suma de importes de cuotas
    saldoActual = cuotasActuales.reduce(
      (acc, c) => acc + Number(c.monto || 0),
      0
    );
    el.saldo.textContent = money(saldoActual);

    el.cuotas.innerHTML =
      cuotasActuales
        .map(
          (c) => `
        <tr data-num="${c.nro}">
          <td>${fmtDate(c.vencimiento)}</td>
          <td>#${c.nro}</td>
          <td style="text-align:right">${money(c.monto)}</td>
          <td>${c.pagada ? fmtDate(c.pagadaEl) : ""}</td>
          <td>${
            Array.isArray(c.pagos) && c.pagos.length
              ? c.pagos
                  .map((p) => `${fmtDate(p.fecha)} — $${money(p.monto)}`)
                  .join("<br>")
              : ""
          }</td>
        </tr>`
        )
        .join("") ||
      `<tr><td colspan="5" style="text-align:center">-</td></tr>`;
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-detalle");
    if (!btn) return;
    const ventaId = btn.closest("tr")?.dataset.id;
    if (ventaId) await cargarDetalle(ventaId);
  });

  // 4) Registrar pago → validación excedente + confirm + backend
  $("#btn-registrar-pago")?.addEventListener("click", async () => {
    if (!ventaActual) return;
    const monto = parseFloat(el.inpMontoPago.value);
    if (isNaN(monto) || monto <= 0) return alert("Monto inválido");

    if (monto > saldoActual) {
      alert(
        `El monto ingresado ($${money(monto)}) supera el saldo ($${money(
          saldoActual
        )}).`
      );
      return;
    }

    if (!confirm(`¿Confirmás registrar un pago por $${money(monto)}?`)) return;

    try {
      const r = await fetch(`${API}/ventas/${ventaActual.id}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto }),
      });

      if (!r.ok) {
        // intento leer mensaje del servidor si vino 400
        let msg = `Error ${r.status}`;
        try {
          const j = await r.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }

      await cargarDetalle(ventaActual.id); // refrescar
      el.inpMontoPago.value = "";
      alert("Pago registrado.");
    } catch (e) {
      console.error(e);
      alert(`No se pudo registrar el pago: ${e.message}`);
    }
  });

  // 5) Editar cuota → abrir modal y guardar
  document.addEventListener("click", (e) => {
    const row = e.target.closest("#tabla-cuotas tr");
    if (!row || !ventaActual) return;
    const n = parseInt(row.dataset.num, 10);
    const c = cuotasActuales.find((x) => x.nro === n);
    if (!c) return;
    cuotaSeleccionada = c;
    el.inpMontoCuota.value = Number(c.monto || 0).toFixed(2);
    el.modal.style.display = "block";
  });

  el.btnGuardarCuota?.addEventListener("click", async () => {
    const nuevo = parseFloat(el.inpMontoCuota.value);
    if (isNaN(nuevo) || nuevo < 0) return alert("Monto inválido");
    if (!ventaActual || !cuotaSeleccionada) return;

    try {
      const r = await fetch(
        `${API}/ventas/${ventaActual.id}/cuotas/${cuotaSeleccionada.nro}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importe: nuevo }),
        }
      );
      if (!r.ok) throw new Error(`${r.status}`);
      el.modal.style.display = "none";
      await cargarDetalle(ventaActual.id); // refresco
      alert("Cuota actualizada");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la cuota");
    }
  });
});
