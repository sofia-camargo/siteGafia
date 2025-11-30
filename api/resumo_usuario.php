<?php
// api/resumo_usuario.php
require_once 'db_connection.php';
session_start(); 

header('Content-Type: application/json');

// CORREÇÃO: Usando 'id_usuario' ao invés de 'user_id'
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403); 
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$userId = $_SESSION['id_usuario']; // CORRIGIDO

try {
    $sql = "SELECT 
                total_viagens, 
                total_km, 
                total_abastecimentos, 
                media_km_por_viagem, 
                media_tempo_viagem_horas 
            FROM vw_resumo_usuario 
            WHERE id_usuario = :user_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    
    $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resumo) {
        echo json_encode($resumo);
    } else {
        echo json_encode([
            'total_viagens' => 0, 
            'total_km' => 0, 
            'total_abastecimentos' => 0, 
            'media_km_por_viagem' => 0, 
            'media_tempo_viagem_horas' => 0
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>