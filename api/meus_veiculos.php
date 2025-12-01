<?php
// api/meus_veiculos.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Define a ação
$action = $_GET['action'] ?? null;

// Verificação de Autenticação Padronizada
// Nota: Padronizamos a sessão para 'id_usuario' nos arquivos anteriores
$userId = $_SESSION['id_usuario'] ?? null;

// Lista de ações que exigem login
$requiresAuth = ['list_garage', 'add_veiculo', 'delete_veiculo'];

if (in_array($action, $requiresAuth) && !$userId) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ==================================================================
// 1. LISTAR VEÍCULOS (GET) - Corrigido para nova estrutura
// ==================================================================
if ($action === 'list_garage' && $method === 'GET') {
    try {
        // NÃO EXISTE MAIS JOIN COM GARAGEM
        // Buscamos direto na tabela CARRO onde o id_usuario for igual ao da sessão
        $sql = "SELECT 
                    c.id_carro, 
                    c.ano_carro, 
                    c.dur_bat, 
                    c.eficiencia_wh_km,
                    m.nm_marca, 
                    mo.nm_modelo
                FROM carro c
                JOIN marca m ON c.id_marca = m.id_marca
                JOIN modelo mo ON c.id_modelo = mo.id_modelo
                WHERE c.id_usuario = :user_id
                ORDER BY c.id_carro DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $veiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Garante valor padrão para eficiência se vier nulo
        foreach ($veiculos as &$veiculo) {
            if (empty($veiculo['eficiencia_wh_km'])) {
                $veiculo['eficiencia_wh_km'] = 200; 
            }
        }
        
        echo json_encode($veiculos);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Erro list_garage: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao buscar garagem.']);
    }
    exit;
}

if ($action === 'add_veiculo' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validação básica
    if (empty($data['marca_id']) || empty($data['modelo_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Marca e Modelo são obrigatórios.']);
        exit;
    }

    try {
        // AGORA INSERIMOS DIRETO NA TABELA CARRO COM O ID_USUARIO
        $sql = "INSERT INTO carro (id_usuario, id_marca, id_modelo, ano_carro, dur_bat, eficiencia_wh_km) 
                VALUES (:user_id, :marca_id, :modelo_id, :ano, :bateria, :eficiencia)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id'    => $userId,
            ':marca_id'   => $data['marca_id'],
            ':modelo_id'  => $data['modelo_id'],
            ':ano'        => $data['ano'] ?? date('Y'),
            ':bateria'    => $data['autonomia'] ?? 300,
            ':eficiencia' => $data['eficiencia'] ?? 200
        ]);

        http_response_code(200);
        echo json_encode(['message' => 'Veículo cadastrado com sucesso!']);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Erro add_veiculo: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao salvar veículo.']);
    }
    exit;
}

if ($action === 'delete_veiculo' && $method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $carroId = $data['carro_id'] ?? null;

    if (!$carroId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do carro não fornecido.']);
        exit;
    }

    try {
        // Remove da tabela CARRO, garantindo que pertence ao usuário logado (Segurança)
        $sql = "DELETE FROM carro WHERE id_carro = :carro_id AND id_usuario = :user_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':carro_id' => $carroId, ':user_id' => $userId]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Veículo removido com sucesso.']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Veículo não encontrado ou não pertence a você.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao remover veículo.']);
    }
    exit;
}


// Listar Marcas
if ($action === 'list_marcas' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) { echo json_encode([]); }
    exit;
}

// Listar Modelos de uma Marca
if ($action === 'list_modelos' && $method === 'GET') {
    $marcaId = $_GET['marca_id'] ?? null;
    try {
        $stmt = $pdo->prepare("SELECT id_modelo, nm_modelo FROM modelo WHERE id_marca = ? ORDER BY nm_modelo");
        $stmt->execute([$marcaId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) { echo json_encode([]); }
    exit;
}

// Se nenhuma ação for encontrada
http_response_code(404);
echo json_encode(['error' => 'Ação inválida.']);
?>