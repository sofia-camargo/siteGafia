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
    // CORREÇÃO: Usando os nomes exatos da sua View (vw_sustentabilidade)
    $sql = "SELECT 
                kg_co2_poupados, 
                arvores_equivalentes 
            FROM vw_sustentabilidade 
            WHERE id_usuario = :id_usuario";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $userId]);
    
    $dados = $stmt->fetch(PDO::FETCH_ASSOC);

    // Se não tiver dados (usuário novo), retorna zeros
    if (!$dados) {
        $dados = [
            'kg_co2_poupados' => 0,
            'arvores_equivalentes' => 0
        ];
    }
    
    echo json_encode($dados);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar dados de sustentabilidade: ' . $e->getMessage()]);
}
?>