<?php
// api/get_anos_e_carro_id.php
require_once 'db_connection.php';
header('Content-Type: application/json');

$idModelo = $_GET['id_modelo'] ?? null;

if (!$idModelo) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do modelo não fornecido.']);
    exit;
}

try {
    // Busca os anos disponíveis para um modelo, incluindo o id_carro
    $sql = "SELECT id_carro, ano_carro FROM carro WHERE id_modelo = :id_modelo ORDER BY ano_carro DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_modelo' => $idModelo]);
    $carros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['message' => 'Veículo adicionado à sua garagem!']);
    echo json_encode($carros);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar anos.']);
}
?>