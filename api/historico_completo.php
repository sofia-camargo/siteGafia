<?php
// api/historico_completo.php
require_once 'db_connection.php';
session_start(); 
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado.']);
    exit;
}

$idUsuario = $_SESSION['id_usuario'];

try {
    // Busca os dados da View
    // Certifique-se que a view vw_historico_usuario existe no banco
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
            WHERE id_usuario = :id_usuario
            ORDER BY dt_consulta DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);
    
    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($historico);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar histórico: ' . $e->getMessage()]);
}
?>