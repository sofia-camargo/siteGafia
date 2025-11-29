<?php
// api/historico_completo.php
require_once 'db_connection.php';
session_start(); 

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Consulta a View de histórico detalhado, filtrando pelo ID do usuário
    // vw_historico_usuario tem a lista de todas as viagens com detalhes do carro
    $sql = "SELECT 
                dt_consulta,
                cidade_origem,
                cidade_destino,
                km_viagem,
                tempo_viagem,
                qnt_abastecimento,
                nm_marca,
                nm_modelo,
                ano_carro
            FROM vw_historico_usuario 
            WHERE id_usuario = :user_id
            ORDER BY dt_consulta DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    
    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($historico);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("PDO Error in historico_completo: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar o histórico detalhado.']);
}
?>