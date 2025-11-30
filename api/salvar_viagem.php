<?php
session_start();
require_once 'db_connection.php'; // Certifique-se que este arquivo existe e conecta no PDO
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não logado.']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Nenhum dado recebido.']);
    exit;
}

try {
    $sql = "INSERT INTO historico_viagem 
            (id_usuario, id_carro, cidade_origem, cidade_destino, km_viagem, tempo_viagem, qnt_abastecimento, dt_consulta, id_estado) 
            VALUES 
            (:id_usuario, :id_carro, :origem, :destino, :km, :tempo, :recargas, NOW(), 1)";

    $stmt = $pdo->prepare($sql);
    
    // Converte segundos para string de intervalo do Postgres
    $tempoIntervalo = $input['tempo_viagem_segundos'] . " seconds";

    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'],
        ':id_carro'   => $input['id_carro'],
        ':origem'     => $input['origem'],
        ':destino'    => $input['destino'],
        ':km'         => $input['distancia_km'],
        ':tempo'      => $tempoIntervalo,
        ':recargas'   => $input['paradas']
    ]);

    echo json_encode(['success' => true, 'message' => 'Viagem salva com sucesso!']);

} catch (PDOException $e) {
    error_log("Erro ao salvar viagem: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro interno ao salvar.']);
}
?>