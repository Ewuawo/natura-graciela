document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("formProducto")) {
        document.getElementById("formProducto").addEventListener("submit", function (e) {
            const nombreProducto = document.getElementById("nombreProducto").value.trim();  
            const detalleProducto = document.getElementById("detalleProducto").value.trim();
            const precioProducto = document.getElementById("precioProducto").value.trim();  
            const vencimientoProducto = document.getElementById("vencimientoProducto").value.trim();
            const cantidadProducto = document.getElementById("cantidadProducto").value.trim();  
            if (!nombreProducto || !detalleProducto || !precioProducto || !vencimientoProducto || !cantidadProducto) {
                alert("Por favor, completa todos los campos.");
                e.preventDefault();
                return;
            }
            if (!/^\d+(\.\d{1,2})?$/.test(precioProducto)) {
                alert("El precio debe ser un número válido con hasta dos decimales.");  
                e.preventDefault();
                return;
            }
            alert("Producto agregado correctamente.");
           
        });
    }


    if(document.getElementById("form-cliente")) {
        document.getElementById("form-cliente").addEventListener("submit", function (e) {
            const nombreCliente = document.getElementById("nombreCliente").value.trim();
            const apellidoCliente = document.getElementById("apellidoCliente").value.trim();
            const telefonoCliente = document.getElementById("telefonoCliente").value.trim();
            const direccionCliente = document.getElementById("direccionCliente").value.trim();
            if (!nombreCliente || !apellidoCliente || !telefonoCliente || !direccionCliente) {
                alert("Por favor, completa todos los campos.");
                e.preventDefault();
                return;
            }
            if (!/^\d{10,20}$/.test(telefonoCliente)) {
                alert("El teléfono debe tener entre 10 y 20 dígitos.");
                e.preventDefault();
                return;
            }
            alert("Cliente agregado correctamente.");
            
        });
    }   

    if(document.getElementById("editarCliente")) {
        document.getElementById("editarCliente").addEventListener("submit", function (e) {
            const nombre = document.getElementById("nombre").value.trim();
            const apellido = document.getElementById("apellido").value.trim();
            const telefono = document.getElementById("telefono").value.trim();
            const direccion = document.getElementById("direccion").value.trim();
            if (!nombre || !apellido ||  !telefono || !direccion) {
                alert("Por favor, completa todos los campos.");
                e.preventDefault();
                return;
            }
            if (!/^\d{10,20}$/.test(telefono)) {
                alert("El teléfono debe tener entre 10 y 20 dígitos.");
                e.preventDefault();
                return;
            }
            alert("Cliente editado correctamente.");
            
        });
    }

    if (document.getElementById("buscar")) {
        document.getElementById("buscar").addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll(".product-list table tbody tr");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchTerm));
                row.style.display = match ? "" : "none";
            });
        });
    }

    if (document.querySelectorAll(".eliminar-venta")) {
        document.querySelectorAll(".eliminar-venta").forEach(button => {
            button.addEventListener("click", function () {
                if (confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
                    this.closest("tr").remove();
                    alert("Venta eliminada correctamente.");
                }
            });
        });
    }

    if (document.querySelectorAll(".editar-venta")) {
        document.querySelectorAll(".editar-venta").forEach(button => {
            button.addEventListener("click", function () {
                const row = this.closest("tr");
                const cells = row.querySelectorAll("td");
                const cliente = cells[0].textContent;
                const producto = cells[1].textContent;
                const fecha = cells[2].textContent;
                const medioPago = cells[3].textContent;
                const cantidad = cells[4].textContent;
                // Aquí podrías abrir un modal o redirigir a una página de edición
                this.closest("tr").setAttribute('data-cliente', cliente);
                location.href = 'registrarVentas.html';
                alert(`Editar Venta:\nCliente: ${cliente}\nProducto: ${producto}\nfecha: ${fecha}\nMedio de Pago: ${medioPago}\nCantidad: ${cantidad}`);
            });
        });
    }

    if (document.getElementById("registrarVenta")) {
        document.getElementById("registrarVenta").addEventListener("submit", function (e) {
            const cliente = document.getElementById("cliente").value.trim();
            const producto = document.getElementById("producto").value.trim();
            const fecha = document.getElementById("fecha").value.trim();
            const medioPago = document.getElementById("medioPago").value.trim();
            const cantidad = document.getElementById("cantidad").value.trim();
            if (!cliente || !producto || !fecha || !medioPago || !cantidad) {
                alert("Por favor, completa todos los campos.");
                e.preventDefault();
                return;
            }
            if (!/^\d+$/.test(cantidad)) {
                alert("La cantidad debe ser un número entero.");
                e.preventDefault();
                return;
            }
            alert("Venta registrada correctamente.");
            
        });
    }

}); 















