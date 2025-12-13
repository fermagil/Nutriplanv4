/**
 * Integración del Modal Antropométrico con la página de Valoración
 * Este archivo maneja la integración específica en Valoracion_Antropometrica_1.html
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el modal antropométrico
    AntropometricModal.init();
    
    // Manejar el botón de apertura del modal
    const openModalBtn = document.getElementById('openAntropometricModalBtn');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            AntropometricModal.openModal(event);
            
            // Evitar que otros botones se activen
            return false;
        }, true); // Usar captura para prevenir otros eventos
    }
    
    // También puedes prevenir el comportamiento si el botón está dentro de un formulario
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Si el evento fue disparado por nuestro botón, prevenir el submit
            if (e.submitter && e.submitter.id === 'openAntropometricModalBtn') {
                e.preventDefault();
                return false;
            }
        });
    });
    
    // Si hay un botón "Calcular Resultados", asegurarnos que no interfiera
    const calcularBtn = document.querySelector('button[type="submit"], button:contains("Calcular")');
    if (calcularBtn) {
        calcularBtn.addEventListener('click', function(e) {
            // Solo dejar que este botón ejecute su acción si no es nuestro botón del modal
            if (e.target.id !== 'openAntropometricModalBtn') {
                return;
            }
        });
    }
    
    // Prevenir doble clic en el botón del modal
    let modalButtonClicked = false;
    if (openModalBtn) {
        openModalBtn.addEventListener('click', function() {
            if (modalButtonClicked) {
                event.preventDefault();
                return;
            }
            modalButtonClicked = true;
            setTimeout(() => {
                modalButtonClicked = false;
            }, 1000);
        });
    }
});