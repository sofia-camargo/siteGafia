<?php
// api/salvar_viagem.php
session_start();
require_once 'db_connection.php'; // Certifique-se que este arquivo existe e conecta no PDO
header('Content-Type: application/json');

// 1. Verifica se o usuário está logado
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado.']);
    exit;
}

// 2. Recebe o JSON do JavaScript
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Nenhum dado recebido.']);
    exit;
}

try {
    // 3. Query de Inserção
    // Estamos salvando o texto do endereço nas colunas cidade_origem e cidade_destino
    $sql = "INSERT INTO historico_viagem 
            (id_usuario, id_carro, cidade_origem, cidade_destino, km_viagem, tempo_viagem, qnt_abastecimento, dt_consulta, id_estado) 
            VALUES 
            (:id_usuario, :id_carro, :origem, :destino, :km, :tempo, :recargas, NOW(), 1)";
            // Obs: id_estado fixo em 1 por enquanto, pois o foco é o nome da cidade

    $stmt = $pdo->prepare($sql);
    
    // Converte segundos para o formato INTERVAL do PostgreSQL
    $tempoIntervalo = $input['tempo_viagem_segundos'] . " seconds";

    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'],
        ':id_carro'   => $input['id_carro'],
        ':origem'     => $input['origem'],   // Aqui entra o texto "São Paulo, SP..."
        ':destino'    => $input['destino'],  // Aqui entra o texto "Rio de Janeiro, RJ..."
        ':km'         => $input['distancia_km'],
        ':tempo'      => $tempoIntervalo,
        ':recargas'   => $input['paradas']
    ]);

    echo json_encode(['success' => true, 'message' => 'Viagem salva com sucesso!']);

} catch (PDOException $e) {
    // Grava o erro no log do servidor para debug, mas não mostra pro usuário
    error_log("Erro ao salvar viagem: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro interno ao salvar.']);
}
?>