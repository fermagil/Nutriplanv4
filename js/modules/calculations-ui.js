import {
    parseFloatSafe, calculateIMC, calculateICC, calcularACT,
    calculateMetabolicAge, estimateTargetBodyFat, calculateSlaughterBodyFat,
    calculateJacksonPollockBodyFat, calculateCircumferenceBodyFat, calculateDurninWomersleyBodyFat,
    formatResult, calculateTotalAbdominalFat, calcularGrasaVisceral, calculateGrasaPctDeurenberg,
    formatGrasaPctDeurenbergSource, calculateCUNBAEBodyFat, calculateSomatotype,
    calculateIdealWeight, calculateWeightObjective, calculateMuscleMassToGain
} from './math-utils.js';
import { generateBodyCompositionAnalysis, generateExplanationsAndSuggestionsHTML, renderExplanationsAndSuggestionsCharts } from './report-generator.js';

let resultElements = {};

// --- Helper Functions for Source Formatting ---

function formatAmbSource(amb, ranges, isAthlete, gender, ageRange) {
    if (!ranges || isNaN(amb)) return '(No calculado)';
    if (isAthlete) {
        if (amb < ranges.P50) return `Dxt Recreativo percentil <50 (${ranges.P50} cm²)`;
        else if (amb >= ranges.P50 && amb < ranges.P75) return `Dxt Recreativo/Competitivo Percentil 50 (${ranges.P50} cm²)`;
        else if (amb >= ranges.P75 && amb < ranges.P90) return `Dxt Competitivo Percentil 75 (${ranges.P75} cm²)`;
        else return `Dxt Fuerza/Elite Percentil >90 (${ranges.P90} cm²)`;
    } else {
        if (amb < ranges.P5) return `Muy bajo percentil <5 (${ranges.P5} cm²)`;
        else if (amb >= ranges.P5 && amb < ranges.P50) return `Bajo-Medio Percentiles 5–50 (${ranges.P5}–${ranges.P50} cm²)`;
        else if (amb >= ranges.P50 && amb < ranges.P95) return `Medio-Alto Percentil >50 (${ranges.P50}–${ranges.P95} cm²)`;
        else return `Muy Alto percentil >95 (${ranges.P95} cm²)`;
    }
}

function formatPctmmtSource(pctmmt, gender, isAthlete, peso, mmt) {
    if (isNaN(pctmmt) || !gender) return { text: '(No calculado)', muscleToGain: null };
    gender = gender.toLowerCase();
    let healthyRange, minHealthyPct, resultText;

    if (gender === 'masculino') {
        healthyRange = isAthlete ? '45–55%' : '38–48%';
        minHealthyPct = isAthlete ? 45 : 38;
    } else if (gender === 'femenino') {
        healthyRange = isAthlete ? '35–45%' : '30–40%';
        minHealthyPct = isAthlete ? 35 : 30;
    } else {
        return { text: '(No calculado)', muscleToGain: null };
    }

    if (pctmmt >= minHealthyPct && pctmmt <= (minHealthyPct + 10)) {
        resultText = `Rango saludable (${healthyRange})`;
    } else if (pctmmt < minHealthyPct) {
        resultText = `Por debajo del rango saludable (${healthyRange})`;
    } else {
        resultText = `Por encima del rango saludable (${healthyRange})`;
    }

    let muscleToGain = null;
    let muscleToGainSource = '(No calculado)';
    if (pctmmt < minHealthyPct && !isNaN(peso) && !isNaN(mmt)) {
        const targetMMT = (minHealthyPct / 100) * peso;
        muscleToGain = Math.max(0, Number((targetMMT - mmt).toFixed(1)));
        resultText += `; Gana ${muscleToGain} kg para alcanzar ${minHealthyPct}%`;
        muscleToGainSource = `(Para alcanzar el rango saludable)`;
    } else if (pctmmt >= minHealthyPct) {
        muscleToGain = 0;
        resultText += `; No necesitas ganar masa muscular`;
        muscleToGainSource = `(No necesitas ganar masa muscular)`;
    }

    return { text: resultText, muscleToGain, muscleToGainSource };
}

function formatMasaResidualSource(masaResidualPct, gender) {
    if (isNaN(masaResidualPct) || !gender) return '(No calculado)';
    gender = gender.toLowerCase();
    const min = gender === 'masculino' ? 22 : 19;
    const max = gender === 'masculino' ? 26 : 23;
    const rangeText = `${min}–${max}%`;

    if (masaResidualPct >= min && masaResidualPct <= max) return `Rango típico (${rangeText})`;
    else if (masaResidualPct < min) return `Por debajo del rango típico (${rangeText})`;
    else return `Por encima del rango típico (${rangeText})`;
}

function formatMasaOseaSource(boneMassPct, gender, age, isAthlete) {
    if (isNaN(boneMassPct) || !gender || !age) return '(No calculado)';
    gender = gender.toLowerCase();

    const boneMassRanges = {
        masculino: {
            '15-19': { range: [14, 15], obs: 'Pico óseo' },
            '20-29': { range: [14, 15], obs: 'Máximo óseo' },
            '30-39': { range: [13.5, 14.5], obs: 'Inicio descenso' },
            '40-49': { range: [13, 14], obs: 'Pérdida sin ejercicio' },
            '50-59': { range: [12, 13.5], obs: 'Riesgo desmineralización' },
            '60-69': { range: [11.5, 13], obs: 'Disminución sin ejercicio' },
            '70+': { range: [11, 12.5], obs: 'Alto riesgo fracturas' },
            athlete: { range: [15, 16], obs: 'Densidad ósea sólida' }
        },
        femenino: {
            '15-19': { range: [12, 13.5], obs: 'Desarrollo óseo' },
            '20-29': { range: [12, 13.5], obs: 'Máximo óseo' },
            '30-39': { range: [11.5, 13], obs: 'Pérdida inicial' },
            '40-49': { range: [11, 12.5], obs: 'Pérdida acelerada' },
            '50-59': { range: [10.5, 12], obs: 'Riesgo osteoporosis' },
            '60-69': { range: [10, 11.5], obs: 'Pérdida significativa' },
            '70+': { range: [9.5, 11], obs: 'Prevención osteoporosis' },
            athlete: { range: [13, 14], obs: 'Densidad ósea sólida' }
        }
    };

    const boneAgeRange = age >= 15 && age <= 19 ? '15-19' :
        age <= 29 ? '20-29' :
            age <= 39 ? '30-39' :
                age <= 49 ? '40-49' :
                    age <= 59 ? '50-59' :
                        age <= 69 ? '60-69' : '70+';

    const entry = isAthlete ? boneMassRanges[gender].athlete : boneMassRanges[gender][boneAgeRange];
    if (!entry) return '(No calculado)'; // Should not happen given ranges cover all ages > 15
    const [min, max] = entry.range;
    const obs = entry.obs;
    const rangeText = `${min}–${max}%`;

    if (boneMassPct >= min && boneMassPct <= max) return `Rango saludable (${rangeText}): ${obs}`;
    else if (boneMassPct < min) return `Por debajo del rango saludable (${rangeText}): ${obs}`;
    else return `Por encima del rango saludable (${rangeText}): ${obs}`;
}

const ambRangesData = {
    masculino: {
        general: {
            '18-20': { P5: 23.4, P50: 30.4, P95: 39.6 },
            '21-24': { P5: 23.6, P50: 30.6, P95: 39.8 },
            '25-29': { P5: 23.8, P50: 31.0, P95: 40.0 },
            '30-34': { P5: 23.5, P50: 30.6, P95: 39.8 },
            '35-39': { P5: 22.9, P50: 29.9, P95: 39.0 },
            '40-44': { P5: 22.6, P50: 29.5, P95: 38.5 },
            '45-49': { P5: 21.8, P50: 28.5, P95: 37.3 },
            '50-54': { P5: 21.2, P50: 27.9, P95: 36.5 },
            '55-59': { P5: 20.6, P50: 27.1, P95: 35.5 },
            '60-64': { P5: 20.2, P50: 26.4, P95: 34.7 },
            '65-70': { P5: 19.0, P50: 25.0, P95: 33.0 },
            '70+': { P5: 16.5, P50: 21.9, P95: 29.0 }
        },
        athlete: {
            '18-20': { P50: 30.5, P75: 34.5, P90: 40.5 },
            '21-24': { P50: 30.8, P75: 34.8, P90: 41.0 },
            '25-29': { P50: 31.2, P75: 35.2, P90: 41.5 },
            '30-34': { P50: 30.8, P75: 34.7, P90: 41.0 },
            '35-39': { P50: 30.0, P75: 33.8, P90: 40.0 },
            '40-44': { P50: 29.6, P75: 33.3, P90: 39.5 },
            '45-49': { P50: 28.7, P75: 32.1, P90: 38.3 },
            '50-54': { P50: 28.1, P75: 31.5, P90: 37.5 },
            '55-59': { P50: 27.2, P75: 30.5, P90: 36.4 },
            '60-64': { P50: 26.5, P75: 29.7, P90: 35.5 },
            '65-70': { P50: 25.0, P75: 28.2, P90: 34.0 },
            '70+': { P50: 21.9, P75: 25.2, P90: 30.0 }
        }
    },
    femenino: {
        general: {
            '18-20': { P5: 17.7, P50: 22.6, P95: 28.8 },
            '21-24': { P5: 17.9, P50: 22.8, P95: 29.1 },
            '25-29': { P5: 18.0, P50: 23.2, P95: 29.8 },
            '30-34': { P5: 17.8, P50: 22.9, P95: 29.4 },
            '35-39': { P5: 17.3, P50: 22.4, P95: 29.0 },
            '40-44': { P5: 17.1, P50: 22.2, P95: 28.8 },
            '45-49': { P5: 16.6, P50: 21.8, P95: 28.4 },
            '50-54': { P5: 16.3, P50: 21.4, P95: 27.9 },
            '55-59': { P5: 15.8, P50: 21.0, P95: 27.4 },
            '60-64': { P5: 15.4, P50: 20.5, P95: 26.8 },
            '65-70': { P5: 14.7, P50: 19.5, P95: 25.6 },
            '70+': { P5: 13.2, P50: 17.7, P95: 23.5 }
        },
        athlete: {
            '18-20': { P50: 22.7, P75: 25.8, P90: 30.5 },
            '21-24': { P50: 22.9, P75: 26.0, P90: 31.0 },
            '25-29': { P50: 23.3, P75: 26.5, P90: 31.5 },
            '30-34': { P50: 23.0, P75: 26.2, P90: 31.0 },
            '35-39': { P50: 22.5, P75: 25.5, P90: 30.2 },
            '40-44': { P50: 22.2, P75: 25.1, P90: 29.7 },
            '45-49': { P50: 21.8, P75: 24.6, P90: 29.0 },
            '50-54': { P50: 21.4, P75: 24.1, P90: 28.4 },
            '55-59': { P50: 21.0, P75: 23.6, P90: 27.8 },
            '60-64': { P50: 20.5, P75: 22.9, P90: 27.0 },
            '65-70': { P50: 19.5, P75: 21.8, P90: 25.6 },
            '70+': { P50: 17.7, P75: 20.0, P90: 24.0 }
        }
    }
};

// --- Main UI Logic ---

export const initializeResultElements = () => {
    resultElements = {
        imc: document.getElementById('result-imc'),
        imcSource: document.getElementById('imc-source'),
        icc: document.getElementById('result-icc'),
        iccSource: document.getElementById('icc-source'),
        grasaPctActual: document.getElementById('result-grasa-pct-actual'),
        grasaPctActualSource: document.getElementById('grasa-pct-actual-source'),
        grasaPctMetabolic: document.getElementById('result-grasa-pct-metabolic'),
        grasaPctMetabolicSource: document.getElementById('grasa-pct-metabolic-source'),
        grasaPctDeseado: document.getElementById('result-grasa-pct-deseado'),
        grasaPctDeseadoSource: document.getElementById('grasa-pct-deseado-source'),
        grasaPctDeurenberg: document.getElementById('result-grasa-pct-Deurenberg'),
        grasaPctDeurenbergSource: document.getElementById('grasa-pct-Deurenberg-source'),
        grasaPctCUNBAE: document.getElementById('result-grasa-pct-CUN-BAE'),
        grasaPctCUNBAESource: document.getElementById('grasa-pct-CUN-BAE-source'),
        grasavisceralActual: document.getElementById('result-grasa-pct-visceral'),
        grasavisceralActualSource: document.getElementById('grasa-pct-visceral-source'),
        grasaAbsActual: document.getElementById('result-grasa-abdominal'),
        grasaAbsActualSource: document.getElementById('grasa-abdominal-source'),
        abdominalFatThickness: document.getElementById('result-abdominal-fat-thickness'),
        abdominalFatThicknessSource: document.getElementById('abdominal-fat-thickness-source'),
        masaGrasaActual: document.getElementById('result-masa-grasa-actual'),
        masaGrasaActualSource: document.getElementById('masa-grasa-actual-source'),
        masaGrasaMetabolic: document.getElementById('result-masa-grasa-metabolic'),
        masaGrasaMetabolicSource: document.getElementById('masa-grasa-metabolic-source'),
        masaMagraActual: document.getElementById('result-masa-magra-actual'),
        masaMagraActualSource: document.getElementById('masa-magra-actual-source'),
        masaMagraMetabolic: document.getElementById('result-masa-magra-metabolic'),
        masaMagraMetabolicSource: document.getElementById('masa-grasa-metabolic-source'), // ID reused in original?
        imlgActual: document.getElementById('result-imlg-actual'),
        imlgActualSource: document.getElementById('imlg-actual-source'),
        imlgMetabolic: document.getElementById('result-imlg-metabolic'),
        imlgMetabolicSource: document.getElementById('imlg-metabolic-source'),
        imgActual: document.getElementById('result-img-actual'),
        imgActualSource: document.getElementById('img-actual-source'),
        imgMetabolic: document.getElementById('result-img-metabolic'),
        imgMetabolicSource: document.getElementById('img-metabolic-source'),
        tipologiaActual: document.getElementById('result-tipologia-actual'),
        tipologiaActualSource: document.getElementById('tipologia-actual-source'),
        tipologiaMetabolic: document.getElementById('result-tipologia-metabolic'),
        tipologiaMetabolicSource: document.getElementById('tipologia-metabolic-source'),
        BRMEstimado: document.getElementById('result-tmb'),
        BRMEstimadoSource: document.getElementById('tmb-source'),
        edadmetabolica: document.getElementById('result-edadmetabolica'),
        edadmetabolicaSource: document.getElementById('edadmetabolica-source'),
        somatotipo: document.getElementById('result-somatotipo'),
        somatotipoSource: document.getElementById('somatotipo-source'),
        amb: document.getElementById('result-amb'),
        ambSource: document.getElementById('amb-source'),
        ambc: document.getElementById('result-ambc'),
        ambcSource: document.getElementById('ambc-source'),
        mmt: document.getElementById('result-mmt'),
        mmtSource: document.getElementById('mmt-source'),
        mmt2: document.getElementById('result-mmt2'),
        mmt2Source: document.getElementById('mmt2-source'),
        Pctmmt: document.getElementById('result-Pct-mmt'),
        PctmmtSource: document.getElementById('Pct-mmt-source'),
        Pctmmt2: document.getElementById('result-Pct-mmt2'),
        Pctmmt2Source: document.getElementById('Pct-mmt2-source'),
        masaOsea: document.getElementById('result-masa-osea'),
        masaOseaSource: document.getElementById('masa-osea-source'),
        masaResidual: document.getElementById('result-masa-residual'),
        masaResidualSource: document.getElementById('masa-residual-source'),
        pesoIdeal: document.getElementById('result-peso-ideal'),
        pesoIdealMetabolic: document.getElementById('result-peso-ideal-metabolic'),
        pesoObjetivo: document.getElementById('result-peso-objetivo'),
        pesoObjetivoMetabolic: document.getElementById('result-peso-objetivo-metabolic'),
        pesoMuscular: document.getElementById('result-peso-muscular'),
        pesoMuscularSource: document.getElementById('peso-muscular-source'),
        aguacorporal: document.getElementById('result-agua-corporal'),
        aguacorporalSource: document.getElementById('agua-corporal-source')
    };
    return resultElements;
};

export const resetResultElements = () => {
    Object.values(resultElements).forEach(el => {
        if (!el || !el.tagName) return;
        if (el.tagName === 'SPAN') {
            el.textContent = '---';
        } else if (el.tagName === 'SMALL') {
            el.textContent = '(No calculado/estimado)';
        }
    });
};

export const updateResultElement = (key, value, source = null) => {
    if (resultElements[key]) {
        resultElements[key].textContent = value !== null && value !== undefined && !Number.isNaN(value) ? value : '---';
    }
    if (source && resultElements[`${key}Source`]) {
        resultElements[`${key}Source`].textContent = source;
    }
};

const drawSomatotypeChart = (results) => {
    const canvasSomatotype = document.getElementById('somatotype-point-canvas');
    const imgSomatotype = document.getElementById('somatotype-image');
    if (!canvasSomatotype || !imgSomatotype) return;

    const ctxSomatotype = canvasSomatotype.getContext('2d');

    const draw = () => {
        canvasSomatotype.width = imgSomatotype.width;
        canvasSomatotype.height = imgSomatotype.height;
        ctxSomatotype.clearRect(0, 0, canvasSomatotype.width, canvasSomatotype.height);

        const chartWidth = imgSomatotype.width * 0.8;
        const chartHeight = imgSomatotype.height * 0.8;
        const chartOffsetX = (imgSomatotype.width - chartWidth) / 2;
        const chartOffsetY = (imgSomatotype.height - chartHeight) / 2;

        const centerX = chartOffsetX + chartWidth / 2;
        const centerY = chartOffsetY + chartHeight / 2;
        const xAxisY = chartOffsetY + 1 * chartHeight;

        const x = results.x;
        const y = results.y;

        if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return;

        const xClamped = Math.min(Math.max(x, -8), 8);
        const yClamped = Math.min(Math.max(y, -10), 12);
        const pixelX = chartOffsetX + ((xClamped + 8) / 16) * chartWidth;
        const pixelY = centerY - (yClamped / 22) * ((centerY - chartOffsetY) + (xAxisY - centerY));

        // Draw point
        ctxSomatotype.beginPath();
        ctxSomatotype.arc(pixelX, pixelY, 40, 0, 2 * Math.PI);
        ctxSomatotype.fillStyle = '#0056b3';
        ctxSomatotype.fill();
        ctxSomatotype.strokeStyle = '#003087';
        ctxSomatotype.lineWidth = 6;
        ctxSomatotype.stroke();

        // Text
        const somatotypeText = `(${formatResult(results.endomorfia, 1)}-${formatResult(results.mesomorfia, 1)}-${formatResult(results.ectomorfia, 1)})`;
        const coordinatesText = `(${formatResult(x, 1)}, ${formatResult(y, 1)})`;

        ctxSomatotype.font = 'bold 70px Roboto, sans-serif';
        ctxSomatotype.fillStyle = '#000000';
        ctxSomatotype.strokeStyle = '#ffffff';
        ctxSomatotype.lineWidth = 5;
        ctxSomatotype.textAlign = 'center';

        ctxSomatotype.strokeText(somatotypeText, pixelX, pixelY - 55);
        ctxSomatotype.fillText(somatotypeText, pixelX, pixelY - 55);

        ctxSomatotype.font = 'bold 65px Roboto, sans-serif';
        ctxSomatotype.strokeText(coordinatesText, pixelX, pixelY + 85);
        ctxSomatotype.fillText(coordinatesText, pixelX, pixelY + 85);
    };

    if (imgSomatotype.complete) {
        draw();
    } else {
        imgSomatotype.onload = draw;
    }
};

export const handleFormSubmit = async (event) => {
    event.preventDefault();
    console.log('Form submitted via calculations-ui handler');

    const guardarDatosBtn = document.getElementById('guardar_datos');
    if (guardarDatosBtn) guardarDatosBtn.style.display = 'inline-block';

    resetResultElements();

    const form = event.target;
    // Hide previous explanations
    const explanationSection = document.getElementById('explanation-section');
    const explanationContent = document.getElementById('explanation-content');
    if (explanationSection) explanationSection.style.display = 'none';
    if (explanationContent) explanationContent.innerHTML = '';

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => key === 'es_deportista' ? null : (data[key] = value)); // Handle checkboxes manually or assume text

    // Numeric conversion
    const numericFields = [
        'edad', 'peso', 'altura', 'pliegue_tricipital', 'pliegue_subescapular',
        'pliegue_suprailiaco', 'pliegue_bicipital', 'pliegue_pantorrilla',
        'pliegue_abdominal', 'circ_cintura', 'circ_cadera', 'circ_cuello',
        'circ_pantorrilla', 'circ_brazo', 'circ_brazo_contraido', 'diam_humero',
        'diam_femur', 'diam_muneca', 'grasa_actual_conocida', 'grasa_deseada'
    ];
    // Also include lab results if needed

    for (const [key, value] of formData.entries()) {
        if (numericFields.includes(key)) {
            data[key] = parseFloatSafe(value);
        } else {
            data[key] = value;
        }
    }
    // Handle radio/select specifically if needed, but FormData usually handles it.
    // Ensure es_deportista
    data.es_deportista = formData.get('es_deportista') || 'no'; // Default to no

    const { genero, edad, peso, altura } = data;
    const esDeportista = data.es_deportista === 'si';
    data.genero = genero;
    data.esDeportista = esDeportista;

    // Check essentials
    if (!peso || !altura || !genero || !edad) {
        alert('Por favor, complete los campos obligatorios: Género, Edad, Peso, Altura.');
        return;
    }

    const alturaM = altura / 100;
    const results = {};

    // --- IMC ---
    try {
        const { imc, imcSource } = calculateIMC(data);
        results.imc = imc;
        results.imcSource = imcSource;
        updateResultElement('imc', formatResult(imc, 2));
        updateResultElement('imcSource', `${imcSource.clasificacion} (${imcSource.riesgo})`);
    } catch (e) {
        results.imc = NaN;
        console.warn(e.message);
    }

    // --- ICC ---
    try {
        const { icc, iccSource } = calculateICC(data);
        results.icc = icc;
        results.iccSource = iccSource;
        updateResultElement('icc', formatResult(icc, 2));
        updateResultElement('iccSource', `${iccSource.clasificacion} (${iccSource.riesgo})`);
    } catch (e) { results.icc = NaN; }

    // --- Grasa Actual ---
    let actualBodyFatPct = NaN;
    let actualBodyFatSource = '(No calculado)';

    if (!isNaN(data.grasa_actual_conocida)) {
        actualBodyFatPct = data.grasa_actual_conocida;
        actualBodyFatSource = '(Proporcionado: BioImpedancia)';
    } else {
        if (edad < 6) actualBodyFatSource = '(No calculado: Edad < 6 años)';
        else if (edad <= 17) {
            actualBodyFatPct = calculateSlaughterBodyFat(data);
            if (!isNaN(actualBodyFatPct)) actualBodyFatSource = '(Calculado: Slaughter, 6-17 años)';
        } else {
            if (esDeportista) {
                actualBodyFatPct = calculateJacksonPollockBodyFat(data);
                if (!isNaN(actualBodyFatPct)) actualBodyFatSource = '(Calculado: Jackson-Pollock, 3 pliegues, deportistas)';
            } else {
                actualBodyFatPct = calculateDurninWomersleyBodyFat(data);
                if (!isNaN(actualBodyFatPct)) actualBodyFatSource = '(Calculado: Durnin-Womersley, adultos no deportistas)';
            }
            if (isNaN(actualBodyFatPct)) {
                actualBodyFatPct = calculateCircumferenceBodyFat(data);
                if (!isNaN(actualBodyFatPct)) actualBodyFatSource = '(Calculado: Circunferencias US Navy)';
            }
        }
    }
    results.grasaPctActual = actualBodyFatPct;
    results.actualBodyFatSource = actualBodyFatSource;
    updateResultElement('grasaPctActual', formatResult(actualBodyFatPct, 1));
    updateResultElement('grasaPctActualSource', actualBodyFatSource);

    // --- Grasa Deseada ---
    let desiredBodyFatPct = NaN;
    let desiredBodyFatSource = '(No estimado)';
    if (!isNaN(data.grasa_deseada) && data.grasa_deseada > 0) {
        desiredBodyFatPct = data.grasa_deseada;
        desiredBodyFatSource = '(Proporcionado)';
    } else {
        desiredBodyFatPct = estimateTargetBodyFat(genero, esDeportista, edad);
        if (!isNaN(desiredBodyFatPct)) desiredBodyFatSource = '(Estimado según edad, sexo y nivel AF)';
    }
    results.grasaPctDeseado = desiredBodyFatPct;
    updateResultElement('grasaPctDeseado', formatResult(desiredBodyFatPct, 1));
    updateResultElement('grasaPctDeseadoSource', desiredBodyFatSource);

    // --- Visceral Fat ---
    try {
        const resVisc = calcularGrasaVisceral(data);
        const val = resVisc.indiceMixto || resVisc.iav;
        results.grasavisceralActual = val;
        results.grasavisceralActualSource = `${resVisc.riesgo} - ${resVisc.metodo}`;
        updateResultElement('grasavisceralActual', formatResult(val, 2));
        updateResultElement('grasavisceralActualSource', results.grasavisceralActualSource);
    } catch (e) { console.warn(e.message); }

    // --- Abdominal Fat ---
    const gatResult = calculateTotalAbdominalFat(data);
    results.grasaAbsActual = gatResult.value;
    updateResultElement('grasaAbsActual', formatResult(gatResult.value, 1));
    updateResultElement('grasaAbsActualSource', gatResult.source);
    updateResultElement('abdominalFatThickness', formatResult(gatResult.thickness, 1));
    updateResultElement('abdominalFatThicknessSource', gatResult.thicknessSource);

    // --- Metabolic Age ---
    try {
        const metabolicData = { ...data, porcentajeGrasa: actualBodyFatPct, cintura: data.circ_cintura, imc: results.imc, pliegues: { tricipital: data.pliegue_tricipital, subescapular: data.pliegue_subescapular, suprailiaco: data.pliegue_suprailiaco, bicipital: data.pliegue_bicipital } };
        // Normalize gender for metabolic func
        metabolicData.genero = genero.toLowerCase();

        const metRes = calculateMetabolicAge(metabolicData);
        results.edadmetabolica = metRes.edadMetabolica;
        results.BRMEstimado = metRes.BRMEstimado;
        results.masaGrasaMetabolic = metRes.masaGrasa;
        results.masaMagraMetabolic = metRes.masaMagra;
        results.grasaPctMetabolic = (metRes.masaGrasa / peso) * 100;

        updateResultElement('edadmetabolica', Array.isArray(metRes.edadMetabolica) ? metRes.edadMetabolica.join(' - ') : metRes.edadMetabolica);
        updateResultElement('edadmetabolicaSource', metRes.method);
        updateResultElement('BRMEstimado', formatResult(metRes.BRMEstimado, 0));
        updateResultElement('BRMEstimadoSource', metRes.BRMEstimadoSource);

        updateResultElement('grasaPctMetabolic', formatResult(results.grasaPctMetabolic, 1));
        updateResultElement('grasaPctMetabolicSource', metRes.method);
        // Note: Masa Grasa/Magra Metabolic elements might need update too if UI has them
        updateResultElement('masaGrasaMetabolic', formatResult(metRes.masaGrasa, 1));
        updateResultElement('masaMagraMetabolic', formatResult(metRes.masaMagra, 1));

    } catch (e) { console.warn('Metabolic Age Error', e); }

    // --- Body Composition Analysis (IMLG, IMG, Typology) ---
    // Use Actual Fat
    if (!isNaN(actualBodyFatPct)) {
        try {
            const bodyComp = generateBodyCompositionAnalysis({ peso, altura, porcentajeGrasa: actualBodyFatPct }, { sexo: genero === 'masculino' ? 'hombre' : 'mujer', edad, esDeportista });
            results.masaGrasaActual = (actualBodyFatPct / 100) * peso;
            results.masaMagraActual = peso - results.masaGrasaActual;
            results.imlgActual = bodyComp.imlg;
            results.imgActual = bodyComp.img;
            results.tipologiaActual = bodyComp.tipologia;

            updateResultElement('masaGrasaActual', formatResult(results.masaGrasaActual, 1));
            updateResultElement('masaGrasaActualSource', actualBodyFatSource);
            updateResultElement('masaMagraActual', formatResult(results.masaMagraActual, 1));
            updateResultElement('masaMagraActualSource', 'Calculado desde % Grasa Actual');
            updateResultElement('imlgActual', formatResult(bodyComp.imlg, 1));
            updateResultElement('imlgActualSource', bodyComp.imlgCategory);
            updateResultElement('imgActual', formatResult(bodyComp.img, 1));
            updateResultElement('imgActualSource', bodyComp.imgCategory);
            updateResultElement('tipologiaActual', bodyComp.tipologia);
        } catch (e) { console.warn(e); }
    }

    // --- AMB ---
    if (data.circ_brazo && data.pliegue_tricipital && edad >= 18) { // Added age check similar to original logic
        const circBrazo = data.circ_brazo;
        const pliegueTricipital = data.pliegue_tricipital;
        const tricepsCm = pliegueTricipital / 10;
        const term = circBrazo - Math.PI * tricepsCm;
        const baseAMB = (term * term) / (4 * Math.PI);
        let correction = 0;
        const g = genero.toLowerCase();
        if (g === 'masculino') {
            correction = esDeportista ? (edad < 40 ? 8 : edad < 60 ? 7 : 6) : (edad < 40 ? 10 : edad < 60 ? 9 : 8);
        } else {
            correction = esDeportista ? (edad < 40 ? 5 : edad < 60 ? 4.5 : 4) : (edad < 40 ? 6.5 : edad < 60 ? 6 : 5.5);
        }
        results.amb = Math.max(baseAMB - correction, 0);

        // Amb Source
        let ageRange;
        if (edad <= 20) ageRange = '18-20';
        else if (edad <= 24) ageRange = '21-24';
        else if (edad <= 29) ageRange = '25-29';
        else if (edad <= 34) ageRange = '30-34';
        else if (edad <= 39) ageRange = '35-39';
        else if (edad <= 44) ageRange = '40-44';
        else if (edad <= 49) ageRange = '45-49';
        else if (edad <= 54) ageRange = '50-54';
        else if (edad <= 59) ageRange = '55-59';
        else if (edad <= 64) ageRange = '60-64';
        else if (edad <= 70) ageRange = '65-70';
        else ageRange = '70+';

        const ranges = ambRangesData[g][esDeportista ? 'athlete' : 'general'][ageRange];
        const ambSource = formatAmbSource(results.amb, ranges, esDeportista, g, ageRange);

        updateResultElement('amb', formatResult(results.amb, 1));
        updateResultElement('ambSource', ambSource);

        // MMT
        if (edad >= 15 && peso > 0) {
            let ambMultiplier = 0.0029;
            if (esDeportista) {
                // Simplified sport type check (assuming general if not specified)
                ambMultiplier = 0.0029;
            } else {
                ambMultiplier = 0.0024;
            }
            results.mmt = altura * (0.0264 + ambMultiplier * results.amb);
            results.Pctmmt = (results.mmt / peso) * 100;
            const pctRes = formatPctmmtSource(results.Pctmmt, g, esDeportista, peso, results.mmt);
            updateResultElement('mmt', formatResult(results.mmt, 1));
            updateResultElement('Pctmmt', formatResult(results.Pctmmt, 1));
            updateResultElement('PctmmtSource', pctRes.text);
            updateResultElement('pesoMuscular', pctRes.muscleToGain !== null ? pctRes.muscleToGain : '---');
            updateResultElement('pesoMuscularSource', pctRes.muscleToGainSource);
        }
    }

    // --- Masa Osea ---
    if (data.diam_muneca && data.diam_femur && peso && edad >= 15) {
        let masaOsea = 3.02 * Math.pow(alturaM * alturaM * (data.diam_muneca / 100) * (data.diam_femur / 100) * 400, 0.712);
        if (esDeportista) masaOsea *= 1.05;
        results.masaOsea = masaOsea;
        const boneMassPct = (masaOsea / peso) * 100;
        const moSource = formatMasaOseaSource(boneMassPct, genero, edad, esDeportista);
        updateResultElement('masaOsea', formatResult(masaOsea, 1));
        updateResultElement('masaOseaSource', moSource);
    }

    // --- Masa Residual ---
    if (peso && genero) {
        const factor = genero.toLowerCase() === 'masculino' ? 0.24 : 0.21;
        results.masaResidual = peso * factor;
        const mrPct = (results.masaResidual / peso) * 100;
        updateResultElement('masaResidual', formatResult(results.masaResidual, 1));
        updateResultElement('masaResidualSource', formatMasaResidualSource(mrPct, genero));
    }

    // --- Agua Corporal (ACT) ---
    const act = calcularACT(edad, genero, altura, peso, esDeportista);
    if (act && !act.error) {
        updateResultElement('aguacorporal', formatResult(act.act, 1));
        updateResultElement('aguacorporalSource', act.metodo);
    }

    // --- Deurenberg ---
    const deurenberg = calculateGrasaPctDeurenberg(peso, altura, edad, genero.toLowerCase() === 'masculino' ? 'hombre' : 'mujer');
    if (deurenberg !== null) {
        updateResultElement('grasaPctDeurenberg', formatResult(deurenberg, 1));
        updateResultElement('grasaPctDeurenbergSource', formatGrasaPctDeurenbergSource(deurenberg, genero.toLowerCase() === 'masculino' ? 'hombre' : 'mujer', edad, results.imc));
    }

    // --- CUN-BAE ---
    const cunbae = calculateCUNBAEBodyFat(data, results.imc);
    if (!isNaN(cunbae.grasaPct)) {
        updateResultElement('grasaPctCUNBAE', formatResult(cunbae.grasaPct, 1));
        updateResultElement('grasaPctCUNBAESource', cunbae.source);
    }

    // --- Somatotype ---
    const somato = calculateSomatotype(data);
    Object.assign(results, somato);
    updateResultElement('somatotipo', somato.somatotipoSource === 'Heath-Carter' ? `(${formatResult(somato.endomorfia, 1)} - ${formatResult(somato.mesomorfia, 1)} - ${formatResult(somato.ectomorfia, 1)})` : '---');
    updateResultElement('somatotipoSource', somato.somatotipoSource);
    if (somato.somatotipoSource === 'Heath-Carter') {
        setTimeout(() => drawSomatotypeChart(results), 100);
    }

    // --- Objective Metrics: Peso Ideal y Objetivos ---
    // Calculate ideal weight based on desired body fat percentage
    if (!isNaN(desiredBodyFatPct) && !isNaN(actualBodyFatPct) && peso && altura) {
        const pesoIdeal = calculateIdealWeight(peso, altura, actualBodyFatPct, desiredBodyFatPct);
        results.pesoIdeal = pesoIdeal;
        updateResultElement('pesoIdeal', formatResult(pesoIdeal, 1));
        updateResultElement('pesoIdealSource', `(Según % Grasa Deseado: ${formatResult(desiredBodyFatPct, 1)}%)`);

        // Calculate weight to lose/gain
        const pesoObjetivo = calculateWeightObjective(peso, pesoIdeal);
        results.pesoObjetivo = pesoObjetivo;
        updateResultElement('pesoObjetivo', formatResult(Math.abs(pesoObjetivo), 1));
        updateResultElement('pesoObjetivoSource', pesoObjetivo < 0 ? 'Peso a Perder' : 'Peso a Ganar');
    }

    // Calculate ideal weight based on metabolic body fat percentage
    if (results.grasaPctMetabolic && !isNaN(results.grasaPctMetabolic) && peso && altura) {
        const metabolicBodyFat = results.grasaPctMetabolic;
        const pesoIdealMetabolic = calculateIdealWeight(peso, altura, actualBodyFatPct, metabolicBodyFat);
        results.pesoIdealMetabolic = pesoIdealMetabolic;
        updateResultElement('pesoIdealMetabolic', formatResult(pesoIdealMetabolic, 1));
        updateResultElement('pesoIdealMetabolicSource', `(Según % GC Metabolico: ${formatResult(metabolicBodyFat, 1)}%)`);

        // Calculate weight to lose/gain (metabolic)
        const pesoObjetivoMetabolic = calculateWeightObjective(peso, pesoIdealMetabolic);
        results.pesoObjetivoMetabolic = pesoObjetivoMetabolic;
        updateResultElement('pesoObjetivoMetabolic', formatResult(Math.abs(pesoObjetivoMetabolic), 1));
        updateResultElement('pesoObjetivoMetabolicSource', pesoObjetivoMetabolic < 0 ? 'Peso a Perder' : 'Peso a Ganar');
    }

    // Calculate muscle mass to gain (metabolic) - based on healthy minimum of 38%
    if (results.Pctmmt && !isNaN(results.Pctmmt) && peso) {
        const currentMusclePct = results.Pctmmt;
        const targetMusclePct = 38; // Minimum healthy muscle mass percentage
        const muscleMassToGainMetabolic = calculateMuscleMassToGain(currentMusclePct, targetMusclePct, peso);
        results.muscleMassToGainMetabolic = muscleMassToGainMetabolic;

        if (muscleMassToGainMetabolic > 0) {
            updateResultElement('pesoMuscularMetabolic', formatResult(muscleMassToGainMetabolic, 1));
            updateResultElement('pesoMuscularMetabolicSource', `(Para alcanzar ${targetMusclePct}% mínimo saludable)`);
        } else {
            updateResultElement('pesoMuscularMetabolic', '0.0');
            updateResultElement('pesoMuscularMetabolicSource', '(Ya en rango saludable)');
        }
    }


    // --- Generate Report ---
    // window.calculatedResults hack for now to support notify function in global scope if any
    window.calculatedResults = results; // Keep for now as many things might depend on it

    if (explanationSection) explanationSection.style.display = 'block';

    // Construct bodyCompResults
    const bodyCompResults = {
        imlg: results.imlgActual,
        img: results.imgActual,
        tipologia: results.tipologiaActual,
        imlgCategory: results.imlgActualSource,
        imgCategory: results.imgActualSource
    };

    const explanationsHTML = generateExplanationsAndSuggestionsHTML(data, results, bodyCompResults);
    if (explanationContent) explanationContent.innerHTML = explanationsHTML;

    setTimeout(() => {
        console.log('DEBUG: About to call renderExplanationsAndSuggestionsCharts');
        console.log('DEBUG: data =', data);
        console.log('DEBUG: results =', results);
        console.log('DEBUG: bodyCompResults =', bodyCompResults);
        renderExplanationsAndSuggestionsCharts(data, results, bodyCompResults);
    }, 100);

};

export const setupCalculationsUI = () => {
    const form = document.getElementById('anthropometry-form');
    if (form) {
        initializeResultElements();
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Form not found: anthropometry-form');
    }
};
