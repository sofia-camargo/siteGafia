// src/js/historico.js

document.addEventListener('DOMContentLoaded', () => {
    // Assegurando que o usuário está logado (como em src/js/perfil.js)
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (session.loggedIn) {
                carregarResumoUsuario();
                carregarHistoricoDetalhado();
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

// Converte o formato de intervalo do PostgreSQL para uma string legível
function formatarTempoInterval(intervalStr) {
    if (!intervalStr) return '0m';
    
    // Simplificado para buscar HH:MM:SS ou 00:00:00
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

// Atualiza o Donut Chart
function atualizarDonut(id, porcentagem) {
    const donut = document.getElementById(id);
    if (!donut) return;

    const finalPorcentagem = Math.min(Math.max(porcentagem, 0), 100);

    donut.querySelector("span").textContent = finalPorcentagem + "%";
    donut.style.setProperty("--progress", (finalPorcentagem * 3.6) + "deg");
}

async function carregarResumoUsuario() {
    const resumoUrl = 'api/resumo_usuario.php';

    // Coloca placeholders para indicar que está carregando
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
        document.getElementById('media-km').textContent = parseFloat(data.media_km_por_viagem).toFixed(2);
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
        atualizarDonut("donut-tempo", calcularPorcentagem(kmPorAbastecimento, 100)); // Meta: 100 km/recarga
        document.querySelector('#donut-tempo + p').textContent = 'KM por Recarga'; // Altera o rótulo

    } catch (error) {
        console.error("Erro ao carregar resumo:", error);
        // Em caso de erro, zera os valores ou mostra N/A
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

        // Popula a tabela
        historico.forEach(viagem => {
            const row = tbody.insertRow();
            
            // Data
            const dtConsulta = new Date(viagem.dt_consulta).toLocaleDateString('pt-BR');
            row.insertCell().textContent = dtConsulta;
            
            // Origem/Destino
            row.insertCell().textContent = `${viagem.cidade_origem} -> ${viagem.cidade_destino}`;
            
            // Veículo
            row.insertCell().textContent = `${viagem.nm_marca} ${viagem.nm_modelo} (${viagem.ano_carro})`;
            
            // KM
            row.insertCell().textContent = `${parseFloat(viagem.km_viagem).toFixed(2)} km`;
            
            // Tempo
            row.insertCell().textContent = formatarTempoInterval(viagem.tempo_viagem);
            
            // Recargas
            row.insertCell().textContent = viagem.qnt_abastecimento;
        });

    } catch (error) {
        loadingMessage.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff6b6b;">Erro ao carregar histórico: ${error.message}</td></tr>`;
        console.error("Erro na comunicação com a API de histórico:", error);
    }
}