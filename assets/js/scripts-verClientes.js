document.addEventListener("DOMContentLoaded", function(){

function formatearFecha(fecha) {
    const partes = fecha.split("-");
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}


    const cliente = JSON.parse(localStorage.getItem("clienteVer"));
    if (!cliente) {
        alert("No se encontró el cliente");
        location.href = "clientes.html";
        return;
    }

    document.getElementById("nombreCliente").innerText = `${cliente.nombre} ${cliente.apellido}`;

    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
    const ventasCliente = ventas.filter(v => v.cliente === nombreCompleto);
    const tabla = document.getElementById("tabla-compras");
    ventasCliente.forEach((venta, index) => {
        const fila = document.createElement("tr");
        
        const botonDetalle = venta.medioPago === 'credito'
            ? `<button class="btn-ver-detalle" data-index="${index}">Ver</button>`
            : 'Sin cuotas';
        

        fila.innerHTML = `
            <td>${formatearFecha(venta.fecha)}</td>
            <td>${venta.producto}</td>
            <td>${venta.medioPago}</td>
            <td>$${venta.total}</td>
            <td>${botonDetalle}></td>
        `;
    
        tabla.appendChild(fila);
    });

    document.querySelectorAll(".btn-ver-detalle").forEach(boton => {
        boton.addEventListener("click", function(){
            const index = this.getAttribute("data-index");
            const venta = ventasCliente[index];

            document.getElementById("detalle-compra").style.display = "block";
            document.getElementById("detalle-producto").innerText = venta.producto;
            document.getElementById("detalle-medio").innerText = venta.medioPago;
            document.getElementById("detalle-total").innerText = venta.total;

            const tbodyCuotas = document.getElementById("tabla-cuotas");
            tbodyCuotas.innerHTML = "";
            venta.cuotas.forEach(cuota => {
                const filaCuota = document.createElement("tr");
                filaCuota.innerHTML = `
                    <td>${cuota.fechaVencimiento}</td>
                    <td>${cuota.numero}</td>
                    <td>$${cuota.monto}</td>
                `;
                tbodyCuotas.appendChild(filaCuota);
            });
        });
    });

let ventaSeleccionada = null;

document.querySelectorAll(".btn-ver-detalle").forEach(boton => {
    boton.addEventListener("click", function(){
        const index = this.getAttribute("data-index");
        ventaSeleccionada = ventasCliente[index];
        
        // Mostrar detalle
        document.getElementById("detalle-compra").style.display = "block";
        document.getElementById("seccion-pago").style.display = "block";
        document.getElementById("saldo-actual").innerText = ventaSeleccionada.total.toFixed(2);

        cargarCuotas(ventaSeleccionada);
    });
});

document.getElementById("btn-registrar-pago").addEventListener("click", function(){
    let monto = parseFloat(document.getElementById("monto-pago").value);
    if (isNaN(monto) || monto <= 0) return alert("Monto inválido");

    let saldo = ventaSeleccionada.total;
    saldo -= monto;
    if (saldo < 0) saldo = 0;
    ventaSeleccionada.total = saldo;

    // Resta en cuotas
    ventaSeleccionada.cuotas.forEach(cuota => {
        if (cuota.monto > 0 && monto > 0) {
            if (monto >= cuota.monto) {
                monto -= cuota.monto;
                cuota.monto = 0;
            } else {
                cuota.monto -= monto;
                monto = 0;
            }
        }
    });

    // Actualiza saldo
    document.getElementById("saldo-actual").innerText = saldo.toFixed(2);
    cargarCuotas(ventaSeleccionada);
    alert(`Se registró un pago. Saldo actualizado a $${saldo.toFixed(2)}.`);

    // 📝 Actualizar localStorage
    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
    const indexVenta = ventas.findIndex(v => v.fecha === ventaSeleccionada.fecha && v.producto === ventaSeleccionada.producto);
    if (indexVenta !== -1) {
        ventas[indexVenta] = ventaSeleccionada;
        localStorage.setItem("ventas", JSON.stringify(ventas));
    }
});

function cargarCuotas(venta){
    const tbody = document.getElementById("tabla-cuotas");
    tbody.innerHTML = "";
    venta.cuotas.forEach(cuota => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${cuota.fechaVencimiento}</td>
            <td>${cuota.numero}</td>
            <td>${cuota.monto <= 0 
            ? 'Pagada <button class="btn-editar-cuota" data-numero="' + cuota.numero + '">Editar</button>'
            : `$${cuota.monto.toFixed(2)} <button class="btn-editar-cuota" data-numero=${cuota.numero}">Editar</button>`
            }
            </td>
        `;
        tbody.appendChild(fila);
    });
}

let cuotaSeleccionada = null;

document.addEventListener("click", function (e){
    if (e.target.classList.contains("btn-editar-cuota")) {
        const numCuota = parseInt(e.target.getAttribute("data-numero"));
        cuotaSeleccionada = ventaSeleccionada.cuotas.find(c => c.numero === numCuota);
       
       if (cuotaSeleccionada.monto <= 0) {
        const confirmar = confirm("Esta cuota figura como pagada. ¿Querés editarla?");
        if (!confirmar) return;
       }
       
        document.getElementById("nuevo-monto-cuota").value = cuotaSeleccionada.monto.toFixed(2);
        document.getElementById("modal-editar-cuota").style.display = "block";
    }
});

document.getElementById("btn-guardar-cuota").addEventListener("click", function () {
    const nuevoMonto = parseFloat(document.getElementById("nuevo-monto-cuota").value);
    if (isNaN(nuevoMonto) || nuevoMonto < 0) {
        alert("Monto invalido");
        return;
    }

    cuotaSeleccionada.monto = nuevoMonto;

    //Actualizar el localStorage
    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
    const indexVenta = ventas.findIndex(v => v.fecha === ventaSeleccionada.fecha && v.producto === ventaSeleccionada.producto);
    if (indexVenta !== -1) {
       ventas[indexVenta] = ventaSeleccionada;
       localStorage.setItem("ventas", JSON.stringify(ventas));
    }

    cargarCuotas(ventaSeleccionada);
    document.getElementById("modal-editar-cuota").style.display = "none";





});




});

