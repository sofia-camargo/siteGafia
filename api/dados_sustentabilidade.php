<?php
// api/dados_sustentabilidade.php

require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado.']);
    exit;
}

$userId = $_SESSION['id_usuario'];

try {
    // A query deve ser exatamente esta:
    $sql = "SELECT 
                co2_total_evitado, 
                arvores_equivalentes 
            FROM vw_sustentabilidade 
            WHERE id_usuario = :id_usuario";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $userId]);
    
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dados) {
        $dados = [
            'co2_total_evitado' => 0.0,
            'arvores_equivalentes' => 0
        ];
    }
    
    $dados['co2_total_evitado'] = round((float)$dados['co2_total_evitado'], 2);
    $dados['arvores_equivalentes'] = (int)$dados['arvores_equivalentes'];
    
    echo json_encode($dados);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro SQL em dados_sustentabilidade: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar dados de sustentabilidade.']);
}

?>