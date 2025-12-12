// Ensure Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Ensure firebase-app.js and firebase-auth.js are included in the <head>.');
    var errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = 'Error: No se pudo cargar Firebase. Contacta al administrador.';
    document.querySelector('main').insertBefore(errorDiv, document.querySelector('main').firstChild);
} else {
    // Firebase initialized in firebase-config.js
    var auth = firebase.auth();

    // Logout
    function logout() {
        auth.signOut().then(function () {
            console.log('Sesión cerrada');
            window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
        }).catch(function (error) {
            console.error('Error al cerrar sesión:', error.code, error.message);
            var main = document.querySelector('main');
            var errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.marginBottom = '10px';
            errorDiv.style.fontSize = '14px';
            errorDiv.textContent = 'Error al cerrar sesión: ' + error.message;
            main.insertBefore(errorDiv, main.firstChild);
            setTimeout(function () { errorDiv.remove(); }, 5000);
        });
    }

    // Initialize UI
    function initializeUI() {
        document.getElementById('logo').addEventListener('click', function (event) {
            event.preventDefault();
            var dropdown = document.getElementById('dropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function (event) {
            var dropdown = document.getElementById('dropdown');
            var logo = document.getElementById('logo');
            if (!logo.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });

        window.logout = logout;
    }

    // Handle auth state
    auth.onAuthStateChanged(function (user) {
        var dropdown = document.getElementById('dropdown');
        if (user) {
            console.log('Auth state: User signed in', user.displayName, user.email);
            if (dropdown) dropdown.style.display = 'none'; // Initially hidden, shown on logo click
        } else {
            console.log('Auth state: No user signed in');
            window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
        }
    });

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initializeUI);
}
