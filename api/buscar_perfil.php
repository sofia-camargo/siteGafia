<?php
// api/buscar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

$userId = $_SESSION['id_usuario'] ?? $_SESSION['user_id'];

try {
    // CORREÇÃO: Busca os nomes novos e entrega como 'nome' e 'sobrenome' para o JS
    $sql = "SELECT 
                nm_usuario AS nome, 
                sobrenome_usuario AS sobrenome, 
                email, 
                cep, 
                cidade
            FROM usuarios 
            WHERE id_usuario = :id";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $userId]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        echo json_encode($perfil);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
}
?>