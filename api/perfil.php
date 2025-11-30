<?php
// api/perfil.php
session_start();
// Ajuste o caminho do login conforme sua estrutura de pastas
if (!isset($_SESSION['id_usuario'])) { header("Location: ../login.html"); exit; }
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Histórico</title>
    <style>
        body { background-color: #1e0b36; color: white; font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .stats-grid { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin: 40px 0; }
        .text-stats { background: #2a1b4e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .donut-container { text-align: center; }
        .donut {
            width: 100px; height: 100px; border-radius: 50%;
            background: conic-gradient(#a020f0 var(--progress, 0deg), #333 0deg);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 10px; position: relative;
        }
        .donut::before { content: ""; position: absolute; width: 80px; height: 80px; background-color: #1e0b36; border-radius: 50%; }
        .donut span { position: relative; font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; background: #2a1b4e; border-radius: 8px; margin-top: 20px; }
        th, td { padding: 15px; border-bottom: 1px solid #444; text-align: left; }
        th { background: #3b2c63; }
        .btn { display: inline-block; padding: 10px 20px; background: #a020f0; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>

<div class="container">
    <a href="../index.html" class="btn">Voltar ao Mapa</a>
    <h1>Histórico de Viagens</h1>

    <div class="text-stats">
        <p>Total de Viagens: <strong id="total-viagens">0</strong></p>
        <p>Total de KM: <strong id="total-km">0</strong> km</p>
        <p>Total Recargas: <strong id="total-abastecimentos">0</strong></p>
        <p>Média KM/Viagem: <strong id="media-km">0</strong> km</p>
    </div>

    <div class="stats-grid">
        <div class="donut-container">
            <div class="donut" id="donut-viagens" style="--progress: 0deg;"><span>0%</span></div>
            <p>Viagens</p>
        </div>
        <div class="donut-container">
            <div class="donut" id="donut-km" style="--progress: 0deg;"><span>0%</span></div>
            <p>Distância</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Carro</th>
                <th>Trajeto</th>
                <th>Distância</th>
                <th>Tempo</th>
                <th>Recargas</th>
            </tr>
        </thead>
        <tbody id="tabela-historico">
            <tr><td colspan="6">Carregando...</td></tr>
        </tbody>
    </table>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        carregarResumo();
        carregarHistorico();
    });

    async function carregarResumo() {
        try {
            const res = await fetch('resumo_usuario.php');
            const data = await res.json();
            
            if(!data.error) {
                document.getElementById('total-viagens').innerText = data.total_viagens;
                document.getElementById('total-km').innerText = parseFloat(data.total_km).toFixed(0);
                document.getElementById('total-abastecimentos').innerText = data.total_abastecimentos;
                document.getElementById('media-km').innerText = parseFloat(data.media_km_por_viagem).toFixed(1);
                
                // Exemplo visual simples para os donuts
                atualizarDonut('donut-viagens', Math.min(data.total_viagens * 5, 100));
                atualizarDonut('donut-km', Math.min(data.total_km / 10, 100));
            }
        } catch(e) { console.error(e); }
    }

    async function carregarHistorico() {
        const tbody = document.getElementById('tabela-historico');
        try {
            const res = await fetch('historico_completo.php');
            const lista = await res.json();
            
            tbody.innerHTML = '';
            if(!lista || lista.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado.</td></tr>';
                return;
            }

            lista.forEach(item => {
                const tr = document.createElement('tr');
                // Formatação do tempo (Interval Postgres)
                let tempoStr = item.tempo_viagem;
                if(typeof item.tempo_viagem === 'object' && item.tempo_viagem !== null) {
                    tempoStr = `${item.tempo_viagem.hours || 0}h ${item.tempo_viagem.minutes || 0}m`;
                }

                tr.innerHTML = `
                    <td>${new Date(item.dt_consulta).toLocaleDateString('pt-BR')}</td>
                    <td>${item.nm_marca} ${item.nm_modelo}</td>
                    <td>${item.cidade_origem} <br>⬇<br> ${item.cidade_destino}</td>
                    <td>${parseFloat(item.km_viagem).toFixed(1)} km</td>
                    <td>${tempoStr}</td>
                    <td>${item.qnt_abastecimento}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) { 
            tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar.</td></tr>';
        }
    }

    function atualizarDonut(id, val) {
        const el = document.getElementById(id);
        if(el) {
            el.style.setProperty('--progress', (val * 3.6) + 'deg');
            el.querySelector('span').innerText = Math.round(val) + '%';
        }
    }
</script>
</body>
</html>