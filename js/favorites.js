// ============================================
// FAVORITOS (LocalStorage) - SIN INVITADO
// ============================================

function getFavorites() {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('📖 getFavorites - raw stored:', stored);
    
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            console.log('📖 getFavorites - parsed:', parsed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error al parsear favoritos:', e);
            return [];
        }
    }
    return [];
}

function saveFavorites(favorites) {
    console.log('💾 saveFavorites - guardando:', favorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

function addFavorite(processId) {
    console.log('➕ addFavorite llamado para:', processId);
    
    const favorites = getFavorites();
    console.log('Favoritos actuales antes de agregar:', favorites);
    
    if (!favorites.includes(processId)) {
        favorites.push(processId);
        saveFavorites(favorites);
        console.log('✅ Proceso agregado a favoritos:', processId);
        showToast('✅ Proceso guardado en favoritos');
        return true;
    } else {
        console.log('⚠️ El proceso ya estaba en favoritos:', processId);
        return false;
    }
}

function removeFavorite(processId) {
    console.log('➖ removeFavorite llamado para:', processId);
    
    let favorites = getFavorites();
    console.log('Favoritos actuales antes de eliminar:', favorites);
    
    const initialLength = favorites.length;
    favorites = favorites.filter(id => id !== processId);
    
    if (favorites.length !== initialLength) {
        saveFavorites(favorites);
        console.log('❌ Proceso eliminado de favoritos:', processId);
        showToast('❌ Proceso eliminado de favoritos');
        return true;
    } else {
        console.log('⚠️ Proceso no encontrado en favoritos:', processId);
        return false;
    }
}

function isFavorite(processId) {
    const favorites = getFavorites();
    const result = favorites.includes(processId);
    console.log(`🔍 isFavorite("${processId}") = ${result}`);
    return result;
}

function toggleFavorite(processId) {
    console.log('🔄 Toggle favorito para:', processId);
    
    if (isFavorite(processId)) {
        removeFavorite(processId);
        return false;
    } else {
        addFavorite(processId);
        return true;
    }
}

function updateFavoritesList() {
    const favoritesIds = getFavorites();
    state.favoriteProcesses = state.results.filter(p => favoritesIds.includes(p.id_del_proceso));
    console.log('📋 Lista de favoritos actualizada:', state.favoriteProcesses.length);
}

function renderFavoritesTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    const favoritesIds = getFavorites();
    const favoriteProcesses = state.results.filter(p => favoritesIds.includes(p.id_del_proceso));
    
    if (favoriteProcesses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">⭐ No tienes procesos guardados. Busca y guarda tus procesos favoritos.</td></tr>';
        document.getElementById('resultsCount').textContent = '0 procesos guardados';
        return;
    }
    
    tbody.innerHTML = favoriteProcesses.map(process => renderTableRow(process)).join('');
    document.getElementById('resultsCount').textContent = `${favoriteProcesses.length} proceso${favoriteProcesses.length !== 1 ? 's' : ''} guardado${favoriteProcesses.length !== 1 ? 's' : ''}`;
}