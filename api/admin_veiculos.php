<?php
// api/admin_veiculos.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// 1. Segurança: Apenas Admin
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- LISTAR TODOS OS CARROS (GET) ---
if ($method === 'GET') {
    try {
        $sql = "SELECT c.id_carro, c.ano_carro, c.dur_bat, m.nm_marca, mo.nm_modelo, c.id_marca, c.id_modelo
                FROM carro c
                JOIN marca m ON c.id_marca = m.id_marca
                JOIN modelo mo ON c.id_modelo = mo.id_modelo
                ORDER BY c.id_carro DESC";
        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// --- CADASTRAR NOVO CARRO (POST) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Simplificação: Assume que o admin envia IDs de marca/modelo existentes.
    // Para um sistema completo, precisaria criar Marcas/Modelos se não existissem.
    try {
        $sql = "INSERT INTO carro (ano_carro, dur_bat, id_marca, id_modelo) 
                VALUES (:ano, :bateria, :marca, :modelo)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':ano' => $data['ano'],
            ':bateria' => $data['bateria'],
            ':marca' => $data['id_marca'],
            ':modelo' => $data['id_modelo']
        ]);
        echo json_encode(['message' => 'Veículo cadastrado com sucesso!']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao cadastrar: ' . $e->getMessage()]);
    }
}

// --- ATUALIZAR VEÍCULO (PUT) ---
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data['id_carro']) {
        http_response_code(400); echo json_encode(['error' => 'ID necessário']); exit;
    }

    try {
        $sql = "UPDATE carro SET 
                ano_carro = :ano, 
                dur_bat = :bateria,
                id_marca = :marca,
                id_modelo = :modelo
                WHERE id_carro = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':ano' => $data['ano'],
            ':bateria' => $data['bateria'],
            ':marca' => $data['id_marca'],
            ':modelo' => $data['id_modelo'],
            ':id' => $data['id_carro']
        ]);
        echo json_encode(['message' => 'Veículo atualizado!']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar: ' . $e->getMessage()]);
    }
}
?>