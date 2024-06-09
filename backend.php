<?php
header("Content-Type: application/json");

// obtain query parameters from http request
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents("php://input");
$request = json_decode($body, true);

switch ($method) {
    case 'POST':
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

function getJobsFromAddresses($addresses)
{
    $coordinates = [];

    $ch = curl_init();
    static $index = 0;
    foreach ($addresses as $address) {
        curl_setopt($ch, CURLOPT_URL, "https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248d1aa126574e44c94aaaa83c89563c666&text=" . urlencode($address) . "&boundary.country=CH&size=1");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);

        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            "Accept: application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8"
        ));

        $response = curl_exec($ch);
        $data = json_decode($response, true);

        if (count($data['features']) > 0) {
            $job = new stdClass();
            $job->id = $index;
            $job->location = [
                $data['features'][0]['geometry']['coordinates'][0],
                $data['features'][0]['geometry']['coordinates'][1]
            ];
            $job->description = $address;
            $coordinates[] = $job;
        }

        $index++;
    }

    return $coordinates;
}

function getFastestRoute($request)
{
    $addresses = [];
    foreach ($request['addresses'] as $address) {
        $addresses[] = $address['street'] . ", " . $address['zip'] . " " . $address['city'] . ", Switzerland";
    }

    $jobs = getJobsFromAddresses($addresses);

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
        "jobs" => $jobs,
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
