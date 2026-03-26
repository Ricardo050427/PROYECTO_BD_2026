document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // ELEMENTOS DEL DOM
    // ==========================================
    const btnAbrir = document.getElementById('btnNuevaReservacion');
    const modal = document.getElementById('modalReservacion');
    const fondoModal = document.getElementById('fondoModal');
    const contenidoModal = document.getElementById('contenidoModal');
    const btnCerrar = document.getElementById('btnCerrarModal');
    const btnCancelar = document.getElementById('btnCancelarModal');

    const selectInicio = document.getElementById('horaInicio');
    const selectFin = document.getElementById('horaFin');
    const inputAsistentes = document.getElementById('inputAsistentes');
    const checkboxesSalas = document.querySelectorAll('.checkbox-sala');
    const alertaCapacidad = document.getElementById('alertaCapacidad');
    const contenedorEventos = document.getElementById('contenedorEventos');

    const toast = document.getElementById('toastNotificacion');
    const toastMensaje = document.getElementById('toastMensaje');
    const btnCerrarToast = document.getElementById('btnCerrarToast');
    let toastTimeout;

    // ==========================================
    // FUNCIONES DEL TOAST (NOTIFICACIÓN DE ERROR)
    // ==========================================
    const mostrarErrorToast = (mensaje) => {
        toastMensaje.textContent = mensaje;
        toast.classList.remove('translate-x-[120%]', 'opacity-0');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => cerrarToast(), 6000);
    };

    const cerrarToast = () => toast.classList.add('translate-x-[120%]', 'opacity-0');
    btnCerrarToast.addEventListener('click', cerrarToast);

    // ==========================================
    // LÓGICA DE HORAS Y VALIDACIÓN DE SALAS
    // ==========================================
    const generarOpcionesHora = (selectElement, inicio, fin) => {
        selectElement.innerHTML = '<option value="" disabled selected>--:--</option>';
        for (let i = inicio; i <= fin; i++) {
            const horaStr = i.toString().padStart(2, '0') + ':00';
            const option = document.createElement('option');
            option.value = horaStr;
            option.textContent = horaStr;
            selectElement.appendChild(option);
        }
    };

    generarOpcionesHora(selectInicio, 7, 19);

    selectInicio.addEventListener('change', (e) => {
        const horaSeleccionada = parseInt(e.target.value.split(':')[0]);
        selectFin.disabled = false;
        selectFin.classList.remove('bg-slate-100', 'text-slate-500');
        selectFin.classList.add('bg-slate-50', 'text-slate-700', 'hover:bg-slate-100');
        generarOpcionesHora(selectFin, horaSeleccionada + 1, 20);
    });

    const validarCapacidad = () => {
        const asistentes = parseInt(inputAsistentes.value) || 0;
        const salasSeleccionadas = Array.from(checkboxesSalas).filter(cb => cb.checked).length;
        const capacidadActual = salasSeleccionadas * 40;

        if (asistentes > capacidadActual && salasSeleccionadas > 0) {
            alertaCapacidad.classList.remove('hidden');
        } else {
            alertaCapacidad.classList.add('hidden');
        }
    };

    inputAsistentes.addEventListener('input', validarCapacidad);
    checkboxesSalas.forEach(cb => cb.addEventListener('change', validarCapacidad));

    // ==========================================
    // CONTROL DEL MODAL
    // ==========================================
    const abrirModal = () => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            fondoModal.classList.remove('opacity-0');
            contenidoModal.classList.remove('opacity-0', 'scale-95');
            contenidoModal.classList.add('opacity-100', 'scale-100');
        }, 10);
    };

    const cerrarModal = () => {
        fondoModal.classList.add('opacity-0');
        contenidoModal.classList.remove('opacity-100', 'scale-100');
        contenidoModal.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('formReservacion').reset();
            selectFin.disabled = true;
            selectFin.classList.add('bg-slate-100', 'text-slate-500');
            selectFin.classList.remove('bg-slate-50', 'text-slate-700', 'hover:bg-slate-100');
            alertaCapacidad.classList.add('hidden');
        }, 300);
    };

    btnAbrir.addEventListener('click', abrirModal);
    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    fondoModal.addEventListener('click', cerrarModal);

    // ==========================================
    // CARGAR Y DIBUJAR EVENTOS DESDE FASTAPI
    // ==========================================
    const cargarReservaciones = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/reservaciones');
            const reservaciones = await response.json();

            const eventosAnteriores = contenedorEventos.querySelectorAll('.evento-dinamico');
            eventosAnteriores.forEach(evento => evento.remove());

            reservaciones.forEach(reserva => {
                const horaInicioNum = parseInt(reserva.hora_inicio.split(':')[0]);
                const horaFinNum = parseInt(reserva.hora_fin.split(':')[0]);

                const topRem = (horaInicioNum - 7) * 10;
                const heightRem = (horaFinNum - horaInicioNum) * 10;

                const minSala = Math.min(...reserva.salas);
                const maxSala = Math.max(...reserva.salas);

                const leftPorcentaje = (minSala - 1) * 33.333;
                const widthPorcentaje = ((maxSala - minSala) + 1) * 33.333;

                let colorClases = "bg-blue-50/95 border-unison-500 hover:bg-blue-100 border-blue-200 text-unison-900";
                let colorBadge = "bg-unison-500";

                if (reserva.acomodo === "auditorio") {
                    colorClases = "bg-emerald-50/95 border-emerald-500 hover:bg-emerald-100 border-emerald-200 text-emerald-900";
                    colorBadge = "bg-emerald-500";
                } else if (reserva.acomodo === "herradura") {
                    colorClases = "bg-amber-50/95 border-amber-500 hover:bg-amber-100 border-amber-200 text-amber-900";
                    colorBadge = "bg-amber-500";
                }

                const divEvento = document.createElement('div');
                divEvento.className = "evento-dinamico absolute p-1.5 z-20 cursor-pointer group overflow-hidden";
                divEvento.style.top = `${topRem}rem`;
                divEvento.style.height = `${heightRem}rem`;
                divEvento.style.left = `${leftPorcentaje}%`;
                divEvento.style.width = `${widthPorcentaje}%`;

                // Etiquetas mucho más compactas para asegurar que quepan en 2 renglones
                const reqHtml = reserva.requerimientos.map(req =>
                    `<span class="bg-white/80 text-[9px] px-1.5 py-0.5 rounded border shadow-sm font-semibold whitespace-nowrap">${req}</span>`
                ).join('');

                divEvento.innerHTML = `
                    <div class="h-full w-full border-l-4 rounded-xl p-2 flex flex-col shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 border ${colorClases}">
                        
                        <div class="flex justify-between items-start gap-2">
                            <p class="text-sm font-extrabold leading-tight truncate">${reserva.evento}</p>
                            <span class="text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-sm shrink-0 ${colorBadge}">${reserva.asistentes} PAX</span>
                        </div>
                        
                        <div class="mt-1 flex flex-col gap-0.5">
                            <p class="text-[10px] font-bold opacity-80 leading-tight truncate">Req: ${reserva.solicitante}</p>
                            <div class="flex items-center gap-2">
                                <p class="text-[10px] font-bold opacity-80 leading-tight">${reserva.acomodo.charAt(0).toUpperCase() + reserva.acomodo.slice(1)}</p>
                                <span class="text-[9px] font-bold bg-white/70 px-1.5 py-0.5 rounded-md text-slate-700">${reserva.hora_inicio} - ${reserva.hora_fin}</span>
                            </div>
                        </div>
                        
                        <div class="mt-auto pt-1.5 border-t border-slate-200/50">
                            <div class="flex gap-1 flex-wrap items-center">
                                ${reqHtml}
                            </div>
                        </div>
                    </div>
                `;

                contenedorEventos.appendChild(divEvento);
            });
        } catch (error) {
            console.error("Error al cargar las reservaciones:", error);
        }
    };

    cargarReservaciones();

    // ==========================================
    // ENVIAR DATOS (POST) AL GUARDAR
    // ==========================================
    const form = document.getElementById('formReservacion');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const salasSeleccionadas = Array.from(checkboxesSalas).filter(cb => cb.checked).map(cb => parseInt(cb.value));
        if (salasSeleccionadas.length === 0) {
            const contenedorSalas = document.querySelector('.grid-cols-3.gap-3').parentElement;
            contenedorSalas.classList.add('animate-pulse', 'border-red-500');
            setTimeout(() => contenedorSalas.classList.remove('animate-pulse', 'border-red-500'), 1000);
            return;
        }

        const checkboxesReq = form.querySelectorAll('.grid-cols-2.md\\:grid-cols-4.gap-3 input[type="checkbox"]');
        const nombresReq = ["Coffeebreak", "Extensiones", "Eq. Sonido", "Videoconferencia"];
        const requerimientosSeleccionados = [];
        checkboxesReq.forEach((cb, index) => {
            if(cb.checked) requerimientosSeleccionados.push(nombresReq[index]);
        });

        const inputsTexto = form.querySelectorAll('input[type="text"]');
        const selects = form.querySelectorAll('select');

        const payload = {
            solicitante: inputsTexto[0].value,
            evento: inputsTexto[1].value,
            fecha: form.querySelector('input[type="date"]').value,
            hora_inicio: selects[0].value,
            hora_fin: selects[1].value,
            asistentes: parseInt(inputAsistentes.value),
            acomodo: selects[2].value,
            salas: salasSeleccionadas,
            requerimientos: requerimientosSeleccionados
        };

        const btnGuardar = document.getElementById('btnGuardarSubmit');
        const textoOriginal = btnGuardar.innerHTML;

        try {
            btnGuardar.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Guardando...';
            btnGuardar.disabled = true;

            const response = await fetch('http://127.0.0.1:8000/api/reservaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                btnGuardar.classList.add('btn-success');
                btnGuardar.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span> ¡Reservado!';

                setTimeout(() => {
                    btnGuardar.classList.remove('btn-success');
                    btnGuardar.innerHTML = textoOriginal;
                    btnGuardar.disabled = false;
                    cerrarModal();
                    cargarReservaciones();
                }, 1200);
            } else {
                const errorData = await response.json();
                mostrarErrorToast(errorData.detail);

                contenidoModal.classList.add('animate-pulse', 'border-red-500');
                setTimeout(() => contenidoModal.classList.remove('animate-pulse', 'border-red-500'), 500);

                btnGuardar.innerHTML = textoOriginal;
                btnGuardar.disabled = false;
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            mostrarErrorToast("No se pudo conectar con el servidor. Revisa tu conexión.");
            btnGuardar.innerHTML = textoOriginal;
            btnGuardar.disabled = false;
        }
    });
});