//Fade out in Title
const title = document.getElementById('title');
setTimeout(() => {
    // Start fade-out
    title.classList.add('fade-out');
    setTimeout(() => {
        // Change content and remove glitch classes
        title.innerHTML = 'Valoracion Antropometrica App';
        title.classList.remove('animated-title', 'fade-out');
        title.classList.add('fade-in');
    }, 500); // Duration of fade-out
}, 3500); // Wait for glitch animation to complete (3.345s rounded up)

// Accordion Effect
document.addEventListener('DOMContentLoaded', () => {
    const accordionSections = document.querySelectorAll('.accordion-section');

    // Explicitly add 'collapsed' class to all sections
    accordionSections.forEach(section => {
        section.classList.add('collapsed');
    });

    // Add click event listeners to toggle sections
    const accordionHeaders = document.querySelectorAll('.section-header[data-accordion]');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.accordion-section');
            if (section) {
                section.classList.toggle('collapsed');
            }
        });
    });
});

// Visibility of the "P. Abdominal"
document.addEventListener('DOMContentLoaded', () => {
    const deportistaSelect = document.getElementById('es_deportista');
    const pliegueAbdominalGroup = document.querySelector('.pliegue-abdominal-group');

    // Function to update visibility based on dropdown value
    const updateVisibility = () => {
        const isDeportista = deportistaSelect.value === 'si';
        pliegueAbdominalGroup.style.display = isDeportista ? 'block' : 'none';
    };

    // Function to handle value changes (from dropdown or external data)
    const handleValueChange = (value) => {
        if (deportistaSelect.value !== value) {
            deportistaSelect.value = value;
        }
        localStorage.setItem('es_deportista', value);
        updateVisibility();
    };

    // Restore saved value from localStorage
    const savedValue = localStorage.getItem('es_deportista');
    if (savedValue) {
        handleValueChange(savedValue);
    }

    // Update localStorage and visibility on dropdown change
    deportistaSelect.addEventListener('change', () => {
        handleValueChange(deportistaSelect.value);
    });

    // Observe changes to the dropdown value programmatically
    const observer = new MutationObserver(() => {
        updateVisibility();
    });
    observer.observe(deportistaSelect, {
        attributes: true,
        attributeFilter: ['value']
    });

    // Expose function to update value programmatically
    window.updateDeportistaValue = (newValue) => {
        handleValueChange(newValue);
    };
});

//pdf create 
document.addEventListener('DOMContentLoaded', () => {
    // Verifica que jsPDF y html2canvas estÃ©n cargados
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error('Error: Biblioteca jsPDF no estÃ¡ cargada.');
        alert('Error: No se pudo cargar la biblioteca jsPDF. Verifica la inclusiÃ³n del script.');
        return;
    }
    if (!window.html2canvas) {
        console.error('Error: Biblioteca html2canvas no estÃ¡ cargada.');
        alert('Error: No se pudo cargar la biblioteca html2canvas. Verifica la inclusiÃ³n del script.');
        return;
    }
    console.log('Bibliotecas jsPDF y html2canvas cargadas correctamente.');

    const exportarBtn = document.getElementById('exportar-btn');
    if (!exportarBtn) {
        console.error('BotÃ³n exportar-btn no encontrado.');
        alert('Error: BotÃ³n exportar-btn no encontrado.');
        return;
    }

    // FunciÃ³n para convertir data URL a blob
    const dataURLToBlob = (dataURL) => {
        try {
            const byteString = atob(dataURL.split(',')[1]);
            const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mimeString });
        } catch (error) {
            console.error('Error al convertir dataURL a blob:', error.message);
            return null;
        }
    };

    // FunciÃ³n para descargar archivo (mejorada)
    // FunciÃ³n para descargar archivo (mejorada)
    const downloadFile = (blob, filename) => {
        try {
            if (!blob || blob.size === 0) {
                throw new Error(`Blob invÃ¡lido para ${filename}: tamaÃ±o ${blob ? blob.size : 'nulo'}`);
            }
            console.log(`Preparando descarga de ${filename}, tamaÃ±o: ${blob.size} bytes`);
            const url = window.URL.createObjectURL(blob);
            console.log(`URL creado para ${filename}: ${url}`);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            // Usar setTimeout para evitar bloqueos del navegador
            setTimeout(() => {
                a.click();
                console.log(`Clic simulado para descargar ${filename}`);
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                console.log(`Archivo ${filename} descargado.`);
            }, 100);
            // AÃ±adir enlace de respaldo en la UI
            const backupLink = document.createElement('a');
            backupLink.href = url;
            backupLink.download = filename;
            backupLink.textContent = `Haz clic aquÃ­ para descargar ${filename} si no se descarga automÃ¡ticamente`;
            backupLink.style.display = 'block';
            backupLink.style.color = 'red';
            document.body.appendChild(backupLink);
            setTimeout(() => {
                if (backupLink.parentNode) {
                    document.body.removeChild(backupLink);
                }
            }, 10000); // Eliminar enlace despuÃ©s de 10 segundos
        } catch (error) {
            console.error(`Error al descargar ${filename}:`, error.message);
            alert(`Error al descargar ${filename}: ${error.message}`);
        }
    };

    exportarBtn.addEventListener('click', async () => {
        console.log('Exportar button clicked. Starting PDF export.');
        const btn = document.getElementById('exportar-btn');
        const spinner = document.getElementById('pdf-spinner');
        // Mostrar spinner y cambiar texto
        spinner.style.display = 'inline-block';
        btn.textContent = 'Creando PDF...';
        btn.disabled = true;

        try {
            const explanationContent = document.getElementById('explanation-content');
            if (!explanationContent) {
                throw new Error('Elemento explanation-content no encontrado');
            }

            // Crea un nuevo documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });
            console.log('Documento PDF creado:', doc);

            // Verifica que autoTable estÃ© disponible
            if (!doc.autoTable) {
                throw new Error('El plugin jspdf-autotable no estÃ¡ cargado. AsegÃºrate de incluir el script jspdf.plugin.autotable.min.js.');
            }

            // Define mÃ¡rgenes
            const margin = {
                top: 50,
                bottom: 90,
                left: 40,
                right: 40
            };
            let yPosition = 50; // PosiciÃ³n vertical inicial (en puntos)
            const pageWidth = doc.internal.pageSize.getWidth(); // ~595pt para A4
            const pageHeight = doc.internal.pageSize.getHeight(); // ~842pt para A4
            const contentWidth = pageWidth - margin.left - margin.right; // ~515pt

            // Obtener datos personales y resultados desde el HTML
            const nombre = document.getElementById('nombre')?.value?.trim() || 'Cliente';
            const edad = document.getElementById('edad')?.value?.trim() || 'N/A';
            const genero = document.getElementById('genero')?.value?.trim() || 'N/A';
            const edadMetabolica = document.getElementById('result-edadmetabolica')?.textContent?.trim() || 'N/A';
            const tipologia = document.getElementById('result-tipologia-actual')?.textContent?.trim() || 'N/A';

            // Obtener y formatear la fecha
            const selectElement = document.getElementById('seleccionar_fecha');
            const fechaId = selectElement?.value?.trim();
            console.log('Valor crudo de seleccionar_fecha (value):', JSON.stringify(fechaId));
            let fecha = 'N/A';
            if (selectElement && fechaId && fechaId !== '') {
                try {
                    const fechaText = selectElement.selectedOptions[0]?.text?.trim();
                    console.log('Texto de la opciÃ³n seleccionada:', JSON.stringify(fechaText));
                    if (fechaText && fechaText !== 'Seleccionar fecha...') {
                        const match = fechaText.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,.*(\d{2}:\d{2}))?$/);
                        if (match) {
                            const day = match[1];
                            const month = match[2];
                            const year = match[3].slice(-2); // Ãšltimos 2 dÃ­gitos del aÃ±o
                            fecha = `${day}/${month}/${year}`;
                            console.log('Fecha parseada:', fecha);
                        } else {
                            console.warn('Formato de texto de fecha invÃ¡lido:', JSON.stringify(fechaText));
                        }
                    } else {
                        console.warn('No se seleccionÃ³ una fecha vÃ¡lida o es el placeholder:', JSON.stringify(fechaText));
                    }
                } catch (error) {
                    console.error('Error al formatear la fecha:', error.message);
                }
            } else {
                console.warn('No se seleccionÃ³ ninguna fecha o select invÃ¡lido:', JSON.stringify(fechaId));
            }

            // Construir el tÃ­tulo dinÃ¡mico
            const title = `ExplicaciÃ³n de los Resultados con Fecha de ValoraciÃ³n ${fecha} y Sugerencias para ${nombre} con ${edad} aÃ±os, gÃ©nero ${genero}, Edad MetabÃ³lica ${edadMetabolica} aÃ±os, TipologÃ­a ${tipologia}`;

            // FunciÃ³n auxiliar para parsear subsecciones de result-analisis
            // FunciÃ³n auxiliar para parsear subsecciones de result-analisis
            const parseBioquimicosSubsections = () => {
                const resultAnalisis = document.getElementById('result-analisis');
                if (!resultAnalisis) {
                    console.warn('Elemento result-analisis no encontrado.');
                    return [{ fullWidth: true, value: '---' }];
                }

                const subsections = [
                    'Deficiencia de Vitamina D',
                    'Fosfatasa Alcalina Elevada',
                    'Riesgo de Hipotiroidismo',
                    'Testosterona Baja',
                    'Cortisol Elevado',
                    'InflamaciÃ³n SistÃ©mica',
                    'HÃ­gado Graso (NAFLD)',
                    'Riesgo de HÃ­gado Graso (NAFLD)',
                    'Riesgo de Fibrosis HepÃ¡tica',
                    'DisfunciÃ³n Renal',
                    'Riesgo MetabÃ³lico Elevado',
                    'Resistencia LeptÃ­nica',
                    'Adiponectina Baja',
                    'Diabetes No Controlada',
                    'Prediabetes',
                    'Diabetes Mellitus',
                    'Resistencia a la Insulina',
                    'Obesidad MetabÃ³lica (SÃ­ndrome MetabÃ³lico)',
                    'Riesgo de Obesidad MetabÃ³lica',
                    'DesnutriciÃ³n Proteica',
                    'Riesgo de DesnutriciÃ³n Proteica'
                ];

                const result = [];
                let currentSubsection = null;
                let currentText = '';
                const nodes = resultAnalisis.childNodes;

                for (const node of nodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tag = node.tagName.toLowerCase();
                        const text = node.textContent.trim();

                        if (tag === 'h2') {
                            // Guardar la subsecciÃ³n anterior si existe
                            if (currentSubsection && currentText) {
                                result.push({ subsectionTitle: true, content: currentSubsection });
                                result.push({ fullWidth: true, value: currentText.trim() || '---' });
                                console.log(`SubsecciÃ³n procesada: ${currentSubsection}`);
                                currentText = '';
                            }
                            // Verificar si el h2 es una subsecciÃ³n vÃ¡lida
                            if (subsections.includes(text)) {
                                currentSubsection = text;
                            } else {
                                currentSubsection = null;
                            }
                        } else if (['p', 'div', 'span', 'li'].includes(tag) && currentSubsection) {
                            // AÃ±adir texto asociado a la subsecciÃ³n
                            currentText += (currentText ? '\n' : '') + text;
                        }
                    } else if (node.nodeType === Node.TEXT_NODE && currentSubsection) {
                        const text = node.textContent.trim();
                        if (text) {
                            currentText += (currentText ? '\n' : '') + text;
                        }
                    }
                }

                // AÃ±adir la Ãºltima subsecciÃ³n si existe
                if (currentSubsection && currentText) {
                    result.push({ subsectionTitle: true, content: currentSubsection });
                    result.push({ fullWidth: true, value: currentText.trim() || '---' });
                    console.log(`SubsecciÃ³n procesada: ${currentSubsection}`);
                }

                // Si no se encontraron subsecciones, aÃ±adir fila por defecto
                if (result.length === 0) {
                    console.warn('No se encontraron subsecciones <h2> en result-analisis.');
                    result.push({ fullWidth: true, value: '---' });
                }

                return result;
            };

            // Definir datos de la tabla principal, organizados por secciones
            const tableData = [
                // ComposiciÃ³n Corporal
                { section: 'ComposiciÃ³n Corporal', metric: '', value: '', note: '' },
                { metric: 'IMC', value: `${document.getElementById('result-imc')?.textContent?.trim() || '---'} kg/mÂ²`, note: document.getElementById('imc-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'ICC', value: document.getElementById('result-icc')?.textContent?.trim() || '---', note: document.getElementById('icc-source')?.textContent?.trim() || '(No calculado)' },
                { metric: '% Grasa Deseado', value: `${document.getElementById('result-grasa-pct-deseado')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-deseado-source')?.textContent?.trim() || '(No estimado)' },
                { metric: '% Grasa Actual', value: `${document.getElementById('result-grasa-pct-actual')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-actual-source')?.textContent?.trim() || '(No calculado)' },
                { metric: '% Grasa MetabÃ³lico', value: `${document.getElementById('result-grasa-pct-metabolic')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-metabolic-source')?.textContent?.trim() || '(No calculado)' },
                { metric: '% Grasa Visceral', value: `${document.getElementById('result-grasa-pct-visceral')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-visceral-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Grasa Actual (MGa)', value: `${document.getElementById('result-masa-grasa-actual')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-grasa-actual-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Grasa MetabÃ³lico (MG)', value: `${document.getElementById('result-masa-grasa-metabolic')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-grasa-metabolic-source')?.textContent?.trim() || '(No calculado)' },
                { metric: '% Grasa (Deurenberg)', value: `${document.getElementById('result-grasa-pct-Deurenberg')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-Deurenberg-source')?.textContent?.trim() || '(No estimado)' },
                { metric: '% Grasa (CUN-BAE)', value: `${document.getElementById('result-grasa-pct-CUN-BAE')?.textContent?.trim() || '---'} %`, note: document.getElementById('grasa-pct-CUN-BAE-source')?.textContent?.trim() || '(No estimado)' },
                { metric: 'Grasa Abdominal Total', value: `${document.getElementById('result-grasa-abdominal')?.textContent?.trim() || '---'} cmÂ²`, note: document.getElementById('grasa-abdominal-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Espesor Grasa Abdominal', value: `${document.getElementById('result-abdominal-fat-thickness')?.textContent?.trim() || '---'} cm`, note: document.getElementById('abdominal-fat-thickness-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Agua Corporal Total', value: document.getElementById('result-agua-corporal')?.textContent?.trim() || '---', note: document.getElementById('agua-corporal-source')?.textContent?.trim() || '(No calculado)' },
                // MÃ©tricas MetabÃ³licas
                { section: 'MÃ©tricas MetabÃ³licas', metric: '', value: '', note: '' },
                { metric: 'Edad MetabÃ³lica', value: `${document.getElementById('result-edadmetabolica')?.textContent?.trim() || '---'} aÃ±os`, note: document.getElementById('edadmetabolica-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'TMB', value: `${document.getElementById('result-tmb')?.textContent?.trim() || '---'} Kcal`, note: document.getElementById('tmb-source')?.textContent?.trim() || '(No calculado)' },
                // Masa Libre de Grasa
                { section: 'Masa Libre de Grasa', metric: '', value: '', note: '' },
                { metric: 'Masa Magra Actual (MLG)', value: `${document.getElementById('result-masa-magra-actual')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-magra-actual-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Magra MetabÃ³lico (MLG)', value: `${document.getElementById('result-masa-magra-metabolic')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-magra-metabolic-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'IMLG Actual', value: `${document.getElementById('result-imlg-actual')?.textContent?.trim() || '---'} kg/mÂ²`, note: document.getElementById('imlg-actual-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'IMLG MetabÃ³lico', value: `${document.getElementById('result-imlg-metabolic')?.textContent?.trim() || '---'} kg/mÂ²`, note: document.getElementById('imlg-metabolic-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'IMG Actual', value: `${document.getElementById('result-img-actual')?.textContent?.trim() || '---'} kg/mÂ²`, note: document.getElementById('img-actual-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'IMG MetabÃ³lico', value: `${document.getElementById('result-img-metabolic')?.textContent?.trim() || '---'} kg/mÂ²`, note: document.getElementById('img-metabolic-source')?.textContent?.trim() || '(No calculado)' },
                // Estructurales
                { section: 'Estructurales', metric: '', value: '', note: '' },
                { metric: 'Somatotipo', value: document.getElementById('result-somatotipo')?.textContent?.trim() || '---', note: document.getElementById('somatotipo-source')?.textContent?.trim() || '(Endo: Meso: Ecto)' },
                { metric: 'TipologÃ­a Actual', value: document.getElementById('result-tipologia-actual')?.textContent?.trim() || '---', note: document.getElementById('tipologia-actual-source')?.textContent?.trim() || '(RelaciÃ³n IMLG/IMG)' },
                { metric: 'TipologÃ­a MetabÃ³lico', value: document.getElementById('result-tipologia-metabolic')?.textContent?.trim() || '---', note: document.getElementById('tipologia-metabolic-source')?.textContent?.trim() || '(RelaciÃ³n IMLG/IMG)' },
                { metric: 'Ãrea Muscular Brazo (AMB)', value: `${document.getElementById('result-amb')?.textContent?.trim() || '---'} cmÂ²`, note: document.getElementById('amb-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Muscular Total (MMT)', value: `${document.getElementById('result-mmt')?.textContent?.trim() || '---'} kg`, note: document.getElementById('mmt-source')?.textContent?.trim() || '(Estimado segÃºn AMB)' },
                { metric: '% Masa Muscular', value: `${document.getElementById('result-Pct-mmt')?.textContent?.trim() || '---'} %`, note: document.getElementById('Pct-mmt-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'AMB(c) Corregida', value: `${document.getElementById('result-ambc')?.textContent?.trim() || '---'} cmÂ²`, note: document.getElementById('ambc-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Muscular Total (MMT2)', value: `${document.getElementById('result-mmt2')?.textContent?.trim() || '---'} kg`, note: document.getElementById('mmt2-source')?.textContent?.trim() || '(Estimado segÃºn AMB(c) Heymsfield, 1982)' },
                { metric: '% Masa Muscular (MMT2)', value: `${document.getElementById('result-Pct-mmt2')?.textContent?.trim() || '---'} %`, note: document.getElementById('Pct-mmt2-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Area Grasa Brazo', value: `${document.getElementById('result-agb')?.textContent?.trim() || '---'} %`, note: document.getElementById('agb-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Ã“sea', value: `${document.getElementById('result-masa-osea')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-osea-source')?.textContent?.trim() || '(No calculado)' },
                { metric: 'Masa Residual', value: `${document.getElementById('result-masa-residual')?.textContent?.trim() || '---'} kg`, note: document.getElementById('masa-residual-source')?.textContent?.trim() || '(No calculado)' },
                // Objetivos
                { section: 'Objetivos', metric: '', value: '', note: '' },
                { metric: 'Peso Ideal (% Grasa)', value: `${document.getElementById('result-peso-ideal')?.textContent?.trim() || '---'} kg`, note: document.getElementById('peso-ideal-source')?.textContent?.trim() || '(SegÃºn % GC Actual Rango de Edad, Sexo y AF)' },
                { metric: 'Peso Ideal (% Grasa Mtb)', value: `${document.getElementById('result-peso-ideal-metabolic')?.textContent?.trim() || '---'} kg`, note: document.getElementById('pesometabolico-source')?.textContent?.trim() || '(SegÃºn % GC Metabolico Edad, Sexo y AF)' },
                { metric: 'Peso a Perder/Ganar', value: `${document.getElementById('result-peso-objetivo')?.textContent?.trim() || '---'} kg`, note: document.getElementById('peso-objetivo-source')?.textContent?.trim() || 'Peso Actual - Masa Grasa' },
                { metric: 'Peso a Perder/Ganar (Mtb)', value: `${document.getElementById('result-peso-objetivo-metabolic')?.textContent?.trim() || '---'} kg`, note: document.getElementById('peso-objetivo-metabolicsource')?.textContent?.trim() || 'Peso Actual - Masa Grasa Metabolica' },
                { metric: 'Masa Muscular a Ganar', value: `${document.getElementById('result-peso-muscular')?.textContent?.trim() || '---'} kg`, note: document.getElementById('peso-muscular-source')?.textContent?.trim() || '' },
                { metric: 'Masa Muscular a Ganar (Mtb)', value: `${document.getElementById('result-peso-muscular-matabolic')?.textContent?.trim() || '---'} kg`, note: document.getElementById('peso-muscular-metabolicsource')?.textContent?.trim() || '' },
                // InterpretaciÃ³n de Resultados ParÃ¡metros BioquÃ­micos
                { section: 'InterpretaciÃ³n de Resultados ParÃ¡metros BioquÃ­micos', metric: '', value: '', note: '' },
                ...parseBioquimicosSubsections()
            ];

            // Crear tabla principal con autoTable, incluyendo el tÃ­tulo como encabezado
            // Crear tabla principal con autoTable, incluyendo el tÃ­tulo como encabezado
            doc.autoTable({
                startY: yPosition,
                head: [
                    [{ content: title, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 14, fillColor: [255, 255, 255], textColor: [56, 142, 60], halign: 'center' } }],
                    ['MÃ©trica', 'Valor', 'Nota']
                ],
                body: tableData.map(row => {
                    if (row.section) {
                        return [{ content: row.section, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } }];
                    }
                    if (row.subsectionTitle) {
                        return [{ content: row.content, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }];
                    }
                    if (row.fullWidth) {
                        return [{ content: row.value, colSpan: 3, styles: { fontStyle: 'normal', fillColor: [255, 255, 255] } }];
                    }
                    return [row.metric, row.value, row.note];
                }),
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    cellPadding: 4
                },
                headStyles: {
                    fillColor: [56, 142, 60], // Verde para el encabezado de columnas
                    textColor: [255, 255, 255], // Texto blanco
                    fontStyle: 'bold',
                    fontSize: 10
                },
                margin: { left: margin.left, right: margin.right },
                didDrawPage: (data) => {
                    yPosition = data.cursor.y; // Actualiza yPosition despuÃ©s de la tabla
                }
            });

            console.log('Tabla principal de resultados con tÃ­tulo aÃ±adida en yPosition:', yPosition);

            // AÃ±adir tÃ­tulo para el contenido de explanation-content
            yPosition += 20; // Espacio despuÃ©s de la tabla
            if (yPosition + 50 > pageHeight - margin.bottom) {
                doc.addPage();
                yPosition = margin.top;
                console.log('Nueva pÃ¡gina aÃ±adida para explicaciÃ³n, yPosition reiniciada:', yPosition);
            }

            // Configurar estilo similar a <h2> (tÃ­tulo destacado)
            doc.setFont('helvetica', 'bold');  // Fuente en negrita
            doc.setFontSize(14);  // TamaÃ±o mÃ¡s grande (12 es normal, 14-16 para h2)
            doc.setTextColor(56, 142, 60);  // Verde oscuro (como en tu tabla) o [0, 0, 0] para negro

            // Escribir el tÃ­tulo
            doc.text('Detalles de la ExplicaciÃ³n de los Resultados por Secciones:', margin.left, yPosition);

            // Restaurar estilo normal para el texto siguiente
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);  // TamaÃ±o estÃ¡ndar
            doc.setTextColor(0, 0, 0);  // Negro

            yPosition += 10;  // Espacio despuÃ©s del tÃ­tulo (ajusta segÃºn necesidad)

            // Definir secciones principales
            const sections = [
                'ExplicaciÃ³n de los Resultados del IMC, ICC y % Grasa Actual',
                'Masa Grasa y Masa Magra(MLG), TipologÃ­a del Cuerpo segÃºn Ãndices de Masa (IMLG e IMG), InterpretaciÃ³n de las TipologÃ­as',
                'Edad MetabÃ³lica, Â¿CÃ³mo Mejorar tu Edad MetabÃ³lica?',
                'RelaciÃ³n entre IMLG, TMB y GET, Sugerencias Personalizadas',
                'Reserva Proteica AMB, Masa Ã“sea y Masa Residual',
                'Estimacion del Somatotipo, Sugerencias para Mejorar tu ComposiciÃ³n Corporal, MediciÃ³n del Somatotipo, CategorÃ­as de Predominancia FÃ­sica y Recomendaciones'
            ];

            // Mapear encabezados del DOM a secciones principales
            const headerMapping = {
                'ExplicaciÃ³n de los Resultados del IMC, ICC y % Grasa Actual': 0,
                'Peso Ideal Estimado': 0,
                'Masa Grasa y Masa Magra(MLG)': 1,
                'TipologÃ­a del Cuerpo segÃºn Ãndices de Masa (IMLG e IMG)': 1,
                'Edad MetabÃ³lica': 2,
                'Sugerencias Personalizadas': [2, 3],
                'RelaciÃ³n entre IMLG, TMB y GET': 3,
                'Reserva Proteica AMB, Masa Ã“sea y Masa Residual': 4,
                'Estimacion del Somatotipo': 5,
                'Sugerencias para Mejorar tu ComposiciÃ³n Corporal': 5,
                'MediciÃ³n del Somatotipo': 5
            };

            // Recolectar todas las imÃ¡genes (charts)
            // Recolectar todas las imÃ¡genes (charts) - Ajustado para el chart de somatotipo
            const canvasElements = explanationContent.querySelectorAll('canvas, div canvas');
            const chartDataUrls = [];
            for (let i = 0; i < canvasElements.length; i++) {
                const canvas = canvasElements[i];
                try {
                    let elementToCapture = canvas;
                    // Para el Ãºltimo chart (somatotype), capturar el .chart-container que contiene <img> y <canvas>
                    if (i === canvasElements.length - 1) {
                        const parentContainer = canvas.closest('.chart-container');
                        if (parentContainer && parentContainer.querySelector('#somatotype-image')) {
                            elementToCapture = parentContainer;
                            console.log(`Capturando .chart-container para chart ${i + 1} (somatotype) con <img id="somatotype-image">`);
                        } else {
                            console.warn(`No se encontrÃ³ .chart-container con #somatotype-image para chart ${i + 1}`);
                        }
                    }
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    const renderedCanvas = await html2canvas(elementToCapture, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        logging: true,
                        backgroundColor: null, // Preservar fondo
                        onclone: async (document, element) => {
                            // Forzar carga de la imagen de fondo para el somatotype
                            if (i === canvasElements.length - 1) {
                                const img = element.querySelector('#somatotype-image');
                                if (img) {
                                    await new Promise((resolve, reject) => {
                                        img.crossOrigin = 'Anonymous';
                                        img.onload = resolve;
                                        img.onerror = () => {
                                            console.error(`Error al cargar #somatotype-image para chart ${i + 1}`);
                                            reject();
                                        };
                                        // Forzar recarga si la imagen ya estÃ¡ cargada
                                        if (img.complete) {
                                            img.src = img.src;
                                        }
                                    });
                                    console.log(`#somatotype-image cargada para chart ${i + 1}`);
                                }
                            }
                        }
                    });
                    const dataUrl = renderedCanvas.toDataURL('image/png');
                    console.log(`Chart ${i + 1} capturado:`, {
                        dataUrlLength: dataUrl.length,
                        width: renderedCanvas.width,
                        height: renderedCanvas.height
                    });
                    chartDataUrls.push(dataUrl);
                    console.log(`Chart ${i + 1} listo para depuraciÃ³n.`);
                } catch (error) {
                    console.error(`Error al capturar chart ${i + 1}:`, error.message);
                    chartDataUrls.push(null);
                }
            }


            // Procesar el contenido de explanation-content por secciones
            const sectionContents = sections.map(() => []);
            let currentSectionIndex = 0;
            let chartIndex = 0;
            let lastSugerenciasSection = 2;

            const elements = explanationContent.childNodes;
            console.log('Encabezados encontrados en explanation-content:');
            for (const element of elements) {
                if (element.nodeType !== Node.ELEMENT_NODE) continue;

                const tag = element.tagName.toLowerCase();
                let content = '';

                if (['h1', 'h2', 'h3'].includes(tag)) {
                    const text = element.textContent.trim();
                    console.log(`- ${tag}: "${text}"`);
                    if (text in headerMapping) {
                        const mapping = headerMapping[text];
                        if (Array.isArray(mapping)) {
                            currentSectionIndex = text === 'Sugerencias Personalizadas' && lastSugerenciasSection === 2 ? 2 : 3;
                            lastSugerenciasSection = currentSectionIndex;
                        } else {
                            currentSectionIndex = mapping;
                        }
                    }
                } else if (tag === 'p') {
                    content = element.textContent.trim();
                    if (content) {
                        sectionContents[currentSectionIndex].push({ type: 'text', content });
                    }
                } else if (tag === 'ul' || tag === 'ol') {
                    const items = element.querySelectorAll('li');
                    let index = 1;
                    for (const li of items) {
                        const text = li.textContent.trim();
                        if (text) {
                            const bullet = tag === 'ul' ? 'â€¢' : `${index++}.`;
                            content = `${bullet} ${text}`;
                            sectionContents[currentSectionIndex].push({ type: 'text', content });
                        }
                    }
                } else if (tag === 'table') {
                    const rows = element.querySelectorAll('tr');
                    for (const row of rows) {
                        const cells = row.querySelectorAll('th, td');
                        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim()).filter(text => text);
                        if (cellTexts.length === 0) continue;
                        content = cellTexts.join(' | ');
                        sectionContents[currentSectionIndex].push({ type: 'text', content });
                    }
                } else if (tag === 'canvas' || (tag === 'div' && element.querySelector('canvas'))) {
                    if (chartIndex < chartDataUrls.length) {
                        sectionContents[currentSectionIndex].push({
                            type: 'image',
                            content: chartDataUrls[chartIndex] || `Error: No se pudo cargar el chart ${chartIndex + 1}.`,
                            sectionIndex: currentSectionIndex
                        });
                        console.log(`Chart ${chartIndex + 1} asignado a secciÃ³n ${sections[currentSectionIndex]}`);
                    }
                    chartIndex++;
                }
            }

            // Renderizar una tabla por secciÃ³n (solo texto) y aÃ±adir imÃ¡genes despuÃ©s
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const content = sectionContents[i].filter(item => item.type === 'text');

                if (content.length === 0 && !sectionContents[i].some(item => item.type === 'image')) {
                    console.warn(`SecciÃ³n "${section}" estÃ¡ vacÃ­a, omitiendo tabla.`);
                    continue;
                }

                // AÃ±adir tabla para texto
                if (content.length > 0) {
                    if (yPosition + 50 > pageHeight - margin.bottom) {
                        doc.addPage();
                        yPosition = margin.top;
                        console.log('Nueva pÃ¡gina aÃ±adida para tabla de secciÃ³n, yPosition reiniciada:', yPosition);
                    }

                    doc.autoTable({
                        startY: yPosition,
                        head: [[section]],
                        body: content.map(item => [item.content]),
                        theme: 'grid',
                        styles: {
                            font: 'helvetica',
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            lineColor: [0, 0, 0],
                            lineWidth: 0.5,
                            cellPadding: 4
                        },
                        headStyles: {
                            fillColor: [56, 142, 60],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                        columnStyles: {
                            0: { cellWidth: contentWidth }
                        },
                        margin: { left: margin.left, right: margin.right },
                        didDrawPage: (data) => {
                            yPosition = data.cursor.y + 10;
                        }
                    });

                    console.log(`Tabla de texto para secciÃ³n "${section}" aÃ±adida en yPosition:`, yPosition);
                }

                // AÃ±adir imÃ¡genes directamente con doc.addImage
                // AÃ±adir imÃ¡genes directamente con doc.addImage
                const images = sectionContents[i].filter(item => item.type === 'image');
                for (const imageItem of images) {
                    if (imageItem.content.startsWith('data:')) {
                        try {
                            const imgProps = doc.getImageProperties(imageItem.content);
                            console.log(`Propiedades de imagen para secciÃ³n "${section}":`, {
                                width: imgProps.width,
                                height: imgProps.height,
                                dataLength: imageItem.content.length
                            });
                            // Confirmar si es el Ãºltimo chart (somatotype)
                            const isLastChart = chartIndex === canvasElements.length - 1;
                            if (isLastChart) {
                                console.log(`Renderizando chart 6 (somatotype) en secciÃ³n "${section}", incluye <img id="somatotype-image">`);
                            }

                            const pdfWidth = contentWidth - 8;
                            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                            if (yPosition + imgHeight + 20 > pageHeight - margin.bottom) {
                                doc.addPage();
                                yPosition = margin.top;
                                console.log('Nueva pÃ¡gina aÃ±adida para imagen, yPosition reiniciada:', yPosition);
                            }

                            //doc.text(`Chart ${chartIndex + 1} aÃ±adido:`, margin.left, yPosition);
                            yPosition += 15;
                            doc.addImage(imageItem.content, 'PNG', margin.left + 4, yPosition + 4, pdfWidth, imgHeight);
                            console.log(`Imagen renderizada directamente en secciÃ³n "${section}" con dimensiones ${pdfWidth}x${imgHeight}${isLastChart ? ' (somatotype con <img>)' : ''}`);
                            yPosition += imgHeight + 20;
                        } catch (error) {
                            console.error(`Error al renderizar imagen directamente en secciÃ³n "${section}":`, error.message);
                            doc.text(`Error: No se pudo renderizar el chart ${chartIndex + 1}.`, margin.left, yPosition + 20);
                            yPosition += 30;
                        }
                    } else {
                        doc.text(imageItem.content, margin.left, yPosition + 20);
                        yPosition += 30;
                    }
                    chartIndex++;
                }
            }

            // Genera el blob y descÃ¡rgalo
            console.log('Generando blob PDF...');
            const blob = doc.output('blob');
            if (!blob || blob.size === 0) {
                throw new Error('El blob del PDF es invÃ¡lido o estÃ¡ vacÃ­o.');
            }
            console.log('Blob PDF generado:', { size: blob.size, type: blob.type });
            downloadFile(blob, `Resultados_${nombre}_${fecha}.pdf`);
            console.log('Documento PDF generado y descargado.');
            alert('Documento PDF exportado exitosamente.');

            // Para depuraciÃ³n: instrucciÃ³n para descargar charts PNG manualmente
            console.log('Para descargar los charts PNG, ejecuta en la consola:');
            console.log(chartDataUrls.map((url, i) => `downloadFile(dataURLToBlob("${url}"), "chart_${i + 1}.png");`).join('\n'));
        } catch (error) {
            console.error('Error en exportaciÃ³n a PDF:', error.message, error.stack);
            alert('Error al exportar a PDF: ' + error.message);
        } finally {
            // Restaurar botÃ³n
            spinner.style.display = 'none';
            btn.textContent = 'Informe';
            btn.disabled = false;
        }
    });
});
//Abrir Container MapaTipologia Corporal
// File loading functions (for XLSX, kept as is)
var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};
function filledCell(cell) {
    return cell !== '' && cell != null;
}
function loadFileData(filename) {
    if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
        try {
            var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];

            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
            var filteredData = jsonData.filter(row => row.some(filledCell));

            var headerRowIndex = filteredData.findIndex((row, index) =>
                row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
            );
            if (headerRowIndex === -1 || headerRowIndex > 25) {
                headerRowIndex = 0;
            }

            var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
            csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
            return csv;
        } catch (e) {
            console.error(e);
            return "";
        }
    }
    return gk_fileData[filename] || "";
}

// Body composition chart logic
const cliente = [{ x: 18, y: 6 }];

const typologies = [
    { name: 'Obeso Sedentario', color: 'rgba(255, 153, 153, 0.5)', emoji: 'ðŸ“ºðŸ¥”' },
    { name: 'Adiposo Sedentario', color: 'rgba(255, 0, 0, 0.5)', emoji: 'ðŸ¥ðŸ©' },
    { name: 'Obeso SÃ³lido', color: 'rgba(255, 165, 0, 0.5)', emoji: 'ðŸ”ðŸ¦' },
    { name: 'Delgado Adiposo', color: 'rgba(255, 204, 153, 0.5)', emoji: 'ðŸš¶ðŸ©' },
    { name: 'Promedio', color: 'rgba(212, 237, 145, 0.5)', emoji: 'ðŸ˜Š' },
    { name: 'Atleta Promedio', color: 'rgba(0, 128, 0, 0.5)', emoji: 'ðŸƒ' },
    { name: 'Delgado', color: 'rgba(255, 255, 153, 0.5)', emoji: 'ðŸŒ±ðŸ§˜' },
    { name: 'Esbelto Magro Atleta', color: 'rgba(0, 128, 0, 0.5)', emoji: 'ðŸ’ªðŸ”¥' },
    { name: 'Musculoso Atleta', color: 'rgba(0, 128, 0, 0.5)', emoji: 'ðŸ‹ï¸ðŸ’ª' }
];

function createLegend() {
    const legendContainer = document.getElementById('legendContainer');
    legendContainer.innerHTML = ''; // Clear existing content
    typologies.forEach(typology => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
                    <span class="legend-color" style="background-color: ${typology.color};"></span>
                    <span>${typology.emoji} ${typology.name}</span>
                `;
        legendContainer.appendChild(legendItem);
    });
}

const canvas = document.getElementById('somatotype-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 700;
canvas.height = 350;

const tooltip = document.getElementById('tooltip');

const xMin = 11.5;
const xMax = 26.7;
const yMin = 2;
const yMax = 14.3;

let currentPointX = 0;
let currentPointY = 0;
const pointRadius = 7;

function mapToCanvas(value, min, max, canvasSize) {
    return ((value - min) / (max - min)) * canvasSize;
}

function drawGrid(sexo, actividad, edad) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let ranges = RangesGet(sexo, actividad, edad);
    let imlgRanges = ranges.imlgRanges;
    let imgRanges = ranges.imgRanges;
    let maxIMLG = ranges.maxIMLG;
    let maxIMG = ranges.maxIMG;

    const xBajo = mapToCanvas(imlgRanges.bajo, xMin, xMax, canvas.width);
    const xMedio = mapToCanvas(imlgRanges.medio, xMin, xMax, canvas.width);
    const xAlto = mapToCanvas(imlgRanges.alto, xMin, xMax, canvas.width);
    const xMaxCanvas = mapToCanvas(maxIMLG, xMin, xMax, canvas.width);

    const yBajo = canvas.height - mapToCanvas(imgRanges.bajo, yMin, yMax, canvas.height);
    const yMedio = canvas.height - mapToCanvas(imgRanges.medio, yMin, yMax, canvas.height);
    const yAlto = canvas.height - mapToCanvas(imgRanges.alto, yMin, yMax, canvas.height);
    const yMaxCanvas = canvas.height - mapToCanvas(maxIMG, yMin, yMax, canvas.height);

    const regions = [
        { xStart: 0, xEnd: xMedio, yStart: 0, yEnd: yAlto, typology: 'Obeso Sedentario' },
        { xStart: xMedio, xEnd: xAlto, yStart: 0, yEnd: yAlto, typology: 'Adiposo Sedentario' },
        { xStart: xAlto, xEnd: canvas.width, yStart: 0, yEnd: yAlto, typology: 'Obeso SÃ³lido' },
        { xStart: 0, xEnd: xMedio, yStart: yAlto, yEnd: yMedio, typology: 'Delgado Adiposo' },
        { xStart: xMedio, xEnd: xAlto, yStart: yAlto, yEnd: yMedio, typology: 'Promedio' },
        { xStart: xAlto, xEnd: canvas.width, yStart: yAlto, yEnd: yMedio, typology: 'Atleta Promedio' },
        { xStart: 0, xEnd: xMedio, yStart: yMedio, yEnd: canvas.height, typology: 'Delgado' },
        { xStart: xMedio, xEnd: xAlto, yStart: yMedio, yEnd: canvas.height, typology: 'Esbelto Magro Atleta' },
        { xStart: xAlto, xEnd: canvas.width, yStart: yMedio, yEnd: canvas.height, typology: 'Musculoso Atleta' }
    ];

    regions.forEach(region => {
        const typologyObj = typologies.find(t => t.name === region.typology);
        const color = typologyObj ? typologyObj.color : 'rgba(200, 200, 200, 0.5)';
        ctx.fillStyle = color;
        ctx.fillRect(region.xStart, region.yStart, region.xEnd - region.xStart, region.yEnd - region.yStart);

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelX = (region.xStart + region.xEnd) / 2;
        const labelY = (region.yStart + region.yEnd) / 2;
        ctx.fillText(region.typology, labelX, labelY);
    });

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(xMedio, 0);
    ctx.lineTo(xMedio, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xAlto, 0);
    ctx.lineTo(xAlto, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, yMedio);
    ctx.lineTo(canvas.width, yMedio);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, yAlto);
    ctx.lineTo(canvas.width, yAlto);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let imlg = 12; imlg <= 26; imlg += 2) {
        const x = mapToCanvas(imlg, xMin, xMax, canvas.width);
        ctx.fillText(imlg, x, canvas.height - 15);
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, canvas.height - 5);
        ctx.stroke();
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let img = 2; img <= 14; img += 2) {
        const y = canvas.height - mapToCanvas(img, yMin, yMax, canvas.height);
        ctx.fillText(img, 15, y);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(5, y);
        ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillText('IMLG (kg/mÂ²)', canvas.width / 2, canvas.height - 30);
    ctx.save();
    ctx.translate(30, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('IMG (kg/mÂ²)', 0, 0);
    ctx.restore();
}

function drawPoint(imlg, img, color) {
    const x = mapToCanvas(imlg, xMin, xMax, canvas.width);
    const y = canvas.height - mapToCanvas(img, yMin, yMax, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    currentPointX = x;
    currentPointY = y;
}

function isCursorOverPoint(mouseX, mouseY) {
    const dx = mouseX - currentPointX;
    const dy = mouseY - currentPointY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= pointRadius + 5;
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (isCursorOverPoint(mouseX, mouseY)) {
        const sexo = document.getElementById('sexoInput').value;
        const edad = parseInt(document.getElementById('edadInput').value);
        const actividad = document.getElementById('actividadInput').value;
        const result = detectarTipologia(cliente, sexo, actividad, edad);
        const tipologia = result.tipologia;
        const typologyObj = typologies.find(t => t.name === tipologia);
        const emoji = typologyObj ? typologyObj.emoji : '';
        tooltip.style.display = 'block';
        tooltip.innerHTML = `Cliente: IMLG=${cliente[0].x}, IMG=${cliente[0].y}, TipologÃ­a=${emoji} ${tipologia}`;

        let tooltipX = currentPointX - tooltip.offsetWidth / 2;
        let tooltipY = currentPointY - tooltip.offsetHeight - pointRadius - 5;

        if (tooltipX < 0) {
            tooltipX = 0;
        }
        if (tooltipX + tooltip.offsetWidth > canvas.width) {
            tooltipX = canvas.width - tooltip.offsetWidth;
        }
        if (tooltipY < 0) {
            tooltipY = currentPointY + pointRadius + 5;
        }
        if (tooltipY + tooltip.offsetHeight > canvas.height) {
            tooltipY = canvas.height - tooltip.offsetHeight;
        }

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
    } else {
        tooltip.style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});

function RangesGet(sexo, actividad, edad) {
    if (edad < 18) {
        return null;
    }

    let Groupage;
    if (edad >= 18 && edad <= 29) {
        ageGroup = '18-29';
    } else if (edad >= 30 && edad <= 49) {
        ageGroup = '30-49';
    } else {
        ageGroup = '50+';
    }

    let imlgRanges, imgRanges, maxIMLG, maxIMG;

    if (sexo === 'femenino') {
        if (Groupage === '18-29') {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 12.5, medio: 14.5, alto: 16.5 };
                imgRanges = { bajo: 4, medio: 7, alto: 9 };
                maxIMLG = 18.5;
                maxIMG = 13;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 13, medio: 15, alto: 17 };
                imgRanges = { bajo: 3.5, medio: 6.5, alto: 8.5 };
                maxIMLG = 19;
                maxIMG = 12;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 13.5, medio: 15.5, alto: 17.5 };
                imgRanges = { bajo: 3, medio: 6, alto: 8 };
                maxIMLG = 20;
                maxIMG = 10;
            } else {
                imlgRanges = { bajo: 14, medio: 16, alto: 18.5 };
                imgRanges = { bajo: 3, medio: 5, alto: 7 };
                maxIMLG = 22;
                maxIMG = 9;
            }
        } else if (Groupage === '30-49') {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 12, medio: 14, alto: 16 };
                imgRanges = { bajo: 5, medio: 8, alto: 10 };
                maxIMLG = 18;
                maxIMG = 14.3;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 12.5, medio: 14.5, alto: 16.5 };
                imgRanges = { bajo: 4, medio: 7, alto: 9 };
                maxIMLG = 18.5;
                maxIMG = 13;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 13, medio: 15, alto: 17 };
                imgRanges = { bajo: 3.5, medio: 6.5, alto: 8.5 };
                maxIMLG = 19;
                maxIMG = 11;
            } else {
                imlgRanges = { bajo: 13.5, medio: 15.5, alto: 17.5 };
                imgRanges = { bajo: 3, medio: 5.5, alto: 7.5 };
                maxIMLG = 20;
                maxIMG = 9.5;
            }
        } else {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 11.5, medio: 13.5, alto: 15.5 };
                imgRanges = { bajo: 6, medio: 9, alto: 11 };
                maxIMLG = 17.5;
                maxIMG = 14.3;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 12, medio: 14, alto: 16 };
                imgRanges = { bajo: 5, medio: 8, alto: 10 };
                maxIMLG = 18;
                maxIMG = 13;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 12.5, medio: 14.5, alto: 16.5 };
                imgRanges = { bajo: 4, medio: 7, alto: 9 };
                maxIMLG = 18.5;
                maxIMG = 11;
            } else {
                imlgRanges = { bajo: 13, medio: 15, alto: 17 };
                imgRanges = { bajo: 3.5, medio: 6, alto: 8 };
                maxIMLG = 19;
                maxIMG = 10;
            }
        }
    } else {
        if (Groupage === '18-29') {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 15, medio: 17, alto: 19 };
                imgRanges = { bajo: 3, medio: 6, alto: 8 };
                maxIMLG = 21;
                maxIMG = 11;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 15.5, medio: 17.5, alto: 19.5 };
                imgRanges = { bajo: 2.5, medio: 5.5, alto: 7.5 };
                maxIMLG = 21.5;
                maxIMG = 10;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 16, medio: 18, alto: 20 };
                imgRanges = { bajo: 2, medio: 5, alto: 7 };
                maxIMLG = 23;
                maxIMG = 9;
            } else {
                imlgRanges = { bajo: 17, medio: 19, alto: 21.5 };
                imgRanges = { bajo: 2, medio: 4, alto: 6 };
                maxIMLG = 25;
                maxIMG = 8;
            }
        } else if (Groupage === '30-49') {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 14.5, medio: 16.5, alto: 18.5 };
                imgRanges = { bajo: 4, medio: 7, alto: 9 };
                maxIMLG = 20.5;
                maxIMG = 12;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 15, medio: 17, alto: 19 };
                imgRanges = { bajo: 3, medio: 6, alto: 8 };
                maxIMLG = 21;
                maxIMG = 11;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 15.5, medio: 17.5, alto: 19.5 };
                imgRanges = { bajo: 2.5, medio: 5.5, alto: 7.5 };
                maxIMLG = 22;
                maxIMG = 9.5;
            } else {
                imlgRanges = { bajo: 16, medio: 18, alto: 20 };
                imgRanges = { bajo: 2, medio: 4.5, alto: 6.5 };
                maxIMLG = 23;
                maxIMG = 8.5;
            }
        } else {
            if (actividad === 'sedentario') {
                imlgRanges = { bajo: 14, medio: 16, alto: 18 };
                imgRanges = { bajo: 5, medio: 8, alto: 10 };
                maxIMLG = 20;
                maxIMG = 12;
            } else if (actividad === 'pocoActivo') {
                imlgRanges = { bajo: 14.5, medio: 16.5, alto: 18.5 };
                imgRanges = { bajo: 4, medio: 7, alto: 9 };
                maxIMLG = 20.5;
                maxIMG = 11;
            } else if (actividad === 'activo') {
                imlgRanges = { bajo: 15, medio: 17, alto: 19 };
                imgRanges = { bajo: 3, medio: 6, alto: 8 };
                maxIMLG = 21;
                maxIMG = 10;
            } else {
                imlgRanges = { bajo: 15.5, medio: 17.5, alto: 19.5 };
                imgRanges = { bajo: 2.5, medio: 5, alto: 7 };
                maxIMLG = 22;
                maxIMG = 9;
            }
        }
    }

    return { imlgRanges, imgRanges, maxIMLG, maxIMG };
}
//Validaciones
function validateInputs(sexo, actividad, edad, imlg, img) {
    const imlgWarning = document.getElementById('imlgWarning');
    const imgWarning = document.getElementById('imgWarning');
    imlgWarning.style.display = 'none';
    imgWarning.style.display = 'none';

    const ranges = RangesGet(sexo, actividad, edad);
    if (!ranges) {
        // Display a warning for invalid age, but allow processing
        document.getElementById('edadWarning').textContent = 'Edad debe ser mayor o igual a 18';
        document.getElementById('edadWarning').style.display = 'block';
        return true; // Allow calculation to proceed
    }
    const { maxIMLG, maxIMG } = ranges;

    // Check IMLG and display warnings if out of range
    if (imlg < xMin) {
        imlgWarning.textContent = `IMLG debe ser al menos ${xMin} kg/mÂ²`;
        imlgWarning.style.display = 'block';
    } else if (imlg > maxIMLG) {
        imlgWarning.textContent = `IMLG no puede exceder ${maxIMLG} kg/mÂ² para ${sexo === 'mujer' ? 'mujeres' : 'hombres'} de ${edad >= 50 ? '50+' : (edad >= 30 ? '30-49' : '18-29')} aÃ±os ${actividad}`;
        imlgWarning.style.display = 'block';
    }

    // Check IMG and display warnings if out of range
    if (img < yMin) {
        imgWarning.textContent = `IMG debe ser al menos ${yMin} kg/mÂ²`;
        imgWarning.style.display = 'block';
    } else if (img > maxIMG) {
        imgWarning.textContent = `IMG no puede exceder ${maxIMG} kg/mÂ² para ${sexo === 'mujer' ? 'mujeres' : 'hombres'} de ${edad >= 50 ? '50+' : (edad >= 30 ? '30-49' : '18-29')} aÃ±os ${actividad}`;
        imgWarning.style.display = 'block';
    }

    return true; // Always allow calculation to proceed
}

function detectarTipologia(cliente, sexo, actividad, edad) {
    if (!cliente || !cliente[0] || typeof cliente[0].x !== 'number' || typeof cliente[0].y !== 'number') {
        return { tipologia: 'Datos invÃ¡lidos', closestTipologia: null };
    }
    if (edad < 18) {
        return { tipologia: 'Edad no vÃ¡lida (debe ser mayor o igual a 18)', closestTipologia: null };
    }
    let x = cliente[0].x;
    let y = cliente[0].y;
    let tipologia = '';
    let closestTipologia = null;

    const ranges = getRanges(sexo, actividad, edad);
    if (!ranges) {
        return { tipologia: 'Edad no vÃ¡lida (debe ser mayor o igual a 18)', closestTipologia: null };
    }
    let imlgRanges = ranges.imlgRanges;
    let imgRanges = ranges.imgRanges;
    let maxIMLG = ranges.maxIMLG;
    let maxIMG = ranges.maxIMG;

    let isOutOfRange = true;
    let adjustedX = x;
    let adjustedY = y;

    if (x < xMin || x > maxIMLG || y < yMin || y > maxIMG) {
        isOutOfRange = true;
        adjustedX = Math.max(xMin, Math.min(x, maxIMLG));
        adjustedY = Math.max(yMin, Math.min(y, maxIMG));
    }

    let xToUse = isOutOfRange ? adjustedX : x;
    let yToUse = isOutOfRange ? adjustedY : y;

    let imlgCategory = '';
    if (xToUse >= imlgRanges.bajo && xToUse < imlgRanges.medio) {
        imlgCategory = 'bajo';
    } else if (xToUse >= imlgRanges.medio && xToUse < imlgRanges.alto) {
        imlgCategory = 'medio';
    } else if (xToUse >= imlgRanges.alto && xToUse <= maxIMLG) {
        imlgCategory = 'alto';
    }

    let imgCategory = '';
    if (yToUse >= imgRanges.bajo && yToUse < imgRanges.medio) {
        imgCategory = 'bajo';
    } else if (yToUse >= imgRanges.medio && yToUse < imgRanges.alto) {
        imgCategory = 'medio';
    } else if (yToUse >= imgRanges.alto && yToUse <= maxIMG) {
        imgCategory = 'alto';
    }

    if (imlgCategory === 'bajo') {
        if (imgCategory === 'alto') tipologia = 'Obeso Sedentario';
        else if (imgCategory === 'medio') tipologia = 'Delgado Adiposo';
        else if (imgCategory === 'bajo') tipologia = 'Delgado';
    } else if (imlgCategory === 'medio') {
        if (imgCategory === 'alto') tipologia = 'Adiposo Sedentario';
        else if (imgCategory === 'medio') tipologia = 'Promedio';
        else if (imgCategory === 'bajo') tipologia = 'Esbelto Magro Atleta';
    } else if (imlgCategory === 'alto') {
        if (imgCategory === 'alto') tipologia = 'Obeso SÃ³lido';
        else if (imgCategory === 'medio') tipologia = 'Atleta Promedio';
        else if (imgCategory === 'bajo') tipologia = 'Musculoso Atleta';
    }

    return { tipologia: tipologia || 'Fuera de rango', closestTipologia };
}

function updateChart() {
    const sexo = document.getElementById('sexoInput').value;
    const actividad = document.getElementById('actividadInput').value;
    const edad = parseInt(document.getElementById('edadInput').value);
    const imlg = parseFloat(document.getElementById('imlgInput').value);
    const img = parseFloat(document.getElementById('imgInput').value);

    cliente[0] = { x: imlg, y: img };

    const isValid = validateInputs(sexo, actividad, edad, imlg, img);
    if (!isValid) {
        drawGrid(sexo, actividad, edad);
        return;
    }

    drawGrid(sexo, actividad, edad);
    drawPoint(imlg, img, 'red');
}

function downloadChart() {
    const link = document.createElement('a');
    link.download = 'mapa_composicion_corporal.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Initialize modal form fields with values from HTML, URL parameters, or defaults
function populateFormFields() {
    const generoElement = document.getElementById('genero');
    const edadElement = document.getElementById('edad');
    const esDeportistaElement = document.getElementById('es_deportista');
    const imlgElement = document.getElementById('result-imlg-actual');
    const imgElement = document.getElementById('result-img-actual');
    const urlParams = new URLSearchParams(window.location.search);

    // Map genero to sexoInput values
    const genero = generoElement && generoElement.value ?
        (generoElement.value === 'masculino' ? 'masculino' : generoElement.value === 'femenino' ? 'femenino' : 'mujer') :
        (urlParams.get('sexo') === 'masculino' ? 'masculino' : 'femenino');

    // Map edad, ensuring it's at least 18
    const edadFromHtml = edadElement && edadElement.value ? parseFloat(edadElement.value) : NaN;
    const edadFromUrl = parseInt(urlParams.get('edad'));
    const edad = !isNaN(edadFromHtml) && edadFromHtml >= 18 ? edadFromHtml :
        (!isNaN(edadFromUrl) && edadFromUrl >= 18 ? edadFromUrl : 30);

    // Map es_deportista to actividad levels
    const actividadFromHtml = esDeportistaElement && esDeportistaElement.value ?
        (esDeportistaElement.value.toLowerCase() === 'sÃ­' ? 'deportista' : 'sedentario') : null;
    const actividadFromUrl = urlParams.get('actividad');
    const actividad = actividadFromHtml ? actividadFromHtml :
        (['sedentario', 'pocoActivo', 'activo', 'deportista'].includes(actividadFromUrl) ? actividadFromUrl : 'sedentario');

    // Get IMLG and IMG values, checking for '---' or invalid values
    const imlgFromHtml = imlgElement && imlgElement.textContent !== '---' ? parseFloat(imlgElement.textContent) : NaN;
    const imgFromHtml = imgElement && imgElement.textContent !== '---' ? parseFloat(imgElement.textContent) : NaN;
    const imlgFromUrl = parseFloat(urlParams.get('imlg'));
    const imgFromUrl = parseFloat(urlParams.get('img'));
    const imlg = !isNaN(imlgFromHtml) ? imlgFromHtml : (!isNaN(imlgFromUrl) ? imlgFromUrl : 17.0);
    const img = !isNaN(imgFromHtml) ? imgFromHtml : (!isNaN(imgFromUrl) ? imgFromUrl : 11.1);

    // Set form field values
    document.getElementById('sexoInput').value = genero;
    document.getElementById('edadInput').value = edad;
    document.getElementById('actividadInput').value = actividad;
    document.getElementById('imlgInput').value = imlg;
    document.getElementById('imgInput').value = img;

    // Update cliente array for chart rendering
    cliente[0] = { x: imlg, y: img };
}

// Modal event listener for opening
const button = document.getElementById('abrirContainerTipologia');
button.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const modal = document.getElementById('modalContainer');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transition = 'opacity 0.3s ease-in-out';
    }, 10);
    populateFormFields(); // Populate form fields when modal opens
    createLegend();
    updateChart();
});




document.getElementById('closeModal').addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    document.getElementById('modalContainer').style.display = 'none';
});

document.getElementById('modalContainer').addEventListener('click', function (e) {
    if (e.target === this) {
        e.stopPropagation();
        e.preventDefault();
        this.style.display = 'none';
    }
});

document.getElementById('updateButton').addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    updateChart();
});

document.getElementById('downloadButton').addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    downloadChart();
});




//Abrir Container y grafico Somatocarta

document.addEventListener('DOMContentLoaded', () => {
    const buttonsoma = document.getElementById('abrirContainerSomatotipo');
    const modalsoma = document.getElementById('modalSomaContainer');
    const closeSpan = document.querySelector('.close-soma-modal');
    const closeButton = document.querySelector('.closesomaModal');
    let retryCountPopulate = 0;
    const MAX_RETRIES = 10;
    const RETRY_INTERVAL = 1000;

    // Modal event listener for opening
    if (buttonsoma) {
        buttonsoma.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            if (!modalsoma) {
                console.error('Modal container with ID "modalSomaContainer" not found.');
                return;
            }

            modalsoma.style.display = 'flex';
            setTimeout(() => {
                modalsoma.style.opacity = '1';
                modalsoma.style.transition = 'opacity 0.3s ease-in-out';
            }, 10);

            console.log('Abriendo:', new Date().toISOString(), {
                modalSomaContainer: !!modalsoma,
                somatotipoContainer: !!document.getElementById('somatotipo-container'),
                modalContent: modalsoma.innerHTML.substring(0, 100) + '...'
            });

            retryCountPopulate = 0;
            setTimeout(() => {
                if (modalsoma.querySelector('#nombreInput')) {
                    populateFields();
                } else {
                    console.warn('Fields not found initially. Relying on MutationObserver or retries.');
                }
            }, 100);
        });
    } else {
        console.error('Button with ID "abrirContainerSomatotipo" not found.');
    }

    // Function to close the modal
    function closeSomaModal() {
        if (!modalsoma) {
            console.error('Modal container with ID "modalSomaContainer" not found.');
            return;
        }

        modalsoma.style.opacity = '0';
        setTimeout(() => {
            modalsoma.style.display = 'none';
        }, 300);
    }

    // Function to populate fields
    function populateFields() {
        const modalContainer = document.getElementById('modalSomaContainer');
        const generoSelect = modalContainer.querySelector('#nombreInput');
        const endoInput = modalContainer.querySelector('#endoInput');
        const mesoInput = modalContainer.querySelector('#mesoInput');
        const ectoInput = modalContainer.querySelector('#ectoInput');
        const deporteSelect = modalContainer.querySelector('#deporteInput');
        const modalidadSelect = modalContainer.querySelector('#modalidadInput');

        const generoMap = {
            'masculino': 'masculino',
            'femenino': 'femenino'
        };

        const defaultValues = {
            genero: 'masculino',
            endomorfia: 1.0,
            mesomorfia: 1.0,
            ectomorfia: 1.0,
            grupoReferencia: 'N/A',
            modalidad: 'N/A'
        };

        let generoValue = '';
        const sourceGenero = document.getElementById('genero');
        if (sourceGenero && sourceGenero.value in generoMap) {
            generoValue = generoMap[sourceGenero.value];
        }

        let somatotipoValues = { endomorfia: null, mesomorfia: null, ectomorfia: null };
        const resultSomatotipo = document.getElementById('result-somatotipo');
        if (resultSomatotipo && resultSomatotipo.textContent !== '---') {
            const text = resultSomatotipo.textContent;
            const match = text.match(/\s*([\d.]+)\s*:\s*([\d.]+)\s*:\s*([\d.]+)/);
            if (match) {
                somatotipoValues = {
                    endomorfia: parseFloat(match[1]),
                    mesomorfia: parseFloat(match[2]),
                    ectomorfia: parseFloat(match[3])
                };
                console.log('somatotipoValues:', somatotipoValues);
            }
        }

        if (!generoSelect.value) {
            generoSelect.value = generoValue || defaultValues.genero;
        }

        function setSomatotipoValue(input, somatotipoValue, defaultValue) {
            const numericValue = parseFloat(input.value);
            const shouldUseDefault = (
                !input.value ||
                input.value == 1 ||
                input.value == "1" ||
                isNaN(numericValue) ||
                (somatotipoValue !== null &&
                    !isNaN(somatotipoValue) &&
                    numericValue !== somatotipoValue)
            );

            if (shouldUseDefault) {
                input.value = (somatotipoValue !== null && !isNaN(somatotipoValue))
                    ? somatotipoValue.toFixed(1)
                    : defaultValue.toFixed(1);
            }
        }

        setSomatotipoValue(endoInput, somatotipoValues.endomorfia, defaultValues.endomorfia);
        setSomatotipoValue(mesoInput, somatotipoValues.mesomorfia, defaultValues.mesomorfia);
        setSomatotipoValue(ectoInput, somatotipoValues.ectomorfia, defaultValues.ectomorfia);

        if (!deporteSelect.value) {
            deporteSelect.value = defaultValues.grupoReferencia;
        }
        if (!modalidadSelect.value) {
            modalidadSelect.value = defaultValues.modalidad;
        }

        console.log('Campos rellenados:', {
            genero: generoSelect.value,
            endomorfia: endoInput.value,
            mesomorfia: mesoInput.value,
            ectomorfia: ectoInput.value,
            grupoReferencia: deporteSelect.value,
            modalidad: modalidadSelect.value
        });

        drawSomaChart(somatotipoValues);
    }

    // Function to draw somatotipo chart
    function drawSomaChart(initialData, updatedData = null) {
        const Somatotypecanvas = document.getElementById('somatotype-point-canvas2');
        const imgSomatotype = document.getElementById('somatotype-image');

        if (!Somatotypecanvas || !imgSomatotype) {
            console.error('Canvas #somatotype-point-canvas2 o imagen #somatotype-image no encontrado');
            return;
        }

        const container = document.querySelector('.chart-container');
        if (!container) {
            console.error('Chart container (.chart-container) not found');
            return;
        }

        let displayedWidth = container.clientWidth;
        let displayedHeight = container.clientHeight;

        if (displayedWidth === 0 || displayedHeight === 0) {
            console.warn('Container has zero dimensions, using fallback size (500x500px)');
            displayedWidth = 500;
            displayedHeight = 500;
        }

        Somatotypecanvas.width = displayedWidth;
        Somatotypecanvas.height = displayedHeight;

        const ctxSoma = Somatotypecanvas.getContext('2d');
        ctxSoma.clearRect(0, 0, Somatotypecanvas.width, Somatotypecanvas.height);

        const chartWidth = displayedWidth * 0.8;
        const chartHeight = displayedHeight * 0.8;
        const chartOffsetX = (displayedWidth - chartWidth) / 2;
        const chartOffsetY = (displayedHeight - chartHeight) / 2;

        const centerX = chartOffsetX + chartWidth / 2;
        const centerY = chartOffsetY + chartHeight / 2;
        const xAxisY = chartOffsetY + chartHeight;

        console.log(`Container Dimensions: width=${displayedWidth}, height=${displayedHeight}`);
        console.log(`Chart Area: offsetX=${chartOffsetX}, offsetY=${chartOffsetY}, width=${chartWidth}, height=${chartHeight}`);

        // Draw X-axis
        ctxSoma.beginPath();
        ctxSoma.moveTo(chartOffsetX, xAxisY);
        ctxSoma.lineTo(chartOffsetX + chartWidth, xAxisY);
        ctxSoma.strokeStyle = '#000000';
        ctxSoma.lineWidth = 1; // Reduced from 2 to make axis finer
        ctxSoma.stroke();

        ctxSoma.font = '10px Inter, sans-serif'; // Reduced from 16px for finer appearance
        ctxSoma.fillStyle = '#000000';
        ctxSoma.textAlign = 'center';
        for (let i = -8; i <= 8; i += 2) {
            const xPos = chartOffsetX + ((i + 8) / 16) * chartWidth;
            ctxSoma.beginPath();
            ctxSoma.moveTo(xPos, xAxisY - 4); // Reduced tick size from 5 to 4
            ctxSoma.lineTo(xPos, xAxisY + 4);
            ctxSoma.lineWidth = 0.5; // Reduced from implicit 2 to make graduations finer
            ctxSoma.stroke();
            ctxSoma.fillText(i.toString(), xPos, xAxisY + 18); // Adjusted position slightly
        }
        ctxSoma.font = '14px Roboto, sans-serif'; // Reduced from 20px for finer axis label
        ctxSoma.fillText('Endomorfia - Ectomorfia', chartOffsetX + chartWidth / 2, xAxisY + 28);

        // Draw Y-axis
        const yAxisX = chartOffsetX + chartWidth;
        ctxSoma.beginPath();
        ctxSoma.moveTo(yAxisX, xAxisY);
        ctxSoma.lineTo(yAxisX, chartOffsetY);
        ctxSoma.strokeStyle = '#000000';
        ctxSoma.lineWidth = 1; // Reduced from 2 to make axis finer
        ctxSoma.stroke();

        ctxSoma.font = '10px Inter, sans-serif'; // Reduced from 16px for finer appearance
        ctxSoma.fillStyle = '#000000';
        ctxSoma.textAlign = 'center';
        for (let i = -10; i <= 12; i += 2) {
            const yPos = centerY - (i / 22) * ((centerY - chartOffsetY) + (xAxisY - centerY));
            ctxSoma.beginPath();
            ctxSoma.moveTo(yAxisX - 4, yPos); // Reduced tick size from 5 to 4
            ctxSoma.lineTo(yAxisX + 4, yPos);
            ctxSoma.lineWidth = 0.5; // Reduced from implicit 2 to make graduations finer
            ctxSoma.stroke();
            ctxSoma.fillText(i.toString(), yAxisX + 18, yPos + 5); // Adjusted position slightly
        }

        ctxSoma.save();
        ctxSoma.translate(chartOffsetX + ((7 + 8) / 16) * chartWidth, chartOffsetY + chartHeight / 2);
        ctxSoma.rotate(-Math.PI / 2);
        ctxSoma.font = '14px Roboto, sans-serif'; // Reduced from 20px for finer axis label
        ctxSoma.textAlign = 'center';
        ctxSoma.fillText('Mesomorfia', 0, 0);
        ctxSoma.restore();

        // Draw blue point (initial data)
        if (initialData) {
            const x = initialData.ectomorfia - initialData.endomorfia;
            const y = 2 * initialData.mesomorfia - (initialData.endomorfia + initialData.ectomorfia);
            const xClamped = Math.min(Math.max(x, -8), 8);
            const yClamped = Math.min(Math.max(y, -10), 12);

            const pixelX = chartOffsetX + ((xClamped + 8) / 16) * chartWidth;
            const pixelY = centerY - (yClamped / 22) * ((centerY - chartOffsetY) + (xAxisY - centerY));

            console.log(`Blue Point Coordinates: pixelX=${pixelX}, pixelY=${pixelY}`);

            ctxSoma.beginPath();
            ctxSoma.arc(pixelX, pixelY, 6, 0, 2 * Math.PI);
            ctxSoma.fillStyle = '#0056b3';
            ctxSoma.fill();
            ctxSoma.strokeStyle = '#003087';
            ctxSoma.lineWidth = 2;
            ctxSoma.stroke();

            ctxSoma.font = 'bold 10px Arial, sans-serif';
            ctxSoma.fillStyle = '#000000';
            ctxSoma.strokeStyle = '#ffffff';
            ctxSoma.lineWidth = 2;
            ctxSoma.textAlign = 'center';
            ctxSoma.strokeText(
                `${initialData.endomorfia.toFixed(1)}-${initialData.mesomorfia.toFixed(1)}-${initialData.ectomorfia.toFixed(1)}`,
                pixelX,
                pixelY - 15
            );
            ctxSoma.fillText(
                `${initialData.endomorfia.toFixed(1)}-${initialData.mesomorfia.toFixed(1)}-${initialData.ectomorfia.toFixed(1)}`,
                pixelX,
                pixelY - 15
            );
        }

        // Draw red point (updated data)
        if (updatedData) {
            const x = updatedData.ectomorfia - updatedData.endomorfia;
            const y = 2 * updatedData.mesomorfia - (updatedData.endomorfia + updatedData.ectomorfia);
            const xClamped = Math.min(Math.max(x, -8), 8);
            const yClamped = Math.min(Math.max(y, -10), 12);

            const pixelX = chartOffsetX + ((xClamped + 8) / 16) * chartWidth;
            const pixelY = centerY - (yClamped / 22) * ((centerY - chartOffsetY) + (xAxisY - centerY));

            console.log(`Red Point Coordinates: pixelX=${pixelX}, pixelY=${pixelY}`);

            ctxSoma.beginPath();
            ctxSoma.arc(pixelX, pixelY, 6, 0, 2 * Math.PI);
            ctxSoma.fillStyle = '#FF0000';
            ctxSoma.fill();
            ctxSoma.strokeStyle = '#8B0000';
            ctxSoma.lineWidth = 2;
            ctxSoma.stroke();

            ctxSoma.font = 'bold 10px Arial, sans-serif';
            ctxSoma.fillStyle = '#000000';
            ctxSoma.strokeStyle = '#ffffff';
            ctxSoma.lineWidth = 2;
            ctxSoma.textAlign = 'center';
            ctxSoma.strokeText(
                `${updatedData.endomorfia.toFixed(1)}-${updatedData.mesomorfia.toFixed(1)}-${updatedData.ectomorfia.toFixed(1)}`,
                pixelX,
                pixelY + 25
            );
            ctxSoma.fillText(
                `${updatedData.endomorfia.toFixed(1)}-${updatedData.mesomorfia.toFixed(1)}-${updatedData.ectomorfia.toFixed(1)}`,
                pixelX,
                pixelY + 25
            );
        }
    }

    // Attempt to draw chart with retries
    function attemptDrawChart(initialData, attempts = 0, maxAttempts = 20) {
        const container = document.querySelector('.chart-container');
        if (!container) {
            console.error('Chart container (.chart-container) not found');
            return;
        }

        console.log('Attempt', attempts, 'Container state:', {
            display: window.getComputedStyle(container).display,
            visibility: window.getComputedStyle(container).visibility,
            width: container.clientWidth,
            height: container.clientHeight,
            modalDisplay: window.getComputedStyle(modalsoma).display
        });

        if (container.clientWidth > 0 && container.clientHeight > 0 && window.getComputedStyle(modalsoma).display !== 'none') {
            const imgSomatotype = document.getElementById('somatotype-image');
            if (imgSomatotype.complete && imgSomatotype.naturalWidth > 0) {
                drawSomaChart(initialData);
            } else {
                imgSomatotype.onload = () => drawSomaChart(initialData);
                imgSomatotype.onerror = () => {
                    console.error('Error al cargar la imagen #somatotype-image');
                };
            }
        } else if (attempts < maxAttempts) {
            setTimeout(() => attemptDrawChart(initialData, attempts + 1, maxAttempts), 100);
        } else {
            console.error('Max attempts reached, unable to draw chart due to zero container dimensions');
            drawSomaChart(initialData);
        }
    }

    // MutationObserver to detect modal visibility
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style') {
                const display = window.getComputedStyle(modalsoma).display;
                if (display === 'flex') {
                    console.log('Modal is now visible, attempting to draw chart');
                    const resultSomatotipo = document.getElementById('result-somatotipo');
                    let initialData = null;
                    if (resultSomatotipo && resultSomatotipo.textContent !== '---') {
                        const text = resultSomatotipo.textContent;
                        const match = text.match(/\s*([\d.]+)\s*:\s*([\d.]+)\s*:\s*([\d.]+)/);
                        if (match) {
                            initialData = {
                                endomorfia: parseFloat(match[1]),
                                mesomorfia: parseFloat(match[2]),
                                ectomorfia: parseFloat(match[3])
                            };
                        }
                    }
                    attemptDrawChart(initialData);
                    observer.disconnect();
                }
            }
        });
    });

    observer.observe(modalsoma, { attributes: true });

    if (window.getComputedStyle(modalsoma).display === 'flex') {
        const resultSomatotipo = document.getElementById('result-somatotipo');
        let initialData = null;
        if (resultSomatotipo && resultSomatotipo.textContent !== '---') {
            const text = resultSomatotipo.textContent;
            const match = text.match(/\s*([\d.]+)\s*:\s*([\d.]+)\s*:\s*([\d.]+)/);
            if (match) {
                initialData = {
                    endomorfia: parseFloat(match[1]),
                    mesomorfia: parseFloat(match[2]),
                    ectomorfia: parseFloat(match[3])
                };
            }
        }
        attemptDrawChart(initialData);
    }

    // Function to handle "Calcular" button click
    function handleCalcularSubmit(e) {
        e.stopPropagation();
        e.preventDefault();

        const modalContainer = document.getElementById('modalSomaContainer');
        const generoSelect = modalContainer.querySelector('#nombreInput');
        const endoInput = modalContainer.querySelector('#somatotipoEndo');
        const mesoInput = modalContainer.querySelector('#somatotipoMeso');
        const ectoInput = modalContainer.querySelector('#somatotipoEcto');
        const deporteSelect = modalContainer.querySelector('#deporteInput');
        const modalidadSelect = modalContainer.querySelector('#modalidadInput');

        let isValid = true;
        const errors = [];

        if (!generoSelect.value) {
            isValid = false;
            errors.push('El campo gÃ©nero es requerido.');
            generoSelect.classList.add('invalid');
        } else {
            generoSelect.classList.remove('invalid');
        }
        if (!endoInput.value || isNaN(endoInput.value) || endoInput.value < 0) {
            isValid = false;
            errors.push('El campo endomorfia es invÃ¡lido.');
            endoInput.classList.add('invalid');
        } else {
            endoInput.classList.remove('invalid');
        }
        if (!mesoInput.value || isNaN(mesoInput.value) || mesoInput.value < 0) {
            isValid = false;
            errors.push('El campo mesomorfia es invÃ¡lido.');
            mesoInput.classList.add('invalid');
        } else {
            mesoInput.classList.remove('invalid');
        }
        if (!ectoInput.value || isNaN(ectoInput.value) || ectoInput.value < 0) {
            isValid = false;
            errors.push('El campo ectomorfia es invÃ¡lido.');
            ectoInput.classList.add('invalid');
        } else {
            ectoInput.classList.remove('invalid');
        }
        if (!deporteSelect.value) {
            isValid = false;
            errors.push('El campo grupo de referencia es requerido.');
            deporteSelect.classList.add('invalid');
        } else {
            deporteSelect.classList.remove('invalid');
        }

        if (!isValid) {
            console.error('Errores de validaciÃ³n:', errors);
            alert('Por favor, corrige los campos invÃ¡lidos.');
            return;
        }

        const updatedData = {
            genero: generoSelect.value,
            endomorfia: parseFloat(endoInput.value),
            mesomorfia: parseFloat(mesoInput.value),
            ectomorfia: parseFloat(ectoInput.value),
            grupoReferencia: deporteSelect.value,
            modalidad: modalidadSelect.value || 'N/A'
        };

        console.log('Datos procesados:', updatedData);

        const resultSomatotipo = document.getElementById('result-somatotipo');
        let initialData = null;
        if (resultSomatotipo && resultSomatotipo.textContent !== '---') {
            const text = resultSomatotipo.textContent;
            const match = text.match(/\s*([\d.]+)\s*:\s*([\d.]+)\s*:\s*([\d.]+)/);
            if (match) {
                initialData = {
                    endomorfia: parseFloat(match[1]),
                    mesomorfia: parseFloat(match[2]),
                    ectomorfia: parseFloat(match[3])
                };
            }
        }

        drawSomaChart(initialData, updatedData);
    }

    // Set up "Calcular" button listener
    const calcularButton = document.querySelector('#calcularButton');
    if (calcularButton) {
        calcularButton.removeEventListener('click', handleCalcularSubmit);
        calcularButton.addEventListener('click', handleCalcularSubmit);
    } else {
        console.error('Calcular button with ID "calcularButton" not found.');
    }

    // Helper function to determine dominant component
    function getDominante(data) {
        const { endomorfia, mesomorfia, ectomorfia } = data;
        const max = Math.max(endomorfia, mesomorfia, ectomorfia);
        if (max === endomorfia) return 'Endomorfia';
        if (max === mesomorfia) return 'Mesomorfia';
        return 'Ectomorfia';
    }

    // Helper function to calculate X coordinate
    function calculateX(data) {
        return data.ectomorfia - data.endomorfia;
    }

    // Helper function to calculate Y coordinate
    function calculateY(data) {
        return 2 * data.mesomorfia - (data.endomorfia + data.ectomorfia);
    }




    // Set up close button (Ã—)
    if (closeSpan) {
        closeSpan.removeEventListener('click', closeSomaModal);
        closeSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSomaModal();
        });
    } else {
        console.error('Close span with class "close-soma-modal" not found.');
    }

    // Set up close button (Cerrar)
    if (closeButton) {
        closeButton.removeEventListener('click', closeSomaModal);
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSomaModal();
        });
    } else {
        console.error('Close button with class "closesomaModal" not found.');
    }

    // Close modal on click outside content
    modalsoma?.addEventListener('click', (e) => {
        if (e.target === modalsoma) {
            closeSomaModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalsoma?.style.display === 'flex') {
            closeSomaModal();
        }
    });


    //-----------------------------------------------// 



    // Debugging: Log DOM state
    console.log('DOM loaded:', new Date().toISOString(), {
        modalsoma: !!modalsoma,
        somatotipoContainer: !!document.getElementById('somatotipo-container')
    });

    // Manual trigger for dynamic content
    window.populateSomaForm = function () {
        console.log('Manual trigger for populateFields:', new Date().toISOString());
        retryCountPopulate = 0;
        populateFields();
    };
});
document.addEventListener('DOMContentLoaded', () => {
    const deporteInput = document.getElementById('deporteInput');
    const modalidadInput = document.getElementById('modalidadInput');
    const nombreInput = document.getElementById('nombreInput');
    const somatotipoEndo = document.getElementById('somatotipoEndo');
    const somatotipoMeso = document.getElementById('somatotipoMeso');
    const somatotipoEcto = document.getElementById('somatotipoEcto');
    const somatotipoDominante = document.getElementById('somatotipoDominante');
    const somatotipoX = document.getElementById('somatotipoX');
    const somatotipoY = document.getElementById('somatotipoY');

    // Verificar quÃ© elementos no se encontraron
    const missingElements = [];
    if (!deporteInput) missingElements.push('deporteInput');
    if (!modalidadInput) missingElements.push('modalidadInput');
    if (!nombreInput) missingElements.push('nombreInput');
    if (!somatotipoEndo) missingElements.push('somatotipoEndo');
    if (!somatotipoMeso) missingElements.push('somatotipoMeso');
    if (!somatotipoEcto) missingElements.push('somatotipoEcto');
    if (!somatotipoDominante) missingElements.push('somatotipoDominante');
    if (!somatotipoX) missingElements.push('somatotipoX');
    if (!somatotipoY) missingElements.push('somatotipoY');

    if (missingElements.length > 0) {
        console.error(`Los siguientes elementos no se encontraron en el DOM: ${missingElements.join(', ')}`);
        return;
    }

    // Lista de modalidades deportivas
    const deportesModalidades = [
        "Aerobic",
        "Atletismo: 100m lisos",
        "Atletismo: 1500m",
        "Atletismo: 400m vallas",
        "Atletismo: Altura",
        "Atletismo: Fondo",
        "Atletismo: Lanz. Jabalina",
        "Atletismo: Lanzamientos",
        "Atletismo: Marcha",
        "Atletismo: Marcha 20km",
        "Atletismo: MaratÃ³n",
        "Atletismo: PÃ©rtiga",
        "Atletismo: Salto de altura",
        "Ba	dminton",
        "BÃ¡dminton: Dobles",
        "Baloncesto",
        "Baloncesto: Aleros",
        "Balonmano",
        "BÃ©isbol: Lanzadores",
        "Billar",
        "Bolos",
        "Boxeo: Peso pesado",
        "Boxeo: <56kg",
        "Boxeo: <64kg",
        "Boxeo: <75kg",
        "Boxeo: <91kg",
        "Ciclismo: BMX",
        "Ciclismo: Carretera",
        "Ciclismo: MontaÃ±a",
        "Ciclismo: Pista - Velocidad",
        "Ciclismo: Ruta",
        "CrossFit",
        "Curling",
        "Danza ClÃ¡sica",
        "Escalada Deportiva",
        "Esgrima",
        "EsquÃ­ Alpino",
        "Frontenis",
        "FÃºtbol: Campo",
        "FÃºtbol: Porteros",
        "FÃºtbol: <18",
        "FÃºtbol: >18",
        "Gimnasia ArtÃ­stica",
        "Gimnasia ArtÃ­stica: Masculina",
        "Gimnasia RÃ­tmica",
        "Gimnasia TrampolÃ­n",
        "Golf",
        "Halterofilia",
        "HÃ­pica: Salto",
        "Hockey Hierba",
        "Judo: -90 kg",
        "Judo: <58kg",
        "Judo: >80kg",
        "Judo: 58-72kg",
        "Judo: 72-80kg",
        "Karate: Kumite",
        "Lanzamiento de Peso",
        "Lucha: Grecorromana",
        "Lucha: <58kg",
        "Lucha: >80kg",
        "Lucha: 58-72kg",
        "Lucha: 72-80kg",
        "NataciÃ³n: 1500m Libre",
        "NataciÃ³n: Carreras <16",
        "NataciÃ³n: Carreras >16",
        "NataciÃ³n: Sincronizada",
        "PÃ¡del",
        "Parkour",
        "Patinaje ArtÃ­stico",
        "Patinaje: Velocidad",
        "Pesca Deportiva",
        "Petanca",
        "Pilates",
        "PiragÃ¼ismo: Aguas Tranquilas",
        "PiragÃ¼ismo: Slalom",
        "Polo AcuÃ¡tico",
        "Waterpolo: Arco Abs",
        "Waterpolo: Arco Jr",
        "Waterpolo: Fuerza Abs",
        "Waterpolo: Fuerza Jr",
        "Waterpolo: Porteros Abs",
        "Waterpolo: Porteros Jr",
        "Remo: Ligeros",
        "Remo: Pesados",
        "Remo: Skiff",
        "Rugby: Delanteros",
        "Senderismo: Alta MontaÃ±a",
        "Squash",
        "Surf: CompeticiÃ³n",
        "Taekwondo",
        "Taekwondo: <49kg",
        "Taekwondo: <57kg",
        "Taekwondo: <58kg",
        "Taekwondo: <67kg",
        "Taekwondo: <68kg",
        "Taekwondo: <80kg",
        "Taekwondo: >67kg",
        "Taekwondo: >80kg",
        "Tai Chi",
        "Tenis",
        "Tenis: <16",
        "Tenis: >16",
        "Tenis de Mesa",
        "Tiro con Arco",
        "TriatlÃ³n",
        "TriatlÃ³n: Larga Distancia",
        "Vela: Laser",
        "Voleibol",
        "Voleibol: Centrales",
        "Yoga: Hatha"
    ];
    // Tabla de datos de somatotipos
    const somatotipoData = [
        { deporte: "aerobic", sexo: "H", endo: 3, meso: 3.2, ecto: 4, dominante: "Ecto", x: 1, y: -0.6, endo_f: 3.2, meso_f: 2.6, ecto_f: 4.3, x_f: 1.1, y_f: -2.3 },
        { deporte: "atletismo_100m_lisos", sexo: "H", endo: 2.2, meso: 5.8, ecto: 3.8, dominante: "Meso", x: 1.6, y: 5.6, endo_f: 2.5, meso_f: 5, ecto_f: 4, x_f: 1.5, y_f: 3.5 },
        { deporte: "atletismo_1500m", sexo: "H", endo: 1.9, meso: 3.5, ecto: 5.8, dominante: "Ecto", x: 3.9, y: -0.7, endo_f: 2.1, meso_f: 2.9, ecto_f: 6, x_f: 3.9, y_f: -2.3 },
        { deporte: "atletismo_400m_vallas", sexo: "H", endo: 2.3, meso: 4.4, ecto: 4.5, dominante: "Ecto", x: 2.2, y: 2, endo_f: 2.6, meso_f: 3.8, ecto_f: 4.8, x_f: 2.2, y_f: 0.2 },
        { deporte: "atletismo_altura", sexo: "H", endo: 1.6, meso: 3.5, ecto: 0.9, dominante: "", x: 2.6, y: 0.8, endo_f: 2.5, meso_f: 2, ecto_f: 4.4, x_f: -2.4, y_f: -1.9 },
        { deporte: "atletismo_fondo", sexo: "H", endo: 1.7, meso: 3.6, ecto: 3.6, dominante: "", x: 0, y: -3.8, endo_f: 2.4, meso_f: 2.4, ecto_f: 3.9, x_f: -1.5, y_f: -1.5 },
        { deporte: "atletismo_lanz_jabalina", sexo: "H", endo: 2.5, meso: 5, ecto: 3.8, dominante: "Meso", x: 1.3, y: 3.7, endo_f: 2.8, meso_f: 4.3, ecto_f: 3.5, x_f: 0.7, y_f: 2.3 },
        { deporte: "atletismo_lanzamientos", sexo: "H", endo: 3.6, meso: 6.1, ecto: 1.1, dominante: "", x: 5, y: -3.6, endo_f: 4.3, meso_f: 4.1, ecto_f: 1.6, x_f: 2.5, y_f: 2.9 },
        { deporte: "atletismo_marcha", sexo: "H", endo: 1.7, meso: 3.9, ecto: 3.5, dominante: "", x: 0.4, y: -1.5, endo_f: 3.2, meso_f: 2.6, ecto_f: 3.3, x_f: -0.7, y_f: 0.1 },
        { deporte: "atletismo_marcha_20km", sexo: "H", endo: 2, meso: 3, ecto: 5.5, dominante: "Ecto", x: 3.5, y: -1.5, endo_f: 2.2, meso_f: 2.4, ecto_f: 5.8, x_f: 3.6, y_f: -3.2 },
        { deporte: "atletismo_maratÃ³n", sexo: "H", endo: 1.8, meso: 2.9, ecto: 6, dominante: "Ecto", x: 4.2, y: -2, endo_f: 2, meso_f: 2.3, ecto_f: 6.2, x_f: 4.2, y_f: -3.6 },
        { deporte: "atletismo_pÃ©rtiga", sexo: "H", endo: 1.6, meso: 4.7, ecto: 3, dominante: "", x: 1.7, y: -1.5, endo_f: 2.9, meso_f: 3.1, ecto_f: 3.2, x_f: -0.1, y_f: 0.5 },
        { deporte: "atletismo_salto_de_altura", sexo: "H", endo: 2, meso: 4.2, ecto: 4.8, dominante: "Ecto", x: 2.8, y: 1.6, endo_f: 2.2, meso_f: 3.6, ecto_f: 5.2, x_f: 3, y_f: -0.2 },
        { deporte: "atletismo_vel_vallas", sexo: "H", endo: 1.7, meso: 4.8, ecto: 0.9, dominante: "", x: 3.9, y: 0.9, endo_f: 2.6, meso_f: 3.1, ecto_f: 3, x_f: 0.1, y_f: 1.1 },
        { deporte: "badminton", sexo: "H", endo: 2.5, meso: 3.5, ecto: 4.5, dominante: "Ecto", x: 2, y: 0, endo_f: 2.8, meso_f: 2.9, ecto_f: 4.8, x_f: 2, y_f: -1.8 },
        { deporte: "bÃ¡dminton_dobles", sexo: "H", endo: 3, meso: 3.5, ecto: 4.2, dominante: "Ecto", x: 1.2, y: -0.2, endo_f: 3.3, meso_f: 2.9, ecto_f: 4.5, x_f: 1.2, y_f: -2 },
        { deporte: "baloncesto", sexo: "H", endo: 2.5, meso: 3.5, ecto: 3.6, dominante: "", x: -0.1, y: 1, endo_f: 4, meso_f: 2.7, ecto_f: 2.9, x_f: -0.2, y_f: -1.5 },
        { deporte: "baloncesto_aleros", sexo: "H", endo: 2.5, meso: 4.3, ecto: 4.6, dominante: "Ecto", x: 2.1, y: 1.5, endo_f: 2.8, meso_f: 3.7, ecto_f: 4.9, x_f: 2.1, y_f: -0.3 },
        { deporte: "balonmano", sexo: "H", endo: 3, meso: 5.3, ecto: 3.2, dominante: "Meso", x: 0.2, y: 4.4, endo_f: 3.5, meso_f: 4.7, ecto_f: 3, x_f: -0.5, y_f: 2.9 },
        { deporte: "balonmano", sexo: "H", endo: 2.8, meso: 4.9, ecto: 2.2, dominante: "", x: 2.7, y: -0.6, endo_f: 3.8, meso_f: 3.5, ecto_f: 2.4, x_f: 1.1, y_f: 0.9 },
        { deporte: "bÃ©isbol_lanzadores", sexo: "H", endo: 3, meso: 4.8, ecto: 3.5, dominante: "Meso", x: 0.5, y: 3.1, endo_f: 3.4, meso_f: 4.2, ecto_f: 3.2, x_f: -0.2, y_f: 1.8 },
        { deporte: "billar", sexo: "H", endo: 4.2, meso: 2.3, ecto: 3, dominante: "Endo", x: -1.2, y: -2.6, endo_f: 4.5, meso_f: 1.8, ecto_f: 2.7, x_f: -1.8, y_f: -3.6 },
        { deporte: "bolos", sexo: "H", endo: 4.5, meso: 2.5, ecto: 3, dominante: "Endo", x: -1.5, y: -2.5, endo_f: 4.8, meso_f: 2, ecto_f: 2.8, x_f: -2, y_f: -3.6 },
        { deporte: "boxeo_menos_56kg", sexo: "H", endo: 2.2, meso: 4.5, ecto: 2.7, dominante: "", x: 1.8, y: 0.5, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "boxeo_menos_64kg", sexo: "H", endo: 2.2, meso: 4.9, ecto: 2.7, dominante: "", x: 2.2, y: 0.5, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "boxeo_menos_75kg", sexo: "H", endo: 2.1, meso: 4.7, ecto: 2.8, dominante: "", x: 1.9, y: 0.6, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "boxeo_menos_91kg", sexo: "H", endo: 3.2, meso: 5.7, ecto: 1.4, dominante: "", x: 4.3, y: -1.8, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "boxeo_peso_pesado", sexo: "H", endo: 3.8, meso: 5.5, ecto: 2.5, dominante: "Meso", x: -1.3, y: 4.7, endo_f: 4.2, meso_f: 4.8, ecto_f: 2.2, x_f: -2, y_f: 3.2 },
        { deporte: "ciclismo_bmx", sexo: "H", endo: 2.8, meso: 4.5, ecto: 3.8, dominante: "Meso", x: 1, y: 2.4, endo_f: 3, meso_f: 3.9, ecto_f: 3.6, x_f: 0.6, y_f: 1.2 },
        { deporte: "ciclismo_carretera", sexo: "H", endo: 1.8, meso: 4.1, ecto: 3.2, dominante: "", x: 0.9, y: -2.7, endo_f: 3.3, meso_f: 3.1, ecto_f: 2.6, x_f: 0.5, y_f: 0.4 },
        { deporte: "ciclismo_montaÃ±a", sexo: "H", endo: 2, meso: 4.7, ecto: 2.8, dominante: "", x: 1.9, y: -2.5, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "ciclismo_pista_velocidad", sexo: "H", endo: 2.5, meso: 4.9, ecto: 4, dominante: "Meso", x: 1.5, y: 3.3, endo_f: 2.8, meso_f: 4.3, ecto_f: 4.2, x_f: 1.4, y_f: 1.6 },
        { deporte: "ciclismo_ruta", sexo: "H", endo: 2.2, meso: 3.2, ecto: 5.6, dominante: "Ecto", x: 3.4, y: -1.4, endo_f: 2.4, meso_f: 2.6, ecto_f: 5.8, x_f: 3.4, y_f: -3 },
        { deporte: "crossfit", sexo: "H", endo: 2.8, meso: 6.3, ecto: 2.5, dominante: "Meso", x: -0.3, y: 7.3, endo_f: 3.2, meso_f: 5.6, ecto_f: 2.3, x_f: -0.9, y_f: 5.7 },
        { deporte: "curling", sexo: "H", endo: 4, meso: 3.5, ecto: 2.8, dominante: "Endo", x: -1.2, y: 0.2, endo_f: 4.3, meso_f: 2.9, ecto_f: 2.5, x_f: -1.8, y_f: -1 },
        { deporte: "danza_clÃ¡sica", sexo: "H", endo: 2.5, meso: 3, ecto: 5, dominante: "Ecto", x: 2.5, y: -1.5, endo_f: 2.2, meso_f: 2.5, ecto_f: 5.5, x_f: 3.3, y_f: -2.7 },
        { deporte: "escalada_deportiva", sexo: "H", endo: 2.3, meso: 4, ecto: 4.5, dominante: "Ecto", x: 2.2, y: 1.2, endo_f: 2.5, meso_f: 3.4, ecto_f: 4.8, x_f: 2.3, y_f: -0.5 },
        { deporte: "esgrima", sexo: "H", endo: 2.5, meso: 3.8, ecto: 4.7, dominante: "Ecto", x: 2.2, y: 0.4, endo_f: 2.8, meso_f: 3.2, ecto_f: 5, x_f: 2.2, y_f: -1.4 },
        { deporte: "esgrima", sexo: "H", endo: 2.5, meso: 4.2, ecto: 3.2, dominante: "", x: 1, y: -2.4, endo_f: 3.4, meso_f: 2.5, ecto_f: 3.3, x_f: -0.8, y_f: -1.7 },
        { deporte: "esquÃ­_alpino", sexo: "H", endo: 3, meso: 4.5, ecto: 3.5, dominante: "Meso", x: 0.5, y: 2.5, endo_f: 3.4, meso_f: 3.9, ecto_f: 3.2, x_f: -0.2, y_f: 1.2 },
        { deporte: "esquÃ­_alpino", sexo: "H", endo: 2.2, meso: 4.7, ecto: 2.7, dominante: "", x: 2, y: 0.6, endo_f: 3.6, meso_f: 3.3, ecto_f: 2.4, x_f: 0.9, y_f: -1.2 },
        { deporte: "frontenis", sexo: "H", endo: 3, meso: 4, ecto: 3.8, dominante: "Meso", x: 0.8, y: 1.2, endo_f: 3.3, meso_f: 3.4, ecto_f: 3.6, x_f: 0.3, y_f: -0.1 },
        { deporte: "fÃºtbol_campo", sexo: "H", endo: 2.7, meso: 4.5, ecto: 4, dominante: "Meso", x: 1.3, y: 2.3, endo_f: 3, meso_f: 3.9, ecto_f: 4.2, x_f: 1.2, y_f: 0.6 },
        { deporte: "fÃºtbol_mÃ¡s_18", sexo: "H", endo: 2.4, meso: 3.9, ecto: 3.2, dominante: "", x: 0.7, y: 0.9, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "fÃºtbol_menos_18", sexo: "H", endo: 2.3, meso: 4.4, ecto: 2.8, dominante: "", x: 1.6, y: 0.6, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "fÃºtbol_porteros", sexo: "H", endo: 3.2, meso: 5, ecto: 3.3, dominante: "Meso", x: 0.1, y: 3.5, endo_f: 3.7, meso_f: 4.4, ecto_f: 3.1, x_f: -0.6, y_f: 2 },
        { deporte: "gimnasia_artÃ­stica", sexo: "H", endo: 1.6, meso: 5.4, ecto: 2.7, dominante: "", x: 2.7, y: -5.1, endo_f: 2.2, meso_f: 3.8, ecto_f: 3.1, x_f: 0.7, y_f: 2.4 },
        { deporte: "gimnasia_artÃ­stica_masculina", sexo: "H", endo: 2, meso: 6, ecto: 3.5, dominante: "Meso", x: 1.5, y: 6.5, endo_f: 2.2, meso_f: 5, ecto_f: 4, x_f: 1.8, y_f: 3.8 },
        { deporte: "gimnasia_rÃ­tmica", sexo: "M", endo: 2.2, meso: 3.8, ecto: 5, dominante: "Ecto", x: 2.8, y: 0.4, endo_f: 2, meso_f: 3, ecto_f: 5.5, x_f: 3.5, y_f: -1.5 },
        { deporte: "gimnasia_rÃ­tmica", sexo: "M", endo: 1.9, meso: 2.2, ecto: 5.1, dominante: "", x: -2.9, y: -2.4, endo_f: 1.9, meso_f: 2.2, ecto_f: 5.1, x_f: -2.9, y_f: -2.4 },
        { deporte: "gimnasia_trampolÃ­n", sexo: "H", endo: 1.8, meso: 4.6, ecto: 3.2, dominante: "", x: 1.4, y: 4.2, endo_f: 3.1, meso_f: 3.1, ecto_f: 3.1, x_f: 0, y_f: 0 },
        { deporte: "golf", sexo: "H", endo: 4, meso: 3, ecto: 3.5, dominante: "Endo", x: -0.5, y: -1.5, endo_f: 4.5, meso_f: 2.5, ecto_f: 3, x_f: -1.5, y_f: -2.5 },
        { deporte: "golf", sexo: "H", endo: 2.7, meso: 4.2, ecto: 3.1, dominante: "", x: 1.1, y: 0.5, endo_f: 4.4, meso_f: 2.7, ecto_f: 2.8, x_f: -0.1, y_f: -1.9 },
        { deporte: "halterofilia", sexo: "H", endo: 2.5, meso: 7.5, ecto: 1.5, dominante: "Meso", x: -1, y: 11, endo_f: 3, meso_f: 6.8, ecto_f: 1.2, x_f: -1.8, y_f: 9.4 },
        { deporte: "halterofilia", sexo: "H", endo: 3.2, meso: 6, ecto: 1.5, dominante: "", x: 4.5, y: -1.7, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "hÃ­pica_salto", sexo: "H", endo: 3, meso: 3.5, ecto: 4, dominante: "Ecto", x: 1, y: 0, endo_f: 3.3, meso_f: 2.9, ecto_f: 4.3, x_f: 1, y_f: -1.8 },
        { deporte: "hockey_hierba", sexo: "H", endo: 2.7, meso: 4.5, ecto: 3.9, dominante: "Meso", x: 1.2, y: 2.4, endo_f: 3, meso_f: 3.9, ecto_f: 4.1, x_f: 1.1, y_f: 0.7 },
        { deporte: "hockey_hierba", sexo: "H", endo: 2.3, meso: 4.7, ecto: 2.6, dominante: "", x: 2.1, y: 0.3, endo_f: 3.6, meso_f: 3.1, ecto_f: 2.6, x_f: 0.5, y_f: -0.1 },
        { deporte: "judo_58_72kg", sexo: "H", endo: 1.9, meso: 5.5, ecto: 2.2, dominante: "", x: 3.3, y: 0.3, endo_f: 2.9, meso_f: 3.5, ecto_f: 2.4, x_f: 1.1, y_f: -0.4 },
        { deporte: "judo_58_72kg", sexo: "M", endo: 3.6, meso: 4.3, ecto: 1.8, dominante: "", x: 2.5, y: -1.8, endo_f: 3.6, meso_f: 4.3, ecto_f: 1.8, x_f: 2.5, y_f: -1.8 },
        { deporte: "judo_72_80kg", sexo: "H", endo: 2.3, meso: 5.8, ecto: 2, dominante: "", x: 3.8, y: -0.3, endo_f: 3.6, meso_f: 4.3, ecto_f: 1.8, x_f: 2.5, y_f: -1.8 },
        { deporte: "judo_72_80kg", sexo: "M", endo: 3.8, meso: 4.6, ecto: 1.3, dominante: "", x: 3.3, y: -2.5, endo_f: 3.8, meso_f: 4.6, ecto_f: 1.3, x_f: 3.3, y_f: -2.5 },
        { deporte: "judo_menos_58kg", sexo: "M", endo: 2.9, meso: 3.5, ecto: 2.4, dominante: "", x: 1.1, y: -0.4, endo_f: 2.9, meso_f: 3.5, ecto_f: 2.4, x_f: 1.1, y_f: -0.4 },
        { deporte: "judo_menos_90_kg", sexo: "H", endo: 3, meso: 4.6, ecto: 3.4, dominante: "Meso", x: 0.4, y: 2.8, endo_f: 3.5, meso_f: 4, ecto_f: 3.2, x_f: -0.3, y_f: 1.3 },
        { deporte: "judo_mÃ¡s_80kg", sexo: "H", endo: 3.3, meso: 7.3, ecto: 0.8, dominante: "", x: 6.5, y: -2.4, endo_f: 3.8, meso_f: 4.6, ecto_f: 1.3, x_f: 3.3, y_f: -2.5 },
        { deporte: "kÃ¡rate_kumite", sexo: "H", endo: 2.7, meso: 4.2, ecto: 4, dominante: "Meso", x: 1.3, y: 1.7, endo_f: 3, meso_f: 3.6, ecto_f: 4.2, x_f: 1.2, y_f: 0 },
        { deporte: "lanzamiento_de_peso", sexo: "H", endo: 3, meso: 7, ecto: 1.8, dominante: "Meso", x: -1.2, y: 9.2, endo_f: 3.5, meso_f: 6.3, ecto_f: 1.5, x_f: -2, y_f: 7.6 },
        { deporte: "lucha_58_72kg", sexo: "H", endo: 2.1, meso: 5.2, ecto: 2.3, dominante: "", x: 2.9, y: 0.1, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "lucha_72_80kg", sexo: "H", endo: 2.5, meso: 5.5, ecto: 1.8, dominante: "", x: 3.7, y: -0.7, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "lucha_grecorromana", sexo: "H", endo: 3.2, meso: 6.2, ecto: 2.2, dominante: "Meso", x: -1, y: 7, endo_f: 3.7, meso_f: 5.5, ecto_f: 2, x_f: -1.7, y_f: 5.3 },
        { deporte: "lucha_menos_58kg", sexo: "H", endo: 1.8, meso: 4.4, ecto: 3.1, dominante: "", x: 1.3, y: 1.3, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "lucha_mÃ¡s_80kg", sexo: "H", endo: 3.2, meso: 6.6, ecto: 1, dominante: "", x: 5.6, y: -2.2, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "nataciÃ³n_1500m_libre", sexo: "H", endo: 2.5, meso: 3, ecto: 5.2, dominante: "Ecto", x: 2.7, y: -1.7, endo_f: 2.7, meso_f: 2.4, ecto_f: 5.4, x_f: 2.7, y_f: -3.3 },
        { deporte: "nataciÃ³n_carreras_menos_16", sexo: "H", endo: 2.2, meso: 4.3, ecto: 3.2, dominante: "", x: 1.1, y: 1, endo_f: 3, meso_f: 2.9, ecto_f: 3.3, x_f: -0.4, y_f: 0.3 },
        { deporte: "nataciÃ³n_carreras_mÃ¡s_16", sexo: "H", endo: 1.9, meso: 4.6, ecto: 3, dominante: "", x: 1.6, y: 1.1, endo_f: 3, meso_f: 3.1, ecto_f: 3, x_f: 0.1, y_f: -0.1 },
        { deporte: "nataciÃ³n_sincronizada", sexo: "M", endo: 3, meso: 3.5, ecto: 4.2, dominante: "Ecto", x: 1.2, y: -0.2, endo_f: 2.8, meso_f: 3, ecto_f: 4.5, x_f: 1.7, y_f: -1.3 },
        { deporte: "nataciÃ³n_sincronizada", sexo: "M", endo: 3.3, meso: 2.6, ecto: 3.2, dominante: "", x: -0.6, y: -0.1, endo_f: 3.3, meso_f: 2.6, ecto_f: 3.2, x_f: -0.6, y_f: -0.1 },
        { deporte: "pÃ¡del", sexo: "H", endo: 3, meso: 3.8, ecto: 4, dominante: "Ecto", x: 1, y: 0.6, endo_f: 3.3, meso_f: 3.2, ecto_f: 4.2, x_f: 0.9, y_f: -1.1 },
        { deporte: "parkour", sexo: "H", endo: 2.5, meso: 4.3, ecto: 4.2, dominante: "Meso", x: 1.7, y: 1.9, endo_f: 2.8, meso_f: 3.7, ecto_f: 4.4, x_f: 1.6, y_f: 0.2 },
        { deporte: "patinaje_artÃ­stico", sexo: "H", endo: 2.2, meso: 4.3, ecto: 3.1, dominante: "", x: 1.2, y: 0.9, endo_f: 3, meso_f: 2.9, ecto_f: 3, x_f: -0.1, y_f: -0.3 },
        { deporte: "patinaje_velocidad", sexo: "H", endo: 1.9, meso: 4.1, ecto: 3.3, dominante: "", x: 0.8, y: 3, endo_f: 3.7, meso_f: 3.5, ecto_f: 2.3, x_f: 1.2, y_f: 1 },
        { deporte: "patinaje_velocidad", sexo: "H", endo: 2.1, meso: 5.3, ecto: 2, dominante: "", x: 3.3, y: -0.2, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "pentatlÃ³n", sexo: "H", endo: 2.1, meso: 4.4, ecto: 3.2, dominante: "", x: 1.2, y: -3.4, endo_f: 3.4, meso_f: 2.9, ecto_f: 3.1, x_f: -0.2, y_f: -0.7 },
        { deporte: "pesca_deportiva", sexo: "H", endo: 4.2, meso: 3, ecto: 2.8, dominante: "Endo", x: -1.4, y: -1, endo_f: 4.5, meso_f: 2.5, ecto_f: 2.5, x_f: -2, y_f: -2 },
        { deporte: "petanca", sexo: "H", endo: 5, meso: 2, ecto: 2.5, dominante: "Endo", x: -2.5, y: -3.5, endo_f: 5.3, meso_f: 1.5, ecto_f: 2.2, x_f: -3.1, y_f: -4.5 },
        { deporte: "pilates", sexo: "H", endo: 3.2, meso: 3, ecto: 4, dominante: "Ecto", x: 0.8, y: -1.2, endo_f: 3.5, meso_f: 2.4, ecto_f: 4.2, x_f: 0.7, y_f: -2.9 },
        { deporte: "piragÃ¼ismo_aguas_tranquilas", sexo: "H", endo: 3, meso: 5.4, ecto: 3, dominante: "Meso", x: 0, y: 4.8, endo_f: 3.4, meso_f: 4.8, ecto_f: 2.8, x_f: -0.6, y_f: 3.4 },
        { deporte: "piragÃ¼ismo_aguas_tranquilas", sexo: "H", endo: 1.9, meso: 4.3, ecto: 3, dominante: "", x: 1.3, y: 1.1, endo_f: 3.1, meso_f: 3.3, ecto_f: 2.4, x_f: 0.9, y_f: -0.7 },
        { deporte: "piragÃ¼ismo_slalom", sexo: "H", endo: 1.9, meso: 5, ecto: 2.8, dominante: "", x: 2.2, y: 0.9, endo_f: 3.3, meso_f: 3.3, ecto_f: 2.7, x_f: 0.6, y_f: 0.6 },
        { deporte: "remo_ligeros", sexo: "H", endo: 1.8, meso: 4.2, ecto: 3, dominante: "", x: 1.2, y: 1.2, endo_f: 2.8, meso_f: 2, ecto_f: 2.6, x_f: -0.6, y_f: -0.2 },
        { deporte: "remo_pesados", sexo: "H", endo: 2.3, meso: 4.8, ecto: 2.5, dominante: "", x: 2.3, y: 0.2, endo_f: 4.4, meso_f: 3.6, ecto_f: 2, x_f: 1.6, y_f: -2.4 },
        { deporte: "remo_skiff", sexo: "H", endo: 2.8, meso: 5, ecto: 3.5, dominante: "Meso", x: 0.7, y: 3.7, endo_f: 3.2, meso_f: 4.3, ecto_f: 3, x_f: -0.2, y_f: 2.4 },
        { deporte: "rugby_delanteros", sexo: "H", endo: 3.5, meso: 6.5, ecto: 2, dominante: "Meso", x: -1.5, y: 7.5, endo_f: 4, meso_f: 5.8, ecto_f: 1.8, x_f: -2.2, y_f: 5.8 },
        { deporte: "senderismo_alta_montaÃ±a", sexo: "H", endo: 2.8, meso: 3.2, ecto: 4.5, dominante: "Ecto", x: 1.7, y: -0.9, endo_f: 3, meso_f: 2.6, ecto_f: 4.8, x_f: 1.8, y_f: -2.6 },
        { deporte: "squash", sexo: "H", endo: 2.7, meso: 4, ecto: 4.3, dominante: "Ecto", x: 1.6, y: 1, endo_f: 3, meso_f: 3.4, ecto_f: 4.6, x_f: 1.6, y_f: -0.8 },
        { deporte: "surf_competiciÃ³n", sexo: "H", endo: 2.8, meso: 4, ecto: 4.2, dominante: "Ecto", x: 1.4, y: 1, endo_f: 3, meso_f: 3.4, ecto_f: 4.5, x_f: 1.5, y_f: -0.7 },
        { deporte: "taekwondo", sexo: "H", endo: 2.8, meso: 4.3, ecto: 3.8, dominante: "Meso", x: 1, y: 2, endo_f: 3, meso_f: 3.7, ecto_f: 4, x_f: 1, y_f: 0.4 },
        { deporte: "taekwondo_menos_49kg", sexo: "M", endo: 2.5, meso: 2.6, ecto: 3.5, dominante: "", x: -0.9, y: 1, endo_f: 2.5, meso_f: 2.6, ecto_f: 3.5, x_f: -0.9, y_f: 1 },
        { deporte: "taekwondo_menos_57kg", sexo: "M", endo: 3, meso: 3, ecto: 3.2, dominante: "", x: -0.2, y: 0.2, endo_f: 3, meso_f: 3, ecto_f: 3.2, x_f: -0.2, y_f: 0.2 },
        { deporte: "taekwondo_menos_58kg", sexo: "H", endo: 1.7, meso: 3.9, ecto: 3.6, dominante: "", x: 0.3, y: 1.9, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "taekwondo_menos_67kg", sexo: "M", endo: 3.2, meso: 3.4, ecto: 2.7, dominante: "", x: 0.7, y: -0.5, endo_f: 3.2, meso_f: 3.4, ecto_f: 2.7, x_f: 0.7, y_f: -0.5 },
        { deporte: "taekwondo_menos_68kg", sexo: "H", endo: 1.8, meso: 4.3, ecto: 3.3, dominante: "", x: 1, y: 1.5, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "taekwondo_menos_80kg", sexo: "H", endo: 2.2, meso: 4.5, ecto: 2.9, dominante: "", x: 1.6, y: 0.6, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "taekwondo_mÃ¡s_67kg", sexo: "M", endo: 3.6, meso: 3.8, ecto: 2.2, dominante: "", x: 1.6, y: -1.4, endo_f: 3.6, meso_f: 3.8, ecto_f: 2.2, x_f: 1.6, y_f: -1.4 },
        { deporte: "taekwondo_mÃ¡s_80kg", sexo: "H", endo: 3, meso: 5.5, ecto: 1.9, dominante: "", x: 3.6, y: -1.1, endo_f: 0, meso_f: 0, ecto_f: 0, x_f: 0, y_f: 0 },
        { deporte: "tai_chi", sexo: "H", endo: 3.8, meso: 2.5, ecto: 3.5, dominante: "Endo", x: -0.3, y: -2.3, endo_f: 4, meso_f: 2, ecto_f: 3.2, x_f: -0.8, y_f: -3.2 },
        { deporte: "tenis", sexo: "H", endo: 2.8, meso: 4.8, ecto: 3.8, dominante: "Meso", x: 1, y: 3, endo_f: 3, meso_f: 4.2, ecto_f: 4, x_f: 1, y_f: 1.4 },
        { deporte: "tenis_de_mesa", sexo: "H", endo: 2.9, meso: 3.9, ecto: 3.2, dominante: "", x: 0.7, y: 0.4, endo_f: 4.5, meso_f: 2.8, ecto_f: 2.8, x_f: 0, y_f: -1.7 },
        { deporte: "tenis_mÃ¡s_16", sexo: "H", endo: 2.2, meso: 4.3, ecto: 3, dominante: "", x: 1.3, y: 0.8, endo_f: 3.7, meso_f: 3.1, ecto_f: 2.5, x_f: 0.6, y_f: -1.1 },
        { deporte: "tenis_menos_16", sexo: "H", endo: 2.4, meso: 3.9, ecto: 3.5, dominante: "", x: 0.4, y: 1.1, endo_f: 3.7, meso_f: 3, ecto_f: 2.7, x_f: 0.3, y_f: -0.9 },
        { deporte: "tiro_con_arco", sexo: "H", endo: 3.5, meso: 3, ecto: 4, dominante: "Endo", x: 0.5, y: -1.5, endo_f: 3.8, meso_f: 2.4, ecto_f: 4.2, x_f: 0.4, y_f: -3.2 },
        { deporte: "triatlÃ³n", sexo: "H", endo: 1.7, meso: 4.6, ecto: 3.1, dominante: "", x: 1.5, y: -2.8, endo_f: 2.4, meso_f: 3.2, ecto_f: 3.4, x_f: -0.2, y_f: 1 },
        { deporte: "triatlÃ³n_larga_distancia", sexo: "H", endo: 2, meso: 3, ecto: 5.5, dominante: "Ecto", x: 3.5, y: -1.5, endo_f: 2.2, meso_f: 2.4, ecto_f: 5.7, x_f: 3.5, y_f: -3.1 },
        { deporte: "vela_laser", sexo: "H", endo: 3.2, meso: 3.8, ecto: 3.8, dominante: "Meso", x: 0.6, y: 0.6, endo_f: 3.5, meso_f: 3.2, ecto_f: 3.6, x_f: 0.1, y_f: -0.7 },
        { deporte: "voleibol", sexo: "H", endo: 2.2, meso: 3.9, ecto: 3.4, dominante: "", x: 0.5, y: 2.3, endo_f: 3.5, meso_f: 2.3, ecto_f: 3.4, x_f: -1.1, y_f: -2.2 },
        { deporte: "voleibol_centrales", sexo: "H", endo: 2.5, meso: 4.7, ecto: 4.3, dominante: "Meso", x: 1.8, y: 2.6, endo_f: 2.8, meso_f: 4, ecto_f: 4.5, x_f: 1.7, y_f: 0.7 },
        { deporte: "waterpolo", sexo: "H", endo: 3, meso: 4.5, ecto: 3.5, dominante: "Meso", x: 0.5, y: 2.5, endo_f: 3.5, meso_f: 3.9, ecto_f: 3.2, x_f: -0.3, y_f: 1.1 },
        { deporte: "waterpolo_arco_abs", sexo: "H", endo: 2.7, meso: 4.8, ecto: 2.4, dominante: "", x: 2.4, y: -0.3, endo_f: 3.9, meso_f: 3.2, ecto_f: 2.6, x_f: 0.6, y_f: -1.3 },
        { deporte: "waterpolo_arco_jr", sexo: "H", endo: 2.3, meso: 4.4, ecto: 2.9, dominante: "", x: 1.5, y: 0.7, endo_f: 4.1, meso_f: 3.4, ecto_f: 2.4, x_f: 1, y_f: -1.7 },
        { deporte: "waterpolo_fuerza_abs", sexo: "H", endo: 3.5, meso: 5.8, ecto: 1.9, dominante: "", x: 3.9, y: -1.6, endo_f: 4, meso_f: 3.2, ecto_f: 2.5, x_f: 0.7, y_f: -1.5 },
        { deporte: "waterpolo_fuerza_jr", sexo: "H", endo: 3.2, meso: 4.5, ecto: 2.7, dominante: "", x: 1.8, y: -0.6, endo_f: 4.6, meso_f: 3.3, ecto_f: 2.4, x_f: 0.9, y_f: -2.2 },
        { deporte: "waterpolo_porteros_abs", sexo: "H", endo: 3, meso: 4.3, ecto: 2.8, dominante: "", x: 1.5, y: -0.2, endo_f: 4, meso_f: 2.7, ecto_f: 2.7, x_f: 0, y_f: -1.3 },
        { deporte: "waterpolo_porteros_jr", sexo: "H", endo: 2.8, meso: 4, ecto: 3.5, dominante: "", x: 0.5, y: 0.7, endo_f: 4.7, meso_f: 2.6, ecto_f: 2.7, x_f: -0.1, y_f: -2 },
        { deporte: "yoga_hatha", sexo: "H", endo: 3.5, meso: 2.5, ecto: 4, dominante: "Endo", x: 0.5, y: -2.5, endo_f: 3.8, meso_f: 2, ecto_f: 4.2, x_f: 0.4, y_f: -4 }
    ];


    // FunciÃ³n para actualizar las opciones de modalidadInput
    function updateModalidadOptions() {
        const selectedGrupo = deporteInput.value;
        modalidadInput.innerHTML = '<option value="" disabled selected>Selecciona una modalidad</option>';

        if (selectedGrupo === 'Deportes') {
            deportesModalidades.forEach(modalidad => {
                const option = document.createElement('option');
                option.value = modalidad.toLowerCase().replace(/ /g, '_').replace(/:/g, '').replace(/[\(\)]/g, '').replace(/-/g, '_').replace(/>/g, 'mÃ¡s_').replace(/</g, 'menos_');
                option.textContent = modalidad;
                modalidadInput.appendChild(option);
            });
            modalidadInput.disabled = false;
        } else {
            const option = document.createElement('option');
            option.value = selectedGrupo.toLowerCase();
            option.textContent = selectedGrupo;
            modalidadInput.appendChild(option);
            modalidadInput.disabled = true;
        }
        updateSomatotipoValues();
    }

    // FunciÃ³n para actualizar los valores del somatotipo
    function updateSomatotipoValues() {
        const selectedModalidad = modalidadInput.value;
        const selectedSexo = nombreInput.value;

        // Limpiar los campos
        somatotipoEndo.value = '';
        somatotipoMeso.value = '';
        somatotipoEcto.value = '';
        somatotipoDominante.value = '';
        somatotipoX.value = '';
        somatotipoY.value = '';

        // Verificar que haya una modalidad y un gÃ©nero seleccionados
        if (!selectedModalidad || !selectedSexo) {
            console.debug('Falta seleccionar modalidad o gÃ©nero.');
            return;
        }

        // Evitar poblar campos para grupos genÃ©ricos
        if (['sedentarios', 'poblacionTipo', 'tomasCliente'].includes(selectedModalidad)) {
            console.debug(`Modalidad "${selectedModalidad}" no tiene datos de somatotipo.`);
            return;
        }

        // Buscar datos en somatotipoData
        const sexoKey = selectedSexo === 'masculino' ? 'H' : 'M';
        const data = somatotipoData.find(item => item.deporte === selectedModalidad && item.sexo === "H"); // Siempre busca H

        if (data) {
            // Asignar valores segÃºn el sexo seleccionado
            somatotipoEndo.value = sexoKey === 'H' ? data.endo : data.endo_f;
            somatotipoMeso.value = sexoKey === 'H' ? data.meso : data.meso_f;
            somatotipoEcto.value = sexoKey === 'H' ? data.ecto : data.ecto_f;
            somatotipoDominante.value = data.dominante || '';
            somatotipoX.value = sexoKey === 'H' ? data.x : data.x_f;
            somatotipoY.value = sexoKey === 'H' ? data.y : data.y_f;

            console.debug(`Somatotipo actualizado para ${selectedModalidad} (${selectedSexo}):`, data);
        } else {
            console.warn(`No se encontraron datos de somatotipo para ${selectedModalidad} (${sexoKey}).`);
        }

        setTimeout(() => {
            notif.classList.add("hidden");
        }, 3000);
    }

    // Cargar datos al abrir el modal
    function cargarDatos() {
        const savedData = localStorage.getItem("fichaMedica");
        if (!savedData) return;
        const data = JSON.parse(savedData);
        const form = document.getElementById("form-datos-paciente");
        for (const [name, value] of Object.entries(data)) {
            const field = form.querySelector(`[name="${name}"]`);
            if (field && field.type === "radio") {
                field.checked = (field.value === value);
            } else if (field && field.type === "checkbox") {
                field.checked = (value === "on");
            } else if (field) {
                field.value = value || "";
            }
        }
    }

    // Prevenir propagaciÃ³n en clics en "Datos Personales"
    function handleSectionTitleClick(event) {
        event.stopPropagation(); // Evita que el evento se propague a los padres
        // No se define acciÃ³n especÃ­fica; aÃ±adir aquÃ­ si se necesita (e.g., toggle)
    }


    // Efecto hoover Boton Guia Usuario
    const boton = document.getElementById('botonGuiaUsuario');

    // Hover ENTER
    boton.addEventListener('mouseenter', () => {
        boton.style.backgroundColor = '#2e7d32';
        boton.style.color = 'white';
        boton.style.borderRadius = '25px';
        boton.style.cursor = 'pointer';
        boton.style.justifyContent = 'center'; /* Centrado durante hover */
    });

    // Hover LEAVE
    boton.addEventListener('mouseleave', () => {
        boton.style.backgroundColor = 'transparent';
        boton.style.color = '#333';
        boton.style.borderRadius = '0';
        boton.style.cursor = 'default';
    });

    // Click
    boton.addEventListener('click', () => {
        window.location.href = 'https://fermagil.github.io/Nutri_Plan_v2/Explicacion_Cientifica.html';
    });
});
