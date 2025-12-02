<?php
// api/admin_dados.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// 1. Bloqueio de Segurança Rigoroso
// Se não estiver logado OU não for admin, nega o acesso.
if (!isset($_SESSION['logged_in']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado. Apenas administradores.']);
    exit;
}

try {
    $response = [];

    // Dados 1: Usuários e Engajamento (Usa a view vw_empresa_engajamento_usuarios)
    // Limita a 10 para não sobrecarregar a tela inicial
    $sqlUsers = "SELECT * FROM vw_empresa_engajamento_usuarios ORDER BY total_viagens DESC LIMIT 10";
    $stmt = $pdo->query($sqlUsers);
    $response['usuarios'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Dados 2: Viagens por Estado (Usa a view vw_empresa_viagens_por_estado)
    $sqlEstados = "SELECT nm_estado, total_viagens FROM vw_empresa_viagens_por_estado";
    $stmt = $pdo->query($sqlEstados);
    $response['estados'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Dados 3: KPIs Gerais (Contagem simples direta das tabelas)
    $response['kpis'] = [
        'total_users' => $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(), // altere 'usuarios' para 'usuario' se a tabela se chamar 'usuario'
        'total_carros' => $pdo->query("SELECT COUNT(*) FROM carro")->fetchColumn(),
        'total_viagens' => $pdo->query("SELECT COUNT(*) FROM historico_viagem")->fetchColumn()
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar dados administrativos: ' . $e->getMessage()]);
}
?>