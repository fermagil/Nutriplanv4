
// Function to safely parse float, returns NaN if invalid
export const parseFloatSafe = (value) => {
    console.log(`Parsing value for ${value}:`, value);
    const num = parseFloat(value);
    return isNaN(num) ? NaN : num;
};

// Function to format numbers
export const formatResult = (value, decimals = 1) => {
    if (isNaN(value) || value === null || value === undefined) {
        return '---';
    }
    return value.toFixed(decimals);
};

export function calculateIMC(data) {
    let { genero, edad, peso, altura, esDeportista } = data;

    // Verificar datos obligatorios
    if (!genero || !edad || !peso || !altura) {
        throw new Error('Faltan datos obligatorios: genero, edad, peso, altura');
    }

    // Verificar que la edad sea mayor o igual a 5 años
    if (edad < 5) {
        throw new Error('El cálculo de IMC es para personas de 5 años o más');
    }

    // Calcular IMC
    const alturaMetros = altura / 100; // Convertir altura a metros
    const imc = peso / (alturaMetros * alturaMetros);

    // Inicializar objeto de resultado
    let imcSource = {};

    // Lógica para adultos (≥18 años)
    if (edad >= 18) {
        if (imc < 16.0) {
            imcSource = {
                clasificacion: 'Delgadez severa',
                riesgo: 'Alto riesgo de desnutrición'
            };
        } else if (imc >= 16.0 && imc <= 16.9) {
            imcSource = {
                clasificacion: 'Delgadez moderada',
                riesgo: 'Riesgo de desnutrición'
            };
        } else if (imc >= 17.0 && imc <= 18.4) {
            imcSource = {
                clasificacion: 'Delgadez leve',
                riesgo: 'Riesgo leve'
            };
        } else if (imc >= 18.5 && imc <= 24.9) {
            imcSource = {
                clasificacion: 'Normal',
                riesgo: 'Riesgo mínimo'
            };
        } else if (imc >= 25.0 && imc <= 29.9) {
            imcSource = {
                clasificacion: 'Sobrepeso',
                riesgo: 'Riesgo moderado'
            };
        } else if (imc >= 30.0 && imc <= 34.9) {
            imcSource = {
                clasificacion: 'Obesidad grado I',
                riesgo: 'Alto riesgo'
            };
        } else if (imc >= 35.0 && imc <= 39.9) {
            imcSource = {
                clasificacion: 'Obesidad grado II',
                riesgo: 'Riesgo muy alto de cánceres'
            };
        } else if (imc >= 40.0) {
            imcSource = {
                clasificacion: 'Obesidad grado III (mórbida)',
                riesgo: 'Riesgo extremadamente alto'
            };
        }
    } else {
        // Lógica para pediátrico (5 a <18 años)

        // Verificar rango de altura (85 a 175 cm)
        if (altura < 85 || altura > 175) {
            throw new Error('La altura debe estar entre 85 y 175 cm según las tablas pediátricas');
        }

        // Convertir edad a meses para mayor precisión
        const edadMeses = Math.floor(edad * 12);

        // Tablas de IMC para la edad (OMS 2007)
        const imcTablasNiñas = {
            "5:1": { zMinus3: 11.8, zMinus2: 12.6, zPlus1: 16.9, zPlus2: 18.9 },
            "5:6": { zMinus3: 11.7, zMinus2: 12.6, zPlus1: 16.9, zPlus2: 19.0 },
            "6:0": { zMinus3: 11.7, zMinus2: 12.6, zPlus1: 17.0, zPlus2: 19.2 },
            "6:6": { zMinus3: 11.7, zMinus2: 12.6, zPlus1: 17.1, zPlus2: 19.5 },
            "7:0": { zMinus3: 11.8, zMinus2: 12.6, zPlus1: 17.3, zPlus2: 19.8 },
            "7:6": { zMinus3: 11.8, zMinus2: 12.7, zPlus1: 17.5, zPlus2: 20.1 },
            "8:0": { zMinus3: 11.9, zMinus2: 12.8, zPlus1: 17.7, zPlus2: 20.6 },
            "8:6": { zMinus3: 12.0, zMinus2: 12.9, zPlus1: 18.0, zPlus2: 21.0 },
            "9:0": { zMinus3: 12.1, zMinus2: 13.0, zPlus1: 18.3, zPlus2: 21.5 },
            "9:6": { zMinus3: 12.2, zMinus2: 13.2, zPlus1: 18.7, zPlus2: 22.0 },
            "10:0": { zMinus3: 12.4, zMinus2: 13.4, zPlus1: 19.0, zPlus2: 22.6 },
            "10:6": { zMinus3: 12.5, zMinus2: 13.6, zPlus1: 19.4, zPlus2: 23.1 },
            "11:0": { zMinus3: 12.7, zMinus2: 13.8, zPlus1: 19.9, zPlus2: 23.7 },
            "11:6": { zMinus3: 12.9, zMinus2: 14.0, zPlus1: 20.3, zPlus2: 24.3 },
            "12:0": { zMinus3: 13.2, zMinus2: 14.3, zPlus1: 20.8, zPlus2: 25.0 },
            "12:6": { zMinus3: 13.4, zMinus2: 14.6, zPlus1: 21.3, zPlus2: 25.6 },
            "13:0": { zMinus3: 13.6, zMinus2: 14.8, zPlus1: 21.8, zPlus2: 26.2 },
            "13:6": { zMinus3: 13.8, zMinus2: 15.1, zPlus1: 22.3, zPlus2: 26.8 },
            "14:0": { zMinus3: 14.0, zMinus2: 15.3, zPlus1: 22.7, zPlus2: 27.3 },
            "14:6": { zMinus3: 14.2, zMinus2: 15.6, zPlus1: 23.1, zPlus2: 27.8 },
            "15:0": { zMinus3: 14.4, zMinus2: 15.8, zPlus1: 23.5, zPlus2: 28.2 },
            "15:6": { zMinus3: 14.5, zMinus2: 15.9, zPlus1: 23.8, zPlus2: 28.6 },
            "16:0": { zMinus3: 14.6, zMinus2: 16.1, zPlus1: 24.1, zPlus2: 28.9 },
            "16:6": { zMinus3: 14.7, zMinus2: 16.2, zPlus1: 24.3, zPlus2: 29.1 },
            "17:0": { zMinus3: 14.7, zMinus2: 16.3, zPlus1: 24.5, zPlus2: 29.3 },
            "17:6": { zMinus3: 14.7, zMinus2: 16.3, zPlus1: 24.6, zPlus2: 29.4 },
            "18:0": { zMinus3: 14.7, zMinus2: 16.3, zPlus1: 24.8, zPlus2: 29.5 }
        };

        const imcTablasNiños = {
            "5:1": { zMinus3: 12.1, zMinus2: 12.9, zPlus1: 16.6, zPlus2: 18.3 },
            "5:6": { zMinus3: 12.1, zMinus2: 12.9, zPlus1: 16.7, zPlus2: 18.4 },
            "6:0": { zMinus3: 12.1, zMinus2: 12.9, zPlus1: 16.8, zPlus2: 18.5 },
            "6:6": { zMinus3: 12.2, zMinus2: 13.0, zPlus1: 16.9, zPlus2: 18.7 },
            "7:0": { zMinus3: 12.3, zMinus2: 13.0, zPlus1: 17.0, zPlus2: 19.0 },
            "7:6": { zMinus3: 12.3, zMinus2: 13.1, zPlus1: 17.2, zPlus2: 19.3 },
            "8:0": { zMinus3: 12.4, zMinus2: 13.2, zPlus1: 17.4, zPlus2: 19.7 },
            "8:6": { zMinus3: 12.5, zMinus2: 13.3, zPlus1: 17.7, zPlus2: 20.1 },
            "9:0": { zMinus3: 12.6, zMinus2: 13.4, zPlus1: 17.9, zPlus2: 20.5 },
            "9:6": { zMinus3: 12.7, zMinus2: 13.5, zPlus1: 18.2, zPlus2: 20.9 },
            "10:0": { zMinus3: 12.8, zMinus2: 13.6, zPlus1: 18.5, zPlus2: 21.4 },
            "10:6": { zMinus3: 12.9, zMinus2: 13.8, zPlus1: 18.8, zPlus2: 21.9 },
            "11:0": { zMinus3: 13.1, zMinus2: 14.0, zPlus1: 19.2, zPlus2: 22.5 },
            "11:6": { zMinus3: 13.2, zMinus2: 14.1, zPlus1: 19.5, zPlus2: 23.0 },
            "12:0": { zMinus3: 13.4, zMinus2: 14.4, zPlus1: 19.9, zPlus2: 23.6 },
            "12:6": { zMinus3: 13.6, zMinus2: 14.6, zPlus1: 20.4, zPlus2: 24.2 },
            "13:0": { zMinus3: 13.8, zMinus2: 14.8, zPlus1: 20.8, zPlus2: 24.8 },
            "13:6": { zMinus3: 14.0, zMinus2: 15.1, zPlus1: 21.3, zPlus2: 25.3 },
            "14:0": { zMinus3: 14.3, zMinus2: 15.4, zPlus1: 21.8, zPlus2: 25.9 },
            "14:6": { zMinus3: 14.5, zMinus2: 15.6, zPlus1: 22.2, zPlus2: 26.5 },
            "15:0": { zMinus3: 14.7, zMinus2: 15.9, zPlus1: 22.7, zPlus2: 27.0 },
            "15:6": { zMinus3: 14.9, zMinus2: 16.2, zPlus1: 23.1, zPlus2: 27.4 },
            "16:0": { zMinus3: 15.1, zMinus2: 16.4, zPlus1: 23.5, zPlus2: 27.9 },
            "16:6": { zMinus3: 15.3, zMinus2: 16.6, zPlus1: 23.9, zPlus2: 28.3 },
            "17:0": { zMinus3: 15.4, zMinus2: 16.8, zPlus1: 24.3, zPlus2: 28.6 },
            "17:6": { zMinus3: 15.6, zMinus2: 17.0, zPlus1: 24.6, zPlus2: 29.0 },
            "18:0": { zMinus3: 15.7, zMinus2: 17.2, zPlus1: 24.9, zPlus2: 29.2 }
        };

        // Validar peso según tablas de estatura (como referencia)
        function validarPesoPorEstatura(altura, peso) {
            const alturaEntera = Math.round(altura);
            if (alturaEntera >= 85 && alturaEntera <= 114) {
                return peso >= 10 && peso <= 37; // Rango de la tabla 85-114 cm
            } else if (alturaEntera >= 115 && alturaEntera <= 144) {
                return peso >= 12 && peso <= 44; // Rango de la tabla 115-144 cm
            } else if (alturaEntera >= 145 && alturaEntera <= 175) {
                return peso >= 19 && peso <= 52; // Rango de la tabla 145-175 cm
            }
            return false;
        }

        // Validar peso
        if (!validarPesoPorEstatura(altura, peso)) {
            // Nota: En un entorno de producción, podrías querer manejar esto como un warning
            // throw new Error('El peso está fuera del rango esperado para la altura según las tablas pediátricas');
        }

        // Obtener límites de IMC según edad y sexo
        function getIMCLimits(genero, edadMeses) {
            const edadAnios = Math.floor(edadMeses / 12);
            const mesesRestantes = edadMeses % 12;
            const key1 = `${edadAnios}:${mesesRestantes >= 6 ? 6 : 0}`;
            const key2 = mesesRestantes >= 6 ? `${edadAnios + 1}:0` : `${edadAnios}:6`;

            const tabla = genero.toLowerCase() === 'femenino' ? imcTablasNiñas : imcTablasNiños;
            const limites1 = tabla[key1] || tabla[`${edadAnios}:0`];
            const limites2 = tabla[key2] || tabla[`${edadAnios + 1}:0`];

            if (!limites1 || !limites2) {
                throw new Error('Edad fuera del rango de las tablas OMS');
            }

            // Interpolación lineal para valores intermedios
            const factor = mesesRestantes >= 6 ? (mesesRestantes - 6) / 6 : mesesRestantes / 6;
            return {
                zMinus3: limites1.zMinus3 + (limites2.zMinus3 - limites1.zMinus3) * factor,
                zMinus2: limites1.zMinus2 + (limites2.zMinus2 - limites1.zMinus2) * factor,
                zPlus1: limites1.zPlus1 + (limites2.zPlus1 - limites1.zPlus1) * factor,
                zPlus2: limites1.zPlus2 + (limites2.zPlus2 - limites1.zPlus2) * factor
            };
        }

        const imcLimits = getIMCLimits(genero, edadMeses);

        // Determinar clasificación según OMS pediátrica
        if (imc < imcLimits.zMinus3) {
            imcSource = {
                clasificacion: 'Desnutrición severa',
                riesgo: 'Alto riesgo de desnutrición',
                percentil: '<0.1'
            };
        } else if (imc >= imcLimits.zMinus3 && imc < imcLimits.zMinus2) {
            imcSource = {
                clasificacion: 'Desnutrición moderada',
                riesgo: 'Riesgo de desnutrición',
                percentil: '0.1-2.3'
            };
        } else if (imc >= imcLimits.zMinus2 && imc <= imcLimits.zPlus1) {
            imcSource = {
                clasificacion: 'Normal',
                riesgo: 'Riesgo mínimo',
                percentil: '2.3-84.1'
            };
        } else if (imc > imcLimits.zPlus1 && imc <= imcLimits.zPlus2) {
            imcSource = {
                clasificacion: 'Sobrepeso',
                riesgo: 'Riesgo moderado',
                percentil: '84.1-97.7'
            };
        } else if (imc > imcLimits.zPlus2) {
            imcSource = {
                clasificacion: 'Obesidad',
                riesgo: 'Alto riesgo de enfermedades metabólicas',
                percentil: '>97.7'
            };
        }
    }

    // Agregar el valor numérico del IMC al objeto
    imcSource.imc = imc.toFixed(2); // Redondear a 2 decimales

    // Considerar si es deportista
    if (esDeportista) {
        imcSource.nota = 'Nota: En deportistas, el IMC puede no reflejar con precisión la composición corporal debido a mayor masa muscular';
    }

    // Devolver objeto con imc y imcSource
    return { imc, imcSource };
}

// Function to calculate ICC
export function calculateICC(data) {
    // Validar datos de entrada
    if (!data.circ_cintura || !data.circ_cadera || !data.genero) {
        throw new Error('Faltan datos requeridos: circunferencia de cintura, cadera o género');
    }

    const cintura = Number(data.circ_cintura);
    const cadera = Number(data.circ_cadera);
    const genero = data.genero.toLowerCase();

    // Validar valores numéricos
    if (isNaN(cintura) || cintura <= 0) {
        throw new Error('Circunferencia de cintura inválida');
    }
    if (isNaN(cadera) || cadera <= 0) {
        throw new Error('Circunferencia de cadera inválida');
    }
    if (!['masculino', 'femenino'].includes(genero)) {
        throw new Error('Género debe ser "masculino" o "femenino"');
    }

    // Calcular ICC
    const icc = cintura / cadera;

    // Determinar clasificación y riesgo
    let clasificacion = '';
    let riesgo = '';

    if (genero === 'masculino') {
        if (icc < 0.78) {
            clasificacion = 'Ginoide';
            riesgo = 'Riesgo Bajo';
        } else if (icc >= 0.78 && icc <= 0.94) {
            clasificacion = 'Normal';
            riesgo = 'Riesgo Bajo';
        } else if (icc > 0.94 && icc < 1.0) {
            clasificacion = 'Androide';
            riesgo = 'Riesgo Alto';
        } else { // icc >= 1.0
            clasificacion = 'Androide';
            riesgo = 'Riesgo Muy Alto';
        }
    } else { // femenino
        if (icc < 0.71) {
            clasificacion = 'Ginoide';
            riesgo = 'Riesgo Bajo';
        } else if (icc >= 0.71 && icc <= 0.84) {
            clasificacion = 'Normal';
            riesgo = 'Riesgo Bajo';
        } else if (icc > 0.84 && icc < 1.0) {
            clasificacion = 'Androide';
            riesgo = 'Riesgo Alto';
        } else { // icc >= 1.0
            clasificacion = 'Androide';
            riesgo = 'Riesgo Muy Alto';
        }
    }

    return {
        icc: icc,
        iccSource: {
            clasificacion: clasificacion,
            riesgo: riesgo
        }
    };
}

//Funtion %Body Water
export function calcularACT(edad, genero, altura, peso, esDeportista) {
    // Validar entradas
    if (!edad || !genero || !altura || !peso) {
        console.error('calcularACT - Error: Faltan datos requeridos', { edad, genero, altura, peso });
        return { error: 'Por favor, ingrese todos los datos requeridos.' };
    }

    if (edad < 6 || altura < 90 || peso < 15) {
        console.error('calcularACT - Error: Valores no permitidos', { edad, altura, peso });
        return { error: 'Los valores no pueden ser tan bajos.' };
    }

    let actKg, porcentajeACT, rangoReferencia, fuente, clasificacion;
    //const alturaMetros = altura / 100; // Convertir altura a metros
    // Calcular ACT según sexo, edad y fórmula correspondiente
    if (edad > 64) {
        // Fórmulas de Lee et al. para población mayor (>64 años)
        if (genero.toLowerCase() === 'masculino') {
            actKg = -28.3497 + (0.243057 * altura) + (0.366248 * peso);
            fuente = 'Lee et al.';
        } else if (genero.toLowerCase() === 'femenino') {
            actKg = -26.6224 + (0.262513 * altura) + (0.232948 * peso);
            fuente = 'Lee et al.';
        } else {
            console.error('calcularACT - Error: Genero no válido', { genero });
            return { error: 'Sexo no válido. Use "hombre" o "mujer".' };
        }
    } else {
        // Fórmulas de Watson para población general o deportistas (≤64 años)
        if (genero.toLowerCase() === 'masculino') {
            actKg = 2.447 - 0.09516 * edad + 0.1074 * altura + 0.3362 * peso;
            fuente = 'Watson et al., 1980';
        } else if (genero.toLowerCase() === 'femenino') {
            actKg = 2.097 + 0.1069 * altura + 0.2466 * peso;
            fuente = 'Watson et al., 1980';
        } else {
            console.error('calcularACT - Error: Genero no válido', { genero });
            return { error: 'Sexo no válido. Use "hombre" o "mujer".' };
        }
    }

    // Calcular porcentaje de ACT
    porcentajeACT = (actKg / peso) * 100;

    // Determinar rango de referencia y clasificar % ACT
    let limiteInferior, limiteSuperior;

    if (esDeportista && edad <= 64) {
        // Rangos para deportistas
        if (genero.toLowerCase() === 'masculino') {
            limiteInferior = 60;
            limiteSuperior = 70;
            rangoReferencia = '60% - 70%';
        } else {
            limiteInferior = 55;
            limiteSuperior = 65;
            rangoReferencia = '55% - 65%';
        }
    } else {
        // Rangos para población general según edad
        if (edad >= 12 && edad <= 18) {
            if (genero.toLowerCase() === 'masculino') {
                limiteInferior = 52;
                limiteSuperior = 66;
                rangoReferencia = '52% - 66%';
            } else {
                limiteInferior = 49;
                limiteSuperior = 63;
                rangoReferencia = '49% - 63%';
            }
        } else if (edad >= 19 && edad <= 50) {
            if (genero.toLowerCase() === 'masculino') {
                limiteInferior = 43;
                limiteSuperior = 73;
                rangoReferencia = '43% - 73%';
            } else {
                limiteInferior = 41;
                limiteSuperior = 60;
                rangoReferencia = '41% - 60%';
            }
        } else if (edad >= 51) {
            // Incluye a mayores de 64 años (población general)
            if (genero.toLowerCase() === 'masculino') {
                limiteInferior = 47;
                limiteSuperior = 67;
                rangoReferencia = '47% - 67%';
            } else {
                limiteInferior = 39;
                limiteSuperior = 57;
                rangoReferencia = '39% - 57%';
            }
        } else {
            console.error('calcularACT - Error: Edad no válida para rangos de referencia (<12 años)', { edad });
            return { error: 'Rango de referencia no disponible para menores de 12 años.' };
        }
    }

    // Clasificar % ACT dentro del rango
    const rango = limiteSuperior - limiteInferior;
    const cuarto = rango / 4;

    if (porcentajeACT < limiteInferior) {
        clasificacion = 'Muy Bajo';
    } else if (porcentajeACT >= limiteInferior && porcentajeACT < limiteInferior + cuarto) {
        clasificacion = 'Bajo';
    } else if (porcentajeACT >= limiteInferior + cuarto && porcentajeACT < limiteInferior + 3 * cuarto) {
        clasificacion = 'Normal';
    } else if (porcentajeACT >= limiteInferior + 3 * cuarto && porcentajeACT <= limiteSuperior) {
        clasificacion = 'Medio Alto';
    } else {
        clasificacion = 'Por encima del rango de referencia';
    }

    // Registrar resultados
    const resultados = {
        actKg: actKg.toFixed(2),
        porcentajeACT: porcentajeACT.toFixed(2),
        rangoReferencia,
        clasificacion,
        fuente
    };
    // console.log('[calcularACT] Resultados calculados:', resultados); // Removed for pure function

    return resultados;
}

export function metodo1(genero, edad, peso, altura, tricipital, subescapular, suprailiaco, bicipital, usePorcentajeGrasa = false, porcentajeGrasa = null) {
    let grasa;
    if (!usePorcentajeGrasa) {
        const sumaPliegues = tricipital + subescapular + suprailiaco + bicipital;
        let c, m;
        if (genero === 'masculino') {
            if (edad >= 17 && edad <= 19) { c = 1.1620; m = 0.0630; }
            else if (edad >= 20 && edad <= 29) { c = 1.1631; m = 0.0632; }
            else if (edad >= 30 && edad <= 39) { c = 1.1422; m = 0.0544; }
            else if (edad >= 40 && edad <= 49) { c = 1.1620; m = 0.0700; }
            else if (edad >= 50) { c = 1.1715; m = 0.0779; }
        } else if (genero === 'femenino') {
            if (edad >= 17 && edad <= 19) { c = 1.1549; m = 0.0678; }
            else if (edad >= 20 && edad <= 29) { c = 1.1599; m = 0.0717; }
            else if (edad >= 30 && edad <= 39) { c = 1.1423; m = 0.0632; }
            else if (edad >= 40 && edad <= 49) { c = 1.1333; m = 0.0612; }
            else if (edad >= 50) { c = 1.1339; m = 0.0645; }
        } else {
            throw new Error('Género no válido');
        }
        const logSumPliegues = Math.log10(sumaPliegues);
        const densidadCorporal = c - (m * logSumPliegues);
        grasa = (495 / densidadCorporal) - 450;
    } else {
        grasa = porcentajeGrasa;
    }

    // Calcular masa magra y grasa
    const masaGrasa = (grasa / 100) * peso;
    const masaMagra = peso - masaGrasa;

    // Calcular BMR real con Katch-McArdle
    const bmrReal = 370 + (21.6 * masaMagra);

    // Calcular edad metabólica con Harris-Benedict ajustada
    let edadMetabolica;
    if (genero === 'masculino') {
        const numerador = 88.362 + (13.397 * peso) + (4.799 * altura) - bmrReal;
        edadMetabolica = numerador / 5.677; // Corregido de 5.7 a 5.677 para consistencia
    } else if (genero === 'femenino') {
        const numerador = 447.593 + (9.247 * peso) + (3.098 * altura) - bmrReal;
        edadMetabolica = numerador / 4.33; // Corregido de 4.7 a 4.33 para consistencia
    } else {
        throw new Error('Género no válido');
    }

    return {
        edadMetabolica: Number(edadMetabolica.toFixed(1)),
        bmrReal: Number(bmrReal.toFixed(1)),
        masaMagra: Number(masaMagra.toFixed(1)),
        masaGrasa: Number(masaGrasa.toFixed(1))
    };
}

export function metodo2(genero, edad, peso, altura, porcentajeGrasa, cintura, nivelActividad, pliegues = null, esObeso = false) {
    let grasa;
    if (pliegues) {
        const { tricipital, subescapular, suprailiaco, bicipital } = pliegues;
        const sumaPliegues = tricipital + subescapular + suprailiaco + bicipital;
        let c, m;
        if (genero === 'masculino') {
            if (edad >= 17 && edad <= 19) { c = 1.1620; m = 0.0630; }
            else if (edad >= 20 && edad <= 29) { c = 1.1631; m = 0.0632; }
            else if (edad >= 30 && edad <= 39) { c = 1.1422; m = 0.0544; }
            else if (edad >= 40 && edad <= 49) { c = 1.1620; m = 0.0700; }
            else if (edad >= 50) { c = 1.1715; m = 0.0779; }
        } else if (genero === 'femenino') {
            if (edad >= 17 && edad <= 19) { c = 1.1549; m = 0.0678; }
            else if (edad >= 20 && edad <= 29) { c = 1.1599; m = 0.0717; }
            else if (edad >= 30 && edad <= 39) { c = 1.1423; m = 0.0632; }
            else if (edad >= 40 && edad <= 49) { c = 1.1333; m = 0.0612; }
            else if (edad >= 50) { c = 1.1339; m = 0.0645; }
        } else {
            throw new Error('Género no válido');
        }
        const logSumPliegues = Math.log10(sumaPliegues);
        const densidadCorporal = c - (m * logSumPliegues);
        grasa = esObeso ? (498 / densidadCorporal) - 451 : (457 / densidadCorporal) - 414.2;
    } else {
        grasa = porcentajeGrasa;
    }

    // Calcular masa magra y grasa
    const masaGrasa = (grasa / 100) * peso;
    const masaMagra = peso - masaGrasa;

    // Calcular BMR Real (Katch-McArdle)
    const bmrReal = 370 + (21.6 * masaMagra);

    // Calcular BMR Esperado (Harris-Benedict)
    let bmrEsperado;
    if (genero === 'femenino') {
        bmrEsperado = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.33 * edad);
    } else if (genero === 'masculino') {
        bmrEsperado = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad);
    } else {
        throw new Error('Género no válido');
    }

    // Calcular Delta BMR
    const deltaBMR = (bmrEsperado - bmrReal) / 15;

    // Calcular Delta Cintura
    let deltaCintura;
    const whtr = cintura / altura;
    const ajusteWHtR = Math.max(1, whtr / 0.5);
    const ajusteEdad = edad > 50 ? 1 + 0.01 * (edad - 50) : 1;
    if (genero === 'femenino') {
        if (cintura <= 80) {
            deltaCintura = 0;
        } else {
            deltaCintura = 0.2 * (cintura - 80) * ajusteWHtR * ajusteEdad;
            deltaCintura = Math.min(deltaCintura, 10);
        }
    } else if (genero === 'masculino') { // Corregido de 'Masculino' a 'masculino'
        if (cintura <= 94) {
            deltaCintura = 0;
        } else {
            deltaCintura = 0.2 * (cintura - 94) * ajusteWHtR * ajusteEdad;
            deltaCintura = Math.min(deltaCintura, 10);
        }
    }

    // Calcular Delta Actividad
    const ajustesActividad = {
        'sedentario': 3,
        'ligero': 1,
        'moderado': -1,
        'intenso': -4,
        'atleta': -5
    };
    const deltaActividad = ajustesActividad[nivelActividad] || 0;

    // Calcular Edad Metabólica
    const edadMetabolica = edad + deltaBMR + deltaCintura + deltaActividad;

    return {
        edadMetabolica: Number(edadMetabolica.toFixed(2)),
        bmrReal: Number(bmrReal.toFixed(1)),
        masaMagra: Number(masaMagra.toFixed(1)),
        masaGrasa: Number(masaGrasa.toFixed(1))
    };
}

export function calculateMetabolicAge(data) {
    let { genero, edad, peso, altura, esDeportista, pliegues, porcentajeGrasa, cintura, imc } = data;

    // Verificar datos obligatorios
    if (!genero || !edad || !peso || !altura) {
        throw new Error('Faltan datos obligatorios: genero, edad, peso, altura');
    }

    // Validación para culturistas: forzar esDeportista = true si % grasa es bajo e IMC es alto
    let grasaEval;
    if (pliegues) {
        const { tricipital, subescapular, suprailiaco, bicipital } = pliegues;
        if (!tricipital || !subescapular || !suprailiaco || !bicipital) {
            throw new Error('Faltan mediciones de pliegues cutáneos para Durnin-Womersley');
        }
        const sumaPliegues = tricipital + subescapular + suprailiaco + bicipital;
        let c, m;
        if (genero === 'masculino') {
            if (edad >= 17 && edad <= 19) { c = 1.1620; m = 0.0630; }
            else if (edad >= 20 && edad <= 29) { c = 1.1631; m = 0.0632; }
            else if (edad >= 30 && edad <= 39) { c = 1.1422; m = 0.0544; }
            else if (edad >= 40 && edad <= 49) { c = 1.1620; m = 0.0700; }
            else if (edad >= 50) { c = 1.1715; m = 0.0779; }
        } else if (genero === 'femenino') {
            if (edad >= 17 && edad <= 19) { c = 1.1549; m = 0.0678; }
            else if (edad >= 20 && edad <= 29) { c = 1.1599; m = 0.0717; }
            else if (edad >= 30 && edad <= 39) { c = 1.1423; m = 0.0632; }
            else if (edad >= 40 && edad <= 49) { c = 1.1333; m = 0.0612; }
            else if (edad >= 50) { c = 1.1339; m = 0.0645; }
        } else {
            throw new Error('Género no válido');
        }
        const logSumPliegues = Math.log10(sumaPliegues);
        const densidadCorporal = c - (m * logSumPliegues);
        grasaEval = (457 / densidadCorporal) - 414.2;
    } else if (porcentajeGrasa) {
        grasaEval = porcentajeGrasa;
    }

    // Forzar esDeportista = true para culturistas (IMC ≥ 30 y % grasa bajo)
    const umbralGrasaCulturista = genero === 'masculino' ? 15 : 20;
    if (imc >= 30 && grasaEval && grasaEval < umbralGrasaCulturista) {
        esDeportista = true;
    }

    // Determinar nivel de actividad según si es deportista o no
    const nivelActividad = esDeportista ? 'intenso' : 'sedentario';

    // Evaluar obesidad para no deportistas
    let esObeso = false;
    if (!esDeportista) {
        if (!grasaEval) {
            throw new Error('Se requiere pliegues o porcentajeGrasa para evaluar obesidad');
        }
        // Definir obesidad: IMC ≥ 30 y % grasa > umbral saludable
        const umbralGrasa = genero === 'masculino' ? 25 : 32;
        esObeso = imc >= 30 && grasaEval > umbralGrasa;
    }

    // Escenario 1: Deportista, 18-61 años, pliegues conocidos
    if (esDeportista && pliegues && edad >= 18 && edad <= 61) {
        const { tricipital, subescapular, suprailiaco, bicipital } = pliegues;
        if (!tricipital || !subescapular || !suprailiaco || !bicipital) {
            throw new Error('Faltan mediciones de pliegues cutáneos');
        }
        const method = 'Siri_Katch-McArdle_Harris-Benedict(Dxt,Pliegues)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo1(genero, edad, peso, altura, tricipital, subescapular, suprailiaco, bicipital, false);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    // Escenario 2: Deportista, % grasa conocido
    else if (esDeportista && porcentajeGrasa) {
        const method = 'Siri_Katch-McArdle_Harris-Benedict(Dxt,%Grasa Conocido)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo1(genero, edad, peso, altura, null, null, null, null, true, porcentajeGrasa);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    // Escenario 3: No deportista, pliegues conocidos, no obeso
    else if (!esDeportista && pliegues && !esObeso) {
        const { tricipital, subescapular, suprailiaco, bicipital } = pliegues;
        if (!tricipital || !subescapular || !suprailiaco || !bicipital) {
            throw new Error('Faltan mediciones de pliegues cutáneos para Durnin-Womersley');
        }
        const method = 'Brozek_Harris-Benedict(No-Dxt,Pliegues,No-Obeso)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo2(genero, edad, peso, altura, null, cintura, nivelActividad, { tricipital, subescapular, suprailiaco, bicipital }, false);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    // Escenario 4: No deportista, % grasa conocido, no obeso
    else if (!esDeportista && porcentajeGrasa && !esObeso) {
        if (!cintura) {
            throw new Error('Se requiere medida de cintura para Método 2');
        }
        const method = 'Brozek_Harris-Benedict(No-Dxt,%Grasa Conocido,No-Obeso)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo2(genero, edad, peso, altura, porcentajeGrasa, cintura, nivelActividad, null, false);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    // Escenario 5: No deportista, pliegues conocidos, obeso
    else if (!esDeportista && pliegues && esObeso) {
        const { tricipital, subescapular, suprailiaco, bicipital } = pliegues;
        if (!tricipital || !subescapular || !suprailiaco || !bicipital) {
            throw new Error('Faltan mediciones de pliegues cutáneos para Durnin-Womersley');
        }
        const method = 'Wagner_Harris-Benedict(No-Dxt,Pliegues,Obeso)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo2(genero, edad, peso, altura, null, cintura, nivelActividad, { tricipital, subescapular, suprailiaco, bicipital }, true);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    // Escenario 6: No deportista, % grasa conocido, obeso
    else if (!esDeportista && porcentajeGrasa && esObeso) {
        if (!cintura) {
            throw new Error('Se requiere medida de cintura para Método 2');
        }
        const method = 'Wagner_Harris-Benedict(No-Dxt,%Grasa Conocido,Obeso)';
        const { edadMetabolica, bmrReal, masaMagra, masaGrasa } = metodo2(genero, edad, peso, altura, porcentajeGrasa, cintura, nivelActividad, null, true);
        return {
            edadMetabolica,
            BRMEstimado: bmrReal,
            method,
            BRMEstimadoSource: method,
            masaMagra,
            masaGrasa
        };
    }
    else {
        throw new Error('No se cumplen las condiciones para ningún escenario');
    }
}

// Updated estimateTargetBodyFat function
export const estimateTargetBodyFat = (gender, isAthlete, age) => {
    console.log(`Estimating target body fat for gender: ${gender}, isAthlete: ${isAthlete}, age: ${age}`);
    const ranges = {
        masculino: {
            athlete: {
                '18-29': [7, 13],
                '30-49': [9, 17],
                '50+': [10, 19]
            },
            nonAthlete: {
                '18-29': [14, 20],
                '30-49': [17, 23],
                '50+': [20, 25]
            }
        },
        femenino: {
            athlete: {
                '18-29': [14, 20],
                '30-49': [16, 22],
                '50+': [18, 25]
            },
            nonAthlete: {
                '18-29': [20, 28],
                '30-49': [23, 30],
                '50+': [27, 33]
            }
        }
    };

    let ageRange;
    if (age >= 18 && age <= 29) {
        ageRange = '18-29';
    } else if (age >= 30 && age <= 49) {
        ageRange = '30-49';
    } else if (age >= 50) {
        ageRange = '50+';
    } else {
        console.warn('Edad fuera de rango válido:', age);
        return NaN;
    }

    try {
        const category = isAthlete ? 'athlete' : 'nonAthlete';
        const [min, max] = ranges[gender][category][ageRange];
        const target = (min + max) / 2;
        console.log(`Target body fat: ${target}% (range: ${min}–${max}%)`);
        return Number(target.toFixed(1));
    } catch (error) {
        console.error('Error estimating target body fat:', error);
        return NaN;
    }
};

// Function to calculate % Body Fat using Slaughter (ages 6-17)
export const calculateSlaughterBodyFat = (data) => {
    console.log('Calculating Slaughter Body Fat');
    if (data.pliegue_tricipital && data.pliegue_pantorrilla && data.genero) {
        const sumPliegues = data.pliegue_tricipital + data.pliegue_pantorrilla;
        console.log(`Sum of skinfolds: ${sumPliegues}`);
        if (data.genero === 'masculino') {
            return 0.735 * sumPliegues + 1.0;
        } else if (data.genero === 'femenino') {
            return 0.610 * sumPliegues + 5.1;
        }
    }
    console.warn('Slaughter: Missing skinfolds or gender');
    return NaN;
};

// Function to calculate % Body Fat using Jackson-Pollock (3 skinfolds, adults, athletes)
export const calculateJacksonPollockBodyFat = (data) => {
    console.log('Calculating Jackson-Pollock Body Fat');
    if (data.pliegue_tricipital && data.pliegue_subescapular && data.pliegue_suprailiaco && data.edad && data.genero) {
        const sumPliegues = data.pliegue_tricipital + data.pliegue_subescapular + data.pliegue_suprailiaco;
        console.log(`Sum of skinfolds: ${sumPliegues}, Age: ${data.edad}, Gender: ${data.genero}`);
        if (sumPliegues < 10) {
            console.warn('Sum of skinfolds too low (< 10 mm), may produce unreliable results');
            return NaN;
        }
        let dc;
        if (data.genero === 'masculino') {
            dc = 1.10938 - (0.0008267 * sumPliegues) + (0.0000016 * sumPliegues * sumPliegues) - (0.0002574 * data.edad);
        } else if (data.genero === 'femenino') {
            dc = 1.0994921 - (0.0009929 * sumPliegues) + (0.0000023 * sumPliegues * sumPliegues) - (0.0001392 * data.edad);
        }
        if (dc) {
            console.log(`Body density: ${dc}`);
            const bodyFat = (495 / dc) - 450;
            console.log(`Calculated % Body Fat: ${bodyFat}`);
            return bodyFat;
        }
    }
    console.warn('Jackson-Pollock: Missing skinfolds, age, or gender');
    return NaN;
};

// Function to calculate % Body Fat using Circumferences (adults)
export const calculateCircumferenceBodyFat = (data) => {
    console.log('Calculating Circumference-Based Body Fat');
    if (data.circ_cintura && data.circ_cadera && data.circ_cuello && data.altura && data.genero) {
        console.log(`Circumferences: Cintura=${data.circ_cintura}, Cadera=${data.circ_cadera}, Cuello=${data.circ_cuello}, Altura=${data.altura}, Gender=${data.genero}`);
        let dc;
        if (data.genero === 'masculino') {
            const logWaistNeck = Math.log10(data.circ_cintura - data.circ_cuello);
            const logHeight = Math.log10(data.altura);
            dc = 1.0324 - (0.19077 * logWaistNeck) + (0.15456 * logHeight);
        } else if (data.genero === 'femenino') {
            const logWaistHipNeck = Math.log10(data.circ_cintura + data.circ_cadera - data.circ_cuello);
            const logHeight = Math.log10(data.altura);
            dc = 1.29579 - (0.35004 * logWaistHipNeck) + (0.22100 * logHeight);
        }
        if (dc) {
            console.log(`Body density: ${dc}`);
            const bodyFat = (495 / dc) - 450;
            console.log(`Calculated % Body Fat: ${bodyFat}`);
            return bodyFat;
        }
    }
    console.warn('Circumference Method: Missing cintura, cadera, cuello, altura, or gender');
    return NaN;
};

// Function to calculate % Body Fat using Durnin-Womersley (4 skinfolds, adults, general population)
export const calculateDurninWomersleyBodyFat = (data) => {
    console.log('Calculating Durnin-Womersley Body Fat');
    if (data.pliegue_bicipital && data.pliegue_tricipital && data.pliegue_subescapular && data.pliegue_suprailiaco && data.edad && data.genero) {
        const sumPliegues = data.pliegue_bicipital + data.pliegue_tricipital + data.pliegue_subescapular + data.pliegue_suprailiaco;
        console.log(`Sum of skinfolds: ${sumPliegues}, Age: ${data.edad}`);

        const constants = {
            masculino: {
                '17-19': { c: 1.1620, m: 0.0630 },
                '20-29': { c: 1.1631, m: 0.0632 },
                '30-39': { c: 1.1422, m: 0.0544 },
                '40-49': { c: 1.1620, m: 0.0700 },
                '50+': { c: 1.1715, m: 0.0779 }
            },
            femenino: {
                '17-19': { c: 1.1549, m: 0.0678 },
                '20-29': { c: 1.1599, m: 0.0717 },
                '30-39': { c: 1.1423, m: 0.0632 },
                '40-49': { c: 1.1333, m: 0.0612 },
                '50+': { c: 1.1339, m: 0.0645 }
            }
        };

        // Normalizar el género (por si viene como "hombre" en lugar de "masculino")
        const genero = data.genero.toLowerCase() === 'hombre' ? 'masculino' : data.genero.toLowerCase();

        // Verificar que el género sea válido
        if (!constants[genero]) {
            console.error(`Género no válido: ${data.genero}. Debe ser "masculino" o "femenino"`);
            return NaN;
        }

        let ageRange;
        if (data.edad <= 19) ageRange = '17-19';
        else if (data.edad <= 29) ageRange = '20-29';
        else if (data.edad <= 39) ageRange = '30-39';
        else if (data.edad <= 49) ageRange = '40-49';
        else ageRange = '50+';

        // Verificar que exista el rango de edad
        if (!constants[genero][ageRange]) {
            console.error(`Rango de edad no encontrado: ${ageRange} para género ${genero}`);
            return NaN;
        }

        const { c, m } = constants[genero][ageRange];
        const dc = c - (m * Math.log10(sumPliegues));
        console.log(`Body density: ${dc}`);
        const bodyFat = (495 / dc) - 450;
        console.log(`Calculated % Body Fat: ${bodyFat}`);
        return bodyFat;
    }
    console.warn('Durnin-Womersley: Missing skinfolds, age, or gender');
    return NaN;
};

// Function: Calcular IAV
export function calcularIAV(data) {
    console.log(`[calcularIAV] cintura: ${data.circ_cintura}, altura: ${data.altura}`);
    const iav = Math.round((data.circ_cintura / data.altura) * 100) / 100;
    console.log(`[calcularIAV] IAV calculado: ${iav}`);
    return iav;
}

// Function: Calcular Indice Mixto
export function calcularIndiceMixto(data) {
    console.log(`[calcularIndiceMixto] %grasa: ${data.porcentajeGrasa}, cintura: ${data.circ_cintura}, altura: ${data.altura}`);
    const iav = Math.round((data.circ_cintura / data.altura) * 100) / 100;
    const indice = parseFloat((0.4 * (data.porcentajeGrasa / 100) + 0.6 * iav).toFixed(2));
    console.log(`[calcularIndiceMixto] Índice mixto calculado: ${indice}`);
    return indice;
}

// Function: Clasificar Riesgo IAV
export function clasificarRiesgoIAV(data, iav) {
    console.log(`[clasificarRiesgoIAV] género: ${data.genero}, edad: ${data.edad}, IAV: ${iav}`);
    // Validaciones básicas
    if (typeof iav !== 'number' || iav < 0) return 'IAV no válido';
    if (!data.genero || !data.edad) return 'Datos incompletos (género/edad requeridos)';

    if (data.genero === 'masculino') {
        if (data.edad >= 18 && data.edad <= 39) {
            if (iav < 0.50) return 'Normal (Bajo riesgo)';
            if (iav <= 0.59) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        } else if (data.edad >= 40 && data.edad <= 59) {
            if (iav < 0.55) return 'Normal (Bajo riesgo)';
            if (iav <= 0.64) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        } else if (data.edad >= 60) {
            if (iav < 0.60) return 'Normal (Bajo riesgo)';
            if (iav <= 0.69) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        }
    } else if (data.genero === 'femenino') {
        if (data.edad >= 18 && data.edad <= 39) {
            if (iav < 0.45) return 'Normal (Bajo riesgo)';
            if (iav <= 0.54) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        } else if (data.edad >= 40 && data.edad <= 59) {
            if (iav < 0.50) return 'Normal (Bajo riesgo)';
            if (iav <= 0.59) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        } else if (data.edad >= 60) {
            if (iav < 0.55) return 'Normal (Bajo riesgo)';
            if (iav <= 0.64) return 'Elevado (Riesgo moderado)';
            return 'Alto (Riesgo elevado)';
        }
    }
    return 'No aplicable';
}

// Function: Clasificar Riesgo Mixto
export function clasificarRiesgoMixto(data, indiceMixto) {
    console.log(`[clasificarRiesgoMixto] género: ${data.genero}, índice mixto: ${indiceMixto}`);
    // Validaciones básicas
    if (typeof indiceMixto !== 'number' || indiceMixto < 0) return 'Índice no válido';
    if (!data.genero) return 'Género no especificado';

    if (data.genero === 'masculino') {
        if (indiceMixto < 0.35) return 'Bajo riesgo';
        if (indiceMixto <= 0.45) return 'Riesgo moderado';
        return 'Alto riesgo';
    } else if (data.genero === 'femenino') {
        if (indiceMixto < 0.40) return 'Bajo riesgo';
        if (indiceMixto <= 0.50) return 'Riesgo moderado';
        return 'Alto riesgo';
    }
    return 'No aplicable';
}

// Function: Calcular Grasa Visceral total logic
export function calcularGrasaVisceral(data) {
    console.log('[calcularGrasaVisceral] Iniciando cálculo con datos:', data);
    let resultados = {
        indiceMixto: null,
        iav: null,
        riesgo: null,
        metodo: null,
        porcentajeGrasa: null
    };

    if (!data.genero || !data.edad || !data.circ_cintura || !data.altura) {
        throw new Error('Datos incompletos. Se requieren: genero, edad, circ_cintura, altura');
    }

    if (data.es_deportista === "si") {
        if (data.porcentajeGrasaActual) {
            resultados.porcentajeGrasa = data.porcentajeGrasaActual;
            console.log(`[calcularGrasaVisceral] Usando %grasa proporcionado: ${data.porcentajeGrasaActual}%`);
        } else if (data.pliegue_tricipital && data.pliegue_subescapular &&
            data.pliegue_bicipital && data.pliegue_suprailiaco) {
            resultados.porcentajeGrasa = calculateJacksonPollockBodyFat(data);
            console.log(`[calcularGrasaVisceral] %grasa calculado por Jackson-Pollock: ${resultados.porcentajeGrasa}%`);
        } else {
            throw new Error('Para deportistas se requiere % de grasa o medidas de pliegues');
        }

        resultados.indiceMixto = calcularIndiceMixto({
            porcentajeGrasa: resultados.porcentajeGrasa,
            circ_cintura: data.circ_cintura,
            altura: data.altura
        });
        resultados.riesgo = clasificarRiesgoMixto({ genero: data.genero }, resultados.indiceMixto);
        resultados.metodo = 'Fórmula Mixta (Thomas et al. 2013) para Deportistas';

    } else {
        resultados.iav = calcularIAV({
            circ_cintura: data.circ_cintura,
            altura: data.altura
        });
        resultados.riesgo = clasificarRiesgoIAV({
            genero: data.genero,
            edad: data.edad
        }, resultados.iav);
        resultados.metodo = 'IAV (Krakauer)';
    }
    return resultados;
}

// Function to calculate Total Abdominal Fat (GAT), Thickness, and Mass
export const calculateTotalAbdominalFat = (data) => {
    console.log('Calculating Total Abdominal Fat (GAT), Thickness, and Mass');
    let gat = NaN;
    let source = '';
    let risk = '';
    let thickness = NaN;
    let thicknessSource = '';
    let abdominalFatMass = NaN;
    let unscaledGat = NaN; // For Method B unscaled GAT
    let unscaledRisk = ''; // For Method B unscaled GAT risk

    // Calculate BMI for Kvist formula (Method B)
    const bmi = data.peso && data.altura ? data.peso / ((data.altura / 100) ** 2) : NaN;

    // Method A: For athletes with abdominal skinfold
    if (data.es_deportista === 'si' && data.pliegue_abdominal && data.circ_cintura) {
        const cc = data.circ_cintura; // Circumference in cm
        const pca = data.pliegue_abdominal; // Abdominal skinfold in mm
        if (pca <= 40) { // Check for obesity limitation
            gat = ((2 * cc * pca) - ((Math.PI * pca * pca) / 4)) / 10;
            source = 'Método A: Pliegue Abdominal y Circunferencia de Cintura (Kvist et al., 1988)';
            console.log(`GAT Method A: CC=${cc}, PCA=${pca}, GAT=${gat} cm²`);

            // Calculate abdominal fat thickness
            let k;
            if (data.genero === 'masculino') {
                if (data.edad >= 18 && data.edad <= 39) k = 2.0;
                else if (data.edad <= 59) k = 2.5;
                else if (data.edad >= 60) k = 3.0;
                else if (data.edad >= 6 && data.edad <= 9) k = 1.0;
                else if (data.edad <= 13) k = 1.2;
                else k = 1.5; // 14–18
            } else if (data.genero === 'femenino') {
                if (data.edad >= 18 && data.edad <= 39) k = 1.5;
                else if (data.edad <= 59) k = 2.0;
                else if (data.edad >= 60) k = 2.5;
                else if (data.edad >= 6 && data.edad <= 9) k = 1.0;
                else if (data.edad <= 13) k = 1.2;
                else k = 1.5; // 14–18
            }
            if (k !== undefined) {
                thickness = (0.1 * pca) + (0.05 * cc) - k;
                console.log(`Method A Thickness: PCA=${pca}, CC=${cc}, k=${k}, Thickness=${thickness} cm`);

                // Calculate abdominal fat mass using volume
                const density = 0.00092; // kg/cm³
                const volume = gat * thickness; // cm³
                abdominalFatMass = volume * density; // kg
                console.log(`Method A Abdominal Fat Mass: Volume=${volume} cm³, Mass=${abdominalFatMass} kg`);

                // Risk assessment for fat mass
                let massRisk = '';
                let healthyRange = '';
                if (data.genero === 'masculino') {
                    if (data.edad >= 18 && data.edad <= 39) {
                        if (abdominalFatMass < 1.8) {
                            massRisk = 'Normal';
                            healthyRange = '<1.8 kg';
                        } else if (abdominalFatMass <= 3.6) {
                            massRisk = 'Moderado (vigilar)';
                            healthyRange = '<1.8 kg';
                        } else {
                            massRisk = 'Alto (mayor riesgo cardiovascular)';
                            healthyRange = '<1.8 kg';
                        }
                    } else if (data.edad <= 59) {
                        if (abdominalFatMass < 2.0) {
                            massRisk = 'Normal';
                            healthyRange = '<2.0 kg';
                        } else if (abdominalFatMass <= 4.0) {
                            massRisk = 'Moderado (vigilar)';
                            healthyRange = '<2.0 kg';
                        } else {
                            massRisk = 'Alto (mayor riesgo cardiovascular)';
                            healthyRange = '<2.0 kg';
                        }
                    } else if (data.edad >= 60) {
                        if (abdominalFatMass < 2.2) {
                            massRisk = 'Normal';
                            healthyRange = '<2.2 kg';
                        } else if (abdominalFatMass <= 4.4) {
                            massRisk = 'Moderado (vigilar)';
                            healthyRange = '<2.2 kg';
                        } else {
                            massRisk = 'Alto (mayor riesgo cardiovascular)';
                            healthyRange = '<2.2 kg';
                        }
                    } else if (data.edad >= 6 && data.edad <= 18) {
                        if (data.edad <= 9) {
                            if (abdominalFatMass < 0.3) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.45) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.3 kg';
                        } else if (data.edad <= 13) {
                            if (abdominalFatMass < 0.36) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.54) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.36 kg';
                        } else {
                            if (abdominalFatMass < 0.45) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.6) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.45 kg';
                        }
                    }
                } else if (data.genero === 'femenino') {
                    if (data.edad >= 18 && data.edad <= 39) {
                        if (abdominalFatMass < 1.35) {
                            massRisk = 'Normal';
                            healthyRange = '<1.35 kg';
                        } else if (abdominalFatMass <= 3.15) {
                            massRisk = 'Moderado';
                            healthyRange = '<1.35 kg';
                        } else {
                            massRisk = 'Alto';
                            healthyRange = '<1.35 kg';
                        }
                    } else if (data.edad <= 59) {
                        if (abdominalFatMass < 1.5) {
                            massRisk = 'Normal';
                            healthyRange = '<1.5 kg';
                        } else if (abdominalFatMass <= 3.5) {
                            massRisk = 'Moderado';
                            healthyRange = '<1.5 kg';
                        } else {
                            massRisk = 'Alto';
                            healthyRange = '<1.5 kg';
                        }
                    } else if (data.edad >= 60) {
                        if (abdominalFatMass < 1.65) {
                            massRisk = 'Normal';
                            healthyRange = '<1.65 kg';
                        } else if (abdominalFatMass <= 3.85) {
                            massRisk = 'Moderado';
                            healthyRange = '<1.65 kg';
                        } else {
                            massRisk = 'Alto';
                            healthyRange = '<1.65 kg';
                        }
                    } else if (data.edad >= 6 && data.edad <= 18) {
                        if (data.edad <= 9) {
                            if (abdominalFatMass < 0.3) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.45) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.3 kg';
                        } else if (data.edad <= 13) {
                            if (abdominalFatMass < 0.36) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.54) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.36 kg';
                        } else {
                            if (abdominalFatMass < 0.45) massRisk = 'Normal';
                            else if (abdominalFatMass <= 0.6) massRisk = 'Moderado';
                            else massRisk = 'Alto';
                            healthyRange = '<0.45 kg';
                        }
                    }
                }
                thicknessSource = `Estimación de espesor (Método A): ${formatResult(thickness, 1)} cm, Masa grasa abdominal: ${formatResult(abdominalFatMass, 1)} kg, Riesgo: ${massRisk} (Rango saludable: ${healthyRange})`;
            } else {
                thicknessSource = '(No calculado: Faltan datos de género o edad)';
            }
        } else {
            console.warn('Pliegue abdominal > 40 mm, método menos preciso');
            source = 'Método A: Pliegue Abdominal > 40 mm, resultado menos preciso';
            thicknessSource = 'No calculado: Pliegue abdominal > 40 mm';
        }

        // Risk Assessment for GAT (Method A)
        if (!isNaN(gat) && data.genero && data.edad) {
            if (data.genero === 'masculino') {
                if (data.edad >= 18 && data.edad <= 39) {
                    if (gat < 180) risk = 'Normal';
                    else if (gat <= 360) risk = 'Moderado (vigilar)';
                    else risk = 'Alto (mayor riesgo cardiovascular)';
                } else if (data.edad <= 59) {
                    if (gat < 200) risk = 'Normal';
                    else if (gat <= 400) risk = 'Moderado (vigilar)';
                    else risk = 'Alto (mayor riesgo cardiovascular)';
                } else {
                    if (gat < 220) risk = 'Normal';
                    else if (gat <= 440) risk = 'Moderado (vigilar)';
                    else risk = 'Alto (mayor riesgo cardiovascular)';
                }
            } else if (data.genero === 'femenino') {
                if (data.edad >= 18 && data.edad <= 39) {
                    if (gat < 135) risk = 'Normal';
                    else if (gat <= 315) risk = 'Moderado';
                    else risk = 'Alto';
                } else if (data.edad <= 59) {
                    if (gat < 150) risk = 'Normal';
                    else if (gat <= 350) risk = 'Moderado';
                    else risk = 'Alto';
                } else {
                    if (gat < 165) risk = 'Normal';
                    else if (gat <= 385) risk = 'Moderado';
                    else risk = 'Alto';
                }
            } else if (data.edad >= 6 && data.edad < 18) {
                if (data.edad <= 9) {
                    if (gat < 100) risk = 'Normal';
                    else if (gat <= 150) risk = 'Moderado';
                    else risk = 'Alto';
                } else if (data.edad <= 13) {
                    if (gat < 120) risk = 'Normal';
                    else if (gat <= 180) risk = 'Moderado';
                    else risk = 'Alto';
                } else {
                    if (gat < 150) risk = 'Normal';
                    else if (gat <= 200) risk = 'Moderado';
                    else risk = 'Alto';
                }
            }
            source += `, Riesgo Metabólico: ${risk} (subcutáneo)`;
        }
    } else {
        // Method B: Using % Body Fat and Circumference
        let bodyFat = data.grasa_actual_conocida;
        if (isNaN(bodyFat)) {
            if (data.edad >= 18) {
                bodyFat = calculateDurninWomersleyBodyFat(data);
                if (isNaN(bodyFat)) {
                    bodyFat = calculateCircumferenceBodyFat(data);
                    source = isNaN(bodyFat) ? '(No calculado: Faltan datos para % Grasa)' : 'Método B: % Grasa por Circunferencias';
                } else {
                    source = 'Método B: % Grasa por Durnin-Womersley';
                }
            } else {
                bodyFat = calculateSlaughterBodyFat(data);
                source = isNaN(bodyFat) ? '(No calculado: Faltan datos para % Grasa)' : 'Método B: % Grasa por Slaughter';
            }
        } else {
            source = 'Método B: % Grasa proporcionado por el usuario';
        }

        if (!isNaN(bodyFat) && data.circ_cintura) {
            gat = (bodyFat / 10) * 0.45 * data.circ_cintura;
            unscaledGat = data.genero === 'masculino' ? gat * 10 : gat * 15; // Unscaled GAT for comparison
            console.log(`GAT Method B: %Grasa=${bodyFat}, CC=${data.circ_cintura}, Scaled GAT=${gat} cm², Unscaled GAT=${unscaledGat} cm²`);

            // Calculate abdominal fat thickness for Method B
            let k;
            if (data.genero === 'masculino') {
                if (data.edad >= 18 && data.edad <= 39) k = 2.0;
                else if (data.edad <= 59) k = 2.5;
                else if (data.edad >= 60) k = 3.0;
                else if (data.edad >= 6 && data.edad <= 9) k = 1.0;
                else if (data.edad <= 13) k = 1.2;
                else k = 1.5; // 14–18
            } else if (data.genero === 'femenino') {
                if (data.edad >= 18 && data.edad <= 39) k = 1.5;
                else if (data.edad <= 59) k = 2.0;
                else if (data.edad >= 60) k = 2.5;
                else if (data.edad >= 6 && data.edad <= 9) k = 1.0;
                else if (data.edad <= 13) k = 1.2;
                else k = 1.5; // 14–18
            }
            if (k !== undefined) {
                thickness = (0.05 * data.circ_cintura) + (0.1 * bodyFat) - k;
                // Kvist Mass
                if (!isNaN(bmi) && data.genero) {
                    if (data.genero === 'masculino') {
                        abdominalFatMass = (0.062 * data.circ_cintura) - (0.073 * bmi) - 1.018;
                    } else if (data.genero === 'femenino') {
                        abdominalFatMass = (0.055 * data.circ_cintura) - (0.065 * bmi) - 0.95;
                    }
                    thicknessSource = `Estimación de espesor (Método B): ${formatResult(thickness, 1)} cm, Masa grasa abdominal (Kvist et al., 1988, total): ${formatResult(abdominalFatMass, 1)} kg`;
                }
            }
            risk = 'Calculado';
            unscaledRisk = 'Calculado';
            source += `, Riesgo Metabólico: ${risk} (visceral)`;
        } else {
            source = '(No calculado: Faltan datos para % Grasa o Circunferencia)';
            thicknessSource = 'No calculado: Faltan datos para espesor y masa';
        }
    }
    return { value: gat, source: source, thickness: thickness, thicknessSource: thicknessSource, abdominalFatMass: abdominalFatMass, unscaledGat: unscaledGat, unscaledRisk: unscaledRisk };
};

// Function: Calculate % Grasa (Deurenberg)
export function calculateGrasaPctDeurenberg(peso, altura, edad, sexo) {
    console.log('[GrasaPctDeurenberg] Calculating % Grasa:', { peso, altura, edad, sexo });
    // Validate inputs
    if (!peso || !altura || !edad || peso <= 0 || altura <= 0 || edad < 18 || !['hombre', 'mujer'].includes(sexo)) {
        console.log('[GrasaPctDeurenberg] Invalid inputs, returning null');
        return null;
    }
    const alturaMeters = altura / 100;
    const imc = peso / (alturaMeters * alturaMeters);
    if (imc < 10 || imc > 50) return null;

    const sexoValue = sexo === 'hombre' ? 1 : 0;
    const result = (1.20 * imc) + (0.23 * edad) - (10.8 * sexoValue) - 5.4;
    return result;
}

// Function: Format GrasaPctDeurenberg Source
export function formatGrasaPctDeurenbergSource(grasaPct, sexo, edad, imc) {
    if (!grasaPct || !sexo || !edad || !imc || edad < 18 || imc < 16.0 || imc > 34.9) {
        return '(No estimado)';
    }
    return '(Calculado por Deurenberg)';
}

// Function: Calculate CUN-BAE Body Fat
export function calculateCUNBAEBodyFat(data, imc) {
    const { edad, genero, peso, altura } = data;
    if (!edad || !genero || !peso || !altura || isNaN(imc)) {
        return { grasaPct: NaN, source: '(No estimado: Datos insuficientes)' };
    }
    if (edad < 18) return { grasaPct: NaN, source: '(No estimado: Edad < 18 años)' };

    const sexo = genero.toLowerCase() === 'masculino' ? 1 : genero.toLowerCase() === 'femenino' ? 0 : null;
    if (sexo === null) return { grasaPct: NaN, source: '(No estimado: Género no válido)' };

    const imc2 = imc * imc;
    const grasaPct = -44.988 + (0.503 * edad) + (10.689 * sexo) + (3.172 * imc) - (0.026 * imc2) + (0.181 * imc * sexo) - (0.02 * imc * edad) - (0.005 * imc2 * sexo) + (0.00021 * imc2 * edad) - 11.43;

    let category = '';
    if (sexo === 1) { // Hombres
        if (grasaPct < 12) category = 'Bajo (<12%)';
        else if (grasaPct <= 20) category = 'Normal (12–20%)';
        else if (grasaPct <= 25) category = 'Elevado (20–25%)';
        else category = 'Obesidad (>25%)';
    } else { // Mujeres
        if (grasaPct < 25) category = 'Bajo (<25%)';
        else if (grasaPct <= 33) category = 'Normal (25–33%)';
        else if (grasaPct <= 39) category = 'Elevado (33–39%)';
        else category = 'Obesidad (>39%)';
    }

    return {
        grasaPct: grasaPct,
        source: `CUN-BAE: ${category}`
    };
}

// Function: Calculate Somatotype (Heath-Carter)
export const calculateSomatotype = (data) => {
    console.log('Calculating Somatotype (Heath-Carter)');
    const results = {
        endomorfia: NaN,
        mesomorfia: NaN,
        ectomorfia: NaN,
        somatotipoSource: '(No calculado)',
        x: null,
        y: null
    };

    try {
        if (
            data.altura &&
            data.peso &&
            data.pliegue_tricipital &&
            data.pliegue_subescapular &&
            data.pliegue_suprailiaco &&
            data.pliegue_pantorrilla &&
            data.diam_humero &&
            data.diam_femur &&
            data.circ_brazo &&
            data.circ_pantorrilla
        ) {
            // Convert and validate inputs
            const altura = parseFloatSafe(data.altura);
            const peso = parseFloatSafe(data.peso);
            const pliegueTricipital = parseFloatSafe(data.pliegue_tricipital);
            const pliegueSubescapular = parseFloatSafe(data.pliegue_subescapular);
            const pliegueSuprailiaco = parseFloatSafe(data.pliegue_suprailiaco);
            const plieguePantorrilla = parseFloatSafe(data.pliegue_pantorrilla);
            let diamHumero = parseFloatSafe(data.diam_humero);
            let diamFemur = parseFloatSafe(data.diam_femur);
            const circBrazo = parseFloatSafe(data.circ_brazo);
            const circPantorrilla = parseFloatSafe(data.circ_pantorrilla);

            // Validate ranges and units
            if (altura < 100 || altura > 250) throw new Error('Altura fuera de rango (100–250 cm)');
            if (peso < 30 || peso > 200) throw new Error('Peso fuera de rango (30–200 kg)');

            // Convert bone diameters from mm to cm if necessary
            if (diamHumero > 20) diamHumero /= 10;
            if (diamFemur > 20) diamFemur /= 10;

            // Endomorfia
            const sum3Pliegues = pliegueTricipital + pliegueSubescapular + pliegueSuprailiaco;
            const X = sum3Pliegues * (170.18 / altura);
            results.endomorfia = -0.7182 + 0.1451 * X - 0.00068 * Math.pow(X, 2) + 0.0000014 * Math.pow(X, 3);

            // Mesomorfia
            const pliegueTricepsCm = pliegueTricipital / 10;
            const plieguePantorrillaCm = plieguePantorrilla / 10;
            const circBrazoCorregido = circBrazo - pliegueTricepsCm;
            const circPantorrillaCorregida = circPantorrilla - plieguePantorrillaCm;

            // Heath-Carter Formula: 0.858*H + 0.601*F + 0.188*Arm + 0.161*Calf - 0.131*Height + 4.5
            // Note: Height must be in cm.
            const rawMesomorfia =
                0.858 * diamHumero +
                0.601 * diamFemur +
                0.188 * circBrazoCorregido +
                0.161 * circPantorrillaCorregida -
                0.131 * altura +
                4.5;

            results.mesomorfia = rawMesomorfia;

            // Ectomorfia
            const HWR = altura / Math.pow(peso, 1 / 3);
            if (HWR > 40.75) {
                results.ectomorfia = 0.732 * HWR - 28.58;
            } else if (HWR >= 38.25) {
                results.ectomorfia = 0.463 * HWR - 17.63;
            } else {
                results.ectomorfia = 0.1;
            }

            // Ensure non-negative and min 0.1
            results.endomorfia = Math.max(0.1, results.endomorfia);
            results.mesomorfia = Math.max(0.1, results.mesomorfia);
            results.ectomorfia = Math.max(0.1, results.ectomorfia);
            results.somatotipoSource = 'Heath-Carter';

            // Coordinates for chart
            results.x = results.ectomorfia - results.endomorfia;
            results.y = 2 * results.mesomorfia - (results.ectomorfia + results.endomorfia);

            console.log('Somatotype calculated:', results);

        } else {
            results.somatotipoSource = '(No calculado: Datos insuficientes - se requieren pliegues, diámetros y circunferencias)';
        }
    } catch (e) {
        console.error('Error calculating somatotype:', e);
        results.somatotipoSource = 'Error: ' + e.message;
    }
    return results;
};

