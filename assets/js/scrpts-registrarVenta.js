document.addEventListener("DOMContentLoaded", function(){
function cargarSelectClientes() {
    const clientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
    const clienteSelect = document.getElementById("cliente");
    clienteSelect.innerHTML = '<option value="">Seleccionar Cliente</option>';
    clientes.forEach(cliente => {
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
    productos.forEach(producto => {
        const option = document.createElement("option");
        option.value = producto.nombre;
        option.textContent = producto.nombre;
        productoSelect.appendChild(option);
    });
}

cargarSelectClientes();
cargarSelectProductos();
document.getElementById("fecha").valueAsDate = new Date();

let precioCostoUnitario = 0;
let precioVentaUnitario = 0;
let stockProducto = 0;

document.getElementById("producto").addEventListener("change", function(){
    const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
    const producto = productos.find(p => p.nombre === this.value);
    if (producto){
        precioCostoUnitario = parseFloat(producto.pCosto);
        precioVentaUnitario = parseFloat(producto.pVenta);
        stockProducto = parseInt(producto.cantidad);
        document.getElementById("pCosto").value = precioCostoUnitario;
        document.getElementById("pVenta").value = precioVentaUnitario;
        actualizarTotales();
    }
});

document.getElementById("cantidad").addEventListener("input", function(){
    const cantidad = parseInt(this.value) || 0;
    if (cantidad > stockProducto){
        alert(`❌ Stock insuficiente. Solo hay ${stockProducto} unidades`);
        this.value = "";
        actualizarTotales();
    } else {
        actualizarTotales();
    }
});

function actualizarTotales(){
    const cantidad = parseInt(document.getElementById("cantidad").value) || 0;
    document.getElementById("pCosto").value = (cantidad * precioCostoUnitario).toFixed(2);
    document.getElementById("pVenta").value = (cantidad * precioVentaUnitario).toFixed(2);
}

const medioPago = document.getElementById("medioPago");
const seccionCuotas = document.getElementById("seccion-cuotas");
if (medioPago) {
    medioPago.addEventListener("change", function(){
        seccionCuotas.style.display = this.value === "credito" ? "block" : "none";
    });
}

function actualizarFechasyCuotas(){
    const cuotas = parseInt(document.getElementById("cuotas")?.value) || 0;
    const cantidad = parseInt(document.getElementById("cantidad")?.value) || 0;
    const entrega = parseFloat(document.getElementById("entregaInicial")?.value) || 0;
    const interes = parseFloat(document.getElementById("interes")?.value) || 0;

    const saldo = (cantidad * precioVentaUnitario) - entrega;
    const saldoInteres = saldo * (1 + interes / 100);
    const cuota = cuotas > 0 ? (saldoInteres / cuotas).toFixed(2) : 0;

    const infoCuotas = document.getElementById("info-cuotas");
    if(infoCuotas){
        infoCuotas.innerHTML = `Saldo con interés: $${saldoInteres.toFixed(2)} | Monto por cuota: $${cuota}`;
    }

    const contenedorFechas = document.getElementById("fechas-cuotas");
    if(contenedorFechas){
        contenedorFechas.innerHTML = "";
        for (let i = 0; i < cuotas; i++) {
            contenedorFechas.innerHTML += `<label>Fecha cuota ${i+1}</label>
            <input type="date" required><br>
            <p>Cuota ${i+1}: $${cuota}</p>`;
        }
    }
}

const cuotas = document.getElementById("cuotas");
const entrega = document.getElementById("entregaInicial");
const interes = document.getElementById("interes");

if (cuotas) cuotas.addEventListener("input", actualizarFechasyCuotas);
if (entrega) entrega.addEventListener("input", actualizarFechasyCuotas);
if (interes) interes.addEventListener("input", actualizarFechasyCuotas);

const formulario = document.getElementById("registrarVenta");
if (formulario) {
    formulario.addEventListener("submit", function(event){
        event.preventDefault();
        const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
        const nombreProducto = document.getElementById("producto").value;
        const cantidad = parseInt(document.getElementById("cantidad").value) || 0;

        const index = productos.findIndex(p => p.nombre === nombreProducto);
        if (index !== -1){
            productos[index].cantidad -= cantidad;
            if (productos[index].cantidad <= 0){
                productos.splice(index, 1);
            }
            localStorage.setItem("listaProductos", JSON.stringify(productos));
            const ventas = JSON.parse(localStorage.getItem("ventas") || []);

            let cuotasDetalle = [];
            if (document.getElementById("medioPago").value === "credito") {
                const cuotasCantidad = parseInt(document.getElementById("cuotas").value) || 0;
                const interes = parseFloat(document.getElementById("interes").value) || 0;
                const entrega = parseFloat(document.getElementById("entregaInicial").value) || 0;
                const saldo = (cantidad * precioVentaUnitario) - entrega;
                const saldoConInteres = saldo * (1 + interes / 100);
                const montoPorCuota = cuotasCantidad > 0 ? (saldoConInteres / cuotasCantidad).toFixed(2) : 0;
                
                const fechasCuotas = document.querySelectorAll("#fechas-cuotas input[type='date']");
                fechasCuotas.forEach((input, index) => {
                    cuotasDetalle.push({
                        numero: index + 1,
                        fechaVencimiento: input.value,
                        monto: parseFloat(montoPorCuota)
                    });
                });
            }

            const nuevaVenta = {
                cliente: document.getElementById("cliente").value,
                producto: nombreProducto,
                fecha: document.getElementById("fecha").value,
                medioPago: document.getElementById("medioPago").value,
                cantidad: cantidad,
                precio: precioVentaUnitario,
                total: parseFloat((cantidad * precioVentaUnitario).toFixed(2)),
                cuotas: cuotasDetalle

            };
            ventas.push(nuevaVenta);
            localStorage.setItem("ventas", JSON.stringify(ventas));
        }

        alert("✅ Venta registrada y stock actualizado.");
        this.reset();
        location.reload();
    });
}
});