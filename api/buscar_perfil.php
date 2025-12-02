<?php
// api/buscar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica login
if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

// Tenta pegar o ID de uma das duas variáveis de sessão possíveis
$userId = $_SESSION['id_usuario'] ?? $_SESSION['user_id'];

try {
    // Busca TODOS os campos do perfil
    $sql = "SELECT nome, sobrenome, email, telefone, dt_nasc, 
                   cep, endereco, numero, complemento, bairro, cidade, estado 
            FROM usuarios 
            WHERE id_usuario = :id";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $userId]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        echo json_encode($perfil);
    } else {
        // Se não achou o usuário, retorna erro 404
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado no banco.']);
    }
} catch (PDOException $e) {
    // Retorna erro 500 se o SQL falhar (ex: coluna não existe)
    http_response_code(500);
    echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
}
?>