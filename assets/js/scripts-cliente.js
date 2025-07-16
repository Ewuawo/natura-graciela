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
  if (document.getElementById("eCliente")) {
    const cliente = JSON.parse(localStorage.getItem("clienteEditar"));
    if (cliente) {
        document.getElementById("nombre").value = cliente.nombre;
        document.getElementById("apellido").value = cliente.apellido;
        document.getElementById("telefono").value = cliente.telefono;
        document.getElementById("direccion").value = cliente.direccion;
      
               
        }
 }
























});