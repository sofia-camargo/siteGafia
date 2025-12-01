<?php
// api/salvar_veiculo.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Verifica login
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'Erro: Usuário não logado.']);
    exit;
}

// Recebe dados do formulário (marca, modelo, ano, bateria, etc.)
$input = json_decode(file_get_contents("php://input"), true);

try {
    $sql = "INSERT INTO carro (id_usuario, id_marca, id_modelo, ano_carro, dur_bat, eficiencia_wh_km) 
            VALUES (:id_usuario, :id_marca, :id_modelo, :ano, :bateria, :eficiencia)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_usuario' => $_SESSION['id_usuario'], // <--- O VÍNCULO ACONTECE AQUI
        ':id_marca'   => $input['marca_id'],
        ':id_modelo'  => $input['modelo_id'],
        ':ano'        => $input['ano'],
        ':bateria'    => $input['autonomia'], // km totais
        ':eficiencia' => 200 // Valor padrão ou vindo do input
    ]);

    echo json_encode(['success' => true, 'message' => 'Carro adicionado à garagem!']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar: ' . $e->getMessage()]);
}
?>