// ============================================
// ESTADO GLOBAL
// ============================================

const state = {
    // Resultados y paginación
    results: [],
    currentPage: 1,
    pageSize: 25,
    
    // Estado de UI
    isLoading: false,
    filtersVisible: false,
    activeTab: 'search',
    
    // Datos de filtros
    departments: [],
    currentQuery: '',
    favoriteProcesses: [],
    
    // Sesión (sin invitado)
    isLoggedIn: false,
    currentUser: null
};