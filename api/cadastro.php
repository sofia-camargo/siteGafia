<?php
// api/cadastro.php

require_once 'db_connection.php';
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

// Campos alinhados com o JS e HTML (sem estado)
$nome = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$email = $data['email'] ?? null;
$senha = $data['senha'] ?? null;

if (!$nome || !$sobrenome || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos os campos são obrigatórios.']);
    exit;
}

try {
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // *** CORREÇÃO AQUI ***
    // A query SQL estava errada.
    // Faltava a coluna 'email' na lista de colunas (tinham 3 colunas para 4 valores).
    $sql = "INSERT INTO usuarios (nome, sobrenome, email, senha) 
            VALUES (:nome, :sobrenome, :email, :senha)";
    
    $stmt = $pdo->prepare($sql);

    // Os parâmetros de 'execute' estavam corretos, combinando com a nova query
    $stmt->execute([
        ':nome' => $nome,
        ':sobrenome' => $sobrenome,
        ':email' => $email,
        ':senha' => $senhaHash,
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Usuário cadastrado com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro de banco de dados: " . $e->getMessage());
    if ($e->getCode() == '23505' || $e->getCode() == 1062) { // 23505 (PostgreSQL), 1062 (MySQL)
        http_response_code(409);
        echo json_encode(['error' => 'Este email já está em uso.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Ocorreu um erro interno no servidor.', 'details' => $e->getMessage()]);
    }

    /*for ($t = 9; $t < 11; $t++) {    Validação de CPF desativada em razão da simplificação do cadastro
        for ($d = 0, $c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) {
            return false;
        }
    }
    return true;
    */
}
?>