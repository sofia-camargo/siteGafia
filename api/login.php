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
    // --- ALTERAÇÃO: Adicionado 'is_admin' na seleção ---
    $sql = "SELECT id_usuario, nome, senha, is_admin FROM usuarios WHERE email = :email";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verifica se o utilizador existe E se a senha digitada corresponde ao hash no banco de dados
    if ($usuario && password_verify($senha, $usuario['senha'])) {
        
        // Segurança: Regenerar ID da sessão para evitar fixação
        session_regenerate_id(true);

        // Sucesso! Inicia a sessão
        $_SESSION['user_id'] = $usuario['id_usuario'];
        $_SESSION['user_name'] = $usuario['nome'];
        $_SESSION['logged_in'] = true;
        $_SESSION['id_usuario'] = $usuario['id_usuario'];

        // --- ALTERAÇÃO: Salva status de admin na sessão ---
        // Garante que seja um valor booleano (true/false)
        $_SESSION['is_admin'] = (bool)$usuario['is_admin']; 

        http_response_code(200);
        
        // Retorna também a flag is_admin para o frontend, se necessário
        echo json_encode([
            'message' => 'Login bem-sucedido!',
            'is_admin' => $_SESSION['is_admin']
        ]);
    } else {
        // Falha (utilizador não encontrado ou senha incorrecta)
        http_response_code(401);
        echo json_encode(['error' => 'Email ou senha inválidos.']);
    }

} catch (PDOException $e) {
    error_log("Erro de banco de dados no login: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocorreu um erro interno no servidor.']);
}
?>