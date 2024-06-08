<?php
header("Content-Type: application/json");

// obtain query parameters from http request
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents("php://input");
$request = json_decode($body, true);

switch ($method) {
    case 'GET':
        getData($request);
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
}

function getData($request) {
    $data = [
        "status" => "success",
        "message" => "Hello, world!",
        "timestamp" => time()
    ];

    // Encode the data to JSON and output it
    echo json_encode($data);
}

?>
