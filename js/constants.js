// ============================================
// CONSTANTES GLOBALES
// ============================================

// URLs
const WORKER_URL = 'https://secop-proxy.shoyosb.workers.dev';
const SECOP_BASE_URL = 'https://www.secop.gov.co/CO1BusinessLine/Tendering/ContractNoticeManagement/Index?prevCtxUrl=%2fCO1Marketplace%2f';

// Credenciales válidas (solo un usuario)
const VALID_USERS = [
    { email: 'shoyosb@gmail.com', password: 'admin123', role: 'admin' }
];

// Listas fijas para filtros
const MODALITIES_LIST = [
    'Licitación pública',
    'Selección Abreviada de Menor Cuantía',
    'Concurso de méritos abierto',
    'Concurso de méritos con precalificación',
    'Contratación directa',
    'Contratación Directa (con ofertas)',
    'Contratación régimen especial',
    'Mínima cuantía',
    'Selección abreviada subasta inversa'
];

const BASE_STATUSES_LIST = [
    'Abierto',
    'Aprobado',
    'Borrador',
    'Cancelado',
    'En aprobación',
    'Evaluación',
    'Publicado',
    'Seleccionado',
    'Suspendido'
];

const BASE_PHASES_LIST = [
    'Planeación',
    'Selección',
    'Evaluación',
    'Adjudicación',
    'Contratación',
    'Ejecución',
    'Terminación',
    'Cierre'
];

// Keys para LocalStorage
const STORAGE_KEY = 'secop_lite_favorites';
const SESSION_KEY = 'secop_lite_session';