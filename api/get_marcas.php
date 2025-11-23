<?php

require_once 'db_connection.php';
header('Content-Type: application/json');

try {
    // Tenta buscar os dado
    $sql = "SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($marcas);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'ERRO DE DEBUG: ' . $e->getMessage()]);
}
?>