/* ──────────────────────────────────────────────────────────────
   Registrar Venta - FRONTEND
   - Carga clientes y productos desde el backend
   - Carrito con validaciones de IDs/cantidades/precios
   - Cuotas (si medio de pago = crédito)
   - Envío a POST /ventas con payload consistente
   ────────────────────────────────────────────────────────────── */

const API = "http://localhost:3000";

const ui = {
  selCliente: document.getElementById("cliente"),
  selProducto: document.getElementById("producto"),
  pDetalle: document.getElementById("detalleProducto"),
  inpFecha: document.getElementById("fecha"),
  inpCantidad: document.getElementById("cantidad"),
  inpPCosto: document.getElementById("pCosto"),
  inpPVenta: document.getElementById("pVenta"),
  btnAgregarItem: document.getElementById("agregarItem"),
  tbodyItems: document.querySelector("#tablaItems tbody"),
  lblTotal: document.getElementById("totalVenta"),
  selMedioPago: document.getElementById("medioPago"),
  boxCuotas: document.getElementById("seccion-cuotas"),
  inpEntrega: document.getElementById("entregaInicial"),
  inpCuotas: document.getElementById("cuotas"),
  divFechasCuotas: document.getElementById("fechas-cuotas"),
  divInfoCuotas: document.getElementById("info-cuotas"),
  form: document.getElementById("registrarVenta"),
};

let clientes = [];
let productos = [];
let carrito = []; // [{productoId, nombre, cantidad, precioUnitario, subtotal}]

/* ──────────────────────────────────────────────────────────────
   Utilidades
   ────────────────────────────────────────────────────────────── */
const fmtMoney = (n) =>
  Number(n || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const hoyISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function alerta(msg) {
  alert(msg);
}

/* ──────────────────────────────────────────────────────────────
   Carga inicial de clientes y productos
   ────────────────────────────────────────────────────────────── */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function cargarCombos() {
  try {
    const [cli, prods] = await Promise.all([
      getJSON(`${API}/clientes`),
      getJSON(`${API}/productos`),
    ]);

    clientes = Array.isArray(cli) ? cli : [];
    productos = Array.isArray(prods) ? prods : [];

    // Cliente
    ui.selCliente.innerHTML =
      `<option value="">-- Seleccionar --</option>` +
      clientes
        .map(
          (c) =>
            `<option value="${c.id}">${c.nombreCompleto || c.nombre}</option>`
        )
        .join("");

    // Producto
    ui.selProducto.innerHTML =
      `<option value="">-- Seleccionar --</option>` +
      productos
        .map(
          (p) =>
            `<option value="${p.id}" data-pcosto="${p.pCosto}" data-pventa="${p.pVenta}">
              ${p.nombre}
             </option>`
        )
        .join("");

    ui.inpFecha.value = hoyISO();
  } catch (e) {
    // si falla, mostramos un aviso «amigable»
    alerta(
      "No pude cargar clientes/productos. Revisá que el backend esté corriendo."
    );
    // opcional: pegamos una consulta al diag para saber columnas
    try {
      await fetch(`${API}/ventas/_diag`);
    } catch {}
  }
}

/* ──────────────────────────────────────────────────────────────
   Manejo de producto seleccionado => autollenado de precios
   ────────────────────────────────────────────────────────────── */
ui.selProducto.addEventListener("change", () => {
  const idSel = parseInt(ui.selProducto.value, 10);
  const prod = productos.find((x) => x.id === idSel);
  if (!prod) {
    ui.pDetalle.textContent = "";
    ui.inpPCosto.value = "";
    ui.inpPVenta.value = "";
    return;
  }
  ui.pDetalle.textContent = prod.detalle ? `Detalle: ${prod.detalle}` : "";
  ui.inpPCosto.value =
    ui.selProducto.options[ui.selProducto.selectedIndex].dataset.pcosto || "";
  ui.inpPVenta.value =
    ui.selProducto.options[ui.selProducto.selectedIndex].dataset.pventa || "";
});

/* ──────────────────────────────────────────────────────────────
   Agregar item al carrito (validando TODO)
   ────────────────────────────────────────────────────────────── */
ui.btnAgregarItem.addEventListener("click", () => {
  const productoId = parseInt(ui.selProducto.value, 10);
  const prod = productos.find((p) => p.id === productoId);

  if (!productoId || !prod) {
    return alerta("Seleccioná un producto válido.");
  }

  const cantidad = parseInt(ui.inpCantidad.value, 10);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return alerta("Cantidad inválida");
  }

  const precioUnitario = Number(ui.inpPVenta.value || 0);
  if (!(precioUnitario > 0)) {
    return alerta("Ingresá un precio de venta válido (> 0).");
  }

  // Aseguramos ID de item igual al producto seleccionado
  // y no mezclamos productos iguales (sumamos cantidades)
  const existente = carrito.find((it) => it.productoId === productoId);
  if (existente) {
    existente.cantidad += cantidad;
    existente.precioUnitario = precioUnitario; // última referencia
    existente.subtotal = existente.cantidad * existente.precioUnitario;
  } else {
    carrito.push({
      productoId,
      nombre: prod.nombre,
      cantidad,
      precioUnitario,
      subtotal: cantidad * precioUnitario,
    });
  }

  // limpiamos campos rápidos
  ui.inpCantidad.value = "";
  ui.inpPVenta.value = prod.pVenta || ui.inpPVenta.value;

  renderCarrito();
});

function renderCarrito() {
  ui.tbodyItems.innerHTML = "";
  let total = 0;
  carrito.forEach((it, idx) => {
    total += it.subtotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.nombre}</td>
      <td style="text-align:right">${it.cantidad}</td>
      <td style="text-align:right">$ ${fmtMoney(it.precioUnitario)}</td>
      <td style="text-align:right">$ ${fmtMoney(it.subtotal)}</td>
      <td style="text-align:right">
        <button type="button" data-i="${idx}" class="btn-del">Quitar</button>
      </td>
    `;
    ui.tbodyItems.appendChild(tr);
  });
  ui.lblTotal.textContent = fmtMoney(total);

  // botones quitar
  ui.tbodyItems.querySelectorAll(".btn-del").forEach((b) =>
    b.addEventListener("click", (e) => {
      const i = parseInt(e.currentTarget.dataset.i, 10);
      carrito.splice(i, 1);
      renderCarrito();
    })
  );

  actualizarInfoCuotas();
}

/* ──────────────────────────────────────────────────────────────
   Medio de pago / cuotas
   ────────────────────────────────────────────────────────────── */
ui.selMedioPago.addEventListener("change", () => {
  const esCredito = ui.selMedioPago.value === "credito";
  ui.boxCuotas.style.display = esCredito ? "block" : "none";
  if (!esCredito) {
    ui.inpEntrega.value = 0;
    ui.inpCuotas.value = "";
    ui.divFechasCuotas.innerHTML = "";
    ui.divInfoCuotas.innerHTML = "";
  }
  actualizarInfoCuotas();
});

ui.inpCuotas?.addEventListener("input", generarFechasCuotas);
ui.inpEntrega?.addEventListener("input", actualizarInfoCuotas);
document
  .getElementById("interes")
  ?.addEventListener("input", actualizarInfoCuotas);

function generarFechasCuotas() {
  const n = parseInt(ui.inpCuotas.value, 10);
  ui.divFechasCuotas.innerHTML = "";
  if (!Number.isInteger(n) || n < 1 || n > 60) return;

  const base = new Date(ui.inpFecha.value || hoyISO());
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const iso = d.toISOString().slice(0, 10);

    const row = document.createElement("div");
    row.style.margin = "4px 0";
    row.innerHTML = `
      <label>Venc. #${i}:</label>
      <input type="date" class="vto" value="${iso}" />
    `;
    ui.divFechasCuotas.appendChild(row);
  }
  actualizarInfoCuotas();
}

function totalVenta() {
  return carrito.reduce((acc, it) => acc + it.subtotal, 0);
}

function actualizarInfoCuotas() {
  ui.divInfoCuotas.innerHTML = "";
  if (ui.selMedioPago.value !== "credito") return;
  if (!carrito.length) return;

  const total = totalVenta();
  const entrega = Number(ui.inpEntrega.value || 0);
  const interesPct = Number(document.getElementById("interes").value || 0);
  const n = parseInt(ui.inpCuotas.value, 10);

  if (!Number.isInteger(n) || n < 1) return;

  const base = Math.max(total - entrega, 0);
  const totalFinanciado = base * (1 + interesPct / 100);
  const cuota = totalFinanciado / n;

  const p = document.createElement("p");
  p.innerHTML = `
    A financiar: $ ${fmtMoney(base)}<br>
    Interés: ${interesPct}% &nbsp;|&nbsp; Total financiado: $ ${fmtMoney(
    totalFinanciado
  )}<br>
    ${n} cuota(s) de $ ${fmtMoney(cuota)}
  `;
  ui.divInfoCuotas.appendChild(p);
}

/* ──────────────────────────────────────────────────────────────
   Submit del formulario
   ────────────────────────────────────────────────────────────── */
ui.form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clienteId = parseInt(ui.selCliente.value, 10);
  if (!clienteId) return alerta("Seleccioná un cliente.");

  if (!carrito.length) return alerta("Agregá al menos un ítem a la venta.");

  // Validación fuerte de carrito (IDs/cantidades/precios)
  for (const it of carrito) {
    const prod = productos.find((p) => p.id === it.productoId);
    if (!prod) {
      return alerta(
        `El producto con id=${it.productoId} no existe. Refrescá la página.`
      );
    }
    if (!Number.isInteger(it.cantidad) || it.cantidad < 1) {
      return alerta(`Cantidad inválida para "${it.nombre}".`);
    }
    if (!(it.precioUnitario > 0)) {
      return alerta(`Precio unitario inválido para "${it.nombre}".`);
    }
  }

  const fecha = ui.inpFecha.value || hoyISO();
  const total = totalVenta();

  const esCredito = ui.selMedioPago.value === "credito";
  let entregaInicial = 0;
  let interesPct = 0;
  let cuotas = [];

  if (esCredito) {
    entregaInicial = Number(ui.inpEntrega.value || 0);
    interesPct = Number(document.getElementById("interes").value || 0);

    const n = parseInt(ui.inpCuotas.value, 10);
    if (!Number.isInteger(n) || n < 1) {
      return alerta("Ingresá la cantidad de cuotas.");
    }
    const vtos = [...ui.divFechasCuotas.querySelectorAll("input.vto")].map(
      (i) => i.value
    );
    if (vtos.length !== n) {
      return alerta("Completá las fechas de vencimiento de las cuotas.");
    }

    const base = Math.max(total - entregaInicial, 0);
    const totalFinanciado = base * (1 + interesPct / 100);
    const cuotaMonto = totalFinanciado / n;

    cuotas = vtos.map((v, i) => ({
      nro: i + 1,
      monto: cuotaMonto,
      vencimiento: v,
    }));
  }

  const payload = {
    clienteId,
    fecha,
    esCredito,
    entregaInicial,
    interesPct,
    items: carrito.map((x) => ({
      productoId: x.productoId,
      cantidad: x.cantidad,
      precioUnitario: x.precioUnitario,
    })),
    cuotas,
  };

  try {
    const r = await fetch(`${API}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err?.error || `Error HTTP ${r.status}`);
    }
    const data = await r.json();
    alert(`Venta #${data.ventaId} registrada correctamente.`);
    // limpiar y/o navegar a ventas
    carrito = [];
    renderCarrito();
    window.location.href = "ventas.html";
  } catch (e2) {
    alerta(`Error al registrar la venta\n\n${e2.message}`);
  }
});

/* ──────────────────────────────────────────────────────────────
   Init
   ────────────────────────────────────────────────────────────── */
cargarCombos();
