<?php
require_once 'db_connection.php';
session_start(); 
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Usuário não logado.']);
    exit;
}

try {
    $sql = "SELECT * FROM vw_historico_usuario WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $_SESSION['id_usuario']]);
    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($historico);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
}
?>