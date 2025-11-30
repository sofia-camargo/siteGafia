<?php
// api/historico_completo.php
require_once 'db_connection.php';
session_start(); 

header('Content-Type: application/json');

// CORREÇÃO: Usando 'id_usuario'
if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Usuario nao logado']);
    exit;
}

$userId = $_SESSION['id_usuario']; // CORRIGIDO

try {
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
    echo json_encode(['error' => 'Erro ao buscar historico']);
}
?>