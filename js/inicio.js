
// Ensure Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Ensure firebase-app.js and firebase-auth.js are included in the <head>.');
    var errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    // Logic about reporting this to UI was cut off in original, assuming simple log + check is enough.
}

// Global logout function
window.logout = function () {
    if (typeof auth === 'undefined') {
        console.error("Auth not initialized");
        return;
    }
    auth.signOut().then(function () {
        console.log("Signed out");
        window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
    }).catch(function (error) {
        console.error('Error al cerrar sesión:', error.code, error.message);
        var main = document.querySelector('main');
        var errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.marginBottom = '10px';
        errorDiv.style.fontSize = '14px';
        errorDiv.textContent = 'Error al cerrar sesión: ' + error.message;
        if (main) {
            main.insertBefore(errorDiv, main.firstChild);
            setTimeout(function () { errorDiv.remove(); }, 5000);
        } else {
            alert('Error al cerrar sesión: ' + error.message);
        }
    });
};

// Initialize UI
function initializeUI() {
    var logo = document.getElementById('logo');
    var dropdown = document.getElementById('dropdown');

    if (logo) {
        logo.addEventListener('click', function (event) {
            event.preventDefault();
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }

    document.addEventListener('click', function (event) {
        if (logo && dropdown && !logo.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Handle auth state
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(function (user) {
        var dropdown = document.getElementById('dropdown');
        if (user) {
            console.log('Auth state: User signed in', user.displayName, user.email);
            if (dropdown) dropdown.style.display = 'none'; // Initially hidden
        } else {
            console.log('Auth state: No user signed in');
            window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeUI);

// Función para manejar clicks en tabs
window.openTab = function (event, tabId) {
    const clickedButton = event.currentTarget;
    const tabToToggle = document.getElementById(tabId);

    // Safety check
    if (!tabToToggle) return;

    const isAlreadyActive = clickedButton.classList.contains("active");

    // Ocultar todos los tabs y desactivar botones
    const tabContents = document.getElementsByClassName("tab-content");
    const tabButtons = document.getElementsByClassName("tab-button");

    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Mostrar solo si no estaba activo
    if (!isAlreadyActive) {
        tabToToggle.style.display = "block";
        clickedButton.classList.add("active");
    }
};

// Inicialización de tabs: asegurar que todo esté oculto al cargar
document.addEventListener("DOMContentLoaded", function () {
    const tabContents = document.getElementsByClassName("tab-content");
    const tabButtons = document.getElementsByClassName("tab-button");

    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }
});
