<?php
// api/buscar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// 1. Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Usuário não logado.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // 2. Busca os dados. 
    // ATENÇÃO: Verifique se o nome da sua tabela no banco é 'usuario' ou 'usuarios'.
    // Baseado no seu 'cadastro.php', parece ser 'usuarios'.
    $sql = "SELECT nome, sobrenome, email, telefone, dt_nasc FROM usuarios WHERE id_usuario = :id";
    
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
    error_log("Erro ao buscar perfil: " . $e->getMessage());
    echo json_encode(['error' => 'Erro interno ao buscar dados.']);
}
?>