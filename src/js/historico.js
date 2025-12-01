document.addEventListener('DOMContentLoaded', () => {
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (session.loggedIn) {
                carregarResumoUsuario();
                carregarHistoricoDetalhado();
                carregarDesempenhoCarros();
                carregarUsoGaragem();
                carregarEvolucaoMensal();
            } else {
                window.location.href = 'login.html'; 
            }
        })
        .catch(error => console.error('Erro de sessão:', error));
});

function formatarTempoHoras(horasDecimais) {
    if (horasDecimais === null || horasDecimais <= 0) return '0h 0m';
    
    const horas = Math.floor(horasDecimais);
    const minutosDecimais = (horasDecimais - horas) * 60;
    const minutos = Math.round(minutosDecimais);
    return `${horas}h ${minutos}m`;
}

function formatarTempoInterval(intervalStr) {
    if (!intervalStr) return '0m';
    
    const timeMatch = intervalStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    let totalSeconds = 0;
    
    if (timeMatch) {
        totalSeconds += parseInt(timeMatch[1]) * 3600;
        totalSeconds += parseInt(timeMatch[2]) * 60;
        totalSeconds += parseInt(timeMatch[3]);
    }

    const daysMatch = intervalStr.match(/(\d+)\s+day/);
    if (daysMatch) {
        totalSeconds += parseInt(daysMatch[1]) * 24 * 3600;
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let output = [];
    if (hours > 0) output.push(`${hours}h`);
    if (minutes > 0) output.push(`${minutes}m`);

    return output.join(' ') || '0m';
}

function atualizarDonut(id, porcentagem) {
    const donut = document.getElementById(id);
    if (!donut) return;

    const finalPorcentagem = Math.min(Math.max(porcentagem, 0), 100);

    donut.querySelector("span").textContent = finalPorcentagem + "%";
    donut.style.setProperty("--progress", (finalPorcentagem * 3.6) + "deg");
}

async function carregarResumoUsuario() {
    const resumoUrl = 'api/resumo_usuario.php';

    document.getElementById('total-viagens').textContent = '...';
    document.getElementById('total-abastecimentos').textContent = '...';
    document.getElementById('total-km').textContent = '...';
    document.getElementById('media-km').textContent = '...';
    document.getElementById('media-tempo').textContent = '...';

    try {
        const response = await fetch(resumoUrl);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        const totalKm = parseFloat(data.total_km);
        const mediaTempoHoras = parseFloat(data.media_tempo_viagem_horas);
        
        document.getElementById('total-viagens').textContent = data.total_viagens;
        document.getElementById('total-abastecimentos').textContent = data.total_abastecimentos;
        document.getElementById('total-km').textContent = totalKm.toFixed(0) + ' km';
        document.getElementById('media-km').textContent = parseFloat(data.media_km_por_viagem).toFixed(2) + ' km'; 
        document.getElementById('media-tempo').textContent = formatarTempoHoras(mediaTempoHoras);
        
        const limites = { viagens: 50, recargas: 20, km: 5000 };
        
        function calcularPorcentagem(valor, limite) {
            const valorCalculo = Math.min(valor, limite); 
            return Math.round((valorCalculo / limite) * 100);
        }

        atualizarDonut("donut-viagens", calcularPorcentagem(data.total_viagens, limites.viagens));
        atualizarDonut("donut-recargas", calcularPorcentagem(data.total_abastecimentos, limites.recargas));
        atualizarDonut("donut-km", calcularPorcentagem(totalKm, limites.km));
        
        const kmPorAbastecimento = totalKm / Math.max(data.total_abastecimentos, 1);
        atualizarDonut("donut-tempo", calcularPorcentagem(kmPorAbastecimento, 100)); 
        document.querySelector('#donut-tempo + p').textContent = 'KM por Recarga'; 

    } catch (error) {
        console.error("Erro ao carregar resumo:", error);
        document.getElementById('total-viagens').textContent = 'N/A';
        document.getElementById('total-abastecimentos').textContent = 'N/A';
        document.getElementById('total-km').textContent = 'N/A';
        document.getElementById('media-km').textContent = 'N/A';
        document.getElementById('media-tempo').textContent = 'N/A';
    }
}

async function carregarHistoricoDetalhado() {
    const historicoUrl = 'api/historico_completo.php';
    const tbody = document.getElementById('tabela-historico').querySelector('tbody');
    const loadingMessage = document.getElementById('historico-loading');

    tbody.innerHTML = ''; 
    loadingMessage.style.display = 'block';

    try {
        const response = await fetch(historicoUrl);
        const historico = await response.json();
        
        loadingMessage.style.display = 'none';

        if (historico.error) throw new Error(historico.error);

        if (historico.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ddd;">Nenhum histórico de viagem encontrado.</td></tr>`;
            return;
        }

        historico.forEach(viagem => {
            const row = tbody.insertRow();
            
            const dtConsulta = new Date(viagem.dt_consulta).toLocaleDateString('pt-BR');
            row.insertCell().textContent = dtConsulta;
            
            row.insertCell().textContent = `${viagem.cidade_origem} -> ${viagem.cidade_destino}`;
            
            row.insertCell().textContent = `${viagem.nm_marca} ${viagem.nm_modelo} (${viagem.ano_carro})`;
            
            row.insertCell().textContent = `${parseFloat(viagem.km_viagem).toFixed(2)} km`;
            
            row.insertCell().textContent = formatarTempoInterval(viagem.tempo_viagem);
            
            row.insertCell().textContent = viagem.qnt_abastecimento;
        });

    } catch (error) {
        loadingMessage.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff6b6b;">Erro ao carregar histórico: ${error.message}</td></tr>`;
        console.error("Erro na comunicação com a API de histórico:", error);
    }
}


async function carregarDesempenhoCarros() {
    const desempenhoUrl = 'api/desempenho_carros.php';
    const tbody = document.getElementById('tabela-desempenho').querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ddd;">Carregando desempenho...</td></tr>'; 

    try {
        const response = await fetch(desempenhoUrl);
        const desempenho = await response.json();
        
        tbody.innerHTML = ''; 

        if (desempenho.error) throw new Error(desempenho.error);

        if (desempenho.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ddd;">Nenhum carro com histórico de viagem.</td></tr>`;
            return;
        }

        desempenho.forEach(d => {
            const row = tbody.insertRow();
            row.insertCell().textContent = d.nome_veiculo;
            row.insertCell().textContent = `${parseFloat(d.km_total_rodado).toFixed(0)} km`;
            row.insertCell().textContent = d.total_viagens;
            row.insertCell().textContent = `${parseFloat(d.velocidade_media_geral).toFixed(1)} km/h`;
            row.insertCell().textContent = `${parseFloat(d.km_por_paragem_recarga).toFixed(1)} km/recarga`;
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ff6b6b;">Erro ao carregar desempenho.</td></tr>`;
        console.error("Erro na comunicação com a API de desempenho:", error);
    }
}

let usoGaragemChartInstance; 

async function carregarUsoGaragem() {
    const usoUrl = 'api/uso_garagem.php';
    const chartCtx = document.getElementById('usoGaragemChart');
    const loadingMessage = document.getElementById('loading-uso-garagem');
    loadingMessage.style.display = 'block';

    try {
        const response = await fetch(usoUrl);
        const uso = await response.json();
        
        loadingMessage.style.display = 'none';

        if (uso.error) throw new Error(uso.error);

        if (uso.length === 0) {
             chartCtx.style.display = 'none';
             loadingMessage.textContent = 'Adicione carros e viaje para ver o comparativo.';
             loadingMessage.style.display = 'block';
            return;
        }
        
        if (usoGaragemChartInstance) usoGaragemChartInstance.destroy();

        const labels = uso.map(item => `${item.nm_modelo} (${item.total_km_rodados} km)`);
        const dataKm = uso.map(item => parseFloat(item.total_km_rodados));
        
        const backgroundColors = [
            'rgba(255, 99, 132, 0.8)', 
            'rgba(54, 162, 235, 0.8)', 
            'rgba(255, 206, 86, 0.8)', 
            'rgba(75, 192, 192, 0.8)', 
            'rgba(153, 102, 255, 0.8)', 
            'rgba(255, 159, 64, 0.8)' 
        ];

        usoGaragemChartInstance = new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'KM Rodados',
                    data: dataKm,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'white' }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });

    } catch (error) {
        loadingMessage.textContent = 'Erro ao carregar gráfico.';
        console.error("Erro na comunicação com a API de uso da garagem:", error);
    }
}

async function carregarEvolucaoMensal() {
    const evolucaoUrl = 'api/evolucao_mensal.php';
    const tbody = document.getElementById('tabela-evolucao').querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ddd;">Carregando evolução...</td></tr>'; 

    try {
        const response = await fetch(evolucaoUrl);
        const evolucao = await response.json();
        
        tbody.innerHTML = ''; 

        if (evolucao.error) throw new Error(evolucao.error);

        if (evolucao.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ddd;">Nenhum histórico mensal registrado.</td></tr>`;
            return;
        }

        evolucao.forEach(e => {
            const row = tbody.insertRow();
            row.insertCell().textContent = e.mes_ano;
            row.insertCell().textContent = `${parseFloat(e.km_no_mes).toFixed(0)} km`;
            row.insertCell().textContent = e.viagens_no_mes;
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ff6b6b;">Erro ao carregar evolução mensal.</td></tr>`;
        console.error("Erro na comunicação com a API de evolução:", error);
    }
}