// ============================================
// Ficha Médica Deportiva - Modal Functions
// ============================================

/**
 * Fetch and populate Ficha Médica modal with client data from Firestore
 */
async function populateFichaMedicaFromFirestore() {
    // Get current client ID from global variable (set by app.js)
    const clienteId = window.currentClienteId;

    if (!clienteId) {
        console.warn('⚠️ No client selected, cannot load Ficha Médica');
        mostrarNotificacion('⚠️ Selecciona un cliente primero');
        return;
    }

    try {
        // Show loading indicator
        mostrarNotificacion('🔄 Cargando datos del cliente...');

        // Fetch data from Firestore using app.js function
        const fichaMedicaData = await window.fetchFichaMedica(clienteId);

        if (!fichaMedicaData) {
            console.error('❌ Failed to fetch Ficha Médica');
            mostrarNotificacion('❌ Error al cargar datos');
            return;
        }

        // Get the form
        const form = document.getElementById('form-datos-paciente');
        if (!form) {
            console.error('❌ Form not found');
            return;
        }

        // 1. Populate "Id Cliente" field (composite: ID + Name)
        const idClienteField = form.querySelector('#idCliente') ||
            form.querySelector('[name="idCliente"]');
        if (idClienteField) {
            const displayValue = `${fichaMedicaData.id} - ${fichaMedicaData.nombreCliente || 'Sin nombre'}`;
            idClienteField.value = displayValue;
            idClienteField.readOnly = true; // Make it readonly
        }

        // 2. Populate all other form fields
        for (const [fieldName, value] of Object.entries(fichaMedicaData)) {
            // Skip metadata fields
            if (['id', 'idCliente', 'fechaActualizacion', 'lastModified'].includes(fieldName)) {
                continue;
            }

            // Find the field in the form
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) {
                // Field not found, might be okay (not all Firestore fields map to form fields)
                continue;
            }

            // Populate based on field type
            populateField(field, value, fieldName, form);
        }

        console.log('✅ Ficha Médica populated successfully');
        mostrarNotificacion('✅ Datos cargados correctamente');

    } catch (error) {
        console.error('❌ Error populating Ficha Médica:', error);
        mostrarNotificacion('❌ Error al cargar los datos');
    }
}

/**
 * Helper function to populate a single field based on its type
 */
function populateField(field, value, fieldName, form) {
    if (!field || value === undefined || value === null) return;

    const fieldType = field.type || field.tagName.toLowerCase();

    switch (fieldType) {
        case 'radio':
            // For radio buttons, find and check the matching value
            const radioButton = form.querySelector(`[name="${fieldName}"][value="${value}"]`);
            if (radioButton) radioButton.checked = true;
            break;

        case 'checkbox':
            // For checkboxes
            field.checked = (value === true || value === 'on' || value === 'yes' || value === 1);
            break;

        case 'select-one':
        case 'select-multiple':
            // For select dropdowns
            if (field.options) {
                for (let i = 0; i < field.options.length; i++) {
                    if (field.options[i].value === String(value)) {
                        field.selectedIndex = i;
                        break;
                    }
                }
            }
            break;

        case 'textarea':
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
        case 'date':
        default:
            // For text inputs, textareas, etc.
            field.value = value;
            break;
    }
}

/**
 * Modified openModal function to load data from Firestore
 */
async function openModal(event) {
    if (event) event.stopPropagation();

    // Open the modal
    const modal = new bootstrap.Modal(document.getElementById("commitModal"));
    modal.show();

    // Fetch and populate ficha médica data from Firestore
    await populateFichaMedicaFromFirestore();
}

/**
 * Modified guardarDatos function to save to Firestore
 */
async function guardarDatos(event) {
    event.preventDefault();

    const form = document.getElementById("form-datos-paciente");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const clienteId = window.currentClienteId;

    if (!clienteId) {
        mostrarNotificacion('❌ No hay cliente seleccionado');
        return;
    }

    try {
        // Show saving indicator
        mostrarNotificacion('💾 Guardando datos...');

        // Save to Firestore
        await window.saveFichaMedica(clienteId, data);

        // Also save to localStorage as backup
        localStorage.setItem("fichaMedica", JSON.stringify(data));

        mostrarNotificacion('✅ Datos guardados correctamente');

        // Close modal after successful save
        setTimeout(() => {
            closeModal();
        }, 1500);

    } catch (error) {
        console.error('Error saving:', error);
        mostrarNotificacion('❌ Error al guardar los datos');
    }
}

/**
 * Modified closeModal function with Firestore delete option
 */
async function closeModal(event) {
    const hasData = localStorage.getItem("fichaMedica");

    if (hasData && confirm("¿Deseas borrar los datos guardados localmente?")) {
        const clienteId = window.currentClienteId;

        // Ask if they also want to delete from Firestore
        if (clienteId && confirm("¿También borrar de la nube (Firestore)?")) {
            try {
                await window.deleteFichaMedica(clienteId);
                mostrarNotificacion("✅ Datos eliminados de la nube");
            } catch (error) {
                console.error('Error deleting from Firestore:', error);
                mostrarNotificacion("⚠️ Error al eliminar de la nube");
            }
        }

        localStorage.removeItem("fichaMedica");
        mostrarNotificacion("✅ Datos locales eliminados");
    }

    const bsModal = bootstrap.Modal.getInstance(document.getElementById("commitModal"));
    if (bsModal) bsModal.hide();
}

/**
 * Helper function for notifications (if not already in valoracion_antropometrica.js)
 */
function mostrarNotificacion(mensaje) {
    const notif = document.getElementById("save-notification");
    if (!notif) return;

    notif.textContent = mensaje;
    notif.classList.remove("hidden");

    setTimeout(() => {
        notif.classList.add("hidden");
    }, 3000);
}

// Export functions for global access
window.openModal = openModal;
window.guardarDatos = guardarDatos;
window.closeModal = closeModal;
window.populateFichaMedicaFromFirestore = populateFichaMedicaFromFirestore;
