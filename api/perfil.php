<?php
session_start();
if (!isset($_SESSION['id_usuario'])) {
    // Redireciona se não estiver logado
    header("Location: ../login.html"); 
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Perfil Gafia</title>
    <style>
        /* Estilos escuros baseados na sua imagem */
        body { background-color: #1e0b36; color: white; font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        
        /* Layout dos Donuts */
        .stats-grid { display: flex; justify-content: space-around; margin: 40px 0; flex-wrap: wrap; gap: 20px;}
        .donut-container { text-align: center; }
        
        /* CSS do Donut Chart */
        .donut {
            width: 100px; height: 100px; border-radius: 50%;
            background: conic-gradient(#a020f0 var(--progress, 0deg), #333 0deg);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 10px; position: relative;
        }
        .donut::before {
            content: ""; position: absolute; width: 80px; height: 80px;
            background-color: #1e0b36; border-radius: 50%;
        }
        .donut span { position: relative; font-weight: bold; font-size: 1.2em; }

        /* Lista de texto à esquerda */
        .text-stats { background: #2a1b4e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .text-stats p { margin: 10px 0; font-size: 1.1em; }
        
        /* Tabela */
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #2a1b4e; border-radius: 8px; overflow: hidden; }
        th { background-color: #3b2c63; text-align: left; padding: 15px; }
        td { padding: 15px; border-bottom: 1px solid #444; }
        .btn-voltar { display: inline-block; margin-bottom: 20px; color: #ccc; text-decoration: none; }
    </style>
</head>
<body>

<div class="container">
    <a href="../index.html" class="btn-voltar">← Voltar para o Mapa</a>
    <h1>Histórico de Atividades</h1>

    <div class="text-stats">
        <p>• Total de rotas percorridas: <strong id="total-viagens">0</strong></p>
        <p>• Total de abastecimentos: <strong id="total-abastecimentos">0</strong></p>
        <p>• Total de Km rodados: <strong id="total-km">0</strong> km</p>
        <p>• Média KM por Viagem: <strong id="media-km">0.00</strong> km</p>
        <p>• Tempo Médio por Viagem: <strong id="media-tempo">0h 0m</strong></p>
    </div>

    <div class="stats-grid">
        <div class="donut-container">
            <div class="donut" id="donut-viagens" style="--progress: 0deg;"><span>0%</span></div>
            <p>Viagens</p>
        </div>
        <div class="donut-container">
            <div class="donut" id="donut-recargas" style="--progress: 0deg;"><span>0%</span></div>
            <p>Recargas</p>
        </div>
        <div class="donut-container">
            <div class="donut" id="donut-km" style="--progress: 0deg;"><span>0%</span></div>
            <p>Km Rodados</p>
        </div>
        <div class="donut-container">
            <div class="donut" id="donut-tempo" style="--progress: 0deg;"><span>0%</span></div>
            <p>Tempo Médio</p>
        </div>
    </div>

    <h3>Detalhes de Todas as Viagens</h3>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Origem/Destino</th>
                <th>Veículo</th>
                <th>KM</th>
                <th>Tempo</th>
                <th>Recargas</th>
            </tr>
        </thead>
        <tbody id="tabela-historico">
            </tbody>
    </table>
</div>

<script>
    // Sobrescreve as funções de fetch para garantir o caminho correto
    // já que estamos dentro da pasta "api"
    
    async function carregarResumoUsuario() {
        // Removemos o "api/" do fetch porque já estamos na pasta api
        try {
            const response = await fetch('resumo_usuario.php'); 
            const data = await response.json();
            
            if (data.error) { console.error(data.error); return; }

            // Atualiza texto
            document.getElementById('total-viagens').innerText = data.total_viagens || 0;
            document.getElementById('total-abastecimentos').innerText = data.total_abastecimentos || 0;
            document.getElementById('total-km').innerText = parseFloat(data.total_km).toFixed(0);
            document.getElementById('media-km').innerText = parseFloat(data.media_km_por_viagem).toFixed(2);
            
            // Atualiza Donuts (Lógica simplificada para visualização imediata)
            atualizarDonut('donut-viagens', Math.min(data.total_viagens * 2, 100)); // Exemplo visual
            atualizarDonut('donut-km', Math.min(data.total_km / 10, 100));
        } catch (e) { console.error("Erro resumo:", e); }
    }

    async function carregarHistorico() {
        const tbody = document.getElementById('tabela-historico');
        try {
            const response = await fetch('historico_completo.php');
            const dados = await response.json();
            
            tbody.innerHTML = '';
            if (!dados || dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhum histórico encontrado.</td></tr>';
                return;
            }
            
            dados.forEach(via => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(via.dt_consulta).toLocaleDateString('pt-BR')}</td>
                    <td>${via.cidade_origem} <br>⬇<br> ${via.cidade_destino}</td>
                    <td>${via.nm_marca} ${via.nm_modelo}</td>
                    <td>${parseFloat(via.km_viagem).toFixed(1)} km</td>
                    <td>${via.tempo_viagem}</td>
                    <td>${via.qnt_abastecimento}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) { console.error("Erro historico:", e); }
    }

    function atualizarDonut(id, percent) {
        const el = document.getElementById(id);
        if(el) {
            el.style.setProperty('--progress', (percent * 3.6) + 'deg');
            el.querySelector('span').innerText = Math.round(percent) + '%';
        }
    }

    // Inicia ao carregar
    document.addEventListener('DOMContentLoaded', () => {
        carregarResumoUsuario();
        carregarHistorico();
    });
</script>

</body>
</html>