// Código que conecta com o banco as marcas dos carros para seleção do usuário na página "Meu Perfil"
// Ou seja, quando o usuário for adicionar um veículo à sua garagem, ele poderá escolher a marca do carro a partir dos dados fornecidos por esta API.
<?php
// api/get_marcas.php
require_once 'db_connection.php';
header('Content-Type: application/json');

try {
    
    $sql = "SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca"; // busca todas as marcas ordenadas pelo nome
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($marcas);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar marcas.']);
}
?>
