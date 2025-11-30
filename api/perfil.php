<?php
// api/perfil.php
session_start();

// Verificação de segurança
if (!isset($_SESSION['user_id'])) {
    // Se o login.php também estiver na pasta api, use apenas 'login.php'
    // Se o login for um HTML na raiz, use '../login.html'
    header("Location: login.php"); 
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Perfil - Histórico</title>
    <style>
        /* CSS Básico para a página ficar apresentável */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        h1 { color: #2c3e50; margin-bottom: 20px; }
        h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; margin-top: 30px; }
        
        /* Grid dos Cards */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h3 { margin: 0; font-size: 2.5em; font-weight: bold; }
        .card p { margin: 5px 0 0; font-size: 1em; opacity: 0.9; }
        .card.green { background: linear-gradient(135deg, #2af598 0%, #009efd 100%); }

        /* Tabela */
        .table-responsive { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 15px; border-bottom: 1px solid #eee; text-align: left; }
        th { background-color: #f8f9fa; color: #555; font-weight: 600; text-transform: uppercase; font-size: 0.85em; }
        tr:hover { background-color: #f9f9f9; }
        
        .no-data { text-align: center; color: #888; padding: 30px; font-style: italic; }
        
        .header-top { display: flex; justify-content: space-between; align-items: center; }
        .btn-voltar { background-color: #6c757d; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 0.9em; }
        .btn-logout { background-color: #dc3545; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 0.9em; margin-left: 10px; }
        .btn-voltar:hover { background-color: #5a6268; }
        .btn-logout:hover { background-color: #c82333; }
    </style>
</head>
<body>

<div class="container">
    <div class="header-top">
        <h1>Meu Perfil</h1>
        <div>
            <a href="../index.html" class="btn-voltar">Voltar ao Mapa</a>
            <a href="logout.php" class="btn-logout">Sair</a>
        </div>
    </div>
    
    <p>Bem-vindo, <strong><?php echo isset($_SESSION['nome_usuario']) ? $_SESSION['nome_usuario'] : 'Motorista'; ?></strong>!</p>

    <h2>Resumo Geral</h2>
    <div class="dashboard-grid">
        <div class="card">
            <h3 id="resumo-total-viagens"><span style="font-size:0.4em">Carregando...</span></h3>
            <p>Viagens</p>
        </div>
        <div class="card">
            <h3 id="resumo-total-km">-</h3>
            <p>Distância Total</p>
        </div>
        <div class="card">
            <h3 id="resumo-media-km">-</h3>
            <p>Média / Viagem</p>
        </div>
        <div class="card green">
            <h3 id="resumo-abastecimentos">-</h3>
            <p>Recargas Totais</p>
        </div>
    </div>

    <h2>Histórico de Viagens</h2>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Veículo</th>
                    <th>Trajeto</th>
                    <th>Distância</th>
                    <th>Tempo Total</th>
                    <th>Recargas</th>
                </tr>
            </thead>
            <tbody id="tabela-historico">
                <tr><td colspan="6" style="text-align:center; padding: 30px;">Carregando histórico...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        carregarResumo();
        carregarHistorico();
    });

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Como perfil.php está na mesma pasta que resumo_usuario.php,
    // removemos o "api/" da URL.
    
    async function carregarResumo() {
        try {
            const response = await fetch('resumo_usuario.php'); // URL relativa direta
            const dados = await response.json();

            if (dados.error) {
                console.error("Erro API:", dados.error);
                return;
            }

            document.getElementById('resumo-total-viagens').innerText = dados.total_viagens;
            document.getElementById('resumo-total-km').innerText = parseFloat(dados.total_km).toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 1}) + ' km';
            document.getElementById('resumo-media-km').innerText = parseFloat(dados.media_km_por_viagem).toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 1}) + ' km';
            document.getElementById('resumo-abastecimentos').innerText = dados.total_abastecimentos;

        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
        }
    }

    async function carregarHistorico() {
        const tbody = document.getElementById('tabela-historico');
        
        try {
            const response = await fetch('historico_completo.php'); // URL relativa direta
            const listaViagens = await response.json();

            tbody.innerHTML = ''; 

            if (listaViagens.error) {
                tbody.innerHTML = `<tr><td colspan="6" class="no-data">${listaViagens.error}</td></tr>`;
                return;
            }

            if (!listaViagens || listaViagens.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="no-data">Nenhuma viagem registrada. Planeje sua primeira rota!</td></tr>`;
                return;
            }

            listaViagens.forEach(viagem => {
                const tr = document.createElement('tr');
                
                const dataObj = new Date(viagem.dt_consulta);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

                // Tratamento para exibir o tempo corretamente (Postgres Interval vem como string as vezes)
                let tempoExibicao = viagem.tempo_viagem;
                if(viagem.tempo_viagem && viagem.tempo_viagem.hours){ 
                    // Se vier como objeto JSON do Postgres
                    tempoExibicao = `${viagem.tempo_viagem.hours}h ${viagem.tempo_viagem.minutes}m`;
                }

                tr.innerHTML = `
                    <td><strong>${dataFormatada}</strong><br><small>${horaFormatada}</small></td>
                    <td>${viagem.nm_marca} ${viagem.nm_modelo}<br><small>${viagem.ano_carro}</small></td>
                    <td>
                        <span style="color:green">●</span> ${viagem.cidade_origem}<br>
                        <span style="color:red">📍</span> ${viagem.cidade_destino}
                    </td>
                    <td><strong>${parseFloat(viagem.km_viagem).toLocaleString('pt-BR')} km</strong></td>
                    <td>${tempoExibicao}</td>
                    <td>${viagem.qnt_abastecimento > 0 ? viagem.qnt_abastecimento + ' paradas' : 'Direto'}</td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Erro de conexão com o servidor.</td></tr>`;
        }
    }
</script>

</body>
</html>