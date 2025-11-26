<?php
// api/buscar_perfil.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Busca os dados que existem na tabela 'usuarios' ou 'usuario'
    $sql = "SELECT nome, sobrenome, email, telefone, dt_nasc FROM usuarios WHERE id_usuario = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $userId]);
    
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        echo json_encode($perfil);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Perfil não encontrado.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar dados: ' . $e->getMessage()]);
}
?>