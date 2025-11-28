<?php
// api/resumo_usuario.php
require_once 'db_connection.php'; // Usa a conexão PDO existente
session_start(); 

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403); 
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Consulta a View de resumo, filtrando pelo ID do usuário logado
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
        // Retorna valores zerados se não houver histórico
        echo json_encode([
            'total_viagens' => 0, 
            'total_km' => 0.00, 
            'total_abastecimentos' => 0, 
            'media_km_por_viagem' => 0.00, 
            'media_tempo_viagem_horas' => 0.00
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("PDO Error in resumo_usuario: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar o resumo.']);
}
?>