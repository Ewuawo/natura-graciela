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


    //Listar Ventas
    if (document.getElementById("ventas-tabla")) {
        const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
        

        function mostrarVentas(lista) {
            const tabla = document.getElementById("ventas-tabla");
            tabla.innerHTML = "";

            lista.forEach((venta, index) => {
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
                    let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
                    ventas.splice(index, 1);
                    localStorage.setItem("ventas", JSON.stringify(ventas));
                    location.reload(); // Recargar la página para actualizar la tabla
                }
            });
            acciones.appendChild(btnEliminar);
            

        });
    }

    mostrarVentas(ventas);

    document.getElementById("buscar").addEventListener("input", function(){
        const filtro = this.value.toLowerCase();
        const ventasFiltradas = ventas.filter(venta => venta.cliente.toLowerCase().includes(filtro));
        mostrarVentas(ventasFiltradas);
    });
}

  


    


  

    //Editar Venta
    if (document.getElementById("eVenta")) {
        const venta = JSON.parse(localStorage.getItem("ventaEditar"));
        if (venta) {
            document.getElementById("cliente").value = venta.cliente;
            document.getElementById("producto").value = venta.producto;
            document.getElementById("fecha").value = venta.fecha;
            document.getElementById("medioPago").value = venta.medioPago;
            document.getElementById("cantidad").value = venta.cantidad;
            document.getElementById("pCosto").value = venta.pCosto;
            document.getElementById("pVenta").value = venta.pVenta;
        }

        document.getElementById("eVenta").addEventListener("submit", function (event) {
            event.preventDefault();

            const cliente = document.getElementById("cliente").value;
            const producto = document.getElementById("producto").value;
            const fecha = document.getElementById("fecha").value;
            const medioPago = document.getElementById("medioPago").value;
            const cantidad = document.getElementById("cantidad").value;
            const pCosto = parseFloat(document.getElementById("pCosto").value);
            const pVenta = parseFloat(document.getElementById("pVenta").value);
            const total = cantidad * pVenta;

            if (!cliente || !producto || !fecha || !medioPago || !cantidad || isNaN(pCosto) || isNaN(pVenta)) {
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
                pCosto: pCosto,
                pVenta: pVenta,
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

});
