document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";

  // ============ UTILIDADES ============
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const qsp = new URLSearchParams(location.search);

  const request = async (url, opts = {}) => {
    const r = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.status === 204 ? null : r.json();
  };

  // ============ LISTAR (clientes.html) ============
  const $tabla = $("#tabla-clientes");
  const $buscar = $("#buscar");
  if ($tabla) {
    const render = (lista) => {
      $tabla.innerHTML = lista
        .map(
          (c) => `
        <tr data-id="${c.id}">
          <td>${c.id}</td>
          <td>${c.nombre ?? ""}</td>
          <td>${c.apellido ?? ""}</td>
          <td>${c.telefono ?? ""}</td>
          <td>${c.direccion ?? ""}</td>
          <td>
            <button class="btn-ver">Ver</button>
            <button class="btn-editar">Editar</button>
            <button class="btn-eliminar">Eliminar</button>
          </td>
        </tr>`
        )
        .join("");
    };

    let cache = [];
    const cargar = async () => {
      try {
        cache = await request(`${API}/clientes`);
        filtrar();
      } catch (e) {
        console.error(e);
        $tabla.innerHTML =
          '<tr><td colspan="6">Error cargando clientes</td></tr>';
      }
    };

    const filtrar = () => {
      const f = ($buscar.value || "").toLowerCase();
      render(
        cache.filter(
          (c) =>
            (c.nombre ?? "").toLowerCase().includes(f) ||
            (c.apellido ?? "").toLowerCase().includes(f) ||
            (c.nombreCompleto ?? "").toLowerCase().includes(f)
        )
      );
    };

    $buscar?.addEventListener("input", filtrar);
    $tabla.addEventListener("click", async (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;
      const id = tr.dataset.id;

      if (e.target.classList.contains("btn-ver")) {
        location.href = `verCliente.html?id=${id}`;
      }
      if (e.target.classList.contains("btn-editar")) {
        location.href = `verEditarClientes.html?id=${id}`;
      }
      if (e.target.classList.contains("btn-eliminar")) {
        if (!confirm("¿Eliminar este cliente?")) return;
        try {
          await request(`${API}/clientes/${id}`, { method: "DELETE" });
          await cargar();
        } catch (err) {
          console.error(err);
          alert("No se pudo eliminar el cliente");
        }
      }
    });

    cargar();
  }

  // ============ AGREGAR (agregarCliente.html) ============
  const $formAdd = $("#form-cliente");
  if ($formAdd) {
    $formAdd.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        nombre: $("#nombre").value.trim(),
        apellido: $("#apellido").value.trim(),
        telefono: $("#telefono").value.trim(),
        direccion: $("#direccion").value.trim(),
      };
      if (!payload.nombre || !payload.apellido) {
        return alert("Nombre y apellido son requeridos");
      }
      try {
        await request(`${API}/clientes`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        alert("Cliente agregado");
        location.href = "clientes.html";
      } catch (err) {
        console.error(err);
        alert("No se pudo agregar el cliente");
      }
    });

    $(".boton-cancelar")?.addEventListener("click", (e) => {
      e.preventDefault();
      location.href = "clientes.html";
    });
  }

  // ============ EDITAR (verEditarClientes.html) ============
  const $formEdit = $("#eCliente");
  if ($formEdit) {
    const id = qsp.get("id");
    if (!id) {
      alert("Falta id de cliente");
      location.href = "clientes.html";
      return;
    }

    // precargar
    (async () => {
      try {
        const c = await request(`${API}/clientes/${id}`);
        $("#nombre").value = c.nombre ?? "";
        $("#apellido").value = c.apellido ?? "";
        $("#telefono").value = c.telefono ?? "";
        $("#direccion").value = c.direccion ?? "";
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el cliente");
        location.href = "clientes.html";
      }
    })();

    $formEdit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        nombre: $("#nombre").value.trim(),
        apellido: $("#apellido").value.trim(),
        telefono: $("#telefono").value.trim(),
        direccion: $("#direccion").value.trim(),
      };
      try {
        await request(`${API}/clientes/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("Cliente actualizado");
        location.href = "clientes.html";
      } catch (err) {
        console.error(err);
        alert("No se pudo actualizar el cliente");
      }
    });

    $formEdit.addEventListener("reset", (e) => {
      e.preventDefault();
      location.href = "clientes.html";
    });
  }

  // ============ VER (verCliente.html) ============
  // Por ahora sólo muestra el nombre; el historial lo integramos después desde /ventas
  const $nombreCliente = $("#nombreCliente");
  if ($nombreCliente) {
    const id = qsp.get("id");
    if (!id) {
      alert("Falta id de cliente");
      location.href = "clientes.html";
      return;
    }
    (async () => {
      try {
        const c = await request(`${API}/clientes/${id}`);
        $nombreCliente.textContent =
          c.nombreCompleto || `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim();
        // TODO: integrar historial real con backend (GET /ventas?clienteId=ID)
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el cliente");
        location.href = "clientes.html";
      }
    })();
  }
});
