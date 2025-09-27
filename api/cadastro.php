<?php

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

$nome = $data['nome'] ?? null;
$sobrenome = $data['sobrenome'] ?? null;
$cpf = $data['cpf'] ?? null;
$nascimento = $data['nascimento'] ?? null;
$telefone = $data['telefone'] ?? null;
$estado = $data['estado'] ?? null;
$email = $data['email'] ?? null;
$senha = $data['senha'] ?? null;

if (!$nome || !$sobrenome || !$cpf || !$nascimento || !$telefone || !$estado || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos os campos são obrigatórios.']);
    exit;
}

if (!validaCPF($cpf)) {
    http_response_code(400);
    echo json_encode(['error' => 'O CPF informado é inválido.']);
    exit;
}

try {
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $emailHash = password_hash($email, PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios (nome, sobrenome, dtnasc, cpf, email, telefone, senha, id_estado) 
            VALUES (:nome, :sobrenome, :dtnasc, :cpf, :email, :telefone, :senha, :id_estado)";
    
    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nome' => $nome,
        ':sobrenome' => $sobrenome,
        ':dtnasc' => $nascimento,
        ':cpf' => $cpf,
        ':email' => $emailHash,
        ':telefone' => $telefone,
        ':senha' => $senhaHash,
        ':id_estado' => $estado
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Usuário cadastrado com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro de banco de dados: " . $e->getMessage());

    if ($e->getCode() == 23505) {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ou CPF já está em uso.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Ocorreu um erro interno no servidor ao processar sua solicitação.']);
    }
}

function validaCPF($cpf) {
    $cpf = preg_replace('/[^0-9]/is', '', $cpf);
    
    if (strlen($cpf) != 11) {
        return false;
    }

    if (preg_match('/(\d)\1{10}/', $cpf)) {
        return false;
    }

    for ($t = 9; $t < 11; $t++) {
        for ($d = 0, $c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) {
            return false;
        }
    }
    return true;
}
?>