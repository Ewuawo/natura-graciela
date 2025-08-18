(() => {
  const API = "http://localhost:3000";
  const $pVencer = document.getElementById("pVencer");
  const $cVencer = document.getElementById("cVencer");

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      // primero probamos pings para diagnosticar si hay 404
      await fetch(`${API}/alertas/__index_ping`).then((r) => {
        if (!r.ok) throw new Error("index_ping " + r.status);
      });
      await fetch(`${API}/alertas/ping`).then((r) => {
        if (!r.ok) throw new Error("router_ping " + r.status);
      });

      const [prods, cuotas] = await Promise.all([
        fetchJson(`${API}/alertas/productos?days=30`),
        fetchJson(`${API}/alertas/cuotas?days=7`),
      ]);
      renderProductos(prods);
      renderCuotas(cuotas);
    } catch (e) {
      console.error(e);
      if ($pVencer)
        $pVencer.innerHTML = `<tr><td colspan="5">Error cargando productos</td></tr>`;
      if ($cVencer)
        $cVencer.innerHTML = `<tr><td colspan="4">Error cargando cuotas</td></tr>`;
    }
  }

  async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Error ${r.status} en ${url}`);
    return r.json();
  }

  function fmtDate(d) {
    try {
      return new Date(d).toLocaleDateString("es-AR");
    } catch {
      return d;
    }
  }

  function fmtMoney(n) {
    return Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });
  }

  function renderProductos(list) {
    if (!$pVencer) return;
    if (!list || !list.length) {
      $pVencer.innerHTML = `<tr><td colspan="5" style="text-align:center">Sin productos por vencer en 30 días</td></tr>`;
      return;
    }
    $pVencer.innerHTML = list
      .map(
        (p) => `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.detalle ?? ""}</td>
        <td style="text-align:right">${fmtMoney(p.pVenta)}</td>
        <td>${p.fechaVencimiento ? fmtDate(p.fechaVencimiento) : ""}</td>
        <td style="text-align:right">${p.cantidad}</td>
      </tr>
    `
      )
      .join("");
  }

  function renderCuotas(list) {
    if (!$cVencer) return;
    if (!list || !list.length) {
      $cVencer.innerHTML = `<tr><td colspan="4" style="text-align:center">Sin cuotas a vencer en los próximos 7 días</td></tr>`;
      return;
    }
    $cVencer.innerHTML = list
      .map(
        (c) => `
      <tr>
        <td>${c.nombreCompleto ?? "(s/cliente)"}</td>
        <td>#${c.nroCuota}</td>
        <td>${fmtDate(c.venceEl)}</td>
        <td style="text-align:right">${fmtMoney(c.importe)}</td>
      </tr>
    `
      )
      .join("");
  }
})();
