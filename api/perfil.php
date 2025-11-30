<?php
// api/perfil.php
session_start();

// Verificação de segurança: Se não estiver logado, manda para o login
if (!isset($_SESSION['id_usuario'])) {
    // Ajuste o caminho conforme sua estrutura (ex: ../login.html ou login.php)
    header("Location: ../login.html"); 
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Perfil - Gafia</title>
    <style>
        /* --- ESTILOS GERAIS --- */
        body { 
            background-color: #1e0b36; 
            color: white; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 1100px; margin: 0 auto; }
        h1, h2 { color: #fff; font-weight: 600; }
        h2 { border-bottom: 2px solid #444; padding-bottom: 10px; margin-top: 40px; font-size: 1.5em; }
        
        .btn-voltar { 
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #444; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-bottom: 20px; 
            transition: background 0.3s;
        }
        .btn-voltar:hover { background-color: #666; }

        /* --- CARDS DASHBOARD (Resumo e Eco) --- */
        .dashboard-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .card { 
            background: linear-gradient(135deg, #2a1b4e 0%, #150a26 100%); 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.05);
        }
        .card h3 { margin: 0; font-size: 2em; font-weight: bold; }
        .card p { margin: 5px 0 0; font-size: 0.9em; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }

        /* Cores específicas para Eco */
        .card-eco { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #004d40; }
        .card-eco h3 { color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .card-eco p { color: #e0f2f1; opacity: 1; }

        /* --- DONUT CHARTS --- */
        .charts-container {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            background: #2a1b4e;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .donut-wrapper { text-align: center; margin: 10px; }
        .donut {
            width: 100px; height: 100px; border-radius: 50%;
            background: conic-gradient(#a020f0 var(--progress, 0deg), #444 0deg);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 10px; position: relative;
        }
        .donut::before { 
            content: ""; position: absolute; width: 80px; height: 80px; 
            background-color: #2a1b4e; border-radius: 50%; 
        }
        .donut span { position: relative; font-weight: bold; font-size: 1.2em; z-index: 2; }

        /* --- CARDS DE CARROS --- */
        .car-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            text-align: left;
        }
        .car-info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9em; }

        /* --- LISTAS (Top Destinos) --- */
        .list-box { background: #2a1b4e; padding: 0 20px; border-radius: 12px; }
        .list-item { padding: 15px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; }
        .list-item:last-child { border-bottom: none; }

        /* --- TABELA --- */
        .table-responsive { overflow-x: auto; border-radius: 12px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; background: #2a1b4e; min-width: 600px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #444; }
        th { background-color: #3b2c63; font-weight: 600; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; }
        tr:hover { background-color: #32215e; }
        .no-data { text-align: center; color: #aaa; padding: 30px; font-style: italic; }
    </style>
</head>
<body>

<div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center">
        <h1>Olá, <?php echo isset($_SESSION['nome_usuario']) ? $_SESSION['nome_usuario'] : 'Motorista'; ?>!</h1>
        <a href="../index.html" class="btn-voltar">← Voltar ao Mapa</a>
    </div>

    <h2>Resumo da Jornada</h2>
    <div class="dashboard-grid">
        <div class="card">
            <h3 id="total-viagens">0</h3>
            <p>Viagens</p>
        </div>
        <div class="card">
            <h3 id="total-km">0 km</h3>
            <p>Distância Total</p>
        </div>
        <div class="card">
            <h3 id="total-abastecimentos">0</h3>
            <p>Recargas</p>
        </div>
    </div>

    <h2>Impacto Ecológico 🌱</h2>
    <div class="dashboard-grid">
        <div class="card card-eco">
            <h3 id="eco-co2">0 kg</h3>
            <p>CO₂ Evitado</p>
        </div>
        <div class="card card-eco">
            <h3 id="eco-arvores">0</h3>
            <p>Árvores "Salvas"</p>
        </div>
    </div>

    <h2>Estatísticas Visuais</h2>
    <div class="charts-container">
        <div class="donut-wrapper">
            <div class="donut" id="donut-viagens" style="--progress: 0deg;"><span>0%</span></div>
            <p>Meta Viagens</p>
        </div>
        <div class="donut-wrapper">
            <div class="donut" id="donut-km" style="--progress: 0deg;"><span>0%</span></div>
            <p>Meta Km</p>
        </div>
    </div>

    <h2>Desempenho da Garagem 🏎️</h2>
    <div id="container-carros" class="dashboard-grid">
        <p style="text-align:center; width:100%; color:#aaa">Carregando seus veículos...</p>
    </div>

    <h2>Destinos Favoritos 📍</h2>
    <div class="list-box">
        <div id="lista-top-destinos">
            <div class="list-item"><span>Carregando...</span></div>
        </div>
    </div>

    <h2>Histórico Detalhado</h2>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Veículo</th>
                    <th>Trajeto</th>
                    <th>Distância