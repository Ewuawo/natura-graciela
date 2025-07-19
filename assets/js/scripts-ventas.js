document.addEventListener("DOMContentLoaded", function() {

     // Precargar la fecha actual
    if (document.getElementById("fecha")) {
        document.getElementById("fecha").valueAsDate = new Date();
    }
    
      window.editarVenta = function(index) {
        const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
        const venta = ventas[index];
        localStorage.setItem("ventaEditar", JSON.stringify(venta));
        localStorage.setItem("indiceEditar", index);
        location.href = "editarVentas.html"; // Redirige a la página de edición de ventas
    };

    //Registrar Venta
    
    if (document.getElementById("registrarVenta")) {
        document.getElementById("registrarVenta").addEventListener("submit", function (event) {
            event.preventDefault();


            const cliente = document.getElementById("cliente").value;
            const entregaInicial = parseFloat(document.getElementById("entregaInicial").value) || 0;
            const producto = document.getElementById("producto").value;
            const fecha = document.getElementById("fecha").value;
            const medioPago = document.getElementById("medioPago").value;
            const cantidad = document.getElementById("cantidad").value;
            const precio = document.getElementById("precio").value;
            const total = cantidad * precio;
            const saldo = total - entregaInicial;

            if (!cliente || !producto || !fecha || !medioPago || !cantidad || !precio) {
                alert("Por favor, completa todos los campos.");
                return;
            }

            //nuevo
            let cuotas = [];
            if (medioPago.toLowerCase() ==="credito") {
                const cantidadCuotas = parseInt(document.getElementById("cuotas").value) || 0;
                const montoPorCuota = (saldo / cantidadCuotas).toFixed(2);
              
                for (let i = 0; i < cantidadCuotas; i++) {
                    const fecha = document.getElementsByName(`fechaCuota${i}`)[0].value;
                    cuotas.push({
                        fechaVencimiento: fecha,
                        monto: parseFloat(montoPorCuota)
                    });
                }
            }



            const nuevaVenta = {
                cliente: cliente,
                producto: producto,
                fecha: fecha,
                medioPago: medioPago,
                cantidad: cantidad,
                precio: parseFloat(precio),
                total: parseFloat(total),
                cuotas: cuotas,
                entregaInicial: entregaInicial,
            };
            let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
            ventas.push(nuevaVenta);
            localStorage.setItem("ventas", JSON.stringify(ventas));

            alert("Venta registrada correctamente.");
            location.href = "ventas.html"; // Redirige a la página de ventas
        });



    }

    //Listar Ventas
    if (document.getElementById("ventas-tabla")) {
        const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
        const tabla = document.getElementById("ventas-tabla");

        ventas.forEach((venta, index) => {
            const fila = tabla.insertRow();
            fila.insertCell(0).textContent = index + 1;
            fila.insertCell(1).textContent = venta.cliente;
            fila.insertCell(2).textContent = venta.producto;
            fila.insertCell(3).textContent = venta.fecha;
            fila.insertCell(4).textContent = venta.medioPago;
            fila.insertCell(5).textContent = venta.cantidad;
            fila.insertCell(6).textContent = venta.precio.toFixed(2);
            fila.insertCell(7).textContent = venta.total.toFixed(2);
            const acciones = fila.insertCell(8);
            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn btn-primary btn-sm";
            btnEditar.addEventListener("click", function() {
                window.editarVenta(index);
            });
            acciones.appendChild(btnEditar);
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";   
            btnEliminar.className = "boton-eliminar";
            btnEliminar.addEventListener("click", function() {
                if (confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
                    ventas.splice(index, 1);
                    localStorage.setItem("ventas", JSON.stringify(ventas));
                    location.reload(); // Recargar la página para actualizar la tabla
                }
            });
            acciones.appendChild(btnEliminar);
            

        });

    }

    if(document.getElementById("cliente")) {
        const clientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
        const selectCliente = document.getElementById("cliente");
        selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
        clientes.forEach(cliente => {
            const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;
            const option = document.createElement("option");
            option.value = nombreCompleto;
            option.textContent = nombreCompleto;
            selectCliente.appendChild(option);
        });
    }
    
    if(document.getElementById("producto")) {
        const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
        const selectProducto = document.getElementById("producto");
        selectProducto.innerHTML = '<option value="">Seleccione un producto</option>';
        productos.forEach(producto => {
            const option = document.createElement("option");
            option.value = producto.nombre;
            option.textContent = producto.nombre;
            selectProducto.appendChild(option);
        });
    }

   const productoSelect = document.getElementById("producto");
    if (productoSelect) {
        productoSelect.addEventListener("change", function () {
            const productos = JSON.parse(localStorage.getItem("listaProductos")) || [];
            const productoSeleccionado = this.value;
            const producto = productos.find(p => p.nombre === productoSeleccionado);
            if (producto) {
                document.getElementById("precio").value = producto.precio.toFixed(2);
            }else {
                document.getElementById("precio").value = "";
            }
        });


  

    //Editar Venta
    if (document.getElementById("eVenta")) {
        const venta = JSON.parse(localStorage.getItem("ventaEditar"));
        if (venta) {
            document.getElementById("cliente").value = venta.cliente;
            document.getElementById("producto").value = venta.producto;
            document.getElementById("fecha").value = venta.fecha;
            document.getElementById("medioPago").value = venta.medioPago;
            document.getElementById("cantidad").value = venta.cantidad;
            document.getElementById("precio").value = venta.precio.toFixed(2);
        }

        document.getElementById("eVenta").addEventListener("submit", function (event) {
            event.preventDefault();

            const cliente = document.getElementById("cliente").value;
            const producto = document.getElementById("producto").value;
            const fecha = document.getElementById("fecha").value;
            const medioPago = document.getElementById("medioPago").value;
            const cantidad = document.getElementById("cantidad").value;
            const precio = parseFloat(document.getElementById("precio").value);
            const total = cantidad * precio;

            if (!cliente || !producto || !fecha || !medioPago || !cantidad || isNaN(precio)) {
                alert("Por favor, completa todos los campos correctamente.");
                return;
            }

            const indiceEditar = localStorage.getItem("indiceEditar");
            let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
            ventas[indiceEditar] = {
                cliente: cliente,
                producto: producto,
                fecha: fecha,
                medioPago: medioPago,
                cantidad: cantidad,
                precio: precio,
                total: total
            };
            localStorage.setItem("ventas", JSON.stringify(ventas));

            alert("Venta actualizada correctamente.");
            location.href = "ventas.html"; // Redirige a la página de ventas
        });
    }
                if (document.getElementById("eVenta")) {
    document
      .getElementById("eVenta")
      .addEventListener("reset", function (event) {
        event.preventDefault();
        location.href = "ventas.html"; // Redirigir a la página de productos
      });
  }
}   
});

//Buscar cliente 
if (document.getElementById("buscar")) {
    document.getElementById("buscar").addEventListener("input", function () {
        const filtro = this.value.toLowerCase();
        const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
        const tabla = document.getElementById("ventas-tabla");
          
        tabla.innerHTML = ""; // Limpiar tabla antes de mostrar resultados

        ventas.forEach((venta, index) => {
            if (venta.cliente.toLowerCase().includes(filtro)) {
            const fila = tabla.insertRow();
            fila.insertCell(0).textContent = index + 1;
            fila.insertCell(1).textContent = venta.cliente;
            fila.insertCell(2).textContent = venta.producto;
            fila.insertCell(3).textContent = venta.fecha;
            fila.insertCell(4).textContent = venta.medioPago;
            fila.insertCell(5).textContent = venta.cantidad;
            fila.insertCell(6).textContent = venta.precio.toFixed(2);   
            fila.insertCell(7).textContent = venta.total.toFixed(2);
            const acciones = fila.insertCell(8);

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn btn-primary btn-sm";
            btnEditar.addEventListener("click", function() {
                window.editarVenta(index);
            });
            acciones.appendChild(btnEditar);

            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "boton-eliminar";
            btnEliminar.addEventListener("click", function() {
                if (confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
                    ventas.splice(index, 1);
                    localStorage.setItem("ventas", JSON.stringify(ventas));
                    location.reload(); // Recargar la página para actualizar la tabla
                }
            });
            acciones.appendChild(btnEliminar);
            }


        });
    });
}
 
//Medio de pago
if (document.getElementById("medioPago")) {
    document.getElementById("medioPago").addEventListener("change", function () {
    const seccion = document.getElementById("seccion-cuotas");
    seccion.style.display = this.value.toLowerCase() === "credito" ? "block" : "none";
    document.getElementById("fechas-cuotas").innerHTML = ""; // Limpiar fechas de cuotas}
});
}

if (document.getElementById("cuotas")) {
    document.getElementById("cuotas").addEventListener("input", function () {
        const cantidadCuotas = parseInt(document.getElementById("cuotas").value) || 0;
        const cantidad = parseInt(document.getElementById("cantidad").value) || 0;
        const precio = parseFloat(document.getElementById("precio").value) || 0;
        const entrega = parseFloat(document.getElementById("entregaInicial").value) || 0;

        const total = cantidad * precio;
        const saldo = total - entrega;

        const contenedor = document.getElementById("fechas-cuotas");
        contenedor.innerHTML = ""; // Limpiar fechas de cuotas
        const infoCuotas = document.getElementById("info-cuotas");
        infoCuotas.innerHTML = ""; 

        if (saldo <= 0) {
            infoCuotas.innerHTML =  "⚠️ Ingrese cantidad primero.";
            return;
        }


        if (saldo < 0) {
            infoCuotas.innerHTML = "⚠️ Error: la entrega no puede ser mayor al total.";
            return;
        }

        const montoPorCuota = cantidadCuotas > 0 ? (saldo / cantidadCuotas).toFixed(2) : 0;

      //Genera fechas
        for (let i = 0; i < cantidadCuotas; i++) {
            const label = document.createElement("label");
            label.textContent = `Fecha de cuota ${i + 1}:`;
            const input = document.createElement("input");
            input.type = "date";
            input.name = `fechaCuota${i}`;
            input.required = true;

            const info = document.createElement("p");
            info.textContent = `Monto cuota ${i + 1}: $${montoPorCuota}`;
            info.style.fontWeight = "bold";
           
            contenedor.appendChild(label);
            contenedor.appendChild(input);
            contenedor.appendChild(info);
            contenedor.appendChild(document.createElement("br"));
        }

        const resumen = document.createElement("p");
        //resumen.textContent = `Saldo restante: $${saldo.toFixed(2)} | Cada cuota: $${montoPorCuota}`;
        resumen.style.fontWeight = "bold";
        infoCuotas.appendChild(resumen);

        //infoCuotas.innerHTML += `<p>Saldo: $${saldo.toFixed(2)} | Monto por Cuota: $${montoPorCuota}</p>`;

        //document.getElementById("cuotas").addEventListener("input", actualizarFechasyCuotas);
        //document.getElementById("cantidad").addEventListener("input", actualizarFechasyCuotas);
        //document.getElementById("precio").addEventListener("input", actualizarFechasyCuotas);
        //document.getElementById("entregaInicial").addEventListener("input", actualizarFechasyCuotas);

        // Agregar campo para %
        const labelInteres = document.createElement("label");
        labelInteres.textContent = "Interés (%):";
        const inputInteres = document.createElement("input");
        inputInteres.type = "number";
        inputInteres.id = "interes";
        inputInteres.min = "0";
        inputInteres.value = "0";
        
        const resultado = document.createElement("p");
        resultado.id = "resultado-cuota";
        resultado.style.fontWeight = "bold";
        
        infoCuotas.appendChild(labelInteres);
        infoCuotas.appendChild(inputInteres);
        infoCuotas.appendChild(resultado);
        
       
        //Actualizar el resultado
        inputInteres.addEventListener("input", actualizarResultado);
        document.getElementById("cantidad").addEventListener("input", actualizarResultado);
        document.getElementById("precio").addEventListener("input", actualizarResultado);
        document.getElementById("entregaInicial").addEventListener("input",actualizarResultado);
        document.getElementById("cuotas").addEventListener("input", actualizarResultado);

        function actualizarResultado() {
            const cantidadCuotas = parseInt(document.getElementById("cuotas").value) || 0;
            const interes = parseFloat(document.getElementById("interes").value) || 0;
            const cantidad = parseInt(document.getElementById("cantidad").value) || 0;
            const precio = parseFloat(document.getElementById("precio").value) || 0
            const entrega = parseFloat(document.getElementById("entregaInicial").value) || 0;
            const total = cantidad * precio;
            const saldo = total - entrega;
            const saldoConInteres = saldo * (1 + interes / 100);
            const montoPorCuota = cantidadCuotas > 0 ? (saldoConInteres / cantidadCuotas).toFixed(2) : 0;
            

            resultado.textContent = cantidad && precio
                ? `Saldo con interes: $${saldoConInteres.toFixed(2)} | Cada cuota: $${montoPorCuota}`
                : "Ingrese cantidad y precio para calcular";
        }
    });

    }

