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

// **CORREÇÃO IMPORTANTE: Converte a data para o formato do PostgreSQL**
$dateObject = DateTime::createFromFormat('d/m/Y', $nascimento);
if ($dateObject) {
    $nascimentoFormatado = $dateObject->format('Y-m-d');
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de data de nascimento inválido. Use DD/MM/AAAA.']);
    exit;
}

try {
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // Query alinhada com a sua tabela 'usuarios'
    $sql = "INSERT INTO usuarios (nome, sobrenome, cpf, email, telefone, senha, id_estado, dt_nasc) 
            VALUES (:nome, :sobrenome, :cpf, :email, :telefone, :senha, :id_estado, :dt_nasc)";
    
    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nome' => $nome,
        ':sobrenome' => $sobrenome,
        ':cpf' => $cpf,
        ':email' => $email,
        ':telefone' => $telefone,
        ':senha' => $senhaHash,
        ':id_estado' => $estado,
        ':dt_nasc' => $nascimentoFormatado // Usa a data formatada
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Usuário cadastrado com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro de banco de dados: " . $e->getMessage());
    if ($e->getCode() == '23505') {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ou CPF já está em uso.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Ocorreu um erro interno no servidor.', 'details' => $e->getMessage()]);
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