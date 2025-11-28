document.addEventListener('DOMContentLoaded', () => {
    // 1. Protege a página e carrega os dados
    fetch('api/verificar_sessao.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html'; // Redireciona se não houver sessão
            } else {
                carregarPerfil();
                // Chama a função de resumo após verificar a sessão
                carregarResumoUsuario(); 
            }
        });

    // 2. Evento de submissão do formulário
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Coleta os dados de TODOS os campos (incluindo email e data de nascimento)
            const dadosAtualizados = {
                nome: document.getElementById('nome').value,
                sobrenome: document.getElementById('sobrenome').value,
                email: document.getElementById('email').value,    // Adicionado
                telefone: document.getElementById('telefone').value,
                dt_nasc: document.getElementById('dt_nasc').value  // Adicionado
            };

            const mensagemEl = document.getElementById('perfil-mensagem');
            mensagemEl.textContent = "Salvando...";
            mensagemEl.style.color = "#ccc";

            try {
                const response = await fetch('api/atualizar_perfil.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    mensagemEl.textContent = result.message;
                    mensagemEl.style.color = "#4CAF50"; // Verde (Sucesso)
                } else {
                    mensagemEl.textContent = result.error || "Erro ao salvar.";
                    mensagemEl.style.color = "#ff6b6b"; // Vermelho (Erro)
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                mensagemEl.textContent = "Erro de conexão com o servidor.";
                mensagemEl.style.color = "#ff6b6b";
            }
        });
    }
});

// Função para buscar e preencher os dados do perfil
async function carregarPerfil() {
    try {
        const response = await fetch('api/buscar_perfil.php');
        const data = await response.json();
        
        if(data.error) {
            console.error(data.error);
            return;
        }

        // Preenche o formulário com os dados do utilizador
        // Usamos verificações (if) para evitar erros caso algum campo não exista no HTML
        if(document.getElementById('nome')) document.getElementById('nome').value = data.nome || '';
        if(document.getElementById('sobrenome')) document.getElementById('sobrenome').value = data.sobrenome || '';
        if(document.getElementById('email')) document.getElementById('email').value = data.email || '';
        if(document.getElementById('telefone')) document.getElementById('telefone').value = data.telefone || '';
        if(document.getElementById('dt_nasc')) document.getElementById('dt_nasc').value = data.dt_nasc || '';

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }
}

// Função auxiliar para converter horas decimais (ex: 1.5h) para formato HHh MMm
function formatarTempoHoras(horasDecimais) {
    if (horasDecimais <= 0 || isNaN(horasDecimais)) return '0h 0m';
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

// Função principal para buscar e exibir os dados da View de resumo
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
        
        if(document.getElementById('total-viagens')) document.getElementById('total-viagens').textContent = data.total_viagens || '0';
        if(document.getElementById('total-abastecimentos')) document.getElementById('total-abastecimentos').textContent = data.total_abastecimentos || '0';
        if(document.getElementById('total-km')) document.getElementById('total-km').textContent = totalKm.toFixed(0);
        if(document.getElementById('media-tempo')) document.getElementById('media-tempo').textContent = formatarTempoHoras(data.media_tempo_viagem_horas);
        if(document.getElementById('media-km')) document.getElementById('media-km').textContent = parseFloat(data.media_km_por_viagem).toFixed(2);
        
        // --- 2. ATUALIZAR OS DONUT CHARTS ---
        
        const limites = {
            viagens: 50,
            recargas: 20,
            km: 500,
            tempo: 60 // Limite de 60 minutos (1h) para o exemplo da média
        };
        
        function calcularPorcentagem(valor, limite) {
            return Math.min(Math.round((valor / limite) * 100), 100);
        }

        // Usando os dados da View para popular os Donut Charts
        const tempoMedioEmMinutos = data.media_tempo_viagem_horas * 60;
        
        atualizarDonut("donut-viagens", calcularPorcentagem(data.total_viagens, limites.viagens));
        atualizarDonut("donut-recargas", calcularPorcentagem(data.total_abastecimentos, limites.recargas));
        atualizarDonut("donut-km", calcularPorcentagem(totalKm, limites.km));
        atualizarDonut("donut-tempo", calcularPorcentagem(tempoMedioEmMinutos, limites.tempo)); 

    } catch (error) {
        console.error("Erro de comunicação com a API de resumo:", error);
    }
}