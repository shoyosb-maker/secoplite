// ============================================
// GRÁFICOS (Chart.js)
// ============================================

let modalityChart = null;

function processChartData(results) {
    const modalityCount = {};
    results.forEach(process => {
        let modality = process.modalidad_de_contratacion;
        if (!modality || modality === 'No Definido') modality = 'No especificada';
        modalityCount[modality] = (modalityCount[modality] || 0) + 1;
    });
    
    const sorted = Object.entries(modalityCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: sorted.map(item => item[0]), data: sorted.map(item => item[1]) };
}

function renderChart() {
    const canvas = document.getElementById('modalityChart');
    if (!canvas) return;
    
    if (state.results.length === 0) {
        if (modalityChart) { modalityChart.destroy(); modalityChart = null; }
        return;
    }
    
    const chartData = processChartData(state.results);
    if (chartData.labels.length === 0) return;
    
    if (modalityChart) modalityChart.destroy();
    
    const ctx = canvas.getContext('2d');
    modalityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Cantidad de procesos',
                data: chartData.data,
                backgroundColor: 'rgba(1, 45, 29, 0.7)',
                borderColor: '#012d1d',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} procesos` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, title: { display: true, text: 'Cantidad de procesos' } },
                x: { title: { display: true, text: 'Modalidad de contratación' }, ticks: { maxRotation: 45, minRotation: 45 } }
            }
        }
    });
}