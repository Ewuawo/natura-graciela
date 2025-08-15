// assets/js/scrpts-registrarVenta.js
document.addEventListener("DOMContentLoaded", function () {
  // ====== Utils Storage ======
  const getProductos = () =>
    JSON.parse(localStorage.getItem("listaProductos")) || [];
  const setProductos = (arr) =>
    localStorage.setItem("listaProductos", JSON.stringify(arr));

  // ====== Carga de selects ======
  function cargarSelectClientes() {
    const clientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
    const sel = document.getElementById("cliente");
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar Cliente</option>';
    clientes.forEach((c) => {
      const o = document.createElement("option");
      o.value = `${c.nombre} ${c.apellido}`;
      o.textContent = `${c.nombre} ${c.apellido}`;
      sel.appendChild(o);
    });
  }

  // Muestra cada nombre 1 sola vez (aunque haya varios lotes)
  function cargarSelectProductos() {
    const sel = document.getElementById("producto");
    if (!sel) return;
    const prods = getProductos();
    sel.innerHTML = '<option value="">Seleccionar Producto</option>';
    [...new Set(prods.map((p) => p.nombre))].forEach((nombre) => {
      const o = document.createElement("option");
      o.value = nombre;
      o.textContent = nombre;
      sel.appendChild(o);
    });
  }

  cargarSelectClientes();
  cargarSelectProductos();
  const fechaEl = document.getElementById("fecha");
  if (fechaEl) fechaEl.valueAsDate = new Date();

  // ====== FEFO helpers ======
  // lotes por nombre con cantidad > 0, ordenados por vencimiento asc
  function lotesPorNombre(nombre) {
    return getProductos()
      .map((p, idx) => ({ ...p, __idx: idx }))
      .filter((p) => p.nombre === nombre && (parseInt(p.cantidad) || 0) > 0)
      .sort((a, b) => (a.vencimiento || "").localeCompare(b.vencimiento || ""));
  }
  function loteMasProximo(nombre) {
    const lotes = lotesPorNombre(nombre);
    return lotes.length ? lotes[0] : null;
  }
  function stockTotalNombre(nombre) {
    return getProductos()
      .filter((p) => p.nombre === nombre)
      .reduce((acc, p) => acc + (parseInt(p.cantidad) || 0), 0);
  }

  // ====== Estado de línea y carrito ======
  let precioCostoUnitario = 0;
  let precioVentaUnitario = 0;

  const items = []; // { producto, cantidad, pCostoUnit, pVentaUnit }
  const tablaBody = document.querySelector("#tablaItems tbody");
  const totalVentaEl = document.getElementById("totalVenta");

  // stock disponible = total por nombre - lo reservado en carrito
  function stockDisponible(nombre) {
    const reservado = items
      .filter((i) => i.producto === nombre)
      .reduce((acc, i) => acc + i.cantidad, 0);
    return stockTotalNombre(nombre) - reservado;
  }

  // ====== Refs UI línea ======
  const selProducto = document.getElementById("producto");
  const inpCantidad = document.getElementById("cantidad");
  const inpPCosto = document.getElementById("pCosto");
  const inpPVenta = document.getElementById("pVenta");
  const detalleEl = document.getElementById("detalleProducto");

  if (selProducto) {
    selProducto.addEventListener("change", function () {
      const nombre = this.value;
      const lote = loteMasProximo(nombre); // FEFO: se sugiere el que se usará primero

      if (lote) {
        precioCostoUnitario = parseFloat(lote.pCosto) || 0;
        precioVentaUnitario = parseFloat(lote.pVenta) || 0;
        if (inpPCosto) inpPCosto.value = precioCostoUnitario.toFixed(2);
        if (inpPVenta) inpPVenta.value = precioVentaUnitario.toFixed(2);
        if (detalleEl)
          detalleEl.textContent = `${lote.detalle || ""} — Vence: ${
            lote.vencimiento || "N/D"
          }`;
      } else {
        precioCostoUnitario = precioVentaUnitario = 0;
        if (inpPCosto) inpPCosto.value = "";
        if (inpPVenta) inpPVenta.value = "";
        if (detalleEl) detalleEl.textContent = "";
      }
      actualizarTotalesLinea();
    });
  }

  if (inpCantidad) {
    inpCantidad.addEventListener("input", function () {
      const cant = parseInt(this.value) || 0;
      const nombre = selProducto.value;
      const disp = stockDisponible(nombre);
      if (cant > disp) {
        alert(
          `❌ Stock insuficiente. Solo hay ${disp} unidades disponibles de "${nombre}".`
        );
        this.value = "";
      }
      actualizarTotalesLinea();
    });
  }

  function actualizarTotalesLinea() {
    const cantidad = parseInt(inpCantidad?.value) || 0;
    if (inpPCosto)
      inpPCosto.value = (cantidad * precioCostoUnitario).toFixed(2);
    if (inpPVenta)
      inpPVenta.value = (cantidad * precioVentaUnitario).toFixed(2);
    actualizarFechasyCuotas();
  }

  // ====== Carrito ======
  function totalVentaActual() {
    return items.reduce((acc, it) => acc + it.cantidad * it.pVentaUnit, 0);
  }

  function renderItems() {
    if (!tablaBody) return;
    tablaBody.innerHTML = "";
    items.forEach((it, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.producto}</td>
        <td style="text-align:right;">${it.cantidad}</td>
        <td style="text-align:right;">${it.pVentaUnit.toFixed(2)}</td>
        <td style="text-align:right;">${(it.cantidad * it.pVentaUnit).toFixed(
          2
        )}</td>
        <td><button type="button" data-i="${idx}" class="quitar">Quitar</button></td>
      `;
      tablaBody.appendChild(tr);
    });

    if (totalVentaEl) totalVentaEl.textContent = totalVentaActual().toFixed(2);

    tablaBody.querySelectorAll(".quitar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = parseInt(e.currentTarget.getAttribute("data-i"));
        items.splice(i, 1);
        renderItems();
        actualizarTotalesLinea();
        actualizarFechasyCuotas();
      });
    });
  }

  const btnAgregarItem = document.getElementById("agregarItem");
  if (btnAgregarItem) {
    btnAgregarItem.addEventListener("click", function () {
      const nombre = selProducto.value;
      const cantidad = parseInt(inpCantidad.value) || 0;

      if (!nombre) return alert("Elegí un producto.");
      if (cantidad <= 0) return alert("Ingresá una cantidad válida.");

      const disp = stockDisponible(nombre);
      if (cantidad > disp) {
        return alert(
          `❌ Stock insuficiente. Solo hay ${disp} unidades disponibles de "${nombre}".`
        );
      }

      // Precio sugerido desde el lote que se usará primero
      const lote = loteMasProximo(nombre);
      items.push({
        producto: nombre,
        cantidad,
        pCostoUnit: parseFloat(lote?.pCosto) || 0,
        pVentaUnit: parseFloat(lote?.pVenta) || 0,
      });

      // limpiar línea
      selProducto.value = "";
      inpCantidad.value = "";
      if (inpPCosto) inpPCosto.value = "";
      if (inpPVenta) inpPVenta.value = "";
      if (detalleEl) detalleEl.textContent = "";
      precioCostoUnitario = precioVentaUnitario = 0;

      renderItems();
      actualizarFechasyCuotas();
    });
  }

  // ====== Medio de pago / cuotas ======
  const medioPago = document.getElementById("medioPago");
  const seccionCuotas = document.getElementById("seccion-cuotas");
  if (medioPago && seccionCuotas) {
    medioPago.addEventListener("change", function () {
      seccionCuotas.style.display = this.value === "credito" ? "block" : "none";
      actualizarFechasyCuotas();
    });
  }

  function actualizarFechasyCuotas() {
    const cuotas = parseInt(document.getElementById("cuotas")?.value) || 0;
    const entrega =
      parseFloat(document.getElementById("entregaInicial")?.value) || 0;
    const interes = parseFloat(document.getElementById("interes")?.value) || 0;

    const total = totalVentaActual();
    const saldo = Math.max(total - entrega, 0);
    const saldoInteres = saldo * (1 + interes / 100);
    const cuota = cuotas > 0 ? (saldoInteres / cuotas).toFixed(2) : 0;

    const infoCuotas = document.getElementById("info-cuotas");
    if (infoCuotas) {
      infoCuotas.innerHTML = `Saldo con interés: $${saldoInteres.toFixed(
        2
      )} | Monto por cuota: $${cuota}`;
    }

    const contenedorFechas = document.getElementById("fechas-cuotas");
    if (contenedorFechas) {
      contenedorFechas.innerHTML = "";
      for (let i = 0; i < cuotas; i++) {
        contenedorFechas.innerHTML += `<label>Fecha cuota ${i + 1}</label>
          <input type="date" required><br>
          <p>Cuota ${i + 1}: $${cuota}</p>`;
      }
    }
  }

  ["cuotas", "entregaInicial", "interes"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", actualizarFechasyCuotas);
  });

  // ====== Submit: validación + descuento FEFO por lotes ======
  const formulario = document.getElementById("registrarVenta");
  if (formulario) {
    formulario.addEventListener("submit", function (event) {
      event.preventDefault();

      if (items.length === 0) {
        alert("Agregá al menos un ítem a la venta.");
        return;
      }

      // Validación final: suma por nombre vs stock total de todos los lotes
      const prodsNow = getProductos();
      for (const it of items) {
        const disponibleTotal = prodsNow
          .filter((p) => p.nombre === it.producto)
          .reduce((a, p) => a + (parseInt(p.cantidad) || 0), 0);

        const requeridoTotal = items
          .filter((x) => x.producto === it.producto)
          .reduce((a, b) => a + b.cantidad, 0);

        if (requeridoTotal > disponibleTotal) {
          alert(
            `❌ Stock insuficiente de "${it.producto}". Disponible: ${disponibleTotal}.`
          );
          return;
        }
      }

      // Descuento FEFO por producto
      let lista = getProductos();
      for (const it of items) {
        let restar = it.cantidad;
        const lotes = lista
          .map((p, idx) => ({ ...p, __idx: idx }))
          .filter(
            (p) => p.nombre === it.producto && (parseInt(p.cantidad) || 0) > 0
          )
          .sort((a, b) =>
            (a.vencimiento || "").localeCompare(b.vencimiento || "")
          );

        for (const lote of lotes) {
          if (restar <= 0) break;
          const cantLote = parseInt(lote.cantidad) || 0;
          const aDescontar = Math.min(restar, cantLote);
          lista[lote.__idx].cantidad = cantLote - aDescontar;
          restar -= aDescontar;
        }

        if (restar > 0) {
          alert(
            `❌ No se pudo descontar todo el stock de "${it.producto}". Faltan ${restar}.`
          );
          return;
        }
      }
      setProductos(lista);

      // Armar venta
      const ventas = JSON.parse(localStorage.getItem("ventas") || "[]");
      let cuotasDetalle = [];
      if (document.getElementById("medioPago").value === "credito") {
        const cuotasCantidad =
          parseInt(document.getElementById("cuotas").value) || 0;
        const interes =
          parseFloat(document.getElementById("interes").value) || 0;
        const entrega =
          parseFloat(document.getElementById("entregaInicial").value) || 0;

        const total = totalVentaActual();
        const saldo = Math.max(total - entrega, 0);
        const saldoConInteres = saldo * (1 + interes / 100);
        const montoPorCuota =
          cuotasCantidad > 0
            ? (saldoConInteres / cuotasCantidad).toFixed(2)
            : 0;

        const fechasCuotas = document.querySelectorAll(
          "#fechas-cuotas input[type='date']"
        );
        fechasCuotas.forEach((input, index) => {
          cuotasDetalle.push({
            numero: index + 1,
            fechaVencimiento: input.value,
            monto: parseFloat(montoPorCuota),
          });
        });
      }

      const nuevaVenta = {
        cliente: document.getElementById("cliente").value,
        fecha: document.getElementById("fecha").value,
        medioPago: document.getElementById("medioPago").value,
        items: items.map((it) => ({
          producto: it.producto,
          cantidad: it.cantidad,
          precioUnitario: it.pVentaUnit,
          subtotal: parseFloat((it.cantidad * it.pVentaUnit).toFixed(2)),
        })),
        total: parseFloat(totalVentaActual().toFixed(2)),
        cuotas: cuotasDetalle,
      };

      ventas.push(nuevaVenta);
      localStorage.setItem("ventas", JSON.stringify(ventas));

      alert("✅ Venta registrada y stock actualizado por FEFO.");
      this.reset();

      // limpiar carrito y UI
      items.splice(0, items.length);
      renderItems();
      actualizarFechasyCuotas();
      cargarSelectProductos();
      if (detalleEl) detalleEl.textContent = "";
      if (fechaEl) fechaEl.valueAsDate = new Date();
    });
  }
});
