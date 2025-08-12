document.addEventListener("DOMContentLoaded", function () {
  // ===== Carga de selects existentes =====
  function cargarSelectClientes() {
    const clientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
    const clienteSelect = document.getElementById("cliente");
    clienteSelect.innerHTML = '<option value="">Seleccionar Cliente</option>';
    clientes.forEach((cliente) => {
      const option = document.createElement("option");
      option.value = `${cliente.nombre} ${cliente.apellido}`;
      option.textContent = `${cliente.nombre} ${cliente.apellido}`;
      clienteSelect.appendChild(option);
    });
  }

  function cargarSelectProductos() {
    const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
    const productoSelect = document.getElementById("producto");
    productoSelect.innerHTML = '<option value="">Seleccionar Producto</option>';
    productos.forEach((producto) => {
      const option = document.createElement("option");
      option.value = producto.nombre;
      option.textContent = producto.nombre;
      productoSelect.appendChild(option);
    });
  }

  cargarSelectClientes();
  cargarSelectProductos();
  document.getElementById("fecha").valueAsDate = new Date();

  // ===== Estado de la línea en edición y del carrito =====
  let precioCostoUnitario = 0;
  let precioVentaUnitario = 0;
  let stockProducto = 0;

  const items = []; // { producto, cantidad, pCostoUnit, pVentaUnit, subtotalVenta }
  const tablaBody = document.querySelector("#tablaItems tbody");
  const totalVentaEl = document.getElementById("totalVenta");

  function productosLS() {
    return JSON.parse(localStorage.getItem("listaProductos")) || [];
  }

  function findProd(nombre) {
    return productosLS().find((p) => p.nombre === nombre);
  }

  // Stock disponible = stock en LS - cantidad ya reservada en carrito para ese producto
  function stockDisponible(nombre) {
    const prod = findProd(nombre);
    if (!prod) return 0;
    const reservado = items
      .filter((i) => i.producto === nombre)
      .reduce((acc, i) => acc + i.cantidad, 0);
    return (parseInt(prod.cantidad) || 0) - reservado;
  }

  // ==== Línea de edición (select + cantidad) ====
  const selProducto = document.getElementById("producto");
  const inpCantidad = document.getElementById("cantidad");
  const inpPCosto = document.getElementById("pCosto");
  const inpPVenta = document.getElementById("pVenta");

  selProducto.addEventListener("change", function () {
    const producto = findProd(this.value);
    if (producto) {
      precioCostoUnitario = parseFloat(producto.pCosto) || 0;
      precioVentaUnitario = parseFloat(producto.pVenta) || 0;
      stockProducto = stockDisponible(producto.nombre);
      // mostramos precios unitarios inicialmente
      inpPCosto.value = precioCostoUnitario.toFixed(2);
      inpPVenta.value = precioVentaUnitario.toFixed(2);
      actualizarTotalesLinea();
    } else {
      precioCostoUnitario = precioVentaUnitario = stockProducto = 0;
      inpPCosto.value = "";
      inpPVenta.value = "";
    }
  });

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

  function actualizarTotalesLinea() {
    const cantidad = parseInt(inpCantidad.value) || 0;
    // en los inputs mostramos SUBTOTALES de la línea para que veas cuánto suma
    inpPCosto.value = (cantidad * precioCostoUnitario).toFixed(2);
    inpPVenta.value = (cantidad * precioVentaUnitario).toFixed(2);
    actualizarFechasyCuotas(); // recalcula cuotas con el total
  }

  // ===== Carrito =====
  function renderItems() {
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

    // total
    const total = items.reduce(
      (acc, it) => acc + it.cantidad * it.pVentaUnit,
      0
    );
    totalVentaEl.textContent = total.toFixed(2);

    // listeners quitar
    tablaBody.querySelectorAll(".quitar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = parseInt(e.currentTarget.getAttribute("data-i"));
        items.splice(i, 1);
        renderItems();
        // al quitar, se libera stock y se recalculan cuotas
        stockProducto = stockDisponible(selProducto.value);
        actualizarTotalesLinea();
        actualizarFechasyCuotas();
      });
    });
  }

  document.getElementById("agregarItem").addEventListener("click", function () {
    const nombre = selProducto.value;
    const cantidad = parseInt(inpCantidad.value) || 0;

    if (!nombre) {
      alert("Elegí un producto.");
      return;
    }
    if (cantidad <= 0) {
      alert("Ingresá una cantidad válida.");
      return;
    }

    const disp = stockDisponible(nombre);
    if (cantidad > disp) {
      alert(
        `❌ Stock insuficiente. Solo hay ${disp} unidades disponibles de "${nombre}".`
      );
      return;
    }

    const prod = findProd(nombre);
    items.push({
      producto: nombre,
      cantidad,
      pCostoUnit: parseFloat(prod.pCosto) || 0,
      pVentaUnit: parseFloat(prod.pVenta) || 0,
    });

    // limpiar línea y refrescar
    selProducto.value = "";
    inpCantidad.value = "";
    inpPCosto.value = "";
    inpPVenta.value = "";
    precioCostoUnitario = precioVentaUnitario = stockProducto = 0;

    renderItems();
    actualizarFechasyCuotas();
  });

  // ===== Toggle de cuotas (igual que antes) =====
  const medioPago = document.getElementById("medioPago");
  const seccionCuotas = document.getElementById("seccion-cuotas");
  if (medioPago) {
    medioPago.addEventListener("change", function () {
      seccionCuotas.style.display = this.value === "credito" ? "block" : "none";
      actualizarFechasyCuotas();
    });
  }

  // ===== Cuotas sobre el TOTAL de la venta =====
  function totalVentaActual() {
    return items.reduce((acc, it) => acc + it.cantidad * it.pVentaUnit, 0);
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

  // recalcular cuotas al cambiar estos campos
  const cuotasInp = document.getElementById("cuotas");
  const entregaInp = document.getElementById("entregaInicial");
  const interesInp = document.getElementById("interes");
  if (cuotasInp) cuotasInp.addEventListener("input", actualizarFechasyCuotas);
  if (entregaInp) entregaInp.addEventListener("input", actualizarFechasyCuotas);
  if (interesInp) interesInp.addEventListener("input", actualizarFechasyCuotas);

  // ===== Envío del formulario: descuenta TODOS los ítems del carrito =====
  const formulario = document.getElementById("registrarVenta");
  if (formulario) {
    formulario.addEventListener("submit", function (event) {
      event.preventDefault();

      if (items.length === 0) {
        alert("Agregá al menos un ítem a la venta.");
        return;
      }

      // Validación final de stock por si cambió desde que se cargó
      const prods = productosLS();
      for (const it of items) {
        const idx = prods.findIndex((p) => p.nombre === it.producto);
        if (idx === -1) {
          alert(`El producto "${it.producto}" ya no existe.`);
          return;
        }
        // stock disponible real al momento del submit (sin contar carrito)
        const disponible = parseInt(prods[idx].cantidad) || 0;
        const yaReservado = items
          .filter((x) => x.producto === it.producto)
          .reduce((a, b) => a + b.cantidad, 0);
        if (yaReservado > disponible) {
          alert(
            `❌ Stock insuficiente de "${it.producto}". Disponible: ${disponible}.`
          );
          return;
        }
      }

      // Descontar stock
      items.forEach((it) => {
        const prods = productosLS();
        const idx = prods.findIndex((p) => p.nombre === it.producto);
        if (idx !== -1) {
          prods[idx].cantidad = Math.max(
            0,
            (parseInt(prods[idx].cantidad) || 0) - it.cantidad
          );
          localStorage.setItem("listaProductos", JSON.stringify(prods));
        }
      });

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

      alert("✅ Venta registrada y stock actualizado.");
      this.reset();
      // limpiar carrito y UI
      items.splice(0, items.length);
      renderItems();
      actualizarFechasyCuotas();
      // recargar selects y fecha
      cargarSelectProductos();
      document.getElementById("fecha").valueAsDate = new Date();
    });
  }
});
