document.addEventListener("DOMContentLoaded", function() {

//Agregar clientes
if (document.getElementById("form-cliente")) {
    document.getElementById("form-cliente").addEventListener("submit", function(event) {
        event.preventDefault();
         
        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const direccion = document.getElementById("direccion").value.trim();
           
        
        if (!nombre || !apellido || !telefono || !direccion) {
            alert("Por favor, complete todos los campos correctamente.");
            return;
        }

        const nuevoCliente = { nombre, apellido, telefono, direccion };

        let listaClientes = JSON.parse(localStorage.getItem("listaClientes"));
        if (!Array.isArray(listaClientes)) listaClientes = [];
        listaClientes.push(nuevoCliente);
        localStorage.setItem("listaClientes", JSON.stringify(listaClientes));

            alert("Cliente agregado exitosamente.");
            this.reset(); // Resetea el formulario
            document.getElementById("form-cliente").reset();
            location.href = "clientes.html"; // Redirige a la página de clientes
       
        
    });
}
//Tabla Clintes

if (document.getElementById("tabla-clientes")) {
    const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
    const tablaClientes = document.getElementById("tabla-clientes");

    listaClientes.forEach((cliente, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.apellido}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.direccion}</td>
            <td>
                <button class="editarCliente">Editar</button>
                <button class="boton-eliminar">Eliminar</button>
                <button class="boton-ver">Ver</button>
            </td>
        `;
        tablaClientes.appendChild(fila);
    });

}

//Eliminar clientes
if (document.querySelectorAll(".boton-eliminar").length > 0) {
    document.querySelectorAll(".boton-eliminar").forEach((boton, index) => {
        boton.addEventListener("click", function() {
            const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
            if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
            listaClientes.splice(index, 1);
            localStorage.setItem("listaClientes", JSON.stringify(listaClientes));
            location.reload(); // Recargar la página para reflejar los cambios
            }
        });
    });
}

//Editar clientes
 if (document.querySelectorAll(".editarCliente").length > 0) {
    document.querySelectorAll(".editarCliente").forEach((boton,index) => {
        boton.addEventListener("click", function() {
            const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
            const cliente = listaClientes[index];

            localStorage.setItem("clienteEditar", JSON.stringify(cliente));
            localStorage.setItem("indiceEditar", index);

            location.href = "verEditarClientes.html";
        });
    }); 
}

//Ver cliente
if (document.querySelectorAll(".boton-ver").length > 0) {
    document.querySelectorAll(".boton-ver").forEach((boton, index) => {
        boton.addEventListener("click", function() {
            const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
            const cliente = listaClientes[index];

            localStorage.setItem("clienteVer", JSON.stringify(cliente));
            localStorage.setItem("indiceVer", index);

            location.href = "verCliente.html";
        })
    })
}






  if (document.getElementById("eCliente")) {
    const cliente = JSON.parse(localStorage.getItem("clienteEditar"));
    if (cliente) {
        document.getElementById("nombre").value = cliente.nombre;
        document.getElementById("apellido").value = cliente.apellido;
        document.getElementById("telefono").value = cliente.telefono;
        document.getElementById("direccion").value = cliente.direccion;
      
               
        }
 }


if (document.getElementById("eCliente")) {
    document.getElementById("eCliente").addEventListener("submit", function(event) {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const direccion = document.getElementById("direccion").value.trim();

        if (!nombre || !apellido || !telefono || !direccion) {
            alert("Por favor, complete todos los campos correctamente.");
            return;
        }

        const indiceEditar = localStorage.getItem("indiceEditar");
        let listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
        
        listaClientes[indiceEditar] = { nombre, apellido, telefono, direccion };
        localStorage.setItem("listaClientes", JSON.stringify(listaClientes));

        alert("Cliente editado exitosamente.");
        location.href = "clientes.html"; // Redirige a la página de clientes
    });

}

if (document.getElementById("eCliente")) {
    document.getElementById("eCliente").addEventListener("reset", function(event) {
        event.preventDefault();
        location.href = "clientes.html"; // Redirige a la página de clientes
    });
}


function activarEventosBotones() {
    document.querySelectorAll(".editarCliente").forEach((boton,index) => {
        boton.addEventListener("click", function() {
            const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
            const cliente = listaClientes[index];
            localStorage.setItem("clienteEditar", JSON.stringify(cliente));
            localStorage.setItem("indiceEditar", index);
            location.href = "verEditarClientes.html";
        });
    });
    // lo mismo para eliminar y ver si querés
}
if (document.getElementById("buscar")) {
    document.getElementById("buscar").addEventListener("input", function(){
        const filtro = this.value.toLowerCase();
        const listaClientes = JSON.parse(localStorage.getItem("listaClientes")) || [];
        const tabla = document.getElementById("tabla-clientes");
        tabla.innerHTML = "";

        listaClientes
        .filter(cliente =>
            cliente.nombre.toLowerCase().includes(filtro) ||
            cliente.apellido.toLowerCase().includes(filtro)
        )
        .forEach((cliente, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.apellido}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.direccion}</td>
                <td>
                    <button class="editarCliente">Editar</button>
                    <button class="boton-eliminar">Eliminar</button>
                    <button class="boton-ver">Ver</button>
                </td>
            `;
            tabla.appendChild(fila);
        });

        activarEventosBotones(); // 🔑 volvés a activar los eventos
        
        
    });
}




const botonCancelar = document.querySelector(".boton-cancelar");
if (botonCancelar) {
    botonCancelar.addEventListener("click", function (event) {
        event.preventDefault();
        location.href = "clientes.html";
    });
}














});