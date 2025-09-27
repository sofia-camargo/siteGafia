<?php
// api/login.php

require_once 'db_connection.php';

session_start(); 

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido recebido.']);
    exit;
}

$email = $data['email'] ?? null;
$senha = $data['senha'] ?? null;

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['error' => 'Email e senha são obrigatórios.']);
    exit;
}

try {
    $sql = "SELECT id_usuario, nome, senha FROM usuarios WHERE email = :email";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        $_SESSION['user_id'] = $usuario['id_usuario'];
        $_SESSION['user_name'] = $usuario['nome'];
        $_SESSION['logged_in'] = true;

        http_response_code(200);
        echo json_encode(['message' => 'Login bem-sucedido!']);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou senha inválidos.']);
    }

} catch (PDOException $e) {
    error_log("Erro de banco de dados no login: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocorreu um erro interno no servidor.']);
}
?>