// assets/js/scripts-verClientes.js
document.addEventListener("DOMContentLoaded", function () {
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const ymd2dmy = (s) => (s ? s.split("-").reverse().join("-") : "");

  // ===== Cliente seleccionado =====
  const cliente = JSON.parse(localStorage.getItem("clienteVer"));
  if (!cliente) {
    alert("No se encontró el cliente");
    location.href = "clientes.html";
    return;
  }
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
  $("nombreCliente").innerText = nombreCompleto;

  // ===== Ventas del cliente + índice global =====
  const todas = JSON.parse(localStorage.getItem("ventas")) || [];
  const ventasCliente = []; // { venta, idxGlobal }
  todas.forEach((v, i) => {
    if (v.cliente === nombreCompleto)
      ventasCliente.push({ venta: v, idxGlobal: i });
  });

  // ===== Historial =====
  const tbodyHist = $("tabla-compras");
  if (!tbodyHist) {
    console.error("Falta <tbody id='tabla-compras'>");
    return;
  }
  tbodyHist.innerHTML = "";

  ventasCliente.forEach(({ venta, idxGlobal }, pos) => {
    const tr = document.createElement("tr");
    const productosTxt =
      Array.isArray(venta.items) && venta.items.length
        ? venta.items.map((it) => it.producto).join(", ")
        : venta.producto || "—"; // compat ventas viejas

    const botonDetalle =
      venta.medioPago === "credito"
        ? `<button class="btn-ver-detalle" data-pos="${pos}" data-global="${idxGlobal}">Ver</button>`
        : "Sin cuotas";

    tr.innerHTML = `
      <td>${ymd2dmy(venta.fecha)}</td>
      <td>${productosTxt}</td>
      <td>${venta.medioPago || ""}</td>
      <td>$${Number(venta.total || 0).toFixed(2)}</td>
      <td>${botonDetalle}</td>
    `;
    tbodyHist.appendChild(tr);
  });

  // ===== Estado de selección =====
  let ventaSel = null;
  let idxGlobal = -1;

  function renderDetalle() {
    if (!ventaSel) return;

    const productosTxt =
      Array.isArray(ventaSel.items) && ventaSel.items.length
        ? ventaSel.items
            .map((it) => `${it.producto} (x${it.cantidad})`)
            .join(", ")
        : ventaSel.producto || "—";

    $("detalle-compra").style.display = "block";
    $("detalle-producto").innerText = productosTxt;
    $("detalle-medio").innerText = ventaSel.medioPago || "";
    $("detalle-total").innerText = Number(ventaSel.total || 0).toFixed(2);

    $("seccion-pago").style.display = "block";
    $("saldo-actual").innerText = Number(ventaSel.total || 0).toFixed(2);

    cargarCuotas(ventaSel);
  }

  function cargarCuotas(venta) {
    const tb = $("tabla-cuotas");
    tb.innerHTML = "";

    (venta.cuotas || []).forEach((c) => {
      // Historial completo (si existe)
      const pagos = Array.isArray(c.pagos) ? c.pagos : [];

      // Texto/HTML de todos los pagos: una línea por pago
      const pagosHtml = pagos.length
        ? `<ul style="margin:0; padding-left:16px;">
           ${pagos
             .map(
               (p) =>
                 `<li>${ymd2dmy(p.fecha)} — $${Number(p.monto).toFixed(2)}</li>`
             )
             .join("")}
         </ul>`
        : "";

      // Si la cuota quedó en 0 alguna vez, guardamos la fecha de cancelación
      const fechaCancelacionTxt = c.fechaPago ? ymd2dmy(c.fechaPago) : "";

      const montoTxt =
        Number(c.monto) <= 0 ? "Pagada" : `$${Number(c.monto).toFixed(2)}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${c.fechaVencimiento || ""}</td>
      <td>${c.numero}</td>
      <td>${montoTxt}
          <button class="btn-editar-cuota" data-numero="${
            c.numero
          }">Editar</button>
      </td>
      <td>${fechaCancelacionTxt}</td>
      <td>${pagosHtml}</td>
    `;
      tb.appendChild(tr);
    });
  }

  // ===== Click en Ver (usa data-pos y data-global) =====
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-ver-detalle")) return;
    const pos = parseInt(e.target.getAttribute("data-pos"));
    const g = parseInt(e.target.getAttribute("data-global"));
    if (Number.isNaN(pos) || !ventasCliente[pos]) {
      console.warn("Índice inválido:", pos);
      return;
    }
    ventaSel = ventasCliente[pos].venta;
    idxGlobal = g;
    renderDetalle();
  });

  // ===== Registrar pago: guarda fecha + importe por cuota =====
  $("btn-registrar-pago").addEventListener("click", () => {
    if (!ventaSel) return;
    let monto = parseFloat($("monto-pago").value);
    if (isNaN(monto) || monto <= 0) return alert("Monto inválido");

    // 1) Actualizar saldo total
    let saldo = Number(ventaSel.total || 0) - monto;
    if (saldo < 0) saldo = 0;
    ventaSel.total = saldo;

    // 2) Aplicar a cuotas y registrar pagos
    const hoy = hoyISO();
    (ventaSel.cuotas || []).forEach((c) => {
      if (monto > 0 && Number(c.monto) > 0) {
        const aplica = Math.min(monto, Number(c.monto));
        // historial de pagos por cuota
        if (!Array.isArray(c.pagos)) c.pagos = [];
        c.pagos.push({ fecha: hoy, monto: aplica });

        c.monto = Number(c.monto) - aplica; // descuenta
        monto -= aplica;

        if (Number(c.monto) === 0) {
          c.fechaPago = c.fechaPago || hoy; // marca cancelada
        }
      }
    });

    $("saldo-actual").innerText = saldo.toFixed(2);
    renderDetalle();
    alert(`Se registró un pago. Saldo actualizado a $${saldo.toFixed(2)}.`);

    // 3) Persistir por índice global
    if (idxGlobal >= 0) {
      const list = JSON.parse(localStorage.getItem("ventas")) || [];
      list[idxGlobal] = ventaSel;
      localStorage.setItem("ventas", JSON.stringify(list));
    }
  });

  // ===== Editar cuota =====
  let cuotaSel = null;
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-editar-cuota")) return;
    if (!ventaSel) return;
    const n = parseInt(e.target.getAttribute("data-numero"));
    cuotaSel = (ventaSel.cuotas || []).find((c) => c.numero === n);
    if (!cuotaSel) return;

    if (
      Number(cuotaSel.monto) <= 0 &&
      !confirm("Esta cuota figura como pagada. ¿Querés editarla?")
    ) {
      return;
    }
    $("nuevo-monto-cuota").value = Number(cuotaSel.monto || 0).toFixed(2);
    $("modal-editar-cuota").style.display = "block";
  });

  $("btn-guardar-cuota").addEventListener("click", () => {
    const nuevo = parseFloat($("nuevo-monto-cuota").value);
    if (isNaN(nuevo) || nuevo < 0) return alert("Monto invalido");
    if (cuotaSel) {
      cuotaSel.monto = nuevo;
      if (nuevo > 0) delete cuotaSel.fechaPago; // reabierta → sin fechaPago
      // Nota: mantenemos el historial c.pagos tal como está
    }
    if (idxGlobal >= 0) {
      const list = JSON.parse(localStorage.getItem("ventas")) || [];
      list[idxGlobal] = ventaSel;
      localStorage.setItem("ventas", JSON.stringify(list));
    }
    renderDetalle();
    $("modal-editar-cuota").style.display = "none";
  });
});
