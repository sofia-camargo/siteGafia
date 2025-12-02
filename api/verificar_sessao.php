<?php
// api/verificar_sessao.php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // Se o utilizador tem sessão iniciada, envia os seus dados
    echo json_encode([
        'loggedIn' => true,
        'userId' => $_SESSION['user_id'],
        'userName' => $_SESSION['user_name'],
        // --- ALTERAÇÃO: Envia se é admin (padrão false se não existir) ---
        'isAdmin' => $_SESSION['is_admin'] ?? false 
    ]);
} else {
    // Se não tem sessão iniciada
    echo json_encode(['loggedIn' => false]);
}
?>