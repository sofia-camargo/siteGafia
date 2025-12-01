<?php
// api/uso_garagem.php
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
    // Consulta a View de uso da garagem
    $sql = "SELECT nm_modelo, viagens_realizadas, total_km_rodados FROM vw_uso_garagem WHERE id_usuario = :id_usuario ORDER BY total_km_rodados DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);

    $uso = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($uso);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro SQL em uso_garagem: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar uso da garagem.']);
}
?>