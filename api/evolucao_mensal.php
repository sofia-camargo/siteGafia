<?php
// api/evolucao_mensal.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// VERIFICAÇÃO DE SEGURANÇA
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado. Usuário não logado.']);
    exit;
}

$idUsuario = $_SESSION['id_usuario'];

try {
    // Consulta a View de evolução mensal
    $sql = "SELECT mes_ano, km_no_mes, viagens_no_mes FROM vw_evolucao_mensal WHERE id_usuario = :id_usuario ORDER BY mes_ano DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);

    $evolucao = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($evolucao);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro SQL em evolucao_mensal: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar evolução mensal.']);
}
?>