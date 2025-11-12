<?php
// api/get_marcas.php
// NÃO USAR EM PRODUÇÃO, SOMENTE PARA DEBUG!
require_once 'db_connection.php';
header('Content-Type: application/json');

try {
    // Tenta buscar os dados
    $sql = "SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($marcas);

} catch (PDOException $e) {
    // 🚨 Aqui é onde você vê o erro real:
    http_response_code(500);
    echo json_encode(['error' => 'ERRO DE DEBUG: ' . $e->getMessage()]);
    // Volte a linha abaixo quando for para produção:
    // echo json_encode(['error' => 'Erro ao buscar marcas.']);
}
?>