<?php
// api/get_modelos.php
require_once 'db_connection.php';
header('Content-Type: application/json');

$idMarca = $_GET['id_marca'] ?? null;

if (!$idMarca) {
    http_response_code(400);
    echo json_encode(['error' => 'ID da marca não fornecido.']);
    exit;
}

try {
    // Busca os modelos associados a um id_marca ordenados pelo nome
    $sql = "SELECT id_modelo, nm_modelo FROM modelo WHERE id_marca = :id_marca ORDER BY nm_modelo";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_marca' => $idMarca]);
    $modelos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($modelos);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar modelos.']);
}
?>