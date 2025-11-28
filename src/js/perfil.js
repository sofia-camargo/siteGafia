document.addEventListener('DOMContentLoaded', () => {
    // Protege a página e carrega os dados
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html'; // Redireciona se não houver sessão
            } else {
                carregarPerfil();
            }
        });

    // Evento de submissão do formulário
    document.getElementById('form-perfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosAtualizados = {
            nome: document.getElementById('nome').value,
            sobrenome: document.getElementById('sobrenome').value,
            telefone: document.getElementById('telefone').value,
        };

        const response = await fetch('api/atualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });
        const result = await response.json();
        const mensagemEl = document.getElementById('perfil-mensagem');
        mensagemEl.textContent = result.message || result.error;
    });
});

async function carregarPerfil() {
    const response = await fetch('api/buscar_perfil.php');
    const data = await response.json();
    if(data.error) {
        alert(data.error);
        return;
    }

    // Preenche o formulário com os dados do utilizador
    document.getElementById('nome').value = data.nome;
    document.getElementById('sobrenome').value = data.sobrenome;
    document.getElementById('email').value = data.email;
}

// Função auxiliar para converter horas decimais (ex: 1.5h) para formato HHh MMm
function formatarTempoHoras(horasDecimais) {
    if (horasDecimais <= 0) return '0h 0m';
    const horas = Math.floor(horasDecimais);
    const minutosDecimais = (horasDecimais - horas) * 60;
    const minutos = Math.round(minutosDecimais);
    return `${horas}h ${minutos}m`;
}

// Atualiza o Donut Chart (função adaptada do seu código original)
function atualizarDonut(id, porcentagem) {
    const donut = document.getElementById(id);
    if (!donut) return;

    donut.querySelector("span").textContent = porcentagem + "%";
    // Converte porcentagem para ângulo para o CSS (100% = 360deg)
    donut.style.setProperty("--progress", (porcentagem * 3.6) + "deg");
}

// Função principal para buscar e exibir os dados da View
async function carregarResumoUsuario() {
    const resumoUrl = 'api/resumo_usuario.php';

    try {
        const response = await fetch(resumoUrl);
        const data = await response.json();
        
        if (data.error) {
            console.error("Erro ao carregar resumo:", data.error);
            return;
        }

        // --- 1. ATUALIZAR O BLOCO DE RESUMO (HTML) ---
        const totalKm = parseFloat(data.total_km);
        
        document.getElementById('total-viagens').textContent = data.total_viagens;
        document.getElementById('total-abastecimentos').textContent = data.total_abastecimentos;
        document.getElementById('total-km').textContent = totalKm.toFixed(0);
        document.getElementById('media-tempo').textContent = formatarTempoHoras(data.media_tempo_viagem_horas);
        document.getElementById('media-km').textContent = parseFloat(data.media_km_por_viagem).toFixed(2);
        
        // --- 2. ATUALIZAR OS DONUT CHARTS ---
        // (Replicando a lógica do seu script original, mas com dados dinâmicos)
        
        const limites = {
            viagens: 50,
            recargas: 20,
            km: 500,
            tempo: 600  // 10h em minutos, para o total. Vamos usar o KM Total.
        };
        
        function calcularPorcentagem(valor, limite) {
            return Math.min(Math.round((valor / limite) * 100), 100);
        }

        // Usando os dados da View para popular os Donut Charts
        // Nota: O tempo total não está na vw_resumo_usuario, então uso o KM Total como exemplo.
        
        atualizarDonut("donut-viagens", calcularPorcentagem(data.total_viagens, limites.viagens));
        atualizarDonut("donut-recargas", calcularPorcentagem(data.total_abastecimentos, limites.recargas));
        atualizarDonut("donut-km", calcularPorcentagem(totalKm, limites.km));
        
        // Se a View retornasse o tempo TOTAL (e não a média), você usaria:
        // atualizarDonut("donut-tempo", calcularPorcentagem(tempoTotalEmMinutos, limites.tempo));
        // Como não temos o total, vou usar a média multiplicada por um fator (Apenas um exemplo)
        const tempoMedioEmMinutos = data.media_tempo_viagem_horas * 60;
        atualizarDonut("donut-tempo", calcularPorcentagem(tempoMedioEmMinutos, 60)); // Exemplo: 60 minutos como limite
        

    } catch (error) {
        console.error("Erro de comunicação com a API:", error);
    }
}