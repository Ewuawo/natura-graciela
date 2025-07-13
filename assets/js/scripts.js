document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", function (e) {
        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const telefono = document.getElementById("telefono").value.trim();

        if (!nombre || !apellido || !telefono) {
            alert("Por favor, completa todos los campos.");
            e.preventDefault();
            return;
        }
        if (!/^\d{6,15}$/.test(telefono)) {
            alert("El número de teléfono debe tener 15 dígitos.");
            e.preventDefault();
            return;
        }

        alert("Cliente agregado correctamente.");
    })
})