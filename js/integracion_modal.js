/**
 * Integración del Modal Antropométrico
 * Este archivo maneja la carga e inicialización del modal
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando integración del modal...');
    
    // Cargar el HTML del modal primero
    loadModalHTML().then(() => {
        // Inicializar el modal después de cargar el HTML
        initModalIntegration();
    });
});

function loadModalHTML() {
    return new Promise((resolve, reject) => {
        // Verificar si el modal ya está cargado
        if (document.getElementById('aiModal')) {
            console.log('Modal ya cargado');
            resolve();
            return;
        }
        
        // Crear contenedor si no existe
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        // Cargar el HTML del modal
        fetch('components/antropometric_modal.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el modal');
                }
                return response.text();
            })
            .then(html => {
                modalContainer.innerHTML = html;
                console.log('HTML del modal cargado correctamente');
                
                // Inicializar el modal después de cargar el HTML
                if (typeof AntropometricModal !== 'undefined') {
                    // Dar tiempo para que el DOM se actualice
                    setTimeout(() => {
                        if (AntropometricModal.init) {
                            AntropometricModal.init();
                        }
                        // También re-configurar referencias
                        if (AntropometricModal.setupDOMReferences) {
                            AntropometricModal.setupDOMReferences();
                        }
                    }, 50);
                }
                
                resolve();
            })
            .catch(error => {
                console.error('Error cargando el modal:', error);
                // Fallback: cargar modal básico si hay error
                loadFallbackModal();
                resolve();
            });
    });
}

function loadFallbackModal() {
    console.log('Cargando modal de fallback...');
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = `
        <div id="aiModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2><i class="fas fa-robot"></i> Análisis & Progreso Corporal</h2>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>Error cargando el módulo de seguimiento. Por favor, recarga la página.</p>
                </div>
            </div>
        </div>
    `;
}

function initModalIntegration() {
    console.log('Inicializando integración del modal...');
    
    // Asegurar que el botón existe
    const openModalBtn = document.getElementById('openAntropometricModalBtn');
    if (!openModalBtn) {
        console.error('Botón openAntropometricModalBtn no encontrado');
        return;
    }
    
    console.log('Botón encontrado:', openModalBtn);
    
    // Remover cualquier listener previo
    const newBtn = openModalBtn.cloneNode(true);
    openModalBtn.parentNode.replaceChild(newBtn, openModalBtn);
    
    // Obtener referencia al nuevo botón
    const freshBtn = document.getElementById('openAntropometricModalBtn');
    
    // Añadir event listener robusto
    freshBtn.addEventListener('click', handleModalOpen, true); // Usar captura
    
    // También prevenir eventos de teclado
    freshBtn.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            handleModalOpen(event);
        }
    });
    
    console.log('Event listeners configurados');
}

function handleModalOpen(event) {
    console.log('handleModalOpen llamado', event);
    
    // Prevenir todo comportamiento por defecto
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Bloquear cualquier evento de formulario
        if (event.target.form) {
            event.target.form._submit_prevented = true;
        }
    }
    
    // Asegurarse de que el modal esté cargado
    const modal = document.getElementById('aiModal');
    if (!modal) {
        console.error('Modal no encontrado en el DOM');
        alert('El módulo de seguimiento no está disponible. Recarga la página.');
        return false;
    }
    
    // Abrir el modal usando la API pública
    if (typeof AntropometricModal !== 'undefined' && AntropometricModal.openModal) {
        AntropometricModal.openModal(event);
    } else {
        // Fallback: abrir modal directamente
        console.log('Abriendo modal directamente...');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Configurar botón cerrar
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                if (typeof AntropometricModal !== 'undefined' && AntropometricModal.closeModal) {
                    AntropometricModal.closeModal();
                } else {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            };
        }
        
        // Cerrar al hacer clic fuera
        modal.onclick = function(e) {
            if (e.target === modal) {
                if (typeof AntropometricModal !== 'undefined' && AntropometricModal.closeModal) {
                    AntropometricModal.closeModal();
                } else {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        };
    }
    
    return false;
}
