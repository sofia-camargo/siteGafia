<?php
// api/meus_veiculos.php
require_once 'db_connection.php';
session_start();
header('Content-Type: application/json');

// Define a ação
$action = $_GET['action'] ?? null;

// Verificação de Autenticação Padronizada
$userId = $_SESSION['id_usuario'] ?? null;

// Lista de ações que exigem login
$requiresAuth = ['list_garage', 'add_veiculo', 'delete_veiculo'];

if (in_array($action, $requiresAuth) && !$userId) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso não autorizado. Usuário não logado.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- LISTAR GARAGEM ---
if ($action === 'list_garage' && $method === 'GET') {
    try {
        $sql = "SELECT 
                    c.id_carro, 
                    c.ano_carro, 
                    c.dur_bat, 
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
        
        echo json_encode($veiculos);

    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Erro list_garage: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao buscar garagem.']);
    }
    exit;
}

// --- PESQUISAR VEÍCULOS (CATÁLOGO) ---
if ($action === 'search_veiculos' && $method === 'GET') {
    $query = $_GET['q'] ?? '';

    if (strlen($query) < 3) {
        echo json_encode([]);
        exit;
    }

    try {
        $sql = "SELECT 
                    c.id_carro, 
                    c.ano_carro, 
                    c.dur_bat,
                    m.nm_marca, 
                    mo.nm_modelo
                FROM carro c
                JOIN marca m ON c.id_marca = m.id_marca
                JOIN modelo mo ON c.id_modelo = mo.id_modelo
                WHERE c.id_usuario IS NULL -- Filtra apenas carros do catálogo mestre
                AND (m.nm_marca ILIKE :query_like OR mo.nm_modelo ILIKE :query_like)
                LIMIT 10";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':query_like' => '%' . $query . '%']);
        $carros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($carros);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Erro search_veiculos: " . $e->getMessage());
        echo json_encode(['error' => 'Erro ao buscar catálogo de veículos.']);
    }
    exit;
}

// --- ADICIONAR VEÍCULO ---
if ($action === 'add_veiculo' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $masterCarroId = $data['carro_id'] ?? null; // ID do carro mestre selecionado

    if (!$masterCarroId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do carro mestre não fornecido.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Busca os dados do carro mestre
        $sqlSelect = "SELECT id_marca, id_modelo, ano_carro, dur_bat
                      FROM carro 
                      WHERE id_carro = :id AND id_usuario IS NULL";
        $stmtSelect = $pdo->prepare($sqlSelect);
        $stmtSelect->execute([':id' => $masterCarroId]);
        $masterCarro = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        if (!$masterCarro) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Carro mestre não encontrado ou já cadastrado.']);
            exit;
        }

        // 2. Insere na garagem do usuário
        // ATENÇÃO: Se o erro persistir, verifique se seu banco exige a coluna 'tipo' ou outra não listada aqui.
        $sqlInsert = "INSERT INTO carro (id_usuario, id_marca, id_modelo, ano_carro, dur_bat) 
                      VALUES (:user_id, :id_marca, :id_modelo, :ano, :bateria)";
        
        $stmtInsert = $pdo->prepare($sqlInsert);
        $stmtInsert->execute([
            ':user_id'       => $userId,
            ':id_marca'      => $masterCarro['id_marca'],
            ':id_modelo'     => $masterCarro['id_modelo'],
            ':ano'           => $masterCarro['ano_carro'],
            ':bateria'       => $masterCarro['dur_bat']
        ]);

        $pdo->commit();
        http_response_code(200);
        echo json_encode(['message' => 'Veículo adicionado à sua garagem!']);

    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        error_log("Erro add_veiculo: " . $e->getMessage());
        // --- ALTERAÇÃO: Retorna a mensagem real do erro SQL para facilitar o debug ---
        echo json_encode(['error' => 'Erro SQL: ' . $e->getMessage()]);
    }
    exit;
}

// --- DELETAR VEÍCULO ---
if ($action === 'delete_veiculo' && $method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $carroId = $data['carro_id'] ?? null;

    if (!$carroId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID do carro não fornecido.']);
        exit;
    }

    try {
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

// --- LISTAS AUXILIARES ---
if ($action === 'list_marcas' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id_marca, nm_marca FROM marca ORDER BY nm_marca");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) { echo json_encode([]); }
    exit;
}

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