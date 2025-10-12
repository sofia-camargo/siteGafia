<?php
// api/buscar_estados.php

require_once 'db_connection.php';
header('Content-Type: application/json');

try {
    $sql = "SELECT id_estado, nm_estado FROM estado ORDER BY nm_estado ASC";
    $stmt = $pdo->query($sql);
    $estados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($estados);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Não foi possível buscar os estados.']);
}
?>