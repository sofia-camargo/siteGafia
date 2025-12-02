<?php
// api/admin_dados.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Bloqueio de Segurança
if (!isset($_SESSION['logged_in']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado. Apenas administradores.']);
    exit;
}

try {
    $response = [];

    // 1. Dados de Usuários (Top 10 engajados)
    $sqlUsers = "SELECT * FROM vw_empresa_engajamento_usuarios ORDER BY total_viagens DESC LIMIT 10";
    $stmt = $pdo->query($sqlUsers);
    $response['usuarios'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. ALTERAÇÃO: Dados de Destinos (Top 10 Cidades mais visitadas)
    // Substitui a antiga consulta de estados
    $sqlDestinos = "SELECT cidade_destino, total_viagens FROM vw_empresa_viagens_por_destino LIMIT 10";
    $stmt = $pdo->query($sqlDestinos);
    $response['destinos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. KPIs Gerais
    $response['kpis'] = [
        'total_users' => $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(),
        'total_carros' => $pdo->query("SELECT COUNT(*) FROM carro")->fetchColumn(),
        'total_viagens' => $pdo->query("SELECT COUNT(*) FROM historico_viagem")->fetchColumn()
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
}
?>