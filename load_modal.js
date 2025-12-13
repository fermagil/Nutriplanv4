// Cargar dinámicamente el modal en la página
document.addEventListener('DOMContentLoaded', function() {
    // Crear contenedor para el modal
    const modalContainer = document.getElementById('antropometricModalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'antropometricModalContainer';
        document.body.appendChild(modalContainer);
    }
    
    // Cargar el HTML del modal usando fetch
    fetch('components/antropometric_modal.html')
        .then(response => response.text())
        .then(html => {
            modalContainer.innerHTML = html;
            
            // Inicializar el modal después de cargar el HTML
            setTimeout(() => {
                if (typeof AntropometricModal !== 'undefined') {
                    AntropometricModal.init();
                }
            }, 100);
        })
        .catch(error => {
            console.error('Error cargando el modal:', error);
        });
});