document.addEventListener("DOMContentLoaded", function () {
  //Index
  // formatear fecha
  function formatearFecha(fecha) {
      const partes = fecha.split("-");
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    
    //Ver que productos vencen en menos de 30 días

  if (document.getElementById("productos-vencer")) {
    const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
    const hoy = new Date();
    const productosVencer = productos.filter((producto) => {
      const fechaVencimiento = new Date(producto.vencimiento);
      const diferenciaDias = (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24);
      return diferenciaDias <= 30 && diferenciaDias >= 0;
    });
    document.getElementById("productos-vencer").textContent =
      productosVencer.length;
  
  
  if (document.getElementById("lista-productos-vencer")) {
    const lista = document.getElementById("lista-productos-vencer");
    lista.innerHTML = ""; 
    productosVencer.forEach((producto) => {
      const li = document.createElement("li");
      li.textContent = `${producto.nombre} - Vence el ${formatearFecha(producto.vencimiento)}`;
      lista.appendChild(li);
    });
}
  }

  if (document.getElementById("cuotas-proximas")) {
    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
    const hoy = new Date();
    const sieteDias = new Date();
    sieteDias.setDate(hoy.getDate() + 7);
    let cuotasProximas = 0;
    let detalleCuotas= "<ul>";

    ventas.forEach(venta => {
        if (venta.cuotas) {
            venta.cuotas.forEach((cuota, i) => {
                const fechaCuota = new Date(cuota.fechaVencimiento);
                if (fechaCuota >= hoy && fechaCuota <= sieteDias) {
                    cuotasProximas++;
                    detalleCuotas += `<li>✅ ${venta.cliente} - cuota ${i + 1} - $${cuota.monto.toFixed(2)} - vence ${formatearFecha(cuota.fechaVencimiento)}</li>`;
                }
            });
        }
    });

    detalleCuotas += "</ul>";

    const contenedorCuotas = document.getElementById("cuotas-proximas");
    if (cuotasProximas > 0) {
        contenedorCuotas.innerHTML = `<p>📅 Esta semana vencen ${cuotasProximas} cuotas:</p>${detalleCuotas}`;
    }else {
        contenedorCuotas.textContent = "✅ No hay cuotas próximas esta semana";
    }
    }

  





});

