<?php
header("Content-Type: application/json");

// obtain query parameters from http request
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents("php://input");
$request = json_decode($body, true);

switch ($method) {
    case 'GET':
        getFastestRoute($request);
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
}

function getData($request)
{
    $data = [
        "status" => "success",
        "message" => "Hello, world!",
        "timestamp" => time()
    ];

    // Encode the data to JSON and output it
    echo json_encode($data);
}

function getFastestRoute($request)
{
    $locations = [
        [1.98465, 48.70329],
        [2.03655, 48.61128],
        [2.39719, 49.07611]
    ];

    $vehicles = [
        [
            "id" => 1,
            "profile" => "driving-car",
            "start" => [2.35044, 48.71764],
            "end" => [2.35044, 48.71764]
        ]
    ];

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, "https://api.openrouteservice.org/optimization");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);

    curl_setopt($ch, CURLOPT_POST, TRUE);

    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "jobs" => array_map(function ($location) {
            static $index = 0;
            $index++;
            return [
                "id" => $index,
                "location" => $location,
                "description" => "Job description " . $index
            ];
        }, $locations),
        "vehicles" => $vehicles,
    ]));

    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Accept: application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization: 5b3ce3597851110001cf6248d1aa126574e44c94aaaa83c89563c666",
        "Content-Type: application/json; charset=utf-8"
    ));

    $response = curl_exec($ch);
    curl_close($ch);

    echo $response;
}
