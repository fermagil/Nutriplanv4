import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyChC7s5NN-z-dSjqeXDaks7gaNaVCJAu7Q",
    authDomain: "nutriplanv2.firebaseapp.com",
    projectId: "nutriplanv2",
    storageBucket: "nutriplanv2.firebasestorage.app",
    messagingSenderId: "653707489758",
    appId: "1:653707489758:web:9133d1d1620825c385ed4f",
    measurementId: "G-NWER69E8B6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // 🔥 Inicializa Firestore
const provider = new GoogleAuthProvider();

// --- NUEVAS FUNCIONES PARA MANEJAR CARGA ---
function showLoading() {
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('main-ui-container').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading-container').style.display = 'none';
    // No mostrar main-ui-container aquí, déjalo como está. Se mostrará después si es necesario.
}

// Función que simula una espera visual (no bloquea el hilo principal)
function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
// --- FIN NUEVAS FUNCIONES ---


async function signInWithGoogle() {
    try {
        console.log('Initiating signInWithPopup');
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        console.log('Popup result:', result.user.displayName, result.user.email, result.user.uid);
        showSelectionContainer();
    } catch (error) {
        console.error('Sign-in error:', error.code, error.message, error);
        let errorMessage;
        switch (error.code) {
            case 'auth/unauthorized-domain':
                errorMessage = 'Dominio no autorizado. Contacta al administrador o verifica la configuración de Firebase.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de red. Verifica tu conexión e intenta de nuevo.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'El inicio de sesión fue bloqueado por el navegador. Permite las ventanas emergentes.';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = 'Ventana de inicio de sesión cerrada por el usuario.';
                break;
            default:
                errorMessage = `Error al iniciar sesión: ${error.message}`;
        }
        showError(errorMessage);
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginContainer = document.getElementById('login-container');

    const existingError = document.getElementById('login-error');
    if (existingError) existingError.remove();

    if (!email || !password) {
        showError('Por favor, ingrese email y contraseña');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        showSuccess('Inicio de sesión exitoso');
        showSelectionContainer();
    } catch (error) {
        console.error('Email login error:', error.code, error.message, error);
        let errorMessage;
        switch (error.code) {
            case 'auth/unauthorized-domain':
                errorMessage = 'Dominio no autorizado. Contacta al administrador o verifica la configuración de Firebase.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Correo electrónico inválido.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Correo o contraseña incorrectos.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta cuenta ha sido deshabilitada.';
                break;
            default:
                errorMessage = `Error al iniciar sesión: ${error.message}`;
        }
        showError(errorMessage);
    }
}

async function logout() {
    try {
        await signOut(auth);
        console.log('Sesión cerrada');
        // Mostrar indicador de carga antes de redirigir
        showLoading();
        // Esperar 3 segundos visualmente
        (async () => {
            await wait(3);
            window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
        })();
    } catch (error) {
        console.error('Error al cerrar sesión:', error.code, error.message, error);
        showError('Error al cerrar sesión: ' + error.message);
        // Opcional: ocultar loading si hay error
        hideLoading();
    }
}

function showError(message) {
    const loginContainer = document.getElementById('login-container');
    const errorDiv = document.createElement('div');
    errorDiv.id = 'login-error';
    errorDiv.style.color = 'red';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.fontSize = '14px';
    errorDiv.textContent = message;
    loginContainer.insertBefore(errorDiv, loginContainer.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const loginContainer = document.getElementById('login-container');
    const successDiv = document.createElement('div');
    successDiv.style.color = 'green';
    successDiv.style.marginBottom = '10px';
    successDiv.style.fontSize = '14px';
    successDiv.textContent = message;
    loginContainer.insertBefore(successDiv, loginContainer.firstChild);
    setTimeout(() => successDiv.remove(), 3000);
}

function showSelectionContainer() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('selection-container').style.display = 'block';
}




function initializeUI() {
    document.getElementById('logo').addEventListener('click', function (event) {
        event.preventDefault();
        const dropdown = document.getElementById('dropdown');
        const user = auth.currentUser;
        if (user) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    });

    document.addEventListener('click', function (event) {
        const dropdown = document.getElementById('dropdown');
        const logo = document.getElementById('logo');
        if (!logo.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    document.getElementById('email-login-btn').addEventListener('click', login);
    document.getElementById('login-btn').addEventListener('click', signInWithGoogle);

    window.logout = logout;
}

onAuthStateChanged(auth, (user) => {
    const loginContainer = document.getElementById('login-container');
    const selectionContainer = document.getElementById('selection-container');
    const dropdown = document.getElementById('dropdown');
    if (user) {
        console.log('Auth state: User signed in', user.displayName, user.email);
        // 🔥 Verificar el rol del usuario en Firestore
        // Mostrar indicador de carga mientras se verifica el rol
        showLoading();
        // Esperar 3 segundos visualmente antes de verificar el rol
        (async () => {
            await wait(3);
            checkUserRole(user.uid); // Llama a la función que maneja la lógica de rol y redirección
        })();

    } else {
        console.log('Auth state: No user signed in');
        if (!window.location.pathname.includes('index.html')) {
            // Si no estás en index.html y no hay usuario, redirige
            // Si no estás en index.html y no hay usuario, redirige
            showLoading(); // Mostrar carga antes de redirigir
            (async () => {
                await wait(3); // Espera visual de 3 segundos
                window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
            })();
            return;
        } else {
            // Estás en index.html y no hay usuario -> mostrar login
            // Ocultar loading y mostrar UI principal
            hideLoading();
            loginContainer.style.display = 'block';
            selectionContainer.style.display = 'none';
            dropdown.style.display = 'none';
            // Asegurarse de que la UI principal esté visible
            document.getElementById('main-ui-container').style.display = 'block';
        }
    }
});

// 🔥 Nueva función para verificar rol
async function checkUserRole(userId) {
    try {
        const userDocRef = doc(db, "usuarios", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const rol = userData.rol || 'registrado'; // Por defecto, asume registrado

            if (rol === 'salud_escolar') {
                // 🔥 Redirigir directamente a salud escolar
                // Esperar 3 segundos visualmente antes de redirigir
                (async () => {
                    await wait(3);
                    window.location.href = 'salud-escolar.html';
                    // No es necesario llamar a hideLoading aquí, la página se va
                    return;
                })();
                return;
            } else {
                // Mostrar menú de selección
                // Ocultar loading
                hideLoading();
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('selection-container').style.display = 'block';
                // Asegurarse de que la UI principal esté visible
                document.getElementById('main-ui-container').style.display = 'block';
            }
        } else {
            // Si no existe el documento, asume rol "registrado"
            // Ocultar loading
            hideLoading();
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('selection-container').style.display = 'block';
            // Asegurarse de que la UI principal esté visible
            document.getElementById('main-ui-container').style.display = 'block';
        }

    } catch (error) {
        console.error("Error obteniendo rol del usuario:", error);
        // Ocultar loading
        hideLoading();
        // En caso de error, mostrar menú de selección
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('selection-container').style.display = 'block';
        // Asegurarse de que la UI principal esté visible
        document.getElementById('main-ui-container').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', initializeUI);
