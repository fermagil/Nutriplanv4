// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { setupCalculationsUI } from './js/modules/calculations-ui.js';


// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyChC7s5NN-z-dSjqeXDaks7gaNaVCJAu7Q",
    authDomain: "nutriplanv2.firebaseapp.com",
    projectId: "nutriplanv2",
    storageBucket: "nutriplanv2.firebasestorage.app",
    messagingSenderId: "653707489758",
    appId: "1:653707489758:web:9133d1d1620825c385ed4f",
    measurementId: "G-NWER69E8B6"
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

// Initialize Firestore, Auth, and Provider
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize EmailJS
// Initialize EmailJS cuando el script esté cargado
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init("1S-5omi_qgflXcLhD");
        console.log('EmailJS inicializado con éxito');
    } else {
        console.error('EmailJS no está definido. Verifica la carga de email.min.js');
    }
});

// Debug Chart.js and plugin loading
console.log('Checking Chart.js:', typeof Chart);
console.log('Checking ChartDataLabels:', typeof ChartDataLabels);
console.log('Checking ChartAnnotation:', typeof ChartAnnotation);

// Register Chart.js plugins
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined' && typeof ChartAnnotation !== 'undefined') {
    Chart.register(ChartDataLabels, ChartAnnotation);
    console.log('Chart.js plugins registered successfully');
} else {
    console.error('Chart.js, ChartDataLabels, or ChartAnnotation not loaded. Check CDN scripts in HTML.');
}

let currentClienteId = null;
let currentUser = null;
let currentTomaData = null; // Nueva variable para almacenar datos de la toma actual

// Exportar instancias para uso en otros módulos
export { app, db, auth, provider };

// Logout
export async function logout() {
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
        const dropdown = document.getElementById('dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', function (event) {
        const dropdown = document.getElementById('dropdown');
        const logo = document.getElementById('logo');
        if (!logo.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Initialize calculation logic
    setupCalculationsUI();


    // Initialize Ver Progreso button
    const verProgresoBtn = document.getElementById('ver-progreso-btn');
    if (verProgresoBtn) {
        verProgresoBtn.style.display = 'none';
        verProgresoBtn.addEventListener('click', async () => {
            if (currentClienteId) {
                await showProgressCharts(currentClienteId);
            } else {
                alert('Por favor, selecciona un cliente primero.');
            }
        });
    } else {
        console.error('Botón Ver Progreso no encontrado en el DOM durante inicialización');
    }

    // Initialize Enviar Email button
    const enviarEmailBtn = document.getElementById('mail-btn');
    if (enviarEmailBtn) {
        enviarEmailBtn.style.display = 'none';
        enviarEmailBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent form submission
            console.log('Email button clicked, processing email only, event:', { targetId: e.target.id, form: e.target.form });
            if (!currentUser) {
                alert('Por favor, inicia sesión para enviar un correo electrónico.');
                return;
            }
            const nombreInput = document.getElementById('nombre');
            const emailInput = document.getElementById('e-mail');
            if (!nombreInput || !emailInput) {
                console.error('Input elements not found:', { nombreInput, emailInput });
                alert('Error: No se encontraron los campos de nombre o email en el formulario.');
                return;
            }
            const nombre = nombreInput.value.trim();
            const email = emailInput.value.trim();
            console.log('Attempting to send email:', { nombre, email });
            if (!nombre || !email) {
                alert('Por favor, completa los campos de nombre y email.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, introduce un email válido.');
                return;
            }
            let mensaje;
            if (currentTomaData && currentClienteId) {
                // Format date and time
                const fechaRegistro = currentTomaData.fecha && currentTomaData.fecha.toDate ?
                    currentTomaData.fecha.toDate().toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'No disponible';

                // Calculate BMI
                const alturaMetros = currentTomaData.altura ? currentTomaData.altura / 100 : null;
                const bmi = alturaMetros && currentTomaData.peso ? (currentTomaData.peso / (alturaMetros * alturaMetros)).toFixed(1) : null;

                // Health assessment
                let valoracion = '';
                const esHombre = currentTomaData.genero === 'Masculino';
                const esDeportista = currentTomaData.es_deportista &&
                    currentTomaData.es_deportista.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'si';
                console.log('Athlete status:', {
                    es_deportista_raw: currentTomaData.es_deportista,
                    esDeportista: esDeportista,
                    caseInsensitiveMatch: currentTomaData.es_deportista &&
                        currentTomaData.es_deportista.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'si'
                });
                const grasaAlta = currentTomaData.resultados?.grasaPctActual && (
                    (esHombre && currentTomaData.resultados.grasaPctActual > 25) ||
                    (!esHombre && currentTomaData.resultados.grasaPctActual > 32)
                );
                const bmiAlto = bmi && bmi >= 25;

                if (grasaAlta || bmiAlto) {
                    if (esDeportista) {
                        valoracion = `
                                            **Evaluación**: Tus resultados muestran un porcentaje de grasa corporal o peso por encima de los rangos óptimos para un deportista. Esto puede afectar tu rendimiento, resistencia y recuperación en tu disciplina. **Es crucial optimizar tu composición corporal** para maximizar tus resultados deportivos. Te recomendamos un plan nutricional específico para atletas y un programa de entrenamiento personalizado. ¡Contáctanos hoy mismo para impulsar tu rendimiento!
                                        `;
                    } else {
                        valoracion = `
                                            **Evaluación**: Tus resultados indican que tu peso o porcentaje de grasa corporal están por encima de los rangos saludables, lo que puede aumentar el riesgo de problemas de salud como enfermedades cardiovasculares. **Es urgente tomar medidas** para mejorar tu bienestar. Te recomendamos trabajar con nosotros en un plan nutricional personalizado y un programa de ejercicio para normalizar estos valores. ¡Contáctanos hoy mismo para comenzar!
                                        `;
                    }
                } else if (bmi && bmi < 18.5) {
                    if (esDeportista) {
                        valoracion = `
                                            **Evaluación**: Tu índice de masa corporal está por debajo del rango ideal para un deportista, lo que puede limitar tu fuerza, energía y capacidad de entrenamiento. Para mejorar tu rendimiento, es esencial aumentar tu masa muscular y optimizar tu nutrición. Contáctanos para diseñar un plan de alimentación de alto rendimiento y un programa de entrenamiento de fuerza.
                                        `;
                    } else {
                        valoracion = `
                                            **Evaluación**: Tu índice de masa corporal está por debajo del rango saludable, lo que puede indicar bajo peso y riesgos como un sistema inmunológico debilitado. Para proteger tu salud, es importante establecer un plan nutricional que te ayude a alcanzar un peso adecuado. Contáctanos para diseñar un programa que incluya una dieta equilibrada y ejercicios de fortalecimiento.
                                        `;
                    }
                } else {
                    if (esDeportista) {
                        valoracion = `
                                            **Evaluación**: ¡Enhorabuena! Tus resultados están en rangos óptimos para un deportista. Para seguir mejorando tu rendimiento y alcanzar tus metas deportivas, te recomendamos ajustar tu nutrición y entrenamiento según tus objetivos específicos. Contáctanos para personalizar un plan que optimice tu recuperación, fuerza y resistencia.
                                        `;
                    } else {
                        valoracion = `
                                            **Evaluación**: ¡Felicidades! Tus resultados están dentro de rangos saludables. Para mantener tu bienestar, te recomendamos seguir con una dieta equilibrada y un estilo de vida activo. Si deseas optimizar aún más tus objetivos, contáctanos para personalizar tu plan de nutrición y ejercicio.
                                        `;
                    }
                }

                mensaje = `
                                    ¡Hola ${nombre}!
                    
                                    Bienvenid@ a NutriPlan, tu aliado para la salud. Estamos emocionados de acompañarte.
                                    Tu último chequeo del día ${fechaRegistro} incluyó:
                    
                                    **Datos Generales**:
                                    - Peso: ${currentTomaData.peso || 'No disponible'} kg (Fuente: Medición directa con báscula)
                                    - Altura: ${currentTomaData.altura || 'No disponible'} cm (Fuente: Medición directa con estadiómetro)
                                    - Índice de Masa Corporal (IMC): ${bmi || 'No disponible'} (Fuente: Calculado como peso / altura²)
                                    - Porcentaje de Grasa Actual: ${currentTomaData.resultados?.grasaPctActual || 'No disponible'}% (Fuente: ${currentTomaData.grasa_actual_conocida ? 'Estimación proporcionada' : 'Medición de pliegues cutáneos o bioimpedancia'})
                                    - Peso Objetivo: ${currentTomaData.resultados?.pesoObjetivo || 'No disponible'} kg (Fuente: Calculado según objetivos personales)
                    
                                    **Pliegues Cutáneos** (Fuente: Medición con calibrador):
                                    - Tricipital: ${currentTomaData.medidas?.pliegues?.tricipital || 'No disponible'} mm
                                    - Subescapular: ${currentTomaData.medidas?.pliegues?.subescapular || 'No disponible'} mm
                                    - Suprailiaco: ${currentTomaData.medidas?.pliegues?.suprailiaco || 'No disponible'} mm
                                    - Bicipital: ${currentTomaData.medidas?.pliegues?.bicipital || 'No disponible'} mm
                                    - Pantorrilla: ${currentTomaData.medidas?.pliegues?.pantorrilla || 'No disponible'} mm
                    
                                    **Circunferencias** (Fuente: Medición con cinta métrica):
                                    - Cintura: ${currentTomaData.medidas?.circunferencias?.cintura || 'No disponible'} cm
                                    - Cadera: ${currentTomaData.medidas?.circunferencias?.cadera || 'No disponible'} cm
                                    - Cuello: ${currentTomaData.medidas?.circunferencias?.cuello || 'No disponible'} cm
                                    - Pantorrilla: ${currentTomaData.medidas?.circunferencias?.pantorrilla || 'No disponible'} cm
                                    - Brazo: ${currentTomaData.medidas?.circunferencias?.brazo || 'No disponible'} cm
                                    - Brazo Contraído: ${currentTomaData.medidas?.circunferencias?.brazo_contraido || 'No disponible'} cm
                    
                                    **Diámetros Óseos** (Fuente: Medición con calibrador):
                                    - Húmero: ${currentTomaData.medidas?.diametros?.humero || 'No disponible'} cm
                                    - Fémur: ${currentTomaData.medidas?.diametros?.femur || 'No disponible'} cm
                                    - Muñeca: ${currentTomaData.medidas?.diametros?.muneca || 'No disponible'} cm
                    
                                    ${valoracion}
                    
                                    Revisa tu plan con nosotros enviando un correo electrónico para pedir cita a soporte@nutriplan.com.
                                    Contáctanos en soporte@nutriplan.com para soporte.
                    
                                    ¡Gracias por elegir NutriPlan!
                                    El equipo de NutriPlan
                                `;
            } else {
                mensaje = `
                                    ¡Hola ${nombre}!
                    
                                    Bienvenid@ a NutriPlan, tu plataforma para una vida más saludable. Estamos encantados de tenerte con nosotros.
                                    En NutriPlan, ofrecemos herramientas y recursos para ayudarte a alcanzar tus objetivos de nutrición y bienestar.
                                    Explora nuestras funcionalidades, crea tu plan personalizado y comienza tu viaje hacia una mejor versión de ti mism@.
                    
                                    Si tienes alguna pregunta o necesita ayuda, por favor contáctanos en soporte@nutriplan.com.
                    
                                    ¡Gracias por unirte!
                                    El equipo de NutriPlan
                                `;
            }
            const templateParams = {
                from_name: 'NutriPlan Team',
                from_email: 'no-reply@nutriplan.com',
                message: mensaje,
                email: email
            };
            console.log('EmailJS templateParams:', JSON.stringify(templateParams, null, 2));
            enviarEmailBtn.value = 'Enviando...';
            try {
                const response = await emailjs.send('service_hsxp598', 'template_lf5a4xh', templateParams);
                console.log('Email enviado con éxito:', response);
                alert('¡Email de bienvenida enviado con éxito!');

                await addDoc(collection(db, 'emails'), {
                    nombre,
                    email,
                    mensaje,
                    timestamp: new Date(),
                    userId: currentUser.uid,
                    clienteId: currentClienteId || null
                });
            } catch (error) {
                console.error('Error al enviar el email:', error);
                alert('Hubo un error al enviar el email: ' + JSON.stringify(error));
            } finally {
                enviarEmailBtn.value = 'E-mail';
            }
        });
    } else {
        console.error('Botón mail-btn no encontrado en el DOM');
    }

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



// Referencias al formulario y elementos
const form = document.getElementById('anthropometry-form');
const buscarClienteInput = document.getElementById('buscar_cliente');
const nuevoClienteBtn = document.getElementById('nuevo_cliente');
const seleccionarFecha = document.getElementById('seleccionar_fecha');
const guardarDatosBtn = document.getElementById('guardar_datos');
//const enviarEmailBtn = document.getElementById('mail-btn');
//let currentClienteId = null;
//let currentUser = null;

// Lista de elementos de resultados
const resultElementIds = [
    'result-imc',
    'imc-source',
    'result-icc',
    'icc-source',
    'result-grasa-pct-actual',
    'grasa-pct-actual-source',
    'result-grasa-pct-visceral',
    'result-grasa-abdominal',
    'grasa-abdominal-source',
    'grasa-pct-visceral-source',
    'result-grasa-pct-metabolic',
    'grasa-pct-metabolic-source',
    'result-grasa-pct-deseado',
    'grasa-pct-deseado-source',
    'result-grasa-pct-Deurenberg',
    'grasa-pct-Deurenberg-source',
    'result-grasa-pct-CUN-BAE',
    'grasa-pct-CUN-BAE-source',
    'result-masa-grasa-actual',
    'masa-grasa-actual-source',
    'result-masa-grasa-metabolic',
    'masa-grasa-metabolic-source',
    'result-masa-magra-actual',
    'masa-magra-actual-source',
    'result-masa-magra-metabolic',
    'masa-magra-metabolic-source',
    'result-imlg-actual',
    'imlg-actual-source',
    'result-imlg-metabolic',
    'imlg-metabolic-source',
    'result-img-actual',
    'img-actual-source',
    'result-img-metabolic',
    'img-metabolic-source',
    'result-tipologia-actual',
    'tipologia-actual-source',
    'result-tipologia-metabolic',
    'tipologia-metabolic-source',
    'result-tmb',
    'tmb-source',
    'result-edadmetabolica',
    'edadmetabolica-source',
    'result-somatotipo',
    'somatotipo-source',
    'result-amb',
    'amb-source',
    'result-ambc',
    'ambc-source',
    'result-mmt',
    'mmt-source',
    'result-mmt2',
    'mmt2-source',
    'result-Pct-mmt',
    'Pct-mmt-source',
    'result-Pct-mmt2',
    'Pct-mmt2-source',
    'result-masa-osea',
    'masa-osea-source',
    'result-masa-residual',
    'masa-residual-source',
    'result-peso-ideal',
    'peso-ideal-source',
    'result-peso-objetivo',
    'peso-objetivo-source',
    'result-peso-muscular',
    'peso-muscular-source',
    'result-agua-corporal',
    'agua-corporal-source',
    // Bioquímicos
    'result-albumina',
    'albumina-source',
    'result-prealbumina',
    'prealbumina-source',
    'result-proteina-total',
    'proteina-total-source',
    'result-colesterol-total',
    'colesterol-total-source',
    'result-hdl',
    'hdl-source',
    'result-trigliceridos',
    'trigliceridos-source',
    'result-glucosa-ayunas',
    'glucosa-ayunas-source',
    'result-hba1c',
    'hba1c-source',
    'result-insulina',
    'insulina-source',
    'result-pcr-ultrasensible',
    'pcr-ultrasensible-source',
    'result-leptina',
    'leptina-source',
    'result-adiponectina',
    'adiponectina-source',
    'result-alt',
    'alt-source',
    'result-ggt',
    'ggt-source',
    'result-ast',
    'ast-source',
    'result-tsh',
    'tsh-source',
    'result-testosterona',
    'testosterona-source',
    'result-cortisol',
    'cortisol-source',
    'result-vitamina-d',
    'vitamina-d-source',
    'result-fosfatasa-alcalina',
    'fosfatasa-alcalina-source',
    'result-creatinina',
    'creatinina-source',
    'result-bun',
    'bun-source',
    'result-abdominal-fat-thickness',
    'abdominal-fat-thickness-source',
    'result-analisis'
];

// Crear select para resultados de búsqueda
let clientesResultados = document.getElementById('clientes_resultados');
if (!clientesResultados) {
    clientesResultados = document.createElement('select');
    clientesResultados.id = 'clientes_resultados';
    buscarClienteInput.insertAdjacentElement('afterend', clientesResultados);
}

// Función para normalizar texto (eliminar acentos y caracteres especiales)
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
};

// Función para convertir cadenas numéricas a números
const toNumber = (value) => {
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        return parseFloat(value);
    }
    return value;
};


// Manejar estado de autenticación
// Handle auth state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const verProgresoBtn = document.getElementById('ver-progreso-btn');
    const enviarEmailBtn = document.getElementById('mail-btn');
    if (user) {
        console.log('Auth state: User signed in', user.displayName, user.email);
        if (verProgresoBtn) {
            verProgresoBtn.style.display = 'none'; // Hide until client and toma are selected
        }
        if (enviarEmailBtn) {
            enviarEmailBtn.style.display = 'none'; // Hide until toma is selected
        }
        clientesResultados.style.display = 'none';
    } else {
        console.log('Auth state: No user signed in');
        window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/index.html';
        if (verProgresoBtn) verProgresoBtn.style.display = 'none';
        if (enviarEmailBtn) enviarEmailBtn.style.display = 'none';
        clientesResultados.style.display = 'none';
        seleccionarFecha.innerHTML = '<option value="">Seleccionar fecha...</option>';
        currentClienteId = null;
    }
});


// Global variables
currentClienteId = null;
let currentTomaSerial = null; // Track the loaded toma's serial

// Búsqueda de clientes
// Búsqueda de clientes
buscarClienteInput.addEventListener('input', async () => {
    if (!currentUser) {
        console.log('No user authenticated, skipping search');
        return;
    }
    const searchTerm = normalizeText(buscarClienteInput.value);
    console.log('Normalized search term:', searchTerm);
    clientesResultados.innerHTML = '<option value="">Seleccionar cliente...</option>';
    if (searchTerm.length < 2) {
        seleccionarFecha.innerHTML = '<option value="">Seleccionar fecha...</option>';
        clientesResultados.style.display = 'none';
        console.log('Search term too short (< 2), hiding resultados');
        return;
    }
    clientesResultados.style.display = 'block';
    console.log('Executing Firestore query for clientes');
    const q = query(collection(db, 'clientes'),
        where('nombreLowercase', '>=', searchTerm),
        where('nombreLowercase', '<=', searchTerm + '\uf8ff'));
    try {
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot size:', querySnapshot.size);
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log('Found client:', doc.id, data.nombre, 'nombreLowercase:', data.nombreLowercase);
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.nombre;
            clientesResultados.appendChild(option);
        });
        if (querySnapshot.empty) {
            console.log('No clients found for search term:', searchTerm);
            clientesResultados.innerHTML = '<option value="">No se encontraron clientes...</option>';
        }
    } catch (error) {
        console.error('Error fetching clients:', error.code, error.message);
        alert('Error al buscar clientes: ' + error.message);
    }
});

// Cargar fechas de tomas al seleccionar un cliente
clientesResultados.addEventListener('change', async () => {
    const clienteId = clientesResultados.value;
    console.log('Cliente seleccionado:', clienteId);
    const verProgresoBtn = document.getElementById('ver-progreso-btn');
    const enviarEmailBtn = document.getElementById('mail-btn');

    if (!verProgresoBtn) {
        console.error('Botón Ver Progreso no encontrado en el DOM');
        return;
    }
    if (clienteId) {
        currentClienteId = clienteId;
        currentTomaSerial = null; // Reset toma serial when changing client
        verProgresoBtn.style.display = 'inline-block';
        if (enviarEmailBtn) {
            enviarEmailBtn.style.display = 'none';
        }
        await cargarFechasTomas(clienteId);
    } else {
        console.log('No cliente seleccionado, limpiando fechas');
        currentClienteId = null;
        currentTomaSerial = null;
        verProgresoBtn.style.display = 'none';
        if (enviarEmailBtn) {
            enviarEmailBtn.style.display = 'none';
        }
        seleccionarFecha.innerHTML = '<option value="">Seleccionar fecha...</option>';
    }
});

// Cargar datos de la toma seleccionada
seleccionarFecha.addEventListener('change', async () => {
    const tomaId = seleccionarFecha.value;
    console.log('Toma seleccionada:', tomaId);
    const verProgresoBtn = document.getElementById('ver-progreso-btn');
    const enviarEmailBtn = document.getElementById('mail-btn');
    if (tomaId && currentClienteId) {
        currentTomaSerial = tomaId; // Set the loaded toma's serial
        await cargarDatosToma(currentClienteId, tomaId);
        if (verProgresoBtn) {
            verProgresoBtn.style.display = 'inline-block';
        }
        if (enviarEmailBtn) {
            enviarEmailBtn.style.display = 'inline-block'; // Show when toma is selected
        }
    } else {
        console.log('No toma seleccionada o no clienteId, limpiando formulario');
        currentTomaSerial = null; // Reset toma serial
        form.reset();
        if (verProgresoBtn) {
            verProgresoBtn.style.display = 'none';
        }
        if (enviarEmailBtn) {
            enviarEmailBtn.style.display = 'none';
        }
    }
});


// Limpiar y ocultar secciones para nuevo cliente
nuevoClienteBtn.addEventListener('click', () => {
    console.log('Nuevo Cliente clicked');
    currentClienteId = null;
    currentTomaSerial = null; // Reset toma serial
    form.reset();
    buscarClienteInput.value = '';
    clientesResultados.innerHTML = '<option value="">Seleccionar cliente...</option>';
    clientesResultados.style.display = 'none';
    seleccionarFecha.innerHTML = '<option value="">Seleccionar fecha...</option>';
    guardarDatosBtn.style.display = 'none';
    const verProgresoBtn = document.getElementById('ver-progreso-btn');
    const enviarEmailBtn = document.getElementById('mail-btn');
    const pliegueAbdominalGroup = document.querySelector('.pliegue-abdominal-group');
    pliegueAbdominalGroup.style.display = 'none';

    if (verProgresoBtn) {
        verProgresoBtn.style.display = 'none';
    }
    if (enviarEmailBtn) {
        enviarEmailBtn.style.display = 'none';
    }
    // Limpiar sección de resultados
    resultElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '---';
    });
    // Limpiar específicamente el análisis bioquímico
    const analisisElement = document.getElementById('result-analisis');
    if (analisisElement) {
        analisisElement.textContent = 'Aquí se proporcionará una explicación detallada de los resultados obtenidos en los parámetros bioquímicos.';  // O puedes usar innerHTML = '' para limpiar completamente
    }
    // Ocultar sección de explicación
    const explanationSection = document.getElementById('explanation-section');
    if (explanationSection) {
        explanationSection.style.display = 'none';
        console.log('Explanation section hidden');
    }
    // Limpiar gráficos
    ['somatotype-point-canvas', 'typology-chart', 'weight-chart'].forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
});





// Guardar datos
// Guardar datos
guardarDatosBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Por favor, inicia sesión para guardar datos.');
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const peso = document.getElementById('peso').value;
    const altura = document.getElementById('altura').value;
    const email = document.getElementById('e-mail').value.trim();
    const tomaSerial = currentTomaSerial || null; // Use currentTomaSerial
    const elementoAnalisis = document.getElementById("result-analisis");
    const textoAnalisis = elementoAnalisis ? elementoAnalisis.textContent.trim() : null;

    // Validaciones
    if (!nombre) {
        alert('Por favor, ingrese el nombre del cliente.');
        return;
    }
    if (!peso || isNaN(peso) || peso <= 0) {
        alert('Por favor, ingrese un peso válido.');
        return;
    }
    if (!altura || isNaN(altura) || altura <= 0) {
        alert('Por favor, ingrese una altura válida.');
        return;
    }
    if (!email) {
        alert('Por favor, ingrese el email del cliente.');
        return;
    }
    // Verificamos si el análisis bioquímico NO es válido
    // Depuración: Mostrar el valor actual de analisisbioquimico
    // Depuración: Ver qué contiene realmente
    console.log("Contenido de analisisbioquimico:", textoAnalisis);

    // 2. Verificar si el análisis es válido (no vacío, no placeholder)
    const placeholder = "Aquí se proporcionará una explicación detallada de los resultados obtenidos en los parámetros bioquímicos.";

    if (
        !textoAnalisis ||
        textoAnalisis === '---' ||
        textoAnalisis === placeholder
    ) {
        // Si no es válido, pedir confirmación
        const confirmarGuardar = confirm(
            'El análisis bioquímico no se ha realizado.\n\n' +
            '¿Desea guardar los datos sin el análisis bioquímico?\n\n' +
            'Si necesita realizarlo, cancele este mensaje y complete el análisis.'
        );

        if (!confirmarGuardar) {
            alert('Por favor, complete el análisis bioquímico antes de guardar.');
            return false;
        }

        alert('Advertencia: Los datos se guardarán sin el análisis bioquímico.');
    } else {
        console.log("Análisis bioquímico válido:", textoAnalisis);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatedEmail = email && emailRegex.test(email) ? email : null;
    if (!validatedEmail) {
        alert('Por favor, ingrese un email válido.');
        return;
    }

    // Construir objeto de datos
    const data = {
        nombre,
        email: validatedEmail,
        genero: document.getElementById('genero').value || null,
        fecha: document.getElementById('fecha').value ? new Date(document.getElementById('fecha').value) : new Date(),
        edad: parseInt(document.getElementById('edad').value) || null,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        es_deportista: document.getElementById('es_deportista').value || null,
        grasa_actual_conocida: parseFloat(document.getElementById('grasa_actual_conocida').value) || null,
        grasa_deseada: parseFloat(document.getElementById('grasa_deseada').value) || null,
        medidas: {
            pliegues: {
                tricipital: parseFloat(document.getElementById('pliegue_tricipital').value) || null,
                subescapular: parseFloat(document.getElementById('pliegue_subescapular').value) || null,
                suprailiaco: parseFloat(document.getElementById('pliegue_suprailiaco').value) || null,
                bicipital: parseFloat(document.getElementById('pliegue_bicipital').value) || null,
                pantorrilla: parseFloat(document.getElementById('pliegue_pantorrilla').value) || null,
                abdominal: parseFloat(document.getElementById('pliegue_abdominal').value) || null,
            },
            circunferencias: {
                cintura: parseFloat(document.getElementById('circ_cintura').value) || null,
                cadera: parseFloat(document.getElementById('circ_cadera').value) || null,
                cuello: parseFloat(document.getElementById('circ_cuello').value) || null,
                pantorrilla: parseFloat(document.getElementById('circ_pantorrilla').value) || null,
                brazo: parseFloat(document.getElementById('circ_brazo').value) || null,
                brazo_contraido: parseFloat(document.getElementById('circ_brazo_contraido').value) || null,
            },
            diametros: {
                humero: parseFloat(document.getElementById('diam_humero').value) || null,
                femur: parseFloat(document.getElementById('diam_femur').value) || null,
                muneca: parseFloat(document.getElementById('diam_muneca').value) || null,
            },
            parametros_bioquimicos: {
                albumina: parseFloat(document.getElementById('result-albumina')?.textContent) || null,
                albuminaSource: document.getElementById('albumina-source')?.textContent || null,
                proteinaTotal: document.getElementById('result-proteina-total')?.textContent || null,
                proteinaTotalSource: document.getElementById('proteina-total-source')?.textContent || null,
                prealbumina: parseFloat(document.getElementById('result-prealbumina')?.textContent) || null,
                prealbuminaSource: document.getElementById('prealbumina-source')?.textContent || null,
                colesterolTotal: parseFloat(document.getElementById('result-colesterol-total')?.textContent) || null,
                colesterolTotalSource: document.getElementById('colesterol-total-source')?.textContent || null,
                hdl: parseFloat(document.getElementById('result-hdl')?.textContent) || null,
                hdlSource: document.getElementById('hdl-source')?.textContent || null,
                trigliceridos: parseFloat(document.getElementById('result-trigliceridos')?.textContent) || null,
                trigliceridosSource: document.getElementById('trigliceridos-source')?.textContent || null,
                glucosa_ayunas: parseFloat(document.getElementById('result-glucosa-ayunas')?.textContent) || null,
                glucosaAyunasSource: document.getElementById('glucosa-ayunas-source')?.textContent || null,
                hba1c: parseFloat(document.getElementById('result-hba1c')?.textContent) || null,
                hba1cSource: document.getElementById('hba1c-source')?.textContent || null,
                insulina: parseFloat(document.getElementById('result-insulina')?.textContent) || null,
                insulinaSource: document.getElementById('insulina-source')?.textContent || null,
                pcr_ultrasensible: parseFloat(document.getElementById('result-pcr-ultrasensible')?.textContent) || null,
                pcrUltrasensibleSource: document.getElementById('pcr-ultrasensible-source')?.textContent || null,
                adiponectina: parseFloat(document.getElementById('result-adiponectina')?.textContent) || null,
                adiponectinaSource: document.getElementById('adiponectina-source')?.textContent || null,
                leptina: parseFloat(document.getElementById('result-leptina')?.textContent) || null,
                leptinaSource: document.getElementById('leptina-source')?.textContent || null,
                alt: parseFloat(document.getElementById('result-alt')?.textContent) || null,
                altSource: document.getElementById('alt-source')?.textContent || null,
                ggt: parseFloat(document.getElementById('result-ggt')?.textContent) || null,
                ggtSource: document.getElementById('ggt-source')?.textContent || null,
                ast: parseFloat(document.getElementById('result-ast')?.textContent) || null,
                astSource: document.getElementById('ast-source')?.textContent || null,
                tsh: parseFloat(document.getElementById('result-tsh')?.textContent) || null,
                tshSource: document.getElementById('tsh-source')?.textContent || null,
                testosterona: parseFloat(document.getElementById('result-testosterona')?.textContent) || null,
                testosteronaSource: document.getElementById('testosterona-source')?.textContent || null,
                cortisol: parseFloat(document.getElementById('result-cortisol')?.textContent) || null,
                cortisolSource: document.getElementById('cortisol-source')?.textContent || null,

                vitamina_d: parseFloat(document.getElementById('result-vitamina-d')?.textContent) || null,
                vitaminaDSource: document.getElementById('vitamina-d-source')?.textContent || null,
                fosfatasa: parseFloat(document.getElementById('result-fosfatasa-alcalina')?.textContent) || null,
                fosfatasaSource: document.getElementById('fosfatasa-alcalina-source')?.textContent || null,
                creatinina: parseFloat(document.getElementById('result-creatinina')?.textContent) || null,
                creatininaSource: document.getElementById('creatinina-source')?.textContent || null,
                bun: parseFloat(document.getElementById('result-bun')?.textContent) || null,
                bunSource: document.getElementById('bun-source')?.textContent || null,
                bioquimicosanalisis: document.getElementById('result-analisis')?.textContent || null,
            },
        },
        resultados: window.calculatedResults || {},
    };

    try {
        console.log('Datos a guardar:', JSON.stringify(data, null, 2));

        // Create client if not exists
        if (!currentClienteId) {
            const clienteRef = await addDoc(collection(db, 'clientes'), {
                nombre,
                email,
                nombreLowercase: normalizeText(nombre),
                genero: data.genero,
                fecha_creacion: new Date(),
                created_by: currentUser.uid,
            });
            currentClienteId = clienteRef.id;
            console.log('Cliente creado con ID:', currentClienteId);
        }

        let shouldUpdate = false;
        let tomaId = tomaSerial;

        // Check if toma exists if tomaSerial is provided
        if (tomaSerial) {
            const tomaDocRef = doc(db, `clientes/${currentClienteId}/tomas`, tomaSerial);
            const tomaDoc = await getDoc(tomaDocRef);
            if (tomaDoc.exists()) {
                // Existing toma found
                const confirmUpdate = confirm(
                    'Los datos han sido cargados de una toma existente y modificados. ¿Desea actualizar la toma existente o crear una nueva?\nAceptar: Actualizar datos\nCancelar: Crear nueva toma'
                );
                shouldUpdate = confirmUpdate;
            } else {
                tomaId = null; // Serial doesn’t exist, treat as new
            }
        }

        if (shouldUpdate && tomaId) {
            // Update existing toma
            const tomaDocRef = doc(db, `clientes/${currentClienteId}/tomas`, tomaSerial);
            await setDoc(tomaDocRef, data, { merge: true });
            console.log('Toma actualizada con ID:', tomaSerial);
            alert('Datos actualizados exitosamente.');
        } else {
            // Create new toma
            const tomaRef = await addDoc(collection(db, `clientes/${currentClienteId}/tomas`), data);
            console.log('Nueva toma guardada con ID:', tomaRef.id);
            alert('Datos guardados exitosamente.');
        }

        // Refresh the list of toma records
        await cargarFechasTomas(currentClienteId);
        guardarDatosBtn.style.display = 'none';
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar los datos: ' + error.message);
    }
});

// Cargar fechas de tomas
async function cargarFechasTomas(clienteId) {
    if (!clienteId) {
        console.log('No clienteId provided, skipping cargarFechasTomas');
        return;
    }
    console.log('Loading tomas for clienteId:', clienteId);
    seleccionarFecha.innerHTML = '<option value="">Seleccionar fecha...</option>';
    const q = query(collection(db, `clientes/${clienteId}/tomas`), orderBy('fecha', 'desc'));
    try {
        const querySnapshot = await getDocs(q);
        console.log('Tomas query snapshot size:', querySnapshot.size);
        if (querySnapshot.empty) {
            console.log('No tomas found for cliente:', clienteId);
            seleccionarFecha.innerHTML = '<option value="">No hay tomas disponibles</option>';
            return;
        }
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log('Toma found:', doc.id, 'Fecha:', data.fecha);
            const option = document.createElement('option');
            option.value = doc.id;
            let fechaStr = 'Fecha inválida';
            try {
                if (data.fecha && data.fecha.toDate) {
                    fechaStr = data.fecha.toDate().toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else if (data.fecha) {
                    fechaStr = new Date(data.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (error) {
                console.warn('Error formatting fecha for toma:', doc.id, error);
            }
            option.textContent = fechaStr;
            seleccionarFecha.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching tomas:', error.code, error.message);
        alert('Error al cargar fechas: ' + error.message);
    }
}

// Cargar datos de la toma seleccionada en el formulario
// Cargar datos de la toma seleccionada en el formulario
async function cargarDatosToma(clienteId, tomaId) {
    if (!clienteId || !tomaId) {
        console.log('Falta clienteId o tomaId, limpiando formulario');
        form.reset();
        currentTomaData = null; // Limpiar datos de toma
        return;
    }
    console.log('Cargando datos de toma:', tomaId, 'para cliente:', clienteId);
    try {
        const tomaRef = doc(db, `clientes/${clienteId}/tomas`, tomaId);
        const tomaSnap = await getDoc(tomaRef);
        if (!tomaSnap.exists()) {
            console.log('Toma no encontrada:', tomaId);
            alert('La toma seleccionada no existe.');
            form.reset();
            currentTomaData = null;
            return;
        }
        const data = tomaSnap.data();
        console.log('Datos de la toma:', JSON.stringify(data, null, 2));
        currentTomaData = data; // Guardar datos de la toma

        // Poblar campos del formulario
        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('e-mail').value = data.email || '';
        document.getElementById('genero').value = data.genero || '';
        document.getElementById('edad').value = data.edad || '';
        document.getElementById('peso').value = data.peso || '';
        document.getElementById('altura').value = data.altura || '';

        // Actualizar es_deportista y visibilidad de P. Abdominal
        const esDeportistaValue = data.es_deportista || '';
        document.getElementById('es_deportista').value = esDeportistaValue;
        console.log('Valor de es_deportista:', esDeportistaValue);
        if (window.updateDeportistaValue) {
            window.updateDeportistaValue(esDeportistaValue);
        } else {
            console.warn('Función updateDeportistaValue no encontrada. Asegúrate de que el script de visibilidad esté cargado.');
        }

        document.getElementById('grasa_actual_conocida').value = data.grasa_actual_conocida || '';
        document.getElementById('grasa_deseada').value = data.grasa_deseada || '';

        // Poblar medidas.pliegues
        document.getElementById('pliegue_tricipital').value = data.medidas?.pliegues?.tricipital || '';
        document.getElementById('pliegue_subescapular').value = data.medidas?.pliegues?.subescapular || '';
        document.getElementById('pliegue_suprailiaco').value = data.medidas?.pliegues?.suprailiaco || '';
        document.getElementById('pliegue_bicipital').value = data.medidas?.pliegues?.bicipital || '';
        document.getElementById('pliegue_pantorrilla').value = data.medidas?.pliegues?.pantorrilla || '';
        document.getElementById('pliegue_abdominal').value = data.medidas?.pliegues?.abdomimal || '';

        // Poblar medidas.circunferencias
        document.getElementById('circ_cintura').value = data.medidas?.circunferencias?.cintura || '';
        document.getElementById('circ_cadera').value = data.medidas?.circunferencias?.cadera || '';
        document.getElementById('circ_cuello').value = data.medidas?.circunferencias?.cuello || '';
        document.getElementById('circ_pantorrilla').value = data.medidas?.circunferencias?.pantorrilla || '';
        document.getElementById('circ_brazo').value = data.medidas?.circunferencias?.brazo || '';
        document.getElementById('circ_brazo_contraido').value = data.medidas?.circunferencias?.brazo_contraido || '';

        // Poblar medidas.diametros
        document.getElementById('diam_humero').value = data.medidas?.diametros?.humero || '';
        document.getElementById('diam_femur').value = data.medidas?.diametros?.femur || '';
        document.getElementById('diam_muneca').value = data.medidas?.diametros?.muneca || '';

        // Mapear claves de resultados a IDs de elementos, incluyendo parámetros bioquímicos
        const resultMappings = {
            // IMC
            'imc': { id: 'result-imc', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'imcSource': { id: 'imc-source', unit: '', format: (v) => v || '---' },
            // ICC
            'icc': { id: 'result-icc', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(2) : '---' },
            'iccSource': { id: 'icc-source', unit: '', format: (v) => v || '---' },
            // % Grasa
            'grasaPctActual': { id: 'result-grasa-pct-actual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'grasaPctActualSource': { id: 'grasa-pct-actual-source', unit: '', format: (v) => v || '---' },
            'grasavisceralActual': { id: 'result-grasa-pct-visceral', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(2) : '---' },
            'grasavisceralActualSource': { id: 'grasa-pct-visceral-source', unit: '', format: (v) => v || '---' },
            'grasaAbsActual': { id: 'result-grasa-abdominal', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(2) : '---' },
            'grasaAbsActualSource': { id: 'grasa-abdominal-source', unit: '', format: (v) => v || '---' },
            'abdominalFatThickness': { id: 'result-abdominal-fat-thickness', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'abdominalFatThicknessSource': { id: 'abdominal-fat-thickness-source', unit: '', format: (v) => v || '---' },
            'grasaPctMetabolic': { id: 'result-grasa-pct-metabolic', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'grasaPctMetabolicSource': { id: 'grasa-pct-metabolic-source', unit: '', format: (v) => v || '---' },
            'grasaPctDeseado': { id: 'result-grasa-pct-deseado', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'grasaPctDeseadoSource': { id: 'grasa-pct-deseado-source', unit: '', format: (v) => v || '---' },
            'grasaPctDeurenberg': { id: 'result-grasa-pct-Deurenberg', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'grasaPctDeurenbergSource': { id: 'grasa-pct-Deurenberg-source', unit: '', format: (v) => v || '---' },
            'grasaPctCUNBAE': { id: 'result-grasa-pct-CUN-BAE', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'grasaPctCUNBAESource': { id: 'grasa-pct-CUN-BAE-source', unit: '', format: (v) => v || '---' },
            // Masa Grasa
            'masaGrasaActual': { id: 'result-masa-grasa-actual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaGrasaActualSource': { id: 'masa-grasa-actual-source', unit: '', format: (v) => v || '---' },
            'masaGrasaMetabolic': { id: 'result-masa-grasa-metabolic', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaGrasaMetabolicSource': { id: 'masa-grasa-metabolic-source', unit: '', format: (v) => v || '---' },
            // Masa Magra
            'masaMagraActual': { id: 'result-masa-magra-actual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaMagraActualSource': { id: 'masa-magra-actual-source', unit: '', format: (v) => v || '---' },
            'masaMagraMetabolic': { id: 'result-masa-magra-metabolic', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaMagraMetabolicSource': { id: 'masa-magra-metabolic-source', unit: '', format: (v) => v || '---' },
            // IMLG
            'imlgActual': { id: 'result-imlg-actual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'imlgActualSource': { id: 'imlg-actual-source', unit: '', format: (v) => v || '---' },
            'imlgMetabolic': { id: 'result-imlg-metabolic', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'imlgMetabolicSource': { id: 'imlg-metabolic-source', unit: '', format: (v) => v || '---' },
            // IMG
            'imgActual': { id: 'result-img-actual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'imgActualSource': { id: 'img-actual-source', unit: '', format: (v) => v || '---' },
            'imgMetabolic': { id: 'result-img-metabolic', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'imgMetabolicSource': { id: 'img-metabolic-source', unit: '', format: (v) => v || '---' },
            // Tipología
            'tipologiaActual': { id: 'result-tipologia-actual', unit: '', format: (v) => v || '---' },
            'tipologiaActualSource': { id: 'tipologia-actual-source', unit: '', format: (v) => v || '---' },
            'tipologiaMetabolic': { id: 'result-tipologia-metabolic', unit: '', format: (v) => v || '---' },
            'tipologiaMetabolicSource': { id: 'tipologia-metabolic-source', unit: '', format: (v) => v || '---' },
            // TMB
            'BRMEstimado': { id: 'result-tmb', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(0) : '---' },
            'BRMEstimadoSource': { id: 'tmb-source', unit: '', format: (v) => v || '---' },
            // Edad Metabólica
            'edadMetabolica': { id: 'result-edadmetabolica', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(0) : '---' },
            'edadMetabolicaSource': { id: 'edadmetabolica-source', unit: '', format: (v) => v || '---' },
            // Somatotipo
            'somatotipo': { id: 'result-somatotipo', unit: '', format: (v) => typeof v === 'object' && v.formatted ? v.formatted : (typeof v === 'string' ? v : '---') },
            'somatotipoSource': { id: 'somatotipo-source', unit: '', format: (v) => v || '---' },
            // AMB
            'amb': { id: 'result-amb', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(0) : '---' },
            'ambSource': { id: 'amb-source', unit: '', format: (v) => v || '---' },
            // MMT
            'mmt': { id: 'result-mmt', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'mmtSource': { id: 'mmt-source', unit: '', format: (v) => v || '---' },
            'Pctmmt': { id: 'result-Pct-mmt', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            // Masa Ósea
            'masaOsea': { id: 'result-masa-osea', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaOseaSource': { id: 'masa-osea-source', unit: '', format: (v) => v || '---' },
            // Masa Residual
            'masaResidual': { id: 'result-masa-residual', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'masaResidualSource': { id: 'masa-residual-source', unit: '', format: (v) => v || '---' },
            // Peso
            'pesoIdeal': { id: 'result-peso-ideal', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'pesoIdealSource': { id: 'peso-ideal-source', unit: '', format: (v) => v || '---' },
            'pesoObjetivo': { id: 'result-peso-objetivo', unit: '', format: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))) ? toNumber(v).toFixed(1) : '---' },
            'pesoObjetivoSource': { id: 'peso-objetivo-source', unit: '', format: (v) => v || '---' },
            // Parámetros Bioquímicos
            'albumina': { id: 'result-albumina', unit: '', source: 'medidas.parametros_bioquimicos.albumina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'prealbumina': { id: 'result-prealbumina', unit: '', source: 'medidas.parametros_bioquimicos.prealbumina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'proteinaTotal': { id: 'result-proteina-total', unit: '', source: 'medidas.parametros_bioquimicos.proteinaTotal', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'colesterolTotal': { id: 'result-colesterol-total', unit: '', source: 'medidas.parametros_bioquimicos.colesterolTotal', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'hdl': { id: 'result-hdl', unit: '', source: 'medidas.parametros_bioquimicos.hdl', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'trigliceridos': { id: 'result-trigliceridos', unit: '', source: 'medidas.parametros_bioquimicos.trigliceridos', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'glucosaAyunas': { id: 'result-glucosa-ayunas', unit: '', source: 'medidas.parametros_bioquimicos.glucosa_ayunas', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'hba1c': { id: 'result-hba1c', unit: '', source: 'medidas.parametros_bioquimicos.hba1c', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'insulina': { id: 'result-insulina', unit: '', source: 'medidas.parametros_bioquimicos.insulina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'pcrUltrasensible': { id: 'result-pcr-ultrasensible', unit: '', source: 'medidas.parametros_bioquimicos.pcr_ultrasensible', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(2) : '---') },
            'leptina': { id: 'result-leptina', unit: '', source: 'medidas.parametros_bioquimicos.leptina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'adiponectina': { id: 'result-adiponectina', unit: '', source: 'medidas.parametros_bioquimicos.adiponectina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'alt': { id: 'result-alt', unit: '', source: 'medidas.parametros_bioquimicos.alt', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'ggt': { id: 'result-ggt', unit: '', source: 'medidas.parametros_bioquimicos.ggt', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(0) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(0) : '---') },
            'tsh': { id: 'result-tsh', unit: '', source: 'medidas.parametros_bioquimicos.tsh', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(2) : '---') },
            'ast': { id: 'result-ast', unit: '', source: 'medidas.parametros_bioquimicos.ast', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(2) : '---') },
            'cortisol': { id: 'result-cortisol', unit: '', source: 'medidas.parametros_bioquimicos.cortisol', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'testosterona': { id: 'result-testosterona', unit: '', source: 'medidas.parametros_bioquimicos.testosterona', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'vitaminaD': { id: 'result-vitamina-d', unit: '', source: 'medidas.parametros_bioquimicos.vitamina_d', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'fosfatasa': { id: 'result-fosfatasa-alcalina', unit: '', source: 'medidas.parametros_bioquimicos.fosfatasa', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'creatinina': { id: 'result-creatinina', unit: '', source: 'medidas.parametros_bioquimicos.creatinina', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            'bun': { id: 'result-bun', unit: '', source: 'medidas.parametros_bioquimicos.bun', format: (v) => typeof v === 'number' && !isNaN(v) ? v.toFixed(1) : (typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v).toFixed(1) : '---') },
            // Parámetros Bioquímicos Sources        
            // Parámetros Bioquímicos Sources
            'albuminaSource': { id: 'albumina-source', unit: '', source: 'medidas.parametros_bioquimicos.albuminaSource', format: (v) => v || '(No calculado)' },
            'prealbuminaSource': { id: 'prealbumina-source', unit: '', source: 'medidas.parametros_bioquimicos.prealbuminaSource', format: (v) => v || '(No calculado)' },
            'proteinaTotalSource': { id: 'proteina-total-source', unit: '', source: 'medidas.parametros_bioquimicos.proteinaTotalSource', format: (v) => v || '(No calculado)' },
            'colesterolTotalSource': { id: 'colesterol-total-source', unit: '', source: 'medidas.parametros_bioquimicos.colesterolTotalSource', format: (v) => v || '(No calculado)' },
            'hdlSource': { id: 'hdl-source', unit: '', source: 'medidas.parametros_bioquimicos.hdlSource', format: (v) => v || '(No calculado)' },
            'trigliceridosSource': { id: 'trigliceridos-source', unit: '', source: 'medidas.parametros_bioquimicos.trigliceridosSource', format: (v) => v || '(No calculado)' },
            'glucosaAyunasSource': { id: 'glucosa-ayunas-source', unit: '', source: 'medidas.parametros_bioquimicos.glucosaAyunasSource', format: (v) => v || '(No calculado)' },
            'hba1cSource': { id: 'hba1c-source', unit: '', source: 'medidas.parametros_bioquimicos.hba1cSource', format: (v) => v || '(No calculado)' },
            'insulinaSource': { id: 'insulina-source', unit: '', source: 'medidas.parametros_bioquimicos.insulinaSource', format: (v) => v || '(No calculado)' },
            'pcrUltrasensibleSource': { id: 'pcr-ultrasensible-source', unit: '', source: 'medidas.parametros_bioquimicos.pcrUltrasensibleSource', format: (v) => v || '(No calculado)' },
            'leptinaSource': { id: 'leptina-source', unit: '', source: 'medidas.parametros_bioquimicos.leptinaSource', format: (v) => v || '(No calculado)' },
            'adiponectinaSource': { id: 'adiponectina-source', unit: '', source: 'medidas.parametros_bioquimicos.adiponectinaSource', format: (v) => v || '(No calculado)' },
            'altSource': { id: 'alt-source', unit: '', source: 'medidas.parametros_bioquimicos.altSource', format: (v) => v || '(No calculado)' },
            'ggtSource': { id: 'ggt-source', unit: '', source: 'medidas.parametros_bioquimicos.ggtSource', format: (v) => v || '(No calculado)' },
            'tshSource': { id: 'tsh-source', unit: '', source: 'medidas.parametros_bioquimicos.tshSource', format: (v) => v || '(No calculado)' },
            'astSource': { id: 'ast-source', unit: '', source: 'medidas.parametros_bioquimicos.astSource', format: (v) => v || '(No calculado)' },
            'testosteronaSource': { id: 'testosterona-source', unit: '', source: 'medidas.parametros_bioquimicos.testosteronaSource', format: (v) => v || '(No calculado)' },
            'cortisolSource': { id: 'cortisol-source', unit: '', source: 'medidas.parametros_bioquimicos.cortisolSource', format: (v) => v || '(No calculado)' },
            'vitaminaDSource': { id: 'vitamina-d-source', unit: '', source: 'medidas.parametros_bioquimicos.vitaminaDSource', format: (v) => v || '(No calculado)' },
            'fosfatasaSource': { id: 'fosfatasa-alcalina-source', unit: '', source: 'medidas.parametros_bioquimicos.fosfatasaSource', format: (v) => v || '(No calculado)' },
            'creatininaSource': { id: 'creatinina-source', unit: '', source: 'medidas.parametros_bioquimicos.creatininaSource', format: (v) => v || '(No calculado)' },
            'bunSource': { id: 'bun-source', unit: '', source: 'medidas.parametros_bioquimicos.bunSource', format: (v) => v || '(No calculado)' },
            'bioquimicosanalisis': { id: 'result-analisis', unit: '', source: 'medidas.parametros_bioquimicos.bioquimicosanalisis', format: (v) => v || '(No calculado)' }

        };
        // Asignar valores a los elementos de resultados
        Object.entries(resultMappings).forEach(([key, { id, unit, source, format }]) => {
            const element = document.getElementById(id);
            if (element) {
                let value;
                if (source) {
                    // Obtener valor desde la fuente especificada (por ejemplo, medidas.parametros_bioquimicos)
                    const sourceParts = source.split('.');
                    value = sourceParts.reduce((obj, part) => obj && obj[part], data);
                } else {
                    // Obtener valor desde resultados
                    value = data.resultados ? data.resultados[key] : undefined;
                }
                // Asignar .value para inputs, .textContent para elementos de visualización
                if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                    element.value = value !== undefined && value !== null ? format(value) : '';
                } else {
                    element.textContent = value !== undefined && value !== null ? `${format(value)} ${unit}`.trim() : '---';
                }
                console.log(`Asignando ${key} al elemento ${id}:`, value);
            } else {
                console.warn(`Elemento con ID ${id} no encontrado en el DOM`);
            }
        });

        // Asegurarse de que los botones estén en el estado correcto
        const guardarDatosBtn = document.getElementById('guardar_datos');
        const enviarEmailBtn = document.getElementById('mail-btn');
        if (guardarDatosBtn && guardarDatosBtn.style.display !== 'none') {
            guardarDatosBtn.style.display = 'none';
            console.log('Botón Guardar Datos ocultado al cargar toma');
        }
        if (enviarEmailBtn) {
            const email = data.email || '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            enviarEmailBtn.style.display = email && emailRegex.test(email) ? 'inline-block' : 'none';
            console.log('Botón Enviar Email:', enviarEmailBtn.style.display === 'inline-block' ? 'mostrado' : 'ocultado', 'Email:', email);
        }

        // Actualizar sección de explicación (si existe)
        //const explanationSection = document.getElementById('explanation-section');
        //if (explanationSection) {
        // explanationSection.style.display = data.resultados ? 'block' : 'none';
        //}
    } catch (error) {
        console.error('Error al cargar datos de la toma:', error);
        alert('Error al cargar datos: ' + error.message);
        form.reset();
        Object.keys(resultMappings).forEach(key => {
            const { id } = resultMappings[key];
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                    element.value = '';
                } else {
                    element.textContent = '---';
                }
            }
        });
        if (enviarEmailBtn) enviarEmailBtn.style.display = 'none';
        if (guardarDatosBtn) guardarDatosBtn.style.display = 'none';
    }
}
//Bioquimicos Pop-up Function
document.addEventListener('DOMContentLoaded', function () {
    const bioquimicosInput = document.getElementById('parametros-bioquimicos');
    const bioquimicosContainer = document.getElementById('bioquimicos-container');
    const saveButton = document.getElementById('save-bioquimicos');
    const cancelButton = document.getElementById('cancel-bioquimicos');

    // Create warning container
    const warningContainer = document.createElement('div');
    warningContainer.id = 'bioquimicos-warnings';
    warningContainer.style.color = 'red';
    warningContainer.style.marginBottom = '10px';
    warningContainer.style.display = 'none';
    document.getElementById('bioquimicos-form')?.prepend(warningContainer);


    // Define fields globally
    // Define fields globally
    const fields = [
        { input: 'albumina', result: 'result-albumina', source: 'albumina-source', label: 'Albúmina', unit: 'g/dL', range: [1.0, 7.0] },
        { input: 'prealbumina', result: 'result-prealbumina', source: 'prealbumina-source', label: 'Prealbúmina', unit: 'mg/dL', range: [2, 100] },
        { input: 'proteina-total', result: 'result-proteina-total', source: 'proteina-total-source', label: 'Proteína Total', unit: 'g/dL', range: [3.0, 12.0] },
        { input: 'colesterol-total', result: 'result-colesterol-total', source: 'colesterol-total-source', label: 'Colesterol Total', unit: 'mg/dL', range: [50, 500] },
        { input: 'hdl', result: 'result-hdl', source: 'hdl-source', label: 'HDL', unit: 'mg/dL', range: [5, 150] },
        { input: 'trigliceridos', result: 'result-trigliceridos', source: 'trigliceridos-source', label: 'Triglicéridos', unit: 'mg/dL', range: [10, 2000] },
        { input: 'apolipoproteina-b', result: 'result-apolipoproteina-b', source: 'apolipoproteina-b-source', label: 'Apolipoproteína B', unit: 'mg/dL', range: [20, 250] },
        { input: 'glucosa-ayunas', result: 'result-glucosa-ayunas', source: 'glucosa-ayunas-source', label: 'Glucosa en ayunas', unit: 'mg/dL', range: [30, 600] },
        { input: 'hba1c', result: 'result-hba1c', source: 'hba1c-source', label: 'HbA1c', unit: '%', range: [2, 20] },
        { input: 'insulina', result: 'result-insulina', source: 'insulina-source', label: 'Insulina', unit: 'µU/mL', range: [0.5, 300] },
        { input: 'pcr-ultrasensible', result: 'result-pcr-ultrasensible', source: 'pcr-ultrasensible-source', label: 'PCR ultrasensible', unit: 'mg/L', range: [0, 100] },
        { input: 'leptina', result: 'result-leptina', source: 'leptina-source', label: 'Leptina', unit: 'ng/mL', range: [0.1, 500] },
        { input: 'alt', result: 'result-alt', source: 'alt-source', label: 'ALT', unit: 'U/L', range: [0, 500] },
        { input: 'ggt', result: 'result-ggt', source: 'ggt-source', label: 'GGT', unit: 'U/L', range: [0, 1000] },
        { input: 'creatinina', result: 'result-creatinina', source: 'creatinina-source', label: 'Creatinina', unit: 'mg/dL', range: [0.1, 10.0] },
        { input: 'bun', result: 'result-bun', source: 'bun-source', label: 'BUN', unit: 'mg/dL', range: [1, 100] },
        { input: 'tsh', result: 'result-tsh', source: 'tsh-source', label: 'TSH', unit: 'µIU/mL', range: [0.01, 50] },
        { input: 'testosterona', result: 'result-testosterona', source: 'testosterona-source', label: 'Testosterona', unit: 'ng/dL', range: [10, 3000] },
        { input: 'cortisol', result: 'result-cortisol', source: 'cortisol-source', label: 'Cortisol', unit: 'µg/dL', range: [1, 100] },
        { input: 'vitamina-d', result: 'result-vitamina-d', source: 'vitamina-d-source', label: 'Vitamina D', unit: 'ng/mL', range: [1, 300] },
        { input: 'fosfatasa-alcalina', result: 'result-fosfatasa-alcalina', source: 'fosfatasa-alcalina-source', label: 'Fosfatasa Alcalina', unit: 'U/L', range: [10, 1000] },
        { input: 'ast', result: 'result-ast', source: 'ast-source', label: 'AST', unit: 'U/L', range: [0, 500] },
        { input: 'adiponectina', result: 'result-adiponectina', source: 'adiponectina-source', label: 'Adiponectina', unit: 'µg/mL', range: [0.1, 100] },
    ];


    // Función para obtener la explicación de un parámetro bioquímico
    function getBioquimicoExplanation(param, value, genero = 'masculino') {
        const ranges = {
            'albumina': { min: 3.5, max: 5.0, unit: 'g/dL', indica: 'Síntesis proteica y estado nutricional a largo plazo', alteracion: '↓ En desnutrición o inflamación crónica' },
            'prealbumina': { min: 15, max: 40, unit: 'mg/dL', indica: 'Estado nutricional reciente (vida media corta)', alteracion: '↓ En déficit calórico-proteico agudo' },
            'proteina-total': { min: 6.0, max: 8.3, unit: 'g/dL', indica: 'Evaluación global de síntesis hepática y nutrición', alteracion: '↓ En desnutrición crónica o enfermedades hepáticas/renales' },
            'colesterol-total': { min: 0, max: 200, unit: 'mg/dL', indica: 'Riesgo cardiovascular', alteracion: '↑ En dislipidemia (objetivo: <200 mg/dL)' },
            'hdl': {
                min: genero === 'masculino' ? 40 : 50, max: 100, unit: 'mg/dL',
                indica: 'Protección contra enfermedades cardíacas', alteracion: '↓ En obesidad visceral o riesgo cardiovascular'
            },
            'trigliceridos': { min: 0, max: 150, unit: 'mg/dL', indica: 'Energía almacenada; alto nivel sugiere resistencia a insulina', alteracion: '↑ En síndrome metabólico' },
            'apolipoproteina-b': { min: 0, max: 100, unit: 'mg/dL', indica: 'Predictor de riesgo cardiovascular en obesidad', alteracion: '↑ En dislipidemias atherogénicas' },
            'glucosa-ayunas': { min: 70, max: 99, unit: 'mg/dL', indica: 'Niveles de azúcar en sangre', alteracion: '↑ En prediabetes/diabetes (≥100 mg/dL)' },
            'hba1c': { min: 0, max: 5.7, unit: '%', indica: 'Control glucémico a largo plazo (3 meses)', alteracion: '≥5.7% indica riesgo de diabetes' },
            'insulina': { min: 2, max: 25, unit: 'µU/mL', indica: 'Resistencia a insulina si elevada (HOMA-IR >2.5)', alteracion: '↑ En obesidad y síndrome metabólico' },
            'pcr-ultrasensible': { min: 0, max: 1.0, unit: 'mg/L', indica: 'Inflamación sistémica', alteracion: '↑ En obesidad (>3 mg/L = alto riesgo cardiovascular)' },
            'leptina': {
                min: genero === 'masculino' ? 0.5 : 3, max: genero === 'masculino' ? 15 : 30, unit: 'ng/mL',
                indica: 'Regulación de saciedad; alta en obesidad (resistencia leptínica)', alteracion: '↑ En obesidad (resistencia leptínica)'
            },
            'alt': {
                min: 7, max: genero === 'masculino' ? 55 : 45, unit: 'U/L',
                indica: 'Daño hepático (hígado graso no alcohólico, NAFLD)', alteracion: '↑ En NAFLD asociado a obesidad'
            },
            'ggt': {
                min: genero === 'masculino' ? 8 : 5, max: genero === 'masculino' ? 61 : 36, unit: 'U/L',
                indica: 'Sensibilidad a la acumulación de grasa en hígado', alteracion: '↑ En obesidad y consumo de alcohol'
            },
            'creatinina': { min: 0.5, max: 1.5, unit: 'mg/dL', indica: 'Función renal', alteracion: '↑ En enfermedad renal crónica o hiperfiltración' },
            'bun': { min: 7, max: 25, unit: 'mg/dL', indica: 'Función renal', alteracion: '↑ En enfermedad renal crónica' },
            'tsh': { min: 0.4, max: 4.0, unit: 'µIU/mL', indica: 'Función tiroidea (hipotiroidismo → dificultad para perder peso)', alteracion: '↑ En hipotiroidismo subclínico o clínico' },
            'testosterona': { min: 300, max: 1000, unit: 'ng/dL', indica: 'Asociada a masa muscular y grasa visceral', alteracion: '↓ En obesidad masculina o hipogonadismo', genderSpecific: 'masculino' },
            'cortisol': { min: 5, max: 25, unit: 'µg/dL', indica: 'Estrés crónico y acumulación de grasa abdominal', alteracion: '↑ En estrés crónico y síndrome metabólico' },
            'vitamina-d': { min: 30, max: 100, unit: 'ng/mL', indica: 'Metabolismo óseo, muscular e inmunológico', alteracion: '↓ En obesidad (secuestro en tejido adiposo)' },
            'fosfatasa-alcalina': { min: 20, max: 140, unit: 'U/L', indica: 'Remodelación ósea y función hepatobiliar', alteracion: '↑ En recambio óseo acelerado o colestasis' },
            'ast': { min: 5, max: 40, unit: 'U/L', indica: 'Daño hepático o muscular', alteracion: '↑ En hígado graso, hepatitis o lesión muscular' },
            'adiponectina': { min: 5, max: 30, unit: 'µg/mL', indica: 'Sensibilidad a la insulina y protección cardiovascular', alteracion: '↓ En resistencia a insulina y obesidad' }
        };

        const config = ranges[param];
        if (!config) return `Parámetro ${param} no reconocido.`;
        if (isNaN(value) || value === null || value === undefined) return `Valor inválido para ${param}.`;

        if (config.genderSpecific && genero !== config.genderSpecific) {
            return `${param.replace(/-/g, ' ').toUpperCase()}: ${value} ${config.unit}. No aplicable para género ${genero}.`;
        }

        const isLow = value < config.min;
        const isHigh = value > config.max;
        const status = isLow ? 'bajo' : (isHigh ? 'alto' : 'normal');

        return `${param.replace(/-/g, ' ').toUpperCase()}: ${value} ${config.unit} (${status}). ${config.indica}. ${(isLow || isHigh) ? config.alteracion : 'Dentro del rango normal.'}`;
    }


    // Show popup and load existing data when typing in the input field
    bioquimicosInput.addEventListener('input', function () {
        console.log('Input event triggered on parametros-bioquimicos');
        console.log(`bioquimicosInput value: "${this.value}"`);
        if (this.value.length > 0) {
            console.log('Showing bioquimicos popup');
            bioquimicosContainer.style.display = 'flex';
            console.log(`bioquimicosContainer display: ${bioquimicosContainer.style.display}`);
            warningContainer.style.display = 'none';
            console.log(`warningContainer display: ${warningContainer.style.display}`);

            // Ensure form exists
            const form = document.getElementById('bioquimicos-form');
            if (!form) {
                console.error('Form bioquimicos-form not found');
                return;
            }
            console.log('bioquimicos-form found, proceeding to load values');


            // // Load existing values from result spans into the popup form inputs
            fields.forEach(field => {
                console.log(`Processing field: ${field.label} (input: ${field.input}, result: ${field.result})`);
                const input = document.getElementById(field.input);
                const result = document.getElementById(field.result);
                if (!input) {
                    console.error(`Input ${field.input} not found`);
                    return;
                }
                if (!result) {
                    console.error(`Result ${field.result} not found`);
                    input.value = '';
                    console.log(`No result element for ${field.label}, clearing ${field.input}`);
                    return;
                }
                const spanValue = result.textContent.trim();
                console.log(`Result ${field.result} found, textContent: "${spanValue}"`);

                if (spanValue && spanValue !== '---') {
                    console.log(`Attempting to parse value for ${field.label}: "${spanValue}"`);
                    const value = parseFloat(spanValue);
                    if (!isNaN(value)) {
                        // Format value based on field-specific decimals
                        const decimals = ['pcr-ultrasensible', 'hba1c', 'tsh'].includes(field.input) ? 2 : ['colesterol-total', 'hdl', 'trigliceridos', 'glucosa-ayunas', 'alt', 'ggt'].includes(field.input) ? 0 : 1;
                        console.log(`Formatting ${field.label} with ${decimals} decimals`);
                        input.value = value.toFixed(decimals);
                        console.log(`Loaded ${field.label}: ${input.value} into ${field.input}`);
                    } else {
                        console.log(`Non-numeric value "${spanValue}" in ${field.label}, clearing ${field.input}`);
                        input.value = '';
                    }
                } else {
                    console.log(`Empty or placeholder value "${spanValue}" in ${field.label}, clearing ${field.input}`);
                    input.value = '';
                }
                console.log(`Final value for ${field.input}: "${input.value}"`);
            });
        }
    });
    // Function to analyze biochemical results and generate clinical interpretation
    function formatParentheticalValues(text) {
        return text.replace(/\((\D*)([^)]+)\)/g, (match, prefix, value) => {
            return `(${prefix}<span class="affected-value"><strong>${value}</strong></span>)`;
        });
    }

    function analyzeBioquimicoResults(entries, genero = 'masculino') {
        const results = [];
        const values = {};
        entries.forEach(({ field, value }) => {
            values[field.input] = value;
        });

        // Calculate HOMA-IR if Insulin and Glucose are available
        const insulina = values['insulina'] || 0;
        const glucosa = values['glucosa-ayunas'] || 0;
        const hba1c = values['hba1c'] || 0;
        const colesterolTotal = values['colesterol-total'] || 0;
        const apoB = values['apolipoproteina-b'] || 0;
        const homaIR = insulina && glucosa ? (insulina * (glucosa / 18)) / 22.5 : 0;

        // Check for Dislipidemia and Cardiovascular Risk
        if (colesterolTotal > 200 || apoB > 100) {
            results.push('<h2>Riesgo Cardiovascular y Dislipidemia</h2>' + formatParentheticalValues(
                '<p><strong>Perfil Lipídico Alterado Detectado</strong>: Niveles de Colesterol Total (<strong>' + colesterolTotal + ' mg/dL</strong>) o Apolipoproteína B (<strong>' + apoB + ' mg/dL</strong>) por encima de los límites óptimos. La ApoB es un marcador superior al LDL para predecir eventos cardiovasculares ya que refleja el número total de partículas aterogénicas. Recomendaciones: priorizar grasas insaturadas, aumentar el consumo de fibra soluble, realizar ejercicio aeróbico regular y considerar tratamiento farmacológico (estatinas) si el riesgo global es alto.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Colesterol Total > 200 mg/dL: Asociado a hipercolesterolemia primaria o secundaria a dieta/estilo de vida.</p>' +
                '<p>Apolipoproteína B > 100 mg/dL: Indica una alta concentración de partículas aterogénicas circulantes.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Mayor riesgo de formación de placa de ateroma, hipertensión y eventos coronarios a largo plazo.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Nutrición: Dieta baja en grasas saturadas y trans; aumentar omega-3 y fibra.</p>' +
                '<p>- Actividad Física: 150 min/semana de ejercicio aeróbico de intensidad moderada.</p>' +
                '<p>- Monitoreo: Perfil lipídico completo cada 3-6 meses.</p>'
            ));
        }


        // Check for Vitamina D Deficiency
        const vitaminaD = values['vitamina-d'] || 0;
        if (vitaminaD < 30) {
            results.push('<h2>Deficiencia de Vitamina D</h2>' + formatParentheticalValues(
                '<p><strong>Deficiencia de Vitamina D Detectada</strong>: Niveles bajos (menor de 30 ng/mL) por secuestro en tejido adiposo o baja exposición solar. Riesgos: osteoporosis, fracturas, debilidad muscular, resistencia a insulina. Recomendaciones: suplementar 50,000 UI semanales (8 semanas), luego 1,000-2,000 UI/día (objetivo: <strong>30-50 ng/mL</strong>), exposición solar 15-30 min/día, medir cada 3-6 meses, ejercicio con pesas.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Vitamina D menor de 30 ng/mL: Deficiencia asociada a baja exposición solar o secuestro en tejido adiposo.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Secuestro en tejido adiposo: La vitamina D liposoluble se acumula en grasa, reduciendo su biodisponibilidad.</p>' +
                '<p>Baja síntesis: Insuficiente exposición a UVB o problemas de absorción intestinal, ej. malabsorción.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Mayor riesgo de osteoporosis, fracturas óseas, debilidad muscular, y resistencia a insulina.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Alimentos ricos en vitamina D (pescado graso, yema de huevo, alimentos fortificados).</p>' +
                '<p>- Suplementos: 50,000 UI/sem por 8 semanas, luego 1,000-2,000 UI/dia.</p>' +
                '<p>- Estilo de vida: Exposición solar moderada 15-30 min/día y ejercicios de resistencia.</p>' +
                '<p>- Monitoreo: Medir niveles de vitamina D cada 3-6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: Hormonas y su Impacto en el Peso y Metabolismo: La deficiencia de vitamina D contribuye a resistencia a insulina y aumento de grasa visceral, afectando el metabolismo general.</p>'
            ));
        }

        // Check for Fosfatasa Alcalina Elevada
        const fosfatasaAlcalina = values['fosfatasa-alcalina'] || 0;

        const ggt = values['ggt'] || 0;
        if (fosfatasaAlcalina > 140) {
            results.push('<h2>Fosfatasa Alcalina Elevada</h2>' + formatParentheticalValues(
                '<p><strong>Fosfatasa Alcalina Elevada Detectada</strong>: Niveles mayores de 140 U/L, sugieren recambio óseo acelerado (por déficit de vitamina D) o daño hepático (NAFLD/colestasis). Riesgos: osteoporosis, fracturas, enfermedad hepática. Recomendaciones: medir vitamina D, PTH, calcio; realizar densitometría ósea (DEXA); evaluar hígado (ultrasonido, GGT: <strong>' + ggt.toFixed(2) + ' U/L</strong>); suplementar vitamina D y calcio (<strong>1,200 mg/día</strong>), considerar bifosfonatos si osteoporosis confirmada.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Fosfatasa Alcalina mayor de 140 U/L: Indica recambio óseo o daño hepatobiliar.</p>' +
                '<p>GGT (<strong>' + ggt.toFixed(2) + ' U/L</strong>): Sugiere estrés oxidativo o colestasis.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Recambio óseo: Déficit de vitamina D o hiperparatiroidismo secundario aumenta actividad osteoblástica.</p>' +
                '<p>Daño hepático: Inflamación o acumulación de grasa en hígado (NAFLD) eleva fosfatasa.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo de osteoporosis, fracturas óseas, o progresión a enfermedades hepáticas como NAFLD o colestasis.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Diagnóstico: Medir vitamina D, PTH, calcio; realizar densitometría ósea (DEXA) y ultrasonido hepático.</p>' +
                '<p>- Suplementos: Vitamina D (1,000-2,000 UI/día) y calcio (1,200 mg/día).</p>' +
                '<p>- Fármacos: Bifosfonatos si se confirma osteoporosis.</p>' +
                '<p>- Monitoreo: Evaluar marcadores hepáticos y óseos cada 3-6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>: Marcadores Hepáticos y Renales en Obesidad y Síndrome Metabólico: La fosfatasa alcalina elevada puede reflejar daño hepático relacionado con obesidad o inflamación sistémica.</p>'
            ));
        }

        // Check for Hipotiroidismo
        const tsh = values['tsh'] || 0;
        if (tsh > 4.5) {
            results.push('<h2>Riesgo de Hipotiroidismo</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Hipotiroidismo Detectado</strong>: TSH elevada ( mas de 4.5 mUI/L) sugiere disfunción tiroidea, reduciendo metabolismo basal y favoreciendo ganancia de peso (<strong>5-10 kg</strong>). Riesgos: fatiga, aumento de LDL, resistencia a insulina. Recomendaciones: medir T4 libre (normal: <strong>0.8-1.8 ng/dL</strong>), iniciar levotiroxina si T4 (<0.8), monitorear TSH cada 6-8 semanas, descartar hipotiroidismo subclínico.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>TSH (mayor de 4.5 mUI/L): Indica disfunción tiroidea, posiblemente hipotiroidismo primario o subclínico.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Disfunción tiroidea: Reducción de hormonas tiroideas (T3/T4) disminuye el metabolismo basal.</p>' +
                '<p>Impacto metabólico: Aumenta acumulación de grasa y resistencia a insulina.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Fatiga crónica, ganancia de peso, hiperlipidemia, y riesgo de diabetes tipo 2.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Diagnóstico: Medir T4 libre y anticuerpos anti-TPO para descartar tiroiditis autoinmune.</p>' +
                '<p>- Fármacos: Levotiroxina si T4 libre ( menos de 0.8 ng/dL).</p>' +
                '<p>- Estilo de vida: Dieta equilibrada, ejercicio moderado.</p>' +
                '<p>- Monitoreo: TSH cada 6-8 semanas hasta estabilización.</p>' +
                '<p><strong>Explicación Integrada</strong>: Hormonas y su Impacto en el Peso y Metabolismo: La TSH elevada contribuye a ganancia de peso y resistencia a insulina, afectando el metabolismo energético.</p>'
            ));
        }

        // Check for Testosterona Baja (Hombres)
        const testosterona = values['testosterona'] || 0;
        if (genero === 'masculino' && testosterona > 0 && testosterona < 300) {
            results.push('<h2>Testosterona Baja</h2>' + formatParentheticalValues(
                '<p><strong>Testosterona Baja Detectada</strong>: Niveles bajos (menor de 300 ng/dL) promueven la acumulación de grasa visceral y pérdida de masa muscular, un proceso exacerbado por citocinas inflamatorias (IL-6). Riesgos: síndrome metabólico, fatiga crónica y disfunción eréctil. Recomendaciones: realizar entrenamiento de fuerza regular, asegurar niveles óptimos de zinc y vitamina D, mejorar la calidad del sueño y evaluar la sensibilidad a la insulina. En casos de niveles persistentes (menor de 200 ng/dL) con sintomatología clínica, se debe considerar la terapia de reemplazo hormonal bajo supervisión médica.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Testosterona (menor de 300 ng/dL): Niveles por debajo del rango óptimo asociados a inflamación sistémica o disfunción del eje HPT.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Inflamación Sistémica: Las citocinas como IL-6 inhiben directamente la producción de testosterona en las células de Leydig.</p>' +
                '<p>Aromatización Adiposa: El exceso de tejido adiposo aumenta la conversión de testosterona en estrógenos, cerrando un círculo vicioso de ganancia de grasa.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Aumento de la circunferencia abdominal, sarcopenia (pérdida muscular), disminución de la lívido y mayor riesgo de síndrome metabólico.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Estilo de vida: Entrenamiento de fuerza 3-4 veces por semana, higiene del sueño (7-8 horas).</p>' +
                '<p>- Suplementación Nutricional: Zinc (30 mg/día) y Vitamina D (mantener >30 ng/mL).</p>' +
                '<p>- Monitoreo: Reevaluación de testosterona libre y total junto con marcadores metabólicos cada 3-6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: El eje hormonal está estrechamente ligado al metabolismo; la optimización de la testosterona es clave para la recomposición corporal y la salud metabólica masculina.</p>'
            ));
        }


        // Check for Cortisol Elevado
        const cortisol = values['cortisol'] || 0;
        if (cortisol > 25) {
            results.push('<h2>Cortisol Elevado</h2>' + formatParentheticalValues(
                '<p><strong>Cortisol Elevado Detectado</strong>: Niveles altos (mayor de 25 µg/dL) secundarios a estrés crónico promueven la acumulación de grasa abdominal, hiperglucemia y resistencia a la insulina. Riesgos: síndrome metabólico, hipertensión arterial y catabolismo muscular. Recomendaciones: implementar técnicas de reducción de estrés (mindfulness, yoga), asegurar un sueño reparador (<strong>7-8 h de sueño</strong>), seguir una dieta rica en magnesio y omega-3, limitar cafeína y azúcares simples, y considerar la evaluación del cortisol salival para descartar síndrome de Cushing.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Cortisol (mayor de 25 µg/dL): Indicativo de activación crónica del eje HPA (estrés) o hipercortisolismo.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Activación del Eje HPA: El estrés aumenta el cortisol, lo que estimula la lipogénesis en depósitos de grasa visceral.</p>' +
                '<p>Resistencia a la Leptina: El exceso de cortisol interfiere con las señales de saciedad a nivel del sistema nervioso central.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Obesidad central (abdominal), hipertensión, pérdida de densidad ósea y mayor susceptibilidad a infecciones.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Higiene de Vida: Gestión activa del estrés, regularización de horarios de sueño.</p>' +
                '<p>- Nutrición: Alimentos densos en nutrientes (espinacas, semillas, pescado azul).</p>' +
                '<p>- Evaluación Médica: Consulta para descartar patologías glándulares si los niveles persisten elevados.</p>' +
                '<p>- Seguimiento: Medición de cortisol matutino y glucosa basal cada 3-6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: El cortisol es la "hormona del estrés"; su elevación prolongada sabotea los esfuerzos de pérdida de peso al desplazar el tejido adiposo hacia la zona abdominal.</p>'
            ));
        }


        // Check for Inflamación Sistémica
        const pcr = values['pcr-ultrasensible'] || 0;
        if (pcr > 3) {
            results.push('<h2>Inflamación Sistémica</h2>' + formatParentheticalValues(
                '<p><strong>Inflamación Sistémica Detectada</strong>: PCR elevada (mayor de 3 mg/L) indica inflamación crónica por IL-6/TNF-alfa desde tejido adiposo visceral. Riesgos: aterosclerosis, resistencia a insulina, pérdida muscular. Recomendaciones: dieta antiinflamatoria omega3, frutos rojos, fibra, ejercicio, estatinas o metformina, evaluar perfil cardiovascular.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>PCR ultrasensible (mas de 3 mg/L): Inflamación sistémica por tejido adiposo disfuncional.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Inflamación crónica: Adipocitos liberan IL-6 y TNF-alfa, promoviendo inflamación sistémica.</p>' +
                '<p>Estrés oxidativo: Radicales libres dañan vasos, aumentando riesgo cardiovascular.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Aterosclerosis, resistencia a insulina, pérdida muscular, y riesgo cardiovascular elevado.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Antiinflamatoria, añade omega3, frutos rojos, fibra, cúrcuma.</p>' +
                '<p>- Ejercicio: Combinar aeróbico y resistencia para reducir inflamación.</p>' +
                '<p>- Fármacos: Estatinas (si LDL elevado), metformina (si resistencia a insulina).</p>' +
                '<p>- Monitoreo: PCR y perfil lipídico cada 3-6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>:  PCR alto + IL-6/TNF-alfa alto = Inflamación Sistémica: La inflamación crónica impulsa resistencia a insulina y daño vascular.</p>'
            ));
        }

        // Check for Hígado Graso (NAFLD) with ALT, AST, GGT
        const alt = values['alt'] || 0;
        const ast = values['ast'] || 0;
        const albumina = values['albumina'] || 0;
        if (alt > (genero === 'masculino' ? 55 : 45) && ggt > (genero === 'masculino' ? 61 : 36) && alt > ast) {
            results.push('<h2>Hígado Graso (NAFLD)</h2>' + formatParentheticalValues(
                '<p><strong>Hígado Graso (NAFLD) Detectado</strong>: ALT (>' + (genero === 'masculino' ? 55 : 45) + ' U/L) y GGT (>' + (genero === 'masculino' ? 61 : 36) + ' U/L) elevados, con ALT > AST, sugieren acumulación de grasa en hígado por ácidos grasos libres y resistencia a insulina. Riesgos: esteatohepatitis (NASH), fibrosis, cirrosis. Recomendaciones: pérdida de peso (<strong>5-10%</strong>), dieta mediterránea (aceite de oliva, nueces, evitar fructosa), pioglitazona (si diabetes), ultrasonido o elastografía hepática.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>ALT (>' + (genero === 'masculino' ? 55 : 45) + ' U/L): Indica daño hepático por acumulación de grasa.</p>' +
                '<p>GGT (>' + (genero === 'masculino' ? 61 : 36) + ' U/L): Marcador de colestasis y estrés oxidativo.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Acumulación de triglicéridos: Exceso de ácidos grasos libres en hepatocitos.</p>' +
                '<p>Inflamación: Activación de células de Kupffer impulsa progresión a NASH.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Progresión a esteatohepatitis (NASH), fibrosis, cirrosis, o carcinoma hepatocelular.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Pérdida de peso: Reducción del 5-10% del peso mejora esteatosis.</p>' +
                '<p>- Dieta: Mediterránea (aceite de oliva, pescado, evitar fructosa/alcohol).</p>' +
                '<p>- Fármacos: Pioglitazona (si diabetes), vitamina E (800 UI/día en NASH sin diabetes).</p>' +
                '<p>- Diagnóstico: Ultrasonido o elastografía hepática (FibroScan).</p>' +
                '<p><strong>Explicación Detallada</strong>: Marcadores Hepáticos y Renales en Obesidad y Síndrome Metabólico: ALT y GGT elevados reflejan acumulación de grasa hepática relacionada con obesidad.</p>'
            ));
        } else if (alt > (genero === 'masculino' ? 55 : 45) || ggt > (genero === 'masculino' ? 61 : 36)) {
            results.push('<h2>Riesgo de Hígado Graso (NAFLD)</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Hígado Graso (NAFLD)</strong>: ALT o GGT elevados indican posible acumulación de grasa en hígado. Evaluar con pruebas hepáticas y PCR (PCR: <strong>' + pcr.toFixed(2) + ' mg/L</strong>). Recomendaciones: pérdida de peso, dieta mediterránea, evitar alcohol, considerar vitamina E en NASH.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>ALT o GGT: Sugieren acumulación de grasa hepática.</p>' +
                '<p>PCR (<strong>' + pcr.toFixed(2) + ' mg/L</strong>): Indica inflamación sistémica.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Acumulación de lípidos: Exceso de ácidos grasos libres por resistencia a insulina.</p>' +
                '<p>Inflamación: Contribuye a progresión de esteatosis a NASH.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo de progresión a NASH, fibrosis, o cirrosis.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Pérdida de peso: Reducción del 5-10% del peso.</p>' +
                '<p>- Dieta: Mediterránea, evitar alcohol y fructosa.</p>' +
                '<p>- Fármacos: Vitamina E (800 UI/día) en NASH sin diabetes.</p>' +
                '<p>- Diagnóstico: Ultrasonido hepático.</p>' +
                '<p><strong>Explicación Detallada</strong>: Marcadores Hepáticos y Renales en Obesidad y Síndrome Metabólico: ALT o GGT elevados sugieren NAFLD relacionado con obesidad.</p>'
            ));
        }
        if (ast > alt && albumina < 3.5) {
            results.push('<h2>Riesgo de Fibrosis Hepática</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Fibrosis Hepática</strong>: AST > ALT y albúmina baja (<3.5 g/dL) sugieren progresión de NAFLD a fibrosis o cirrosis. Recomendaciones: elastografía hepática (FibroScan), consultar hepatólogo, controlar factores metabólicos.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>AST > ALT: Indica daño hepático avanzado.</p>' +
                '<p>Albúmina (<3.5 g/dL): Reducción de síntesis hepática.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Fibrosis: Inflamación crónica y acumulación de grasa en hígado.</p>' +
                '<p>Disfunción hepática: Reducción de capacidad sintética del hígado.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Progresión a cirrosis, carcinoma hepatocelular, o fallo hepático.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Diagnóstico: Elastografía hepática (FibroScan), biopsia si es necesario.</p>' +
                '<p>- Consulta: Hepatólogo para manejo especializado.</p>' +
                '<p>- Control metabólico: Dieta baja en carbohidratos, pérdida de peso.</p>' +
                '<p><strong>Explicación Detallada</strong>: Marcadores Hepáticos y Renales en Obesidad y Síndrome Metabólico: AST > ALT y albúmina baja indican progresión de NAFLD.</p>'
            ));
        }

        // Check for Renal Dysfunction
        const creatinina = values['creatinina'] || 0;
        const bun = values['bun'] || 0;
        if (creatinina > 1.2 || bun > 20) {
            results.push('<h2>Disfunción Renal</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Disfunción Renal Detectado</strong>: Creatinina ( mayor de 1.2 mg/dL) o BUN ( mas de 20 mg/dL) elevados sugieren hiperfiltración glomerular o daño renal crónico (ERC) por obesidad, resistencia a insulina o inflamación. Riesgos: nefropatía, proteinuria. Recomendaciones: controlar presión arterial (<strong><130/80 mmHg</strong>, preferir IECA/ARA II), dieta baja en sodio y proteínas moderadas (<strong>0.8 g/kg</strong>), evitar nefrotóxicos (AINEs), evaluar microalbuminuria.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Creatinina alta ( mas de 1.2 mg/dL): Indica reducción de filtración glomerular.</p>' +
                '<p>BUN alto ( mas de 20 mg/dL): Sugiere disfunción renal o deshidratación.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Hiperfiltración: Obesidad y resistencia a insulina sobrecargan los riñones.</p>' +
                '<p>Inflamación: Citocinas IL-6 contribuyen a daño renal.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Progresión a enfermedad renal crónica, proteinuria, y riesgo cardiovascular.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Baja en sodio, proteínas moderadas (0.8 g/kg).</p>' +
                '<p>- Fármacos: IECA o ARA II para control de presión arterial.</p>' +
                '<p>- Evitar: Nefrotóxicos: AINEs, ciertos antibióticos.</p>' +
                '<p>- Monitoreo: Microalbuminuria y creatinina cada 3-6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>: Marcadores Hepáticos y Renales en Obesidad y Síndrome Metabólico: Creatinina y BUN elevados reflejan daño renal por obesidad.</p>'
            ));
        }

        // Check for Resistencia Leptínica and ↓ Adiponectina
        const leptina = values['leptina'] || 0;
        const adiponectina = values['adiponectina'] || 0;
        if (leptina > (genero === 'masculino' ? 15 : 30) && adiponectina < 5) {
            results.push('<h2>Riesgo Metabólico Elevado</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo Metabólico Elevado</strong>: Resistencia leptínica (leptina >' + (genero === 'masculino' ? 15 : 30) + ' ng/mL) y baja adiponectina (<5 µg/mL) reflejan disfunción hormonal por obesidad inflamatoria. Consecuencias: hambre constante, resistencia a insulina, síndrome metabólico. Recomendaciones: pérdida de peso (<strong>5-10%</strong>), ejercicio de fuerza, dieta mediterránea, GLP-1 (liraglutida) o pioglitazona, suplementos de omega-3 y magnesio.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Leptina alta(>' + (genero === 'masculino' ? 15 : 30) + ' ng/mL): Indica resistencia a leptina.</p>' +
                '<p>Adiponectina baja (<5 µg/mL): Reducción de sensibilidad a insulina.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia a leptina: Adipocitos inflamados no responden a señales de saciedad.</p>' +
                '<p>Baja adiponectina: Disminuye acción antiinflamatoria y sensitividad a insulina.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Hambre constante, resistencia a insulina, y riesgo de síndrome metabólico.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Pérdida de peso: Reducción del 5-10% del peso.</p>' +
                '<p>- Dieta: Mediterránea, rica en omega-3 y magnesio.</p>' +
                '<p>- Fármacos: GLP-1 (liraglutida), pioglitazona.</p>' +
                '<p>- Monitoreo: Leptina y adiponectina cada 6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: Marcadores Inflamatorios y Metabólicos: Leptina elevada y adiponectina baja indican disfunción metabólica e inflamación.</p>'
            ));
        } else if (leptina > (genero === 'masculino' ? 15 : 30)) {
            results.push('<h2>Resistencia Leptínica</h2>' + formatParentheticalValues(
                '<p><strong>Resistencia Leptínica Detectada</strong>: Leptina elevada indica resistencia, con inflamación (IL-6/TNF-alfa) y hambre constante. Riesgo: obesidad metabólica. Recomendaciones: pérdida de peso, ejercicio de fuerza, mejorar sueño, considerar GLP-1.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Leptina alta (>' + (genero === 'masculino' ? 15 : 30) + ' ng/mL): Resistencia a señalización de saciedad.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Inflamación: Citocinas (IL-6/TNF-alfa) interfieren con receptores de leptina.</p>' +
                '<p>Obesidad: Aumenta producción de leptina sin efecto regulador.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Hambre constante, aumento de peso, y riesgo de síndrome metabólico.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Pérdida de peso: Reducción del 5-10% del peso.</p>' +
                '<p>- Ejercicio: Fuerza para mejorar sensibilidad a leptina.</p>' +
                '<p>- Fármacos: Considerar agonistas de GLP-1.</p>' +
                '<p>- Monitoreo: Leptina cada 6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: Marcadores Inflamatorios y Metabólicos: La resistencia a leptina impulsa inflamación y obesidad metabólica.</p>'
            ));
        } else if (adiponectina < 5) {
            results.push('<h2>Adiponectina Baja</h2>' + formatParentheticalValues(
                '<p><strong>Adiponectina Baja</strong>: Niveles bajos ( menos de 5 µg/mL) contribuyen a resistencia a insulina, inflamación y NAFLD. Recomendaciones: dieta rica en omega-3, ejercicio, pioglitazona o GLP-1, suplementos de magnesio.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Adiponectina baja ( menor de 5 µg/mL): Reducción de acción antiinflamatoria y metabólica.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Disfunción adipocitaria: Obesidad reduce secreción de adiponectina.</p>' +
                '<p>Inflamación: Contribuye a resistencia a insulina y NAFLD.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Mayor riesgo de resistencia a insulina, NAFLD, y síndrome metabólico.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Rica en omega-3 (pescado, nueces) y magnesio.</p>' +
                '<p>- Ejercicio: Aeróbico y resistencia para aumentar adiponectina.</p>' +
                '<p>- Fármacos: Pioglitazona o agonistas de GLP-1.</p>' +
                '<p>- Monitoreo: Adiponectina cada 6 meses.</p>' +
                '<p><strong>Explicación Integrada</strong>: Marcadores Inflamatorios y Metabólicos: La adiponectina baja contribuye a inflamación y disfunción metabólica.</p>'
            ));
        }

        // Check for Diabetes No Controlada
        if (glucosa >= 126 && hba1c >= 6.5) {
            results.push('<h2>Diabetes No Controlada</h2>' + formatParentheticalValues(
                '<p><strong>Diabetes No Controlada Detectada</strong>: Glucosa en ayunas  mayor de 126 mg/dL y HbA1c  mayor de 6.5% indican hiperglucemia sostenida por resistencia o deficiencia de insulina. Riesgos: neuropatía, retinopatía, nefropatía, cetoacidosis. Recomendaciones: monitoreo glucémico frecuente, HbA1c cada 3 meses (objetivo: <strong><7%</strong>), metformina o insulina (según tipo), dieta baja en carbohidratos, consultar endocrinólogo.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Glucosa alta( mayor de 126 mg/dL): Hiperglucemia sostenida.</p>' +
                '<p>HbA1c alto (mas del 6.5%): Mal control glucémico a largo plazo.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia a insulina: Disminuye captación de glucosa en tejidos.</p>' +
                '<p>Deficiencia de insulina: En diabetes tipo 1 o avanzada tipo 2.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Daño vascular, neuropatía, retinopatía, nefropatía, y riesgo de cetoacidosis.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Baja en carbohidratos refinados, alta en fibra.</p>' +
                '<p>- Fármacos: Metformina, insulina, inhibidores de SGLT2 o GLP-1.</p>' +
                '<p>- Monitoreo: Glucosa diaria, HbA1c cada 3 meses.</p>' +
                '<p>- Consulta: Endocrinólogo para manejo integral.</p>' +
                '<p><strong>Explicación Detallada</strong>: Relación entre Glucosa, HbA1c e Insulina: Glucosa y HbA1c elevados indican diabetes no controlada, impulsada por resistencia o deficiencia de insulina.</p>'
            ));
        }

        // Check for Prediabetes or Diabetes
        if (hba1c >= 5.7 && hba1c < 6.5) {
            results.push('<h2>Prediabetes</h2>' + formatParentheticalValues(
                '<p><strong>Prediabetes Detectada</strong>: HbA1c entre 5.7% y 6.4% indica riesgo elevado de diabetes. Recomendaciones: dieta baja en carbohidratos (evitar azúcar, harinas), ejercicio (aeróbico + fuerza), pérdida de peso (<strong>5-10%</strong>), monitoreo anual de HbA1c, evaluar glucosa en ayunas.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>HbA1c alto (5.7–6.4%): Indica riesgo de progresión a diabetes.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia a insulina: Reducción temprana de sensibilidad a insulina.</p>' +
                '<p>Hiperglucemia leve: Aumento gradual de glucosa en sangre.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo elevado de diabetes tipo 2 y complicaciones cardiovasculares.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Baja en carbohidratos refinados, alta en fibra.</p>' +
                '<p>- Ejercicio: Aeróbico (30 min/día) y resistencia.</p>' +
                '<p>- Pérdida de peso: Reducción del 5–10% del peso.</p>' +
                '<p>- Monitoreo: HbA1c y glucosa en ayunas anualmente.</p>' +
                '<p><strong>Explicación Detallada</strong>: Relación entre Glucosa, HbA1c e Insulina: HbA1c en rango de prediabetes indica resistencia a insulina incipiente.</p>'
            ));
        } else if (hba1c >= 6.5) {
            results.push('<h2>Diabetes Mellitus</h2>' + formatParentheticalValues(
                '<p><strong>Diabetes Mellitus Detectada</strong>: HbA1c mayor de 6.5% confirma diabetes. Riesgos: daño vascular, infecciones. Recomendaciones: metformina, inhibidores de SGLT2 o GLP-1, monitoreo glucémico, HbA1c cada 3 meses (objetivo: <strong><7%</strong>), dieta y ejercicio.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>HbA1c alto (mayor de 6.5%): Confirma diabetes mellitus.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia o deficiencia de insulina: Impide control glucémico adecuado.</p>' +
                '<p>Estrés oxidativo: Contribuye a daño vascular.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Daño vascular, infecciones recurrentes, y riesgo de complicaciones diabéticas.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Baja en carbohidratos, alta en fibra.</p>' +
                '<p>- Fármacos: Metformina, inhibidores de SGLT2, o GLP-1.</p>' +
                '<p>- Monitoreo: HbA1c cada 3 meses, glucosa diaria.</p>' +
                '<p>- Consulta: Endocrinólogo.</p>' +
                '<p><strong>Explicación Detallada</strong>: Relación entre Glucosa, HbA1c e Insulina: HbA1c mayor de 6.5% confirma diabetes con resistencia o deficiencia de insulina.</p>'
            ));
        }

        // Check for Insulin Resistance
        if (insulina > 25 && homaIR > 2.5) {
            results.push('<h2>Resistencia a la Insulina</h2>' + formatParentheticalValues(
                '<p><strong>Resistencia a la Insulina Detectada</strong>: Insulina elevada (mayor de 25 µU/mL) y HOMA-IR <strong>' + homaIR.toFixed(2) + '</strong> (mayor de 2.5) indican resistencia a insulina, impulsada por obesidad visceral y citocinas (TNF-α, IL-6). Riesgos: síndrome metabólico, diabetes tipo 2, NAFLD. Recomendaciones: dieta baja en carbohidratos, ejercicio de fuerza, pérdida de peso, metformina o pioglitazona.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Insulina alta( mayor de 25 µU/mL): Indica hiperinsulinemia compensatoria.</p>' +
                '<p>HOMA-IR alta (mayor de 2.5): Confirma resistencia a insulina.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Inflamación: Citocinas (TNF-alfa, IL-6) bloquean señalización de insulina.</p>' +
                '<p>Obesidad visceral: Aumenta ácidos grasos libres, empeorando resistencia.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo de diabetes tipo 2, síndrome metabólico, y NAFLD.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Baja en carbohidratos refinados, alta en fibra.</p>' +
                '<p>- Ejercicio: Fuerza y aeróbico para mejorar sensibilidad a insulina.</p>' +
                '<p>- Fármacos: Metformina o pioglitazona.</p>' +
                '<p>- Monitoreo: HOMA-IR y glucosa cada 3–6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>: Relación entre Glucosa, HbA1c e Insulina: Insulina elevada y HOMA-IR alto indican resistencia a insulina, precursora de diabetes.</p>'
            ));
        }

        // Check for Obesidad Metabólica (Síndrome Metabólico)
        const tg = values['trigliceridos'] || 0;
        const hdl = values['hdl'] || 0;
        const tgHdlRatio = hdl !== 0 ? tg / hdl : 0;
        if (tg > 150 && hdl < (genero === 'masculino' ? 40 : 50) && (glucosa >= 100 || hba1c >= 5.7)) {
            results.push('<h2>Obesidad Metabólica (Síndrome Metabólico)</h2>' + formatParentheticalValues(
                '<p><strong>Obesidad Metabólica (Síndrome Metabólico) Detectada</strong>: Elevados triglicéridos ( mayor de 150 mg/dL), bajo HDL (<' + (genero === 'masculino' ? 40 : 50) + ' mg/dL), y glucosa elevada (ayunas mayor de 100 mg/dL o HbA1c mayor de 5.7%) indican resistencia a insulina y dislipidemia aterogénica. Riesgos: diabetes tipo 2, infarto, ACV, NAFLD. TG/HDL ratio: <strong>' + (tgHdlRatio !== 0 ? tgHdlRatio.toFixed(2) : 'N/A') + '</strong> ( mayor de 2.5 sugiere resistencia a insulina). Recomendaciones: dieta mediterránea (fibra, omega-3), ejercicio (aeróbico + fuerza), pérdida de peso (<strong>5-10%</strong>), metformina, fibratos o GLP-1, monitoreo cada 3-6 meses.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Triglicéridos altos (mayor de 150 mg/dL): Acumulación de lípidos por exceso de carbohidratos y grasas.</p>' +
                '<p>HDL bajo (<' + (genero === 'masculino' ? 40 : 50) + ' mg/dL): Pérdida de efecto cardioprotector.</p>' +
                '<p>HbA1c alta (mayor de 5.7%): Indica resistencia a insulina y mal control glucémico.</p>' +
                '<p>PCR ultrasensible alto (mayor de 3 mg/L): Inflamación crónica por adipocitos disfuncionales.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia a insulina: Adipocitos inflamados liberan citocinas (TNF-alfa, IL-6) que bloquean señalización de insulina.</p>' +
                '<p>Dislipidemia aterogénica: Exceso de ácidos grasos libres lleva a producción de VLDL.</p>' +
                '<p>Estrés oxidativo: Radicales libres dañan vasos, aumentando inflamación.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Mayor riesgo de diabetes tipo 2, enfermedad cardiovascular, y NAFLD.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Restricción de azúcares y grasas saturadas, priorizar fibra y omega-3.</p>' +
                '<p>- Ejercicio: Aeróbico (30 min/día) y resistencia.</p>' +
                '<p>- Fármacos: Metformina si prediabetes, estatinas si LDL elevado, fibratos si TG elevados.</p>' +
                '<p>- Monitoreo: Perfil lipídico y HbA1c cada 3–6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>: TG alto + HDL bajo + Glucosa alta = Obesidad Metabólica=Síndrome Metabólico: Estas alteraciones reflejan resistencia a insulina y dislipidemia aterogénica.</p>'
            ));
        } else if (tg > 150 || hdl < (genero === 'masculino' ? 40 : 50) || glucosa >= 100 || hba1c >= 5.7) {
            results.push('<h2>Riesgo de Obesidad Metabólica</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Obesidad Metabólica</strong>: Alteraciones en triglicéridos, HDL o glucosa (ayunas mayor de 100 mg/dL o HbA1c mayor de 5.7%) sugieren resistencia a insulina. TG/HDL ratio: <strong>' + (tgHdlRatio !== 0 ? tgHdlRatio.toFixed(2) : 'N/A') + '</strong> (mayor de 2.5 indica riesgo). Recomendaciones: evaluar obesidad abdominal, dieta mediterránea, ejercicio, monitoreo cada 3-6 meses.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Triglicéridos altos (mayor de 150 mg/dL) o  HDL bajo (<' + (genero === 'masculino' ? 40 : 50) + ' mg/dL): Indican dislipidemia.</p>' +
                '<p>Glucosa alta (mayor de 100 mg/dL) o HbA1c (mayor de 5.7%): Sugieren resistencia a insulina.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Resistencia a insulina: Reducción de captación de glucosa en tejidos.</p>' +
                '<p>Dislipidemia: Exceso de ácidos grasos libres aumenta VLDL.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo de síndrome metabólico, diabetes tipo 2, y enfermedad cardiovascular.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Mediterránea, rica en fibra y omega3.</p>' +
                '<p>- Ejercicio: Aeróbico y resistencia.</p>' +
                '<p>- Monitoreo: Perfil lipídico y glucosa cada 3–6 meses.</p>' +
                '<p><strong>Explicación Detallada</strong>: TG alto + HDL bajo + Glucosa alta = Obesidad Metabólica=Síndrome Metabólico: Estas alteraciones indican riesgo incipiente de síndrome metabólico.</p>'
            ));
        }

        // Check for Desnutrición Proteica
        const prealbumina = values['prealbumina'] || 0;
        const proteinaTotal = values['proteina-total'] || 0;
        if (albumina < 3.5 && prealbumina < 15 && pcr > 3) {
            results.push('<h2>Desnutrición Proteica</h2>' + formatParentheticalValues(
                '<p><strong>Desnutrición Proteica Detectada</strong>: Baja albúmina (menor de 3.5 g/dL), prealbúmina (menor de 15 mg/dL) y elevada PCR (mayor de 3 mg/L, por IL-6/TNF-alfa) sugieren déficit proteico e inflamación sistémica. Riesgos: infecciones, edema, mortalidad. Recomendaciones: aumentar ingesta proteica, dieta antiinflamatoria (omega-3, antioxidantes), consultar nutricionista.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Albúmina baja (menor de 3.5 g/dL): Síntesis hepática reducida por falta de aminoácidos.</p>' +
                '<p>Prealbúmina baja (menor de 15 mg/dL): Indica déficit proteico reciente.</p>' +
                '<p>PCR alto (mayor de 3 mg/L): Inflamación crónica cataboliza proteínas.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Déficit calórico-proteico: Degradación muscular para obtener energía.</p>' +
                '<p>Inflamación: Citocinas (IL-6/TNF-alfa) inhiben síntesis de albúmina.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Edema, pérdida muscular, inmunosupresión, y retraso en cicatrización.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Suplementos: Proteínas de alto valor biológico como el suero de leche, huevo.</p>' +
                '<p>- Dieta: Calorías suficientes, rica en antioxidantes.</p>' +
                '<p>- Diagnóstico: Evaluar causas como infecciones, cáncer, malabsorción.</p>' +
                '<p>- Monitoreo: Prealbúmina semanal.</p>' +
                '<p><strong>Explicación Integrada</strong>: Marcadores Inflamatorios y Metabólicos: La combinación de baja albúmina/prealbúmina y alta PCR indica desnutrición e inflamación.</p>'
            ));
        } else if (albumina < 3.5 || prealbumina < 15 || proteinaTotal < 6.0) {
            results.push('<h2>Riesgo de Desnutrición Proteica</h2>' + formatParentheticalValues(
                '<p><strong>Riesgo de Desnutrición Proteica</strong>: Baja albúmina, prealbúmina o proteína total, posiblemente con inflamación (PCR: <strong>' + pcr.toFixed(2) + ' mg/L</strong>). Evaluar estado nutricional y posible inflamación sistémica.</p>' +
                '<p><strong>Hallazgos Bioquímicos</strong>:</p>' +
                '<p>Albúmina baja (menor de 3.5 g/dL) o  Prealbúmina baja (menor de 15 mg/dL) o ↓ Proteína Total ( menos de 6.0 g/dL): Indican déficit proteico.</p>' +
                '<p><strong>Mecanismos Subyacentes</strong>:</p>' +
                '<p>Déficit proteico: Insuficiente ingesta o absorción de aminoácidos.</p>' +
                '<p>Inflamación: Puede exacerbar pérdida proteica.</p>' +
                '<p><strong>Consecuencias Clínicas</strong>:</p>' +
                '<p>Riesgo de edema, pérdida muscular, e inmunosupresión.</p>' +
                '<p><strong>Manejo</strong>:</p>' +
                '<p>- Dieta: Aumentar ingesta de proteínas de alto valor biológico.</p>' +
                '<p>- Diagnóstico: Evaluar causas (malabsorción, infecciones).</p>' +
                '<p>- Monitoreo: Prealbúmina y albúmina semanalmente.</p>' +
                '<p><strong>Explicación Integrada</strong>: Marcadores Inflamatorios y Metabólicos: Bajos niveles de proteínas séricas sugieren desnutrición con posible inflamación.</p>'
            ));
        }

        // Return analysis text with blank lines between entries
        return results.length > 0 ? results.join('<p></p>') : 'No se detectaron patrones clínicos significativos. Los valores están dentro de rangos normales o no hay datos suficientes para análisis.';
    }

    // Save values to the table with validation
    saveButton.addEventListener('click', function () {
        console.log('saveButton clicked');
        const genero = document.getElementById('genero')?.value || 'masculino';
        const warnings = [];
        const validEntries = [];

        fields.forEach(field => {
            const input = document.getElementById(field.input);
            const result = document.getElementById(field.result);
            const source = document.getElementById(field.source);
            console.log(`Processing ${field.input}: input=${!!input}, result=${!!result}, source=${!!source}, value=${input?.value}`);

            if (input && result && source && input.value) {
                const value = parseFloat(input.value);
                if (!isNaN(value)) {
                    // Validate range
                    if (value < field.range[0] || value > field.range[1]) {
                        warnings.push(`${field.label} (${value} ${field.unit}) fuera de rango (${field.range[0]}–${field.range[1]} ${field.unit}). Por favor, corrige.`);
                    } else {
                        const decimals = ['pcr-ultrasensible', 'hba1c', 'tsh'].includes(field.input) ? 2 : ['colesterol-total', 'hdl', 'trigliceridos', 'glucosa-ayunas', 'alt', 'ggt'].includes(field.input) ? 0 : 1;
                        validEntries.push({ field, value, decimals });
                        result.textContent = value.toFixed(decimals) + ' ' + field.unit;
                        source.textContent = 'Usuario';
                    }
                } else {
                    warnings.push(`${field.label} tiene un valor inválido (${input.value}).`);
                }
            } else if (input && input.value) {
                warnings.push(`Falta elemento para ${field.label}: result=${!!result}, source=${!!source}.`);
            }
        });

        if (warnings.length > 0) {
            warningContainer.innerHTML = `<strong>Errores:</strong><ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>`;
            warningContainer.style.display = 'block';
            console.warn('Validation warnings:', warnings);
            return; // Stop and let user correct
        }

        // Generate and display analysis in result-analisis
        const analysisText = analyzeBioquimicoResults(validEntries, genero);
        const analysisElement = document.getElementById('result-analisis');
        if (analysisElement) {
            analysisElement.innerHTML = analysisText;
        } else {
            console.error('Element with id "result-analisis" not found.');
        }
        warningContainer.style.display = 'none'; // Hide warnings if successful

        // Save valid entries
        validEntries.forEach(({ field, value, decimals }) => {
            const result = document.getElementById(field.result);
            const source = document.getElementById(field.source);
            result.textContent = value.toFixed(decimals);
            source.textContent = getBioquimicoExplanation(field.input, value, genero);
            console.log(`Asignado ${field.input}: ${value.toFixed(decimals)} a ${field.result}, source: ${source.textContent}`);
        });

        // Verify post-save DOM
        console.log('Post-save DOM check:');
        fields.forEach(field => {
            console.log(`${field.result}: ${document.getElementById(field.result)?.textContent || 'N/A'}, ${field.source}: ${document.getElementById(field.source)?.textContent || 'N/A'}`);
        });

        bioquimicosContainer.style.display = 'none';
        bioquimicosInput.value = '';
        document.getElementById('bioquimicos-form').reset();
        warningContainer.style.display = 'none';
        console.log('Pop-up form reset');
    });

    // Close popup without saving
    cancelButton.addEventListener('click', function () {
        bioquimicosContainer.style.display = 'none';
        bioquimicosInput.value = '';
        document.getElementById('bioquimicos-form').reset();
        warningContainer.style.display = 'none';
        console.log('Pop-up cancelled');
    });
});


// Function to fetch and display progress charts
async function showProgressCharts(clienteId) {
    if (!clienteId) {
        console.log('No clienteId provided, skipping showProgressCharts');
        return;
    }

    try {
        const q = query(collection(db, `clientes/${clienteId}/tomas`), orderBy('fecha', 'asc'));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log('No tomas found for cliente:', clienteId);
            alert('No hay datos disponibles para mostrar el progreso.');
            return;
        }

        // Helper to ensure numeric values
        const safeToNumber = (value) => {
            if (value === null || value === undefined) return null;
            const num = Number(value);
            return isNaN(num) ? null : num;
        };

        // Collect data for charts
        const dates = [];
        const pesoData = {
            actual: [],
            perdidaExceso: [],
            perdidaInicial: []
        };
        const grasaData = {
            actualPct: [],
            actualKg: [],
            metabolicaPct: [],
            metabolicaKg: [],
            deurenberg: [],
            cunBae: []
        };
        const musculoData = {
            mmt: [],
            Pctmmt: [],
            masaMagraActual: [],
            masaMagraMetabolic: []
        };
        const plieguesData = {
            tricipital: [],
            subescapular: [],
            suprailiaco: [],
            bicipital: [],
            pantorrilla: []
        };
        const circunferenciasData = {
            cintura: [],
            cadera: [],
            cuello: [],
            pantorrilla: [],
            brazo: [],
            brazo_contraido: []
        };
        const imcIccData = {
            imc: [],
            icc: []
        };
        const reservaProteicaData = {
            perimetroBrazo: [],
            areaMuscularBrazo: [],
            areaGrasaBrazo: []
        };
        const gastoEnergeticoData = {
            gasto: [],
            edadMetabolica: [],
            tmb: []
        };
        const nonNumericalData = {
            somatotipo: [],
            tipologiaActual: [],
            tipologiaMetabolica: [],
            imgActual: [],
            imgActualSource: [],
            imgMetabolic: [],
            imgMetabolicSource: [],
            imlgActual: [],
            imlgActualSource: [],
            imlgMetabolic: [],
            imlgMetabolicSource: []
        };

        // Calculate initial weight for % loss
        let pesoInicial = null;

        querySnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Document ${index} ID: ${doc.id}`, data);

            // Validate data structure
            if (!data.fecha) {
                console.warn(`Document ${doc.id} missing fecha, skipping`);
                return;
            }
            if (!data.resultados) {
                console.warn(`Document ${doc.id} missing resultados, using defaults`);
                data.resultados = {};
            }
            if (!data.medidas) {
                console.warn(`Document ${doc.id} missing medidas, using defaults`);
                data.medidas = { pliegues: {}, circunferencias: {} };
            }

            const fecha = data.fecha && data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
            dates.push(fecha.toLocaleDateString('es-ES', { year: '2-digit', month: 'numeric', day: 'numeric' }));

            // Peso
            const peso = safeToNumber(data.peso);
            pesoData.actual.push(peso);
            if (index === 0 && peso) pesoInicial = peso;
            const pesoIdeal = safeToNumber(data.resultados.pesoIdeal) || 70;
            pesoData.perdidaExceso.push(peso && pesoInicial && pesoIdeal ? ((pesoInicial - peso) / (pesoInicial - pesoIdeal) * 100) : null);
            pesoData.perdidaInicial.push(peso && pesoInicial ? ((pesoInicial - peso) / pesoInicial * 100) : null);

            // Grasa
            const grasaActualPct = safeToNumber(data.resultados.grasaPctActual) || safeToNumber(data.grasa_actual_conocida);
            grasaData.actualPct.push(grasaActualPct);
            const masaGrasaActual = safeToNumber(data.resultados.masaGrasaActual);
            grasaData.actualKg.push(masaGrasaActual || (peso && grasaActualPct ? (peso * grasaActualPct / 100) : null));
            grasaData.metabolicaPct.push(safeToNumber(data.resultados.grasaPctMetabolic));
            grasaData.metabolicaKg.push(safeToNumber(data.resultados.masaGrasaMetabolic));
            grasaData.deurenberg.push(safeToNumber(data.resultados.grasaPctDeurenberg));
            grasaData.cunBae.push(safeToNumber(data.resultados.grasaPctCUNBAE));

            // Músculo
            musculoData.mmt.push(safeToNumber(data.resultados.mmt));
            musculoData.Pctmmt.push(safeToNumber(data.resultados.Pctmmt));
            musculoData.masaMagraActual.push(safeToNumber(data.resultados.masaMagraActual));
            musculoData.masaMagraMetabolic.push(safeToNumber(data.resultados.masaMagraMetabolic));

            // Pliegues
            plieguesData.tricipital.push(safeToNumber(data.medidas.pliegues?.tricipital));
            plieguesData.subescapular.push(safeToNumber(data.medidas.pliegues?.subescapular));
            plieguesData.suprailiaco.push(safeToNumber(data.medidas.pliegues?.suprailiaco));
            plieguesData.bicipital.push(safeToNumber(data.medidas.pliegues?.bicipital));
            plieguesData.pantorrilla.push(safeToNumber(data.medidas.pliegues?.pantorrilla));

            // Circunferencias
            circunferenciasData.cintura.push(safeToNumber(data.medidas.circunferencias?.cintura));
            circunferenciasData.cadera.push(safeToNumber(data.medidas.circunferencias?.cadera));
            circunferenciasData.cuello.push(safeToNumber(data.medidas.circunferencias?.cuello));
            circunferenciasData.pantorrilla.push(safeToNumber(data.medidas.circunferencias?.pantorrilla));
            circunferenciasData.brazo.push(safeToNumber(data.medidas.circunferencias?.brazo));
            circunferenciasData.brazo_contraido.push(safeToNumber(data.medidas.circunferencias?.brazo_contraido));

            // IMC e ICC
            imcIccData.imc.push(safeToNumber(data.resultados.imc));
            imcIccData.icc.push(safeToNumber(data.resultados.icc));

            // Reserva Proteica
            const perimetroBrazo = safeToNumber(data.medidas.circunferencias?.brazo);
            reservaProteicaData.perimetroBrazo.push(perimetroBrazo);
            reservaProteicaData.areaMuscularBrazo.push(safeToNumber(data.resultados.amb));
            const pliegueTricipital = safeToNumber(data.medidas.pliegues?.tricipital);
            reservaProteicaData.areaGrasaBrazo.push(perimetroBrazo && pliegueTricipital ?
                ((perimetroBrazo * pliegueTricipital / 2) - (Math.PI * (pliegueTricipital / 2) ** 2)) : null);

            // Gasto Energético
            const tmb = safeToNumber(data.resultados.BRMEstimado);
            gastoEnergeticoData.gasto.push(tmb);
            gastoEnergeticoData.edadMetabolica.push(safeToNumber(data.resultados.edadMetabolica)); // Fix: uppercase M
            gastoEnergeticoData.tmb.push(safeToNumber(data.resultados.tmb));

            // Log constructed data
            console.log('Constructed gastoEnergeticoData:', JSON.stringify(gastoEnergeticoData, null, 2));
            console.log('Dates array:', JSON.stringify(dates, null, 2));

            // Non-numerical data
            nonNumericalData.somatotipo.push(data.resultados.somatotipo?.formatted || '---');
            nonNumericalData.tipologiaActual.push(data.resultados.tipologiaActual || '---');
            nonNumericalData.tipologiaMetabolica.push(data.resultados.tipologiaMetabolic || '---');
            nonNumericalData.imgActual.push(data.resultados.imgActual || '---');
            nonNumericalData.imgActualSource.push(data.resultados.imgActualSource || '---');
            nonNumericalData.imgMetabolic.push(data.resultados.imgMetabolic || '---');
            nonNumericalData.imgMetabolicSource.push(data.resultados.imgMetabolicSource || '---');
            nonNumericalData.imlgActual.push(data.resultados.imlgActual || '---');
            nonNumericalData.imlgActualSource.push(data.resultados.imlgActualSource || '---');
            nonNumericalData.imlgMetabolic.push(data.resultados.imlgMetabolic || '---');
            nonNumericalData.imlgMetabolicSource.push(data.resultados.imlgMetabolicSource || '---');
        });

        // Destroy existing charts
        const chartIds = [
            'peso-evolucion-chart',
            'grasa-evolucion-chart',
            'musculo-evolucion-chart',
            'pliegues-chart',
            'circunferencias-chart',
            'imc-icc-chart',
            'reserva-proteica-chart',
            'gasto-energetico-chart'
        ];
        chartIds.forEach(canvasId => {
            const chart = Chart.getChart(canvasId);
            if (chart) chart.destroy();
        });

        // Common chart options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { size: 10 } } },
                datalabels: {
                    display: true,
                    align: 'top',
                    formatter: (value, context) => {
                        if (value === null || value === undefined || isNaN(value)) return '';
                        const numValue = Number(value);
                        if (isNaN(numValue)) return '';
                        let formattedValue = numValue;
                        if (context.dataset.label.includes('kg')) formattedValue = `${numValue.toFixed(1)} `;
                        else if (context.dataset.label.includes('%')) formattedValue = `${numValue.toFixed(1)}`;
                        else if (context.dataset.label.includes('mm')) formattedValue = `${numValue.toFixed(1)}`;
                        else if (context.dataset.label.includes('cm²')) formattedValue = `${numValue.toFixed(1)} `;
                        else if (context.dataset.label.includes('cm')) formattedValue = `${numValue.toFixed(1)}`;
                        else if (context.dataset.label.includes('IMC')) formattedValue = `${numValue.toFixed(1)}`;
                        else if (context.dataset.label.includes('ICC')) formattedValue = `${numValue.toFixed(2)}`;
                        else if (context.dataset.label.includes('kcal')) formattedValue = `${numValue.toFixed(0)} `;
                        else if (context.dataset.label.includes('años')) formattedValue = `${numValue.toFixed(0)} `;
                        return `${formattedValue}`;
                    },
                    color: '#333',
                    font: { size: 10 }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Fecha', font: { size: 12 } } },
                y: { beginAtZero: false }
            }
        };

        // Helper to check if dataset has valid data
        const hasValidData = (dataArray) => dataArray.some(value => value !== null && !isNaN(value));

        // Peso Evolución Chart
        const pesoDatasets = [
            { label: 'Peso Actual (kg)', data: pesoData.actual, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: false, tension: 0.1 },
            { label: '% Pérdida Exceso', data: pesoData.perdidaExceso, borderColor: '#388E3C', backgroundColor: 'rgba(56, 142, 60, 0.2)', fill: false, tension: 0.1 },
            { label: '% Pérdida Inicial', data: pesoData.perdidaInicial, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (pesoDatasets.length > 0) {
            new Chart(document.getElementById('peso-evolucion-chart'), {
                type: 'line',
                data: { labels: dates, datasets: pesoDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Valor', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Peso Evolución Chart');
        }

        // Grasa Evolución Chart
        const grasaDatasets = [
            { label: 'Grasa Actual (%)', data: grasaData.actualPct, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: false, tension: 0.1 },
            { label: 'Grasa Actual (kg)', data: grasaData.actualKg, borderColor: '#388E3C', backgroundColor: 'rgba(56, 142, 60, 0.2)', fill: false, tension: 0.1 },
            { label: 'Grasa Metabólica (%)', data: grasaData.metabolicaPct, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 },
            { label: 'Grasa Metabólica (kg)', data: grasaData.metabolicaKg, borderColor: '#5bc0de', backgroundColor: 'rgba(91, 192, 222, 0.2)', fill: false, tension: 0.1 },
            { label: '% Grasa Deurenberg', data: grasaData.deurenberg, borderColor: '#f0ad4e', backgroundColor: 'rgba(240, 173, 78, 0.2)', fill: false, tension: 0.1 },
            { label: '% Grasa CUN-BAE', data: grasaData.cunBae, borderColor: '#d9534f', backgroundColor: 'rgba(217, 83, 79, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (grasaDatasets.length > 0) {
            new Chart(document.getElementById('grasa-evolucion-chart'), {
                type: 'line',
                data: { labels: dates, datasets: grasaDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Valor', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Grasa Evolución Chart');
        }

        // Músculo Evolución Chart
        const musculoDatasets = [
            { label: 'Masa Muscular (kg)', data: musculoData.mmt, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: false, tension: 0.1 },
            { label: 'Masa Muscular (%)', data: musculoData.Pctmmt, borderColor: '#388E3C', backgroundColor: 'rgba(56, 142, 60, 0.2)', fill: false, tension: 0.1 },
            { label: 'Masa Magra Actual (kg)', data: musculoData.masaMagraActual, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 },
            { label: 'Masa Magra Metabólica (kg)', data: musculoData.masaMagraMetabolic, borderColor: '#5bc0de', backgroundColor: 'rgba(91, 192, 222, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (musculoDatasets.length > 0) {
            new Chart(document.getElementById('musculo-evolucion-chart'), {
                type: 'line',
                data: { labels: dates, datasets: musculoDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Valor', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Músculo Chart');
        }

        // Pliegues Chart
        const plieguesDatasets = [
            { label: 'Tricipital (mm)', data: plieguesData.tricipital, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 },
            { label: 'Subescapular (mm)', data: plieguesData.subescapular, borderColor: '#5bc0de', backgroundColor: 'rgba(91, 192, 222, 0.2)', fill: false, tension: 0.1 },
            { label: 'Suprailiaco (mm)', data: plieguesData.suprailiaco, borderColor: '#5cb85c', backgroundColor: 'rgba(92, 184, 92, 0.2)', fill: false, tension: 0.1 },
            { label: 'Bicipital (mm)', data: plieguesData.bicipital, borderColor: '#f0ad4e', backgroundColor: 'rgba(240, 173, 78, 0.2)', fill: false, tension: 0.1 },
            { label: 'Pantorrilla (mm)', data: plieguesData.pantorrilla, borderColor: '#d9534f', backgroundColor: 'rgba(217, 83, 79, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (plieguesDatasets.length > 0) {
            new Chart(document.getElementById('pliegues-chart'), {
                type: 'line',
                data: { labels: dates, datasets: plieguesDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Pliegues (mm)', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Pliegues Chart');
        }

        // Circunferencias Chart
        const circunferenciasDatasets = [
            { label: 'Cintura (cm)', data: circunferenciasData.cintura, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 },
            { label: 'Cadera (cm)', data: circunferenciasData.cadera, borderColor: '#5bc0de', backgroundColor: 'rgba(91, 192, 222, 0.2)', fill: false, tension: 0.1 },
            { label: 'Cuello (cm)', data: circunferenciasData.cuello, borderColor: '#5cb85c', backgroundColor: 'rgba(92, 184, 92, 0.2)', fill: false, tension: 0.1 },
            { label: 'Pantorrilla (cm)', data: circunferenciasData.pantorrilla, borderColor: '#f0ad4e', backgroundColor: 'rgba(240, 173, 78, 0.2)', fill: false, tension: 0.1 },
            { label: 'Brazo Relajado (cm)', data: circunferenciasData.brazo, borderColor: '#d9534f', backgroundColor: 'rgba(217, 83, 79, 0.2)', fill: false, tension: 0.1 },
            { label: 'Brazo Contraído (cm)', data: circunferenciasData.brazo_contraido, borderColor: '#6610f2', backgroundColor: 'rgba(102, 16, 242, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (circunferenciasDatasets.length > 0) {
            new Chart(document.getElementById('circunferencias-chart'), {
                type: 'line',
                data: { labels: dates, datasets: circunferenciasDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Circunferencias (cm)', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Circunferencias Chart');
        }

        // IMC e ICC Chart
        const imcIccDatasets = [
            { label: 'IMC (kg/m²)', data: imcIccData.imc, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 },
            { label: 'ICC', data: imcIccData.icc, borderColor: '#5bc0de', backgroundColor: 'rgba(91, 192, 222, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (imcIccDatasets.length > 0) {
            new Chart(document.getElementById('imc-icc-chart'), {
                type: 'line',
                data: { labels: dates, datasets: imcIccDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Valor', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for IMC e ICC Chart');
        }

        // Reserva Proteica Chart
        const reservaProteicaDatasets = [
            { label: 'Perímetro de Brazo (cm)', data: reservaProteicaData.perimetroBrazo, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: false, tension: 0.1 },
            { label: 'Área Muscular Brazo (cm²)', data: reservaProteicaData.areaMuscularBrazo, borderColor: '#388E3C', backgroundColor: 'rgba(56, 142, 60, 0.2)', fill: false, tension: 0.1 },
            { label: 'Área Grasa Brazo (cm²)', data: reservaProteicaData.areaGrasaBrazo, borderColor: '#0275d8', backgroundColor: 'rgba(2, 117, 216, 0.2)', fill: false, tension: 0.1 }
        ].filter(ds => hasValidData(ds.data));
        if (reservaProteicaDatasets.length > 0) {
            new Chart(document.getElementById('reserva-proteica-chart'), {
                type: 'line',
                data: { labels: dates, datasets: reservaProteicaDatasets },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: { title: { display: true, text: 'Valor', font: { size: 12 } } }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Reserva Proteica Chart');
        }

        // Gasto Energético Chart

        // Utility function to merge edadMetabolica and edadmetabolica data
        // Utility function to validate and convert data
        function preprocessData(data, datasetLabel, preserveLength = true, defaultValue = 0) {
            if (data === null || data === undefined) {
                console.warn(`${datasetLabel} data is null or undefined.`);
                return preserveLength ? Array(11).fill(defaultValue) : [];
            }

            const dataArray = Array.isArray(data) ? data : [data];

            const processed = dataArray.map((item, index) => {
                if (item === null || item === undefined) {
                    console.warn(`Null or undefined value at index ${index} in ${datasetLabel}`);
                    return preserveLength ? defaultValue : null;
                }
                const value = parseFloat(item);
                if (isNaN(value)) {
                    console.warn(`Invalid data at index ${index} in ${datasetLabel}: ${item}`);
                    return preserveLength ? defaultValue : null;
                }
                return value;
            });

            if (!preserveLength) {
                const filtered = processed.filter(item => item !== null);
                if (filtered.length === 0) {
                    console.warn(`${datasetLabel} dataset is empty after preprocessing. No valid numerical data found.`);
                    return [];
                }
                return filtered;
            }

            return processed;
        }

        // Debug raw data and dates
        console.log('Raw gastoEnergeticoData:', JSON.stringify(gastoEnergeticoData, null, 2));
        console.log('Dates array:', JSON.stringify(dates, null, 2));

        // Gasto Energético Chart
        const gastoEnergeticoDatasets = [
            {
                label: 'Gasto Energético (kcal)',
                data: preprocessData(gastoEnergeticoData.gasto, 'Gasto Energético', true, null),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Edad Metabólica (años)',
                data: preprocessData(gastoEnergeticoData.edadMetabolica, 'Edad Metabólica', true, 0),
                borderColor: '#388E3C',
                backgroundColor: 'rgba(56, 142, 60, 0.2)',
                fill: false,
                tension: 0.1,
                yAxisID: 'y1'
            },
            {
                label: 'TMB (kcal)',
                data: preprocessData(gastoEnergeticoData.tmb, 'TMB', true, null),
                borderColor: '#0275d8',
                backgroundColor: 'rgba(2, 117, 216, 0.2)',
                fill: false,
                tension: 0.1
            }
        ].filter(ds => ds.data.length > 0);

        // Determine chart length
        const maxLength = Math.max(
            dates ? dates.length : 0,
            ...gastoEnergeticoDatasets.map(ds => ds.data.length)
        );
        const chartLabels = (dates && dates.length >= maxLength) ? dates.slice(0, maxLength) :
            Array.from({ length: maxLength }, (_, i) => `2025-05-${i + 1}`);

        if (gastoEnergeticoDatasets.length > 0) {
            console.log('Rendering chart with datasets:', JSON.stringify(gastoEnergeticoDatasets, null, 2));
            new Chart(document.getElementById('gasto-energetico-chart'), {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: gastoEnergeticoDatasets
                },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'kcal', font: { size: 12 } }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'Edad Metabólica (años)', font: { size: 12 } },
                            grid: { drawOnChartArea: false }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        } else {
            console.warn('No valid data for Gasto Energético Chart. Datasets:', gastoEnergeticoDatasets.map(ds => ds.label));
            const chartElement = document.getElementById('gasto-energetico-chart');
            if (chartElement) {
                chartElement.style.display = 'none';
                const container = chartElement.parentElement;
                container.innerHTML += `<p style="color: red;">No valid data for ${gastoEnergeticoDatasets.map(ds => ds.label).join(', ')}. Please check the Firestore data source.</p>`;
            }
        }
        // Populate non-numerical data table
        const tableBody = document.getElementById('non-numerical-table-body');
        tableBody.innerHTML = '';
        dates.forEach((date, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 10px; border: 1px solid #dee2e6;">${date}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.somatotipo[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.tipologiaActual[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.tipologiaMetabolica[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imgActual[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imgActualSource[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imgMetabolic[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imgMetabolicSource[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imlgActual[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imlgActualSource[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imlgMetabolic[index]}</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${nonNumericalData.imlgMetabolicSource[index]}</td>
            `;
            tableBody.appendChild(row);
        });

        // Show popup
        const popup = document.getElementById('progress-container');
        if (popup) {
            popup.style.display = 'flex';
        }

        // Add PDF export functionality
        const printPdfBtn = document.getElementById('print-pdf-btn');
        if (printPdfBtn) {
            printPdfBtn.addEventListener('click', () => {
                const element = document.getElementById('charts-container');
                const opt = {
                    margin: 10,
                    filename: `Progreso_Cliente_${clienteId}_${new Date().toLocaleDateString('es-ES')}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
            });
        }
    } catch (error) {
        console.error('Error al cargar los datos de progreso:', error);
        alert('Error al cargar los datos de progreso: ' + error.message);
    }
}




// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', initializeUI);






