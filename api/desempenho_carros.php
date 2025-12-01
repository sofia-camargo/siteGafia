<?php
// api/desempenho_carros.php
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
    // Consulta a View de desempenho por carro
    $sql = "SELECT * FROM vw_desempenho_carros WHERE id_usuario = :id_usuario ORDER BY km_total_rodado DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);

    $desempenho = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($desempenho);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro SQL em desempenho_carros: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar desempenho dos veículos.']);
}
?>