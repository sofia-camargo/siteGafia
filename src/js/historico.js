// src/js/historico.js

document.addEventListener('DOMContentLoaded', () => {
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (session.loggedIn) {
                // Carrega todas as novas seções
                carregarResumoUsuario();
                carregarHistoricoDetalhado();
                carregarGraficosFrota(); // Essa função cria os 4 gráficos novos
            } else {
                window.location.href = 'login.html'; 
            }
        })
        .catch(error => console.error('Erro de sessão:', error));
});

// --- 1. RESUMO GERAL (Topo da página) ---
async function carregarResumoUsuario() {
    try {
        const response = await fetch('api/resumo_usuario.php');
        const data = await response.json();
        
        if (!data.error) {
            document.getElementById('total-viagens').textContent = data.total_viagens || 0;
            document.getElementById('total-km').textContent = parseFloat(data.total_km || 0).toFixed(0) + ' km';
            document.getElementById('total-abastecimentos').textContent = data.total_abastecimentos || 0;
        }
    } catch (e) { console.error("Erro resumo:", e); }
}

// --- 2. GRÁFICOS E TABELA DE DESEMPENHO (Meio da página) ---
async function carregarGraficosFrota() {
    try {
        // Usa a view atualizada que tem todos os dados (tempo, recargas, km)
        const response = await fetch('api/desempenho_carros.php');
        const dados = await response.json();

        if (dados.error || dados.length === 0) return;

        // Preencher Tabela de Desempenho
        const tbody = document.getElementById('tabela-desempenho').querySelector('tbody');
        tbody.innerHTML = '';
        
        // Arrays para alimentar os Gráficos
        const labels = [];
        const dataViagens = [];
        const dataKM = [];
        const dataTempo = [];
        const dataRecargas = [];

        dados.forEach(carro => {
            // Preenche a Tabela
            const row = tbody.insertRow();
            row.insertCell().textContent = carro.nome_veiculo;
            row.insertCell().textContent = `${parseFloat(carro.km_total_rodado).toFixed(0)} km`;
            row.insertCell().textContent = carro.total_viagens;
            row.insertCell().textContent = `${carro.total_horas} h`;
            row.insertCell().textContent = carro.total_recargas;

            // Preenche os Arrays dos Gráficos
            // Pega apenas a primeira parte do nome para o gráfico não ficar poluido
            labels.push(carro.nome_veiculo.split(' ')[0]); 
            dataViagens.push(carro.total_viagens);
            dataKM.push(parseFloat(carro.km_total_rodado));
            dataTempo.push(parseFloat(carro.total_horas));
            dataRecargas.push(carro.total_recargas);
        });

        // Configuração Visual Comum dos Gráficos
        const cores = ['#ff2efc', '#9b5cff', '#34d399', '#fbbf24', '#f87171'];
        const commonOptions = {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#ddd' }, grid: { color: '#ffffff1a' } },
                x: { ticks: { color: '#ddd' }, grid: { display: false } }
            }
        };

        // 1. Gráfico de Viagens (Barra Vertical)
        new Chart(document.getElementById('chartViagens'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Viagens', data: dataViagens, backgroundColor: '#ff2efc', borderRadius: 5 }]
            },
            options: commonOptions
        });

        // 2. Gráfico de KM (Rosca/Donut)
        new Chart(document.getElementById('chartKM'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ 
                    data: dataKM, 
                    backgroundColor: cores,
                    borderColor: '#2b0e47',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
            }
        });

        // 3. Gráfico de Tempo (Barra Horizontal)
        new Chart(document.getElementById('chartTempo'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Horas', data: dataTempo, backgroundColor: '#34d399', borderRadius: 5 }]
            },
            options: { ...commonOptions, indexAxis: 'y' } // 'y' faz a barra ficar deitada
        });

        // 4. Gráfico de Recargas (Pizza/Pie)
        new Chart(document.getElementById('chartRecargas'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{ 
                    data: dataRecargas, 
                    backgroundColor: cores,
                    borderColor: '#2b0e47',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
            }
        });

    } catch (e) { console.error("Erro ao gerar gráficos:", e); }
}

// --- 3. HISTÓRICO DETALHADO (Lista no final da página) ---
async function carregarHistoricoDetalhado() {
    const tbody = document.getElementById('tabela-historico').querySelector('tbody');
    const loading = document.getElementById('historico-loading');

    try {
        const response = await fetch('api/historico_completo.php');
        const historico = await response.json();
        
        loading.style.display = 'none';
        tbody.innerHTML = '';

        if (!historico || historico.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhuma viagem encontrada.</td></tr>';
            return;
        }

        historico.forEach(v => {
            const row = tbody.insertRow();
            
            // Formata data
            const dataF = new Date(v.dt_consulta).toLocaleDateString('pt-BR');
            
            row.insertCell().textContent = dataF;
            
            // Formata trajeto com setinha
            row.insertCell().innerHTML = `
                <div style="font-weight:600; color:#fff">${v.cidade_destino}</div>
                <div style="font-size:0.85rem; color:#aaa">De: ${v.cidade_origem}</div>
            `;
            
            row.insertCell().textContent = `${v.nm_marca} ${v.nm_modelo}`;
            row.insertCell().textContent = `${parseFloat(v.km_viagem).toFixed(1)} km`;
        });

    } catch (e) { 
        loading.textContent = 'Erro ao carregar histórico.';
        console.error(e); 
    }
}