// ============================================
// FILTROS (carga de opciones dinámicas)
// ============================================

async function loadFilterOptions() {
    console.log('📦 Cargando opciones de filtros...');
    
    const modalitySelect = document.getElementById('modalityFilter');
    if (modalitySelect) {
        modalitySelect.innerHTML = '<option value="">Todas las modalidades</option>';
        MODALITIES_LIST.forEach(modality => {
            const option = document.createElement('option');
            option.value = modality;
            option.textContent = modality;
            modalitySelect.appendChild(option);
        });
    }
    
    const phaseSelect = document.getElementById('phaseFilter');
    if (phaseSelect) {
        phaseSelect.innerHTML = '<option value="">Todas las fases</option>';
        BASE_PHASES_LIST.forEach(phase => {
            const option = document.createElement('option');
            option.value = phase;
            option.textContent = phase;
            phaseSelect.appendChild(option);
        });
    }
    
    await loadStatusesFromAPI();
    await loadDepartments();
}

async function loadStatusesFromAPI() {
    const statusSelect = document.getElementById('statusFilter');
    if (!statusSelect) return;
    
    try {
        const params = new URLSearchParams();
        params.append('$select', 'distinct estado_del_procedimiento');
        params.append('$limit', '500');
        params.append('$where', "estado_del_procedimiento IS NOT NULL AND estado_del_procedimiento != ''");
        
        const url = `${WORKER_URL}?${params.toString()}`;
        console.log('📡 Cargando estados desde:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        const statusesSet = new Set();
        BASE_STATUSES_LIST.forEach(status => statusesSet.add(status));
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item.estado_del_procedimiento && item.estado_del_procedimiento.trim() !== '') {
                    statusesSet.add(item.estado_del_procedimiento);
                }
            });
        }
        
        const allStatuses = Array.from(statusesSet).sort();
        
        statusSelect.innerHTML = '<option value="">Todos los estados</option>';
        allStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
        
        console.log(`✅ Cargados ${allStatuses.length} estados únicos`);
        
    } catch (error) {
        console.error('Error cargando estados:', error);
        statusSelect.innerHTML = '<option value="">Todos los estados</option>';
        BASE_STATUSES_LIST.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });
    }
}

async function loadDepartments() {
    try {
        const params = new URLSearchParams();
        params.append('$select', 'distinct departamento_entidad');
        params.append('$limit', '500');
        params.append('$where', "departamento_entidad IS NOT NULL AND departamento_entidad != '' AND departamento_entidad != 'No Definido'");
        
        const url = `${WORKER_URL}?${params.toString()}`;
        console.log('📡 Cargando departamentos desde:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            const departmentsSet = new Set();
            data.forEach(item => {
                if (item.departamento_entidad && item.departamento_entidad.trim() !== '') {
                    departmentsSet.add(item.departamento_entidad);
                }
            });
            
            const departments = Array.from(departmentsSet).sort();
            state.departments = departments;
            
            const deptSelect = document.getElementById('departmentFilter');
            if (deptSelect) {
                deptSelect.innerHTML = '<option value="">Todos los departamentos</option>';
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    deptSelect.appendChild(option);
                });
            }
            
            console.log(`✅ Cargados ${departments.length} departamentos únicos`);
        }
    } catch (error) {
        console.error('Error cargando departamentos:', error);
    }
}

async function loadCitiesByDepartment() {
    const deptSelect = document.getElementById('departmentFilter');
    const citySelect = document.getElementById('cityFilter');
    const selectedDept = deptSelect?.value;
    
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Cargando ciudades...</option>';
    citySelect.disabled = true;
    
    if (!selectedDept || selectedDept === '') {
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        citySelect.disabled = false;
        return;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('$select', 'distinct ciudad_entidad');
        params.append('$where', `departamento_entidad = '${selectedDept}' AND ciudad_entidad IS NOT NULL AND ciudad_entidad != '' AND ciudad_entidad != 'No Definido'`);
        params.append('$limit', '500');
        
        const url = `${WORKER_URL}?${params.toString()}`;
        console.log('📡 Cargando ciudades desde:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            const citiesSet = new Set();
            data.forEach(item => {
                if (item.ciudad_entidad && item.ciudad_entidad.trim() !== '') {
                    citiesSet.add(item.ciudad_entidad);
                }
            });
            
            const cities = Array.from(citiesSet).sort();
            citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            console.log(`✅ Cargadas ${cities.length} ciudades`);
        }
    } catch (error) {
        console.error('Error cargando ciudades:', error);
        citySelect.innerHTML = '<option value="">Error al cargar ciudades</option>';
    } finally {
        citySelect.disabled = false;
    }
}

function applyFilters() {
    performSearch();
}

function clearFilters() {
    const filterIds = ['entityFilter', 'departmentFilter', 'cityFilter', 'modalityFilter', 'phaseFilter',
                       'statusFilter', 'fromDateFilter', 'toDateFilter', 'minValueFilter', 'maxValueFilter'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    const citySelect = document.getElementById('cityFilter');
    if (citySelect) {
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        citySelect.disabled = false;
    }
    
    performSearch();
}