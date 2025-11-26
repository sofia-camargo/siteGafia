<?php
// api/meus_veiculos.php

require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Define a ação a ser executada com base no parâmetro 'action' na URL
$action = $_GET['action'] ?? null;

// Requisições que DEVEM ter o usuário logado
$requiresAuth = ['list_garage', 'add_veiculo', 'delete_veiculo'];

if (in_array($action, $requiresAuth) && !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

// Se a ação requer autenticação, pegamos o ID do usuário
$userId = $_SESSION['user_id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// LISTAR VEÍCULOS NA GARAGEM (GET: ?action=list_garage)
if ($action === 'list_garage' && $method === 'GET') {
    try {
        // REMOVIDO: c.eficiencia_wh_km
        $sql = "SELECT c.id_carro, c.ano_carro, c.dur_bat, m.nm_marca, mo.nm_modelo
                FROM carro c
                JOIN garagem g ON c.id_carro = g.id_carro
                JOIN marca m ON c.id_marca = m.id_marca
                JOIN modelo mo ON c.id_modelo = mo.id_modelo
                WHERE g.id_usuario = :user_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $veiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // O código abaixo (que já existe no seu arquivo) vai garantir 
        // que o campo eficiencia exista no JSON final, mesmo sem vir do banco.
        foreach ($veiculos as &$veiculo) {
            if (!isset($veiculo['eficiencia_wh_km'])) {
                $veiculo['eficiencia_wh_km'] = 200; 
            }
        }
        
        echo json_encode($veiculos);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("PDO Error in list_garage: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao buscar seus veículos.']);
    }
    exit;
}

// ADICIONAR VEÍCULO À GARAGEM (POST: ?action=add_veiculo)
if ($action === 'add_veiculo' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $carroId = $data['carro_id'] ?? null;

    if (!$carroId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do carro não fornecido.']);
        exit;
    }

    try {
        $sql = "INSERT INTO garagem (id_usuario, id_carro) VALUES (:user_id, :carro_id)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user_id' => $userId, ':carro_id' => $carroId]);
        http_response_code(200);
        echo json_encode(['message' => 'Veículo adicionado à sua garagem!']);
    } catch (PDOException $e) {
        // Código 23000 é geralmente de violação de UNIQUE/PRIMARY KEY (já adicionado)
        $msg = ($e->getCode() === '23000') ? 'Veículo já está na sua garagem.' : 'Erro ao adicionar veículo.';
        http_response_code(409); // Conflito, ou outro erro 500
        error_log("PDO Error in add_veiculo: " . $e->getMessage());
        echo json_encode(['error' => $msg]);
    }
    exit;
}

// DELETAR VEÍCULO DA GARAGEM (DELETE: ?action=delete_veiculo)
if ($action === 'delete_veiculo' && $method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $carroId = $data['carro_id'] ?? null;

    if (!$carroId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do carro não fornecido.']);
        exit;
    }

    try {
        $sql = "DELETE FROM garagem WHERE id_usuario = :user_id AND id_carro = :carro_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user_id' => $userId, ':carro_id' => $carroId]);

        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(['message' => 'Veículo removido da sua garagem!']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Veículo não encontrado na sua garagem ou já foi removido.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("PDO Error in delete_veiculo: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao remover veículo.']);
    }
    exit;
}


if ($action === 'search_veiculos' && $method === 'GET') {
    $query = trim($_GET['q'] ?? '');

    // Requer pelo menos 3 caracteres para iniciar a pesquisa
    if (empty($query) || strlen($query) < 3) {
        echo json_encode([]); 
        exit;
    }

    $searchTerm = "%" . $query . "%";

    try {
        // Busca carros que correspondam à Marca, Modelo ou Ano
        $sql = "SELECT c.id_carro, c.ano_carro, c.dur_bat, c.eficiencia_wh_km, m.nm_marca, mo.nm_modelo
                FROM carro c
                JOIN marca m ON c.id_marca = m.id_marca
                JOIN modelo mo ON c.id_modelo = mo.id_modelo
                WHERE m.nm_marca ILIKE :term 
                OR mo.nm_modelo ILIKE :term 
                OR CAST(c.ano_carro AS TEXT) ILIKE :term 
                ORDER BY m.nm_marca, mo.nm_modelo, c.ano_carro DESC
                LIMIT 10"; 
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':term' => $searchTerm]);
        $carros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Garante que a eficiência está presente (valor padrão se não estiver no DB)
        foreach ($carros as &$carro) {
             if (!isset($carro['eficiencia_wh_km'])) {
                $carro['eficiencia_wh_km'] = 200; 
            }
        }
        
        http_response_code(200);
        echo json_encode($carros);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("PDO Error in search_veiculos: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao buscar veículos no catálogo.']);
    }
    exit;
}

if ($action === 'list_marcas' && $method === 'GET') {
    try {
        $sql = "SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca";
        $stmt = $pdo->query($sql);
        $marcas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($marcas);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar marcas.']);
    }
    exit;
}

// 6. LISTAR MODELOS POR MARCA (GET: ?action=list_modelos&marca_id=X)
if ($action === 'list_modelos' && $method === 'GET') {
    $marcaId = $_GET['marca_id'] ?? null;

    if (!$marcaId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID da marca é obrigatório.']);
        exit;
    }

    try {
        $sql = "SELECT id_modelo, nm_modelo 
                FROM modelo 
                WHERE id_marca = :marca_id 
                ORDER BY nm_modelo";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':marca_id' => $marcaId]);
        $modelos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($modelos);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar modelos.']);
    }
    exit;
}

// 7. LISTAR ANOS/CARROS POR MODELO (GET: ?action=list_carros&modelo_id=X)
if ($action === 'list_carros' && $method === 'GET') {
    $modeloId = $_GET['modelo_id'] ?? null;

    if (!$modeloId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do modelo é obrigatório.']);
        exit;
    }

    try {
        $sql = "SELECT id_carro, ano_carro, dur_bat, eficiencia_wh_km
                FROM carro 
                WHERE id_modelo = :modelo_id 
                ORDER BY ano_carro DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':modelo_id' => $modeloId]);
        $carros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Garante que a eficiência está presente (valor padrão se não estiver no DB)
        foreach ($carros as &$carro) {
             if (!isset($carro['eficiencia_wh_km'])) {
                $carro['eficiencia_wh_km'] = 200; 
            }
        }
        
        http_response_code(200);
        echo json_encode($carros);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar anos de carros.']);
    }
    exit;
}

// Se a ação não foi reconhecida
http_response_code(404);
echo json_encode(['error' => 'Ação de API não encontrada ou método incorreto.']);

?>