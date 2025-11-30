<?php
// api/resumo_usuario.php
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
    // Consulta a View de resumo
    $sql = "SELECT 
                total_viagens, 
                total_km, 
                total_abastecimentos, 
                media_km_por_viagem, 
                media_tempo_viagem_horas 
            FROM vw_resumo_usuario 
            WHERE id_usuario = :id_usuario";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);
    
    $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resumo) {
        echo json_encode($resumo);
    } else {
        // Se o usuário nunca viajou, retorna tudo zerado para não dar erro no JS
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
    error_log("Erro SQL em resumo_usuario: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar o resumo.']);
}
?>