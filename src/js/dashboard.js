// src/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sessão
    try {
        const response = await fetch('api/verificar_sessao.php');
        const session = await response.json();

        if (!session.loggedIn) {
            window.location.href = 'login.html'; // Manda pro login se não tiver logado
            return;
        }

        // Atualiza o nome na saudação
        document.getElementById('user-greeting').textContent = `Olá, ${session.userName}!`;
        
        // 2. Carregar Histórico Recente (Pré-visualização)
        carregarHistoricoRecente();

    } catch (error) {
        console.error('Erro de sessão:', error);
        window.location.href = 'login.html';
    }
});

async function carregarHistoricoRecente() {
    const listaDiv = document.getElementById('lista-historico-recente');
    
    try {
        // Reutilizamos sua API de histórico completo
        const res = await fetch('api/historico_completo.php');
        const viagens = await res.json();

        listaDiv.innerHTML = ''; // Limpa o "Carregando..."

        if (viagens.error || viagens.length === 0) {
            listaDiv.innerHTML = '<p style="color:#aaa; text-align:center;">Nenhuma viagem recente.</p>';
            return;
        }

        // Pega apenas as 3 primeiras viagens
        const ultimasViagens = viagens.slice(0, 3);

        ultimasViagens.forEach(v => {
            const dataFormatada = new Date(v.dt_consulta).toLocaleDateString('pt-BR');
            
            // HTML do item
            const itemHTML = `
                <div class="history-item-mini">
                    <div class="history-icon">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="history-info">
                        <strong>${v.cidade_destino}</strong>
                        <span>${dataFormatada} • ${parseFloat(v.km_viagem).toFixed(0)} km</span>
                    </div>
                </div>
            `;
            listaDiv.innerHTML += itemHTML;
        });

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = '<p style="color:red;">Erro ao carregar.</p>';
    }
}