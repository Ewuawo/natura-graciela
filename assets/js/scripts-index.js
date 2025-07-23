document.addEventListener("DOMContentLoaded", function(){

//Formatear la fecha dd-mm-aaaa
function formatearFecha(fecha) {
    const partes = fecha.split("-");
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

//Buscar productos a vencer
const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
const hoy = new Date();

const productosVencer = productos.filter(producto => {
    const vencimiento = new Date(producto.vencimiento);
    const diferenciaDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diferenciaDias >= 0 && diferenciaDias <=30;
});

//listar en la tabla
const pVencer = document.getElementById("pVencer");
productosVencer.forEach(producto => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
    <td>${producto.nombre}</td>
    <td>${producto.detalle}</td>
    <td>${producto.pVenta.toFixed(2)}</td>
    <td>${formatearFecha(producto.vencimiento)}</td>
    <td>${producto.cantidad}</td>
    `;

    pVencer.appendChild(fila);

})

//Buscar cuotas a vencer
const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
const oy = new Date();
const sieteDias = new Date();
sieteDias.setDate(oy.getDate() + 7);

const cuotasVencer = [];

ventas.forEach(venta => {
    if (venta.cuotas) {
        venta.cuotas.forEach(cuota => {
            const fVencimiento = new Date(cuota.fechaVencimiento);
            if (fVencimiento >= oy && fVencimiento <= sieteDias && cuota.monto > 0) {
                cuotasVencer.push({
                    cliente: venta.cliente,
                    cuota: cuota.monto.toFixed(2),
                    fecha: formatearFecha(cuota.fechaVencimiento),
                    total: venta.total.toFixed(2)
                });
            }
        });
    }
});


//Listar tabla cuotas a vencer
const cVencer = document.getElementById("cVencer");
let contadorCuota = 1;

cuotasVencer.forEach(cuota => {
    const fila = document.createElement("tr");
    fila.innerHTML= `
    <td>${cuota.cliente}</td>
    <td>Cuota ${contadorCuota++}</td>
    <td>${cuota.fecha}</td>
    <td>$${cuota.cuota}</td>
    
    `;
    cVencer.appendChild(fila);
})

});

