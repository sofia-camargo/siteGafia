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
    $sql = "SELECT * FROM vw_resumo_usuario WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $_SESSION['id_usuario']]);
    $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resumo) {
        echo json_encode($resumo);
    } else {
        // Retorna zerado se não achar
        echo json_encode([
            'total_viagens' => 0, 'total_km' => 0, 'total_abastecimentos' => 0,
            'media_km_por_viagem' => 0, 'media_tempo_viagem_horas' => 0
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
}
?>