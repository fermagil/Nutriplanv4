/**
 * Módulo de Modal Antropométrico - NutriPlan v2
 * Gestión de seguimiento corporal y análisis IA
 */

const AntropometricModal = (function() {
    // --- DATOS Y ESTADO PRIVADOS ---
    let photoRecords = [];
    let currentUploads = {
        frontal: null,
        profile: null
    };
    let currentSelectedDate = '';
    let currentImageIndex = 0;
    let currentImages = [];
    let compareMode = false;
    let selectedDates = [];
    let comparisonData = {
        date1: null,
        date2: null
    };
    let myChart = null;
    
    // --- REFERENCIAS A ELEMENTOS DOM ---
    let elements = {};
    
    // --- INICIALIZACIÓN ---
    function init() {
        // Cargar datos iniciales (en un caso real, esto vendría de una API)
        loadInitialData();
        
        // Configurar referencias a elementos DOM
        setupDOMReferences();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Renderizar componentes iniciales
        renderTimeline();
        renderMetricsTable();
        initCalendar();
        
        console.log('Modal Antropométrico inicializado');
    }
    
    function loadInitialData() {
        photoRecords = [
            {
                date: '2024-12-13',
                frontal: 'https://via.placeholder.com/300x400?text=Frontal+Hoy',
                profile: 'https://via.placeholder.com/300x400/2e7d32/fff?text=Perfil+Hoy',
                title: '13 Dic 2024',
                displayDate: '13 Dic',
                metrics: {
                    weight: '78.5',
                    fat: '15.2%',
                    muscle: '65.1',
                    imc: '24.2',
                    waist: '82.0',
                    folds: '45.0'
                },
                active: true
            },
            {
                date: '2024-11-15',
                frontal: 'https://via.placeholder.com/300x400/333/fff?text=Frontal+Nov',
                profile: 'https://via.placeholder.com/300x400/333/fff?text=Perfil+Nov',
                title: '15 Nov 2024',
                displayDate: '15 Nov',
                metrics: {
                    weight: '79.8',
                    fat: '16.5%',
                    muscle: '64.8',
                    imc: '24.6',
                    waist: '84.5',
                    folds: '49.2'
                },
                active: false
            },
            {
                date: '2024-10-01',
                frontal: 'https://via.placeholder.com/300x400/555/fff?text=Frontal+Inicio',
                profile: 'https://via.placeholder.com/300x400/555/fff?text=Perfil+Inicio',
                title: '01 Oct 2024',
                displayDate: '01 Oct',
                metrics: {
                    weight: '82.0',
                    fat: '18.0%',
                    muscle: '64.0',
                    imc: '25.3',
                    waist: '88.0',
                    folds: '55.1'
                },
                active: false
            }
        ];
        
        currentSelectedDate = '2024-12-13';
    }
    
    function setupDOMReferences() {
        elements = {
            modal: document.getElementById('aiModal'),
            imageModal: document.getElementById('imageModal'),
            uploadSubmit: document.getElementById('uploadSubmit'),
            uploadError: document.getElementById('uploadError'),
            compareBtn: document.getElementById('compareBtn'),
            compareCount: document.getElementById('compareCount'),
            compareModeIndicator: document.getElementById('compareModeIndicator'),
            comparisonView: document.getElementById('comparisonView'),
            normalView: document.getElementById('normalView'),
            frontalInput: document.getElementById('frontalInput'),
            profileInput: document.getElementById('profileInput'),
            photoTimeline: document.getElementById('photoTimeline'),
            metricsTableBody: document.getElementById('metricsTableBody'),
            aiFeedback: document.getElementById('aiFeedback'),
            calendarGrid: document.getElementById('calendarGrid'),
            currentMonth: document.getElementById('currentMonth')
        };
    }
    
    function setupEventListeners() {
        // Botón de comparación
        if (elements.compareBtn) {
            elements.compareBtn.addEventListener('click', toggleCompareMode);
        }
        
        // Botón cerrar modal
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // Upload buttons
        const frontalUploadBtn = document.getElementById('frontalUploadBtn');
        const profileUploadBtn = document.getElementById('profileUploadBtn');
        
        if (frontalUploadBtn) {
            frontalUploadBtn.addEventListener('click', () => elements.frontalInput.click());
        }
        if (profileUploadBtn) {
            profileUploadBtn.addEventListener('click', () => elements.profileInput.click());
        }
        
        // File inputs
        if (elements.frontalInput) {
            elements.frontalInput.addEventListener('change', (e) => handleFileSelect(e, 'frontal'));
        }
        if (elements.profileInput) {
            elements.profileInput.addEventListener('change', (e) => handleFileSelect(e, 'profile'));
        }
        
        // Submit upload
        if (elements.uploadSubmit) {
            elements.uploadSubmit.addEventListener('click', processUpload);
        }
        
        // Timeline controls
        const prevTimelineBtn = document.getElementById('prevTimelineBtn');
        const nextTimelineBtn = document.getElementById('nextTimelineBtn');
        
        if (prevTimelineBtn) prevTimelineBtn.addEventListener('click', () => scrollTimeline(-1));
        if (nextTimelineBtn) nextTimelineBtn.addEventListener('click', () => scrollTimeline(1));
        
        // Image modal controls
        const closeImageBtn = document.getElementById('closeImageBtn');
        const prevImageBtn = document.getElementById('prevImageBtn');
        const nextImageBtn = document.getElementById('nextImageBtn');
        
        if (closeImageBtn) closeImageBtn.addEventListener('click', closeImageModal);
        if (prevImageBtn) prevImageBtn.addEventListener('click', () => navigatePhoto(-1));
        if (nextImageBtn) nextImageBtn.addEventListener('click', () => navigatePhoto(1));
        
        // Comparison controls
        const closeComparisonBtn = document.getElementById('closeComparisonBtn');
        const shareComparisonBtn = document.getElementById('shareComparisonBtn');
        
        if (closeComparisonBtn) closeComparisonBtn.addEventListener('click', closeComparison);
        if (shareComparisonBtn) shareComparisonBtn.addEventListener('click', shareComparison);
        
        // Cerrar modal al hacer clic fuera
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) {
                    closeModal();
                }
            });
        }
        
        if (elements.imageModal) {
            elements.imageModal.addEventListener('click', (e) => {
                if (e.target === elements.imageModal) {
                    closeImageModal();
                }
            });
        }
        
        // Inicializar chart cuando se abra el modal
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && 
                    elements.modal.classList.contains('active')) {
                    setTimeout(initChart, 100);
                }
            });
        });
        
        if (elements.modal) {
            modalObserver.observe(elements.modal, { attributes: true });
        }
    }
    
    // --- FUNCIONES PÚBLICAS ---
    function openModal(event) {
    console.log('AntropometricModal.openModal llamado');
    
    // Prevenir cualquier comportamiento por defecto
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Obtener referencia al modal
    const modal = document.getElementById('aiModal');
    if (!modal) {
        console.error('ERROR: Elemento aiModal no encontrado');
        // Intentar cargar dinámicamente
        if (typeof loadModalHTML === 'function') {
            loadModalHTML().then(() => {
                // Re-configurar referencias después de cargar
                setupDOMReferences();
                setupEventListeners();
                const newModal = document.getElementById('aiModal');
                if (newModal) {
                    newModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    // Renderizar componentes
                    renderTimeline();
                    renderMetricsTable();
                    renderCalendar(currentCalendarMonth, currentCalendarYear);
                    setTimeout(initChart, 100);
                }
            });
        }
        return false;
    }
    
    // Re-configurar referencias por si el modal se cargó dinámicamente
    setupDOMReferences();
    
    // Mostrar el modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Re-configurar event listeners (importante cuando el modal se carga dinámicamente)
    setupEventListeners();
    
    // Renderizar componentes (por si no se habían renderizado antes)
    renderTimeline();
    renderMetricsTable();
    renderCalendar(currentCalendarMonth, currentCalendarYear);
    
    // Inicializar gráfico
    setTimeout(() => {
        initChart();
    }, 100);
    
    return false;
    }
    
    function closeModal() {
    const modal = document.getElementById('aiModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    resetUploads();
    
    // Salir del modo comparación si está activo
    if (compareMode) {
        toggleCompareMode();
    }
    
    // Cerrar vista de comparación si está abierta
    if (elements.comparisonView && elements.comparisonView.classList.contains('active')) {
        closeComparison();
    }
}
    
    // --- FUNCIONES PRIVADAS ---
    function openImageModal() {
        if (elements.imageModal) {
            elements.imageModal.classList.add('active');
        }
    }
    
    function closeImageModal() {
        if (elements.imageModal) {
            elements.imageModal.classList.remove('active');
        }
    }
    
    // --- MODO COMPARACIÓN ---
    function toggleCompareMode() {
        compareMode = !compareMode;
        
        if (elements.compareBtn) {
            if (compareMode) {
                elements.compareBtn.classList.add('active');
                elements.compareBtn.innerHTML = '<i class="fas fa-times"></i><span>Cancelar</span>';
                
                if (elements.compareModeIndicator) {
                    elements.compareModeIndicator.style.display = 'flex';
                }
                
                selectedDates = [];
                updateCompareCount();
            } else {
                elements.compareBtn.classList.remove('active');
                elements.compareBtn.innerHTML = '<i class="fas fa-exchange-alt"></i><span>Comparar Fechas</span>';
                
                if (elements.compareModeIndicator) {
                    elements.compareModeIndicator.style.display = 'none';
                }
                
                clearComparisonSelection();
                
                if (elements.comparisonView && elements.comparisonView.classList.contains('active')) {
                    closeComparison();
                }
            }
        }
    }
    
    function selectForComparison(date) {
        if (!compareMode) return;
        
        const index = selectedDates.indexOf(date);
        
        if (index === -1) {
            if (selectedDates.length < 2) {
                selectedDates.push(date);
                
                // Resaltar visualmente
                document.querySelectorAll(`.timeline-item[data-date="${date}"]`).forEach(item => {
                    item.classList.add('selected-for-compare');
                });
                
                document.querySelectorAll(`.cal-day[data-date="${date}"]`).forEach(day => {
                    day.classList.add('selected-for-compare');
                });
                
                updateCompareCount();
                
                if (selectedDates.length === 2) {
                    showComparison(selectedDates[0], selectedDates[1]);
                }
            }
        } else {
            selectedDates.splice(index, 1);
            
            document.querySelectorAll(`.timeline-item[data-date="${date}"]`).forEach(item => {
                item.classList.remove('selected-for-compare');
            });
            
            document.querySelectorAll(`.cal-day[data-date="${date}"]`).forEach(day => {
                day.classList.remove('selected-for-compare');
            });
            
            updateCompareCount();
            
            if (elements.comparisonView && elements.comparisonView.classList.contains('active')) {
                closeComparison();
            }
        }
    }
    
    function updateCompareCount() {
        if (elements.compareCount) {
            elements.compareCount.textContent = selectedDates.length;
        }
    }
    
    function clearComparisonSelection() {
        selectedDates = [];
        updateCompareCount();
        
        document.querySelectorAll('.selected-for-compare').forEach(el => {
            el.classList.remove('selected-for-compare');
        });
    }
    
    // --- VISTA DE COMPARACIÓN ---
    function showComparison(date1, date2) {
        const record1 = photoRecords.find(r => r.date === date1);
        const record2 = photoRecords.find(r => r.date === date2);
        
        if (!record1 || !record2) {
            alert('Error al cargar los registros para comparación');
            return;
        }
        
        comparisonData.date1 = record1;
        comparisonData.date2 = record2;
        
        // Actualizar interfaz
        const date1Badge = document.getElementById('date1Badge');
        const date2Badge = document.getElementById('date2Badge');
        const date1Title = document.getElementById('date1Title');
        const date2Title = document.getElementById('date2Title');
        
        if (date1Badge) date1Badge.innerHTML = `<i class="far fa-calendar"></i><span>${record1.displayDate}</span>`;
        if (date2Badge) date2Badge.innerHTML = `<i class="far fa-calendar"></i><span>${record2.displayDate}</span>`;
        if (date1Title) date1Title.textContent = record1.title;
        if (date2Title) date2Title.textContent = record2.title;
        
        // Actualizar fotos
        const date1Frontal = document.getElementById('date1Frontal');
        const date1Profile = document.getElementById('date1Profile');
        const date2Frontal = document.getElementById('date2Frontal');
        const date2Profile = document.getElementById('date2Profile');
        
        if (date1Frontal) date1Frontal.src = record1.frontal;
        if (date1Profile) date1Profile.src = record1.profile;
        if (date2Frontal) date2Frontal.src = record2.frontal;
        if (date2Profile) date2Profile.src = record2.profile;
        
        // Actualizar métricas
        const date1Metrics = document.getElementById('date1Metrics');
        const date2Metrics = document.getElementById('date2Metrics');
        
        if (date1Metrics) {
            date1Metrics.innerHTML = `
                <div class="metric-row">
                    <span>Peso:</span>
                    <span>${record1.metrics.weight} kg</span>
                </div>
                <div class="metric-row">
                    <span>Grasa corporal:</span>
                    <span>${record1.metrics.fat}</span>
                </div>
                <div class="metric-row">
                    <span>Cintura:</span>
                    <span>${record1.metrics.waist} cm</span>
                </div>
            `;
        }
        
        if (date2Metrics) {
            date2Metrics.innerHTML = `
                <div class="metric-row">
                    <span>Peso:</span>
                    <span>${record2.metrics.weight} kg</span>
                </div>
                <div class="metric-row">
                    <span>Grasa corporal:</span>
                    <span>${record2.metrics.fat}</span>
                </div>
                <div class="metric-row">
                    <span>Cintura:</span>
                    <span>${record2.metrics.waist} cm</span>
                </div>
            `;
        }
        
        // Calcular diferencias
        const weightDiff = parseFloat(record1.metrics.weight) - parseFloat(record2.metrics.weight);
        const fatDiff = parseFloat(record1.metrics.fat) - parseFloat(record2.metrics.fat);
        const waistDiff = parseFloat(record1.metrics.waist) - parseFloat(record2.metrics.waist);
        
        const comparisonSummary = document.getElementById('comparisonSummary');
        if (comparisonSummary) {
            let summaryHTML = `
                <h4><i class="fas fa-chart-line"></i> Análisis de Progreso</h4>
                <p>Comparando <strong>${record1.title}</strong> vs <strong>${record2.title}</strong>:</p>
                <div style="margin-top: 10px;">
            `;
            
            if (weightDiff < 0) {
                summaryHTML += `<p>✅ <strong>Pérdida de peso:</strong> ${Math.abs(weightDiff).toFixed(1)} kg menos</p>`;
            } else if (weightDiff > 0) {
                summaryHTML += `<p>⚠️ <strong>Ganancia de peso:</strong> ${weightDiff.toFixed(1)} kg más</p>`;
            } else {
                summaryHTML += `<p>➖ <strong>Peso estable:</strong> Sin cambios</p>`;
            }
            
            if (fatDiff < 0) {
                summaryHTML += `<p>✅ <strong>Reducción de grasa:</strong> ${Math.abs(fatDiff).toFixed(1)}% menos de grasa corporal</p>`;
            } else if (fatDiff > 0) {
                summaryHTML += `<p>⚠️ <strong>Aumento de grasa:</strong> ${fatDiff.toFixed(1)}% más de grasa corporal</p>`;
            } else {
                summaryHTML += `<p>➖ <strong>Grasa estable:</strong> Sin cambios</p>`;
            }
            
            if (waistDiff < 0) {
                summaryHTML += `<p>✅ <strong>Reducción de cintura:</strong> ${Math.abs(waistDiff).toFixed(1)} cm menos</p>`;
            } else if (waistDiff > 0) {
                summaryHTML += `<p>⚠️ <strong>Aumento de cintura:</strong> ${waistDiff.toFixed(1)} cm más</p>`;
            } else {
                summaryHTML += `<p>➖ <strong>Cintura estable:</strong> Sin cambios</p>`;
            }
            
            // Determinar tendencia general
            const positiveChanges = [weightDiff < 0, fatDiff < 0, waistDiff < 0].filter(Boolean).length;
            
            if (positiveChanges >= 2) {
                summaryHTML += `<p style="color: var(--success); font-weight: 600; margin-top: 10px;">
                    <i class="fas fa-trophy"></i> ¡Excelente progreso! Tendencia positiva en la mayoría de métricas.
                </p>`;
            } else if (positiveChanges >= 1) {
                summaryHTML += `<p style="color: var(--warning); font-weight: 600; margin-top: 10px;">
                    <i class="fas fa-chart-line"></i> Progreso mixto. Algunas métricas mejoran, otras se mantienen.
                </p>`;
            } else {
                summaryHTML += `<p style="color: var(--error); font-weight: 600; margin-top: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> Revisa tu plan. Considera ajustar dieta o entrenamiento.
                </p>`;
            }
            
            summaryHTML += `</div>`;
            comparisonSummary.innerHTML = summaryHTML;
        }
        
        // Habilitar botón de compartir
        const shareComparisonBtn = document.getElementById('shareComparisonBtn');
        if (shareComparisonBtn) {
            shareComparisonBtn.disabled = false;
        }
        
        // Mostrar vista de comparación
        if (elements.comparisonView && elements.normalView) {
            elements.comparisonView.classList.add('active');
            elements.normalView.style.display = 'none';
        }
    }
    
    function closeComparison() {
        if (elements.comparisonView && elements.normalView) {
            elements.comparisonView.classList.remove('active');
            elements.normalView.style.display = 'block';
        }
        
        clearComparisonSelection();
        
        if (compareMode) {
            toggleCompareMode();
        }
    }
    
    function shareComparison() {
        if (!comparisonData.date1 || !comparisonData.date2) {
            alert('Primero selecciona dos fechas para comparar');
            return;
        }
        
        const shareText = `Comparando mi progreso físico:\n📅 ${comparisonData.date1.title} vs ${comparisonData.date2.title}\n`;
        const weightDiff = parseFloat(comparisonData.date1.metrics.weight) - parseFloat(comparisonData.date2.metrics.weight);
        const fatDiff = parseFloat(comparisonData.date1.metrics.fat) - parseFloat(comparisonData.date2.metrics.fat);
        
        let progressText = '';
        if (weightDiff < 0) {
            progressText += `✅ Perdí ${Math.abs(weightDiff).toFixed(1)}kg\n`;
        }
        if (fatDiff < 0) {
            progressText += `✅ Reduje ${Math.abs(fatDiff).toFixed(1)}% de grasa\n`;
        }
        
        if (progressText) {
            alert(`Contenido para compartir:\n\n${shareText}${progressText}\n¡Seguimos progresando! 💪`);
        } else {
            alert(`Contenido para compartir:\n\n${shareText}Manteniendo mi progreso 💪`);
        }
    }
    
    // --- GESTIÓN DE SUBIDA DE ARCHIVOS ---
    function handleFileSelect(event, type) {
        const file = event.target.files[0];
        const maxSize = 1024 * 1024; // 1MB
        
        if (file) {
            if (file.size > maxSize) {
                showUploadError(`El archivo ${file.name} excede 1MB`);
                event.target.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showUploadError('Solo se permiten archivos de imagen');
                event.target.value = '';
                return;
            }
            
            currentUploads[type] = file;
            updateFileInfo(type, file);
            checkUploads();
            hideUploadError();
        }
    }
    
    function updateFileInfo(type, file) {
        const infoElement = document.getElementById(`${type}Info`);
        if (infoElement) {
            const fileSize = (file.size / 1024).toFixed(1);
            infoElement.innerHTML = `
                <span>${file.name}</span>
                <span>${fileSize}KB</span>
            `;
            infoElement.style.display = 'flex';
        }
    }
    
    function checkUploads() {
        const hasBoth = currentUploads.frontal && currentUploads.profile;
        if (elements.uploadSubmit) {
            elements.uploadSubmit.disabled = !hasBoth;
            if (hasBoth) {
                elements.uploadSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir 2 Fotos';
            }
        }
    }
    
    function resetUploads() {
        currentUploads = { frontal: null, profile: null };
        if (elements.frontalInput) elements.frontalInput.value = '';
        if (elements.profileInput) elements.profileInput.value = '';
        
        const frontalInfo = document.getElementById('frontalInfo');
        const profileInfo = document.getElementById('profileInfo');
        
        if (frontalInfo) frontalInfo.style.display = 'none';
        if (profileInfo) profileInfo.style.display = 'none';
        
        if (elements.uploadSubmit) {
            elements.uploadSubmit.disabled = true;
            elements.uploadSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir Medición Completa';
        }
        
        hideUploadError();
    }
    
    function showUploadError(message) {
        if (elements.uploadError) {
            elements.uploadError.textContent = message;
            elements.uploadError.style.display = 'block';
        }
    }
    
    function hideUploadError() {
        if (elements.uploadError) {
            elements.uploadError.style.display = 'none';
        }
    }
    
    function processUpload() {
        if (!currentUploads.frontal || !currentUploads.profile) {
            showUploadError('Debes seleccionar ambas fotos');
            return;
        }
        
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
        
        // Simular procesamiento (en producción, aquí iría la llamada a la API)
        setTimeout(() => {
            const readerFrontal = new FileReader();
            const readerProfile = new FileReader();
            
            readerFrontal.onload = function(e) {
                readerProfile.onload = function(e2) {
                    const today = new Date();
                    const dateStr = today.toISOString().split('T')[0];
                    const displayDate = today.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short' 
                    });
                    
                    const newRecord = {
                        date: dateStr,
                        frontal: readerFrontal.result,
                        profile: readerProfile.result,
                        title: `${displayDate} ${today.getFullYear()}`,
                        displayDate: displayDate,
                        metrics: {
                            weight: '78.2',
                            fat: '15.0%',
                            muscle: '65.2',
                            imc: '24.1',
                            waist: '81.5',
                            folds: '44.8'
                        },
                        active: true
                    };
                    
                    // Actualizar registros anteriores como no activos
                    photoRecords.forEach(r => r.active = false);
                    
                    photoRecords.unshift(newRecord);
                    renderTimeline();
                    renderMetricsTable();
                    renderCalendar(currentCalendarMonth, currentCalendarYear);
                    selectPhotoByDate(newRecord.date);
                    
                    if (loader) loader.style.display = 'none';
                    resetUploads();
                    
                    // Mostrar éxito
                    if (elements.aiFeedback) {
                        elements.aiFeedback.innerHTML = `
                            <strong>¡Medición subida correctamente!</strong><br>
                            Se han procesado 2 fotos. Se detecta mejoría en la postura y reducción de 0.2% en grasa corporal.
                        `;
                    }
                };
                readerProfile.readAsDataURL(currentUploads.profile);
            };
            readerFrontal.readAsDataURL(currentUploads.frontal);
        }, 2000);
    }
    
    // --- RENDERIZADO DEL TIMELINE ---
    function renderTimeline() {
        if (!elements.photoTimeline) return;
        
        elements.photoTimeline.innerHTML = '';
        
        photoRecords.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = `timeline-item ${record.active ? 'active' : ''}`;
            item.dataset.date = record.date;
            item.addEventListener('click', () => {
                if (compareMode) {
                    selectForComparison(record.date);
                } else {
                    selectPhotoByDate(record.date);
                }
            });
            
            item.innerHTML = `
                <div class="timeline-photos">
                    <img src="${record.frontal}" class="timeline-photo" alt="Frontal" 
                         data-date="${record.date}" data-type="frontal" data-index="${index}">
                    <img src="${record.profile}" class="timeline-photo" alt="Perfil"
                         data-date="${record.date}" data-type="profile" data-index="${index}">
                </div>
                <div class="timeline-date">
                    <span>${record.displayDate}</span>
                    <span class="photo-count">2 fotos</span>
                </div>
            `;
            
            // Añadir event listeners a las imágenes individuales
            const images = item.querySelectorAll('.timeline-photo');
            images.forEach(img => {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const date = img.dataset.date;
                    const type = img.dataset.type;
                    const idx = parseInt(img.dataset.index);
                    openPhotoViewer(date, type, idx);
                });
            });
            
            elements.photoTimeline.appendChild(item);
        });
    }
    
    // --- VISUALIZACIÓN DE FOTOS AMPLIADAS ---
    function openPhotoViewer(date, type, index) {
        const record = photoRecords.find(r => r.date === date);
        if (!record) return;
        
        currentImageIndex = index;
        currentImages = [
            { src: record.frontal, type: 'Vista Frontal', date: record.title },
            { src: record.profile, type: 'Vista Perfil', date: record.title }
        ];
        
        const imageIndex = type === 'frontal' ? 0 : 1;
        showImage(imageIndex);
        openImageModal();
    }
    
    function showImage(index) {
        const image = currentImages[index];
        const enlargedImage = document.getElementById('enlargedImage');
        const imageDate = document.getElementById('imageDate');
        const imageType = document.getElementById('imageType');
        
        if (enlargedImage) enlargedImage.src = image.src;
        if (imageDate) imageDate.textContent = image.date;
        if (imageType) imageType.textContent = image.type;
        currentImageIndex = index;
    }
    
    function navigatePhoto(direction) {
        const newIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
        showImage(newIndex);
    }
    
    // --- SELECCIÓN Y ANÁLISIS ---
    function selectPhotoByDate(date) {
        // Actualizar clases activas
        document.querySelectorAll('.timeline-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.date === date) {
                el.classList.add('active');
            }
        });
        
        // Actualizar registro activo
        photoRecords.forEach(record => {
            record.active = (record.date === date);
        });
        
        // Actualizar análisis
        updateAIAnalysis(date);
        currentSelectedDate = date;
    }
    
    function scrollTimeline(direction) {
        if (elements.photoTimeline) {
            elements.photoTimeline.scrollBy({ left: direction * 150, behavior: 'smooth' });
        }
    }
    
    // --- CALENDARIO ---
    let currentCalendarMonth = new Date().getMonth();
    let currentCalendarYear = new Date().getFullYear();
    
    function initCalendar() {
        if (!elements.calendarGrid || !elements.currentMonth) return;
        
        // Inicializar con el mes actual
        currentCalendarMonth = new Date().getMonth();
        currentCalendarYear = new Date().getFullYear();
        
        renderCalendar(currentCalendarMonth, currentCalendarYear);
    }
    
    function renderCalendar(month, year) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        if (!elements.calendarGrid || !elements.currentMonth) return;
        
        // Actualizar el título del calendario
        elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
        
        elements.calendarGrid.innerHTML = '';
        
        // Encabezados de los días de la semana
        const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        dayHeaders.forEach(day => {
            const header = document.createElement('span');
            header.textContent = day;
            elements.calendarGrid.appendChild(header);
        });
        
        // Obtener el primer día del mes y el número de días en el mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Día de la semana del primer día (0: Domingo, 1: Lunes, ...) pero queremos Lunes=0
        let firstWeekday = firstDay.getDay() - 1;
        if (firstWeekday < 0) firstWeekday = 6; // Domingo se convierte en 6
        
        // Añadir celdas vacías hasta el primer día del mes
        for (let i = 0; i < firstWeekday; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('cal-day', 'empty');
            elements.calendarGrid.appendChild(emptyCell);
        }
        
        // Añadir los días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('cal-day');
            dayElement.textContent = day;
            
            // Formatear la fecha para comparar (YYYY-MM-DD)
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Verificar si hay un registro para esta fecha
            const record = photoRecords.find(r => r.date === dateString);
            
            // Marcar días con registros
            if (record) {
                dayElement.classList.add('has-record');
                dayElement.dataset.date = dateString;
                
                // Si está activa, añadir clase active
                if (record.active) {
                    dayElement.classList.add('active');
                }
                
                // Si está seleccionada para comparación
                if (selectedDates.includes(dateString)) {
                    dayElement.classList.add('selected-for-compare');
                }
            }
            
            // Añadir evento de clic
            dayElement.addEventListener('click', function() {
                if (record) {
                    if (compareMode) {
                        selectDateForComparison(dateString);
                    } else {
                        selectPhotoByDate(dateString);
                    }
                } else {
                    // Si no hay registro, mostrar mensaje
                    showDateWithoutRecord(dateString);
                }
            });
            
            elements.calendarGrid.appendChild(dayElement);
        }
        
        // Configurar botones de navegación
        setupCalendarNavigation();
    }
    
    function setupCalendarNavigation() {
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        
        if (prevMonthBtn) {
            // Remover listener previo si existe
            const newPrevBtn = prevMonthBtn.cloneNode(true);
            prevMonthBtn.parentNode.replaceChild(newPrevBtn, prevMonthBtn);
            const freshPrevBtn = document.getElementById('prevMonthBtn');
            if (freshPrevBtn) {
                freshPrevBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    changeMonth(-1);
                });
            }
        }
        
        if (nextMonthBtn) {
            // Remover listener previo si existe
            const newNextBtn = nextMonthBtn.cloneNode(true);
            nextMonthBtn.parentNode.replaceChild(newNextBtn, nextMonthBtn);
            const freshNextBtn = document.getElementById('nextMonthBtn');
            if (freshNextBtn) {
                freshNextBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    changeMonth(1);
                });
            }
        }
    }
    
    function changeMonth(delta) {
        currentCalendarMonth += delta;
        
        if (currentCalendarMonth < 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        } else if (currentCalendarMonth > 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        }
        
        renderCalendar(currentCalendarMonth, currentCalendarYear);
    }
    
    function showDateWithoutRecord(dateString) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        if (!elements.currentMonth) return;
        
        const originalText = elements.currentMonth.textContent;
        elements.currentMonth.textContent = `Sin registros para ${dateString}`;
        elements.currentMonth.style.color = 'var(--error)';
        
        setTimeout(() => {
            elements.currentMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
            elements.currentMonth.style.color = 'var(--dark)';
        }, 1500);
    }
    
    function selectDateForComparison(dateString) {
        // Buscar si existe un registro para esta fecha
        const record = photoRecords.find(r => r.date === dateString);
        if (record) {
            selectForComparison(dateString);
        } else {
            showDateWithoutRecord(dateString);
        }
    }
    
    // --- ACTUALIZACIÓN DE ANÁLISIS ---
    function updateAIAnalysis(date) {
        if (!elements.aiFeedback) return;
        
        elements.aiFeedback.style.opacity = '0.5';
        
        setTimeout(() => {
            elements.aiFeedback.style.opacity = '1';
            const record = photoRecords.find(r => r.date === date);
            
            if (!record) return;
            
            if (date === '2024-12-13') {
                elements.aiFeedback.innerHTML = `<strong>Análisis Actual (${record.title}):</strong><br>
                Mantienes una tendencia positiva. La relación cintura-cadera ha mejorado un 5% este mes. 
                Tu somatotipo se está desplazando hacia mesomorfo puro.`;
                updateChart([20, 70, 10]);
            } else if (date === '2024-11-15') {
                elements.aiFeedback.innerHTML = `<strong>Registro Histórico (${record.title}):</strong><br>
                En este punto estabas saliendo de la fase de volumen. Se observaba mayor retención de líquidos 
                en la zona abdominal comparado con hoy.`;
                updateChart([30, 60, 10]);
            } else {
                elements.aiFeedback.innerHTML = `<strong>Registro Inicial (${record.title}):</strong><br>
                Punto de partida. Niveles de endomorfia más altos (40%). Buena base muscular pero con 
                necesidad de reducir grasa corporal.`;
                updateChart([40, 45, 15]);
            }
        }, 300);
    }
    
    // --- RENDERIZADO DE TABLA DE MÉTRICAS ---
    function renderMetricsTable() {
        if (!elements.metricsTableBody) return;
        
        elements.metricsTableBody.innerHTML = '';
        
        photoRecords.forEach((record, index) => {
            const trendIcon = index === 0 ? 
                '<i class="fas fa-arrow-down trend-down"></i>' : 
                (index < photoRecords.length - 1 ? '' : '<i class="fas fa-arrow-up trend-up"></i>');
            
            const row = document.createElement('tr');
            if (record.active) {
                row.style.backgroundColor = '#f1f8e9';
                row.style.fontWeight = '500';
            }
            
            row.innerHTML = `
                <td>${record.title}</td>
                <td>${record.metrics.weight} ${index === 0 ? trendIcon : ''}</td>
                <td>${record.metrics.fat} ${index === 0 ? trendIcon : ''}</td>
                <td>${record.metrics.muscle}</td>
                <td>${record.metrics.imc}</td>
                <td>${record.metrics.waist}</td>
                <td>${record.metrics.folds}</td>
            `;
            
            elements.metricsTableBody.appendChild(row);
        });
    }
    
    // --- CHART.JS CONFIG ---
    function initChart() {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;
        
        const canvasCtx = ctx.getContext('2d');
        myChart = new Chart(canvasCtx, {
            type: 'radar',
            data: {
                labels: ['Endomorfo', 'Mesomorfo', 'Ectomorfo'],
                datasets: [{
                    label: 'Perfil',
                    data: [20, 70, 10],
                    backgroundColor: 'rgba(46, 125, 50, 0.2)',
                    borderColor: '#2e7d32',
                    pointBackgroundColor: '#2e7d32',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { display: false }
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
    }
    
    function updateChart(newData) {
        if (myChart) {
            myChart.data.datasets[0].data = newData;
            myChart.update();
        }
    }
    
    // --- API PÚBLICA ---
    return {
        init: init,
        openModal: openModal,
        closeModal: closeModal,
        setupDOMReferences: setupDOMReferences,
        setupEventListeners: setupEventListeners,
        // Métodos adicionales que podrían necesitarse desde fuera
        addPhotoRecord: function(record) {
            photoRecords.unshift(record);
            renderTimeline();
            renderMetricsTable();
            renderCalendar(currentCalendarMonth, currentCalendarYear);
        },
        getRecords: function() {
            return [...photoRecords];
        },
        clearData: function() {
            photoRecords = [];
            currentUploads = { frontal: null, profile: null };
            selectedDates = [];
            renderTimeline();
            renderMetricsTable();
            renderCalendar(currentCalendarMonth, currentCalendarYear);
        }
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    AntropometricModal.init();
});
