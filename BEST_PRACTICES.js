/**
 * ============================================
 * GUÍA DE MEJORES PRÁCTICAS - SECOP LITE
 * ============================================
 * 
 * Este archivo documenta patrones recomendados
 * para mantener y mejorar el código
 */

// ============================================
// 1. MANEJO DE ERRORES Y VALIDACIÓN
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Validación defensiva
 * Siempre verificar que los elementos existan
 */
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Elemento no encontrado: ${id}`);
        return null;
    }
    return element;
}

// ✅ USO CORRECTO
const input = safeGetElement('searchInput');
if (input) {
    input.focus();
}

// ❌ EVITAR: Asumir que el elemento existe
// document.getElementById('searchInput').focus(); // Puede fallar

/**
 * ✅ BUENA PRÁCTICA: Try-catch con información útil
 */
async function fetchWithErrorHandling(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );
        }
        
        const data = await response.json();
        
        if (!data) {
            throw new Error('Respuesta vacía del servidor');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error en fetch:', {
            url,
            message: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

// ============================================
// 2. OPTIMIZACIÓN DE PERFORMANCE
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Debouncing para búsqueda
 */
function createDebounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Uso
const debouncedSearch = createDebounce(performSearch, 300);
document.getElementById('searchInput')?.addEventListener(
    'input',
    (e) => debouncedSearch(e.target.value)
);

/**
 * ✅ BUENA PRÁCTICA: Throttling para scroll
 */
function createThrottle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * ✅ BUENA PRÁCTICA: Caché simple con verificación
 */
class SimpleCache {
    constructor(ttl = 5 * 60 * 1000) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Uso
// const apiCache = new SimpleCache(5 * 60 * 1000);

// ============================================
// 3. TRABAJAR CON STRINGS SEGURAMENTE
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Validar antes de normalizar
 */
function normalizeTextSafely(str) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * ✅ BUENA PRÁCTICA: Template literals para HTML
 * (Pero siempre escapar variables)
 */
function createListItem(title, id) {
    const safeTitle = escapeHtml(title);
    const safeId = escapeHtml(id);
    
    return `
        <li data-id="${safeId}">
            <span class="title">${safeTitle}</span>
        </li>
    `;
}

// ❌ EVITAR: Concatenación de strings
// return '<li data-id="' + id + '">' + title + '</li>';

// ============================================
// 4. GESTIÓN DE ESTADO
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Centralize state y usar getters/setters
 */
const AppState = {
    _state: {
        results: [],
        currentPage: 1,
        isLoading: false,
        filters: {}
    },

    getResults() {
        return this._state.results;
    },

    setResults(results) {
        if (!Array.isArray(results)) {
            console.error('❌ Results debe ser un array');
            return false;
        }
        this._state.results = results;
        this.notifyListeners('results-changed');
        return true;
    },

    getPage() {
        return this._state.currentPage;
    },

    setPage(page) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            console.error('❌ Page debe ser un número positivo');
            return false;
        }
        this._state.currentPage = pageNum;
        return true;
    },

    notifyListeners(event) {
        window.dispatchEvent(new CustomEvent(event, {
            detail: this._state
        }));
    }
};

// Uso
// AppState.setResults(data);
// window.addEventListener('results-changed', handleUpdate);

// ============================================
// 5. EVENT HANDLING
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Event delegation
 */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.save-btn');
    if (!btn) return;

    const processId = btn.dataset.id;
    if (!processId) {
        console.error('❌ Process ID no encontrado');
        return;
    }

    handleSaveProcess(processId);
});

// ❌ EVITAR: Agregar listeners a cada botón
// document.querySelectorAll('.save-btn').forEach(btn => {
//     btn.addEventListener('click', handleSaveProcess);
// });

/**
 * ✅ BUENA PRÁCTICA: Remover listeners cuando sea necesario
 */
function setupTemporaryListener(element, eventType, handler) {
    const wrappedHandler = (e) => {
        handler(e);
        element.removeEventListener(eventType, wrappedHandler);
    };
    element.addEventListener(eventType, wrappedHandler);
}

// Uso
// setupTemporaryListener(modal, 'click', handleModalClose);

// ============================================
// 6. TRABAJAR CON ARRAYS Y OBJETOS
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Usar métodos funcionales
 */
function processResults(results) {
    return results
        .filter(item => item.estado_del_procedimiento === 'Abierto')
        .map(item => ({
            id: item.id_del_proceso,
            title: item.nombre_del_procedimiento,
            value: parseFloat(item.precio_base) || 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
}

/**
 * ✅ BUENA PRÁCTICA: Destructuring
 */
function displayProcess({ id, title, entity, value }) {
    console.log(`${id}: ${title} (${entity}) - $${value}`);
}

/**
 * ✅ BUENA PRÁCTICA: Spread operator para copias
 */
function updateFilters(newFilters) {
    state.filters = { ...state.filters, ...newFilters };
}

// ❌ EVITAR: Mutación directa
// state.filters.entity = newEntity; // Modificar directamente

// ============================================
// 7. ASYNC/AWAIT PATTERNS
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Manejar múltiples llamadas async
 */
async function loadInitialData() {
    try {
        const [statuses, departments, cities] = await Promise.all([
            loadStatuses(),
            loadDepartments(),
            loadCities()
        ]);

        return { statuses, departments, cities };
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        return null;
    }
}

/**
 * ✅ BUENA PRÁCTICA: Timeout para llamadas largas
 */
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });
        clearTimeout(id);
        return response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// ============================================
// 8. SEGURIDAD
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Validar entrada del usuario
 */
function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }

    const maxLength = 100;
    const sanitized = query
        .trim()
        .substring(0, maxLength)
        .replace(/[<>]/g, '');

    return sanitized;
}

/**
 * ✅ BUENA PRÁCTICA: Usar Content Security Policy
 * (En meta tag del HTML)
 * <meta http-equiv="Content-Security-Policy" 
 *       content="default-src 'self'; script-src 'self' 'unsafe-inline'">
 */

/**
 * ✅ BUENA PRÁCTICA: Nunca usar eval()
 */
// ❌ EVITAR COMPLETAMENTE
// const result = eval(userInput);

// ✅ USAR
const result = JSON.parse(userInput);

// ============================================
// 9. TESTING CONSIDERATIONS
// ============================================

/**
 * ✅ BUENA PRÁCTICA: Código testeable
 */
function isProcessParticipable(process) {
    const estado = normalizeTextSafely(
        process.estado_del_procedimiento || ''
    );
    
    if (estado !== 'abierto' && estado !== 'publicado') {
        return false;
    }

    const deadline = new Date(process.fecha_de_recepcion_de);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return deadline >= today;
}

// Fácil de testear:
// expect(isProcessParticipable({ 
//     estado_del_procedimiento: 'Abierto',
//     fecha_de_recepcion_de: '2026-12-31'
// })).toBe(true);

// ============================================
// 10. DOCUMENTACIÓN
// ============================================

/**
 * ✅ BUENA PRÁCTICA: JSDoc para funciones importantes
 */
/**
 * Busca procesos de contratación según criterios
 * @param {string} query - Término de búsqueda
 * @param {Object} filters - Objeto con filtros (entity, status, etc.)
 * @param {number} [limit=500] - Cantidad máxima de resultados
 * @returns {Promise<Array>} Array de procesos encontrados
 * @throws {Error} Si la búsqueda falla
 * 
 * @example
 * const results = await searchProcesses('hospital', { entity: 'Minsalud' });
 */
async function searchProcesses(query, filters = {}, limit = 500) {
    // Implementación
}

// ============================================
// CHECKLIST DE CALIDAD DE CÓDIGO
// ============================================

/*
 * ANTES DE HACER COMMIT, VERIFICAR:
 * 
 * [ ] Variables y funciones con nombres descriptivos
 * [ ] No hay console.log() en producción (solo console.error)
 * [ ] Funciones no son muy largas (<50 líneas)
 * [ ] No hay código duplicado
 * [ ] Se validan todas las inputs del usuario
 * [ ] Se escapan strings que van en HTML
 * [ ] Se maneja error en async/await
 * [ ] Se usa const/let, no var
 * [ ] Arrow functions para callbacks
 * [ ] JSDoc en funciones públicas
 * [ ] No hay magic numbers (usar constantes)
 * [ ] Performance: sin loops innecesarios
 * [ ] Accesibilidad: aria-labels donde sea necesario
 */
