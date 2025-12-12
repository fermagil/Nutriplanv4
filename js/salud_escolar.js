import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyChC7s5NN-z-dSjqeXDaks7gaNaVCJAu7Q",
    authDomain: "nutriplanv2.firebaseapp.com",
    projectId: "nutriplanv2",
    appId: "1:653707489758:web:9133d1d1620825c385ed4f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Verificar estado de autenticación y rol
onAuthStateChanged(auth, async (user) => {
    const container = document.getElementById('secciones-container');
    const logo = document.getElementById('logo');

    if (user) {
        // Obtener el token con claims
        const token = await user.getIdTokenResult();
        if (token.claims.rol === "salud_escolar") {
            // ✅ Usuario autorizado: mostrar contenido normal
            container.style.display = 'block';
            logo.style.display = 'block';
        } else {
            // ❌ Usuario autenticado pero sin rol → redirigir
            alert("Acceso denegado: no tienes permisos de Salud Escolar.");
            signOut(auth).then(() => {
                window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
            });
        }
    } else {
        // ❌ No autenticado → redirigir al login
        window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
    }
});

// Función de cierre de sesión
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
    });
};

// Dropdown (solo se muestra si el contenido está visible)
document.getElementById('logo').addEventListener('click', function (event) {
    event.preventDefault();
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('dropdown');
    const logo = document.getElementById('logo');
    if (!logo.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Esperar a que todo el contenido (DOM, imágenes, etc.) esté cargado
window.addEventListener('load', function () {
    // Opcional: agregar un pequeño delay para asegurar renderizado
    setTimeout(function () {
        // Ocultar el spinner de carga
        const spinner = document.getElementById('loading-spinner-fullpage');
        if (spinner) {
            spinner.style.opacity = '0';
            // Esperar a que termine la transición de opacidad antes de ocultarlo por completo
            setTimeout(function () {
                spinner.style.display = 'none';
            }, 300); // Debe coincidir con la duración de la transición CSS si la hay, o un valor pequeño
        }

        // Mostrar el contenido principal
        const mainContent = document.getElementById('main-content-salud-escolar');
        if (mainContent) {
            mainContent.style.display = 'block';
            // Opcional: añadir una clase para un efecto de fade-in suave
            mainContent.classList.add('loaded');
        }
    }, 100); // 100ms de delay opcional
});
// En salud-escolar.html
document.addEventListener('DOMContentLoaded', function () {
    // Opcional: Pequeño delay para asegurar que el CSS se haya aplicado
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 10); // 10ms es suficiente
});
