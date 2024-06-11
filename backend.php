<?php
header("Content-Type: application/json");

// obtain query parameters from http request
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents("php://input");
$request = json_decode($body, true);

// echo '{
//     "code": 0,
//     "summary": {
//         "cost": 449,
//         "routes": 1,
//         "unassigned": 0,
//         "setup": 0,
//         "service": 0,
//         "duration": 449,
//         "waiting_time": 0,
//         "priority": 0,
//         "violations": [],
//         "computing_times": {
//             "loading": 58,
//             "solving": 0,
//             "routing": 0
//         }
//     },
//     "unassigned": [],
//     "routes": [
//         {
//             "vehicle": 1,
//             "cost": 449,
//             "setup": 0,
//             "service": 0,
//             "duration": 449,
//             "waiting_time": 0,
//             "priority": 0,
//             "steps": [
//                 {
//                     "type": "start",
//                     "location": [
//                         8.432927,
//                         47.143519
//                     ],
//                     "setup": 0,
//                     "service": 0,
//                     "waiting_time": 0,
//                     "arrival": 0,
//                     "duration": 0,
//                     "violations": [],
//                     "description": "Start at Suurstoffi 1, 6343 Risch-Rotkreuz, Switzerland"
//                 },
//                 {
//                     "type": "job",
//                     "description": "Forrenstrasse 2, 6343 Rotkreuz, Switzerland",
//                     "location": [
//                         8.428865,
//                         47.150221
//                     ],
//                     "id": 3,
//                     "setup": 0,
//                     "service": 0,
//                     "waiting_time": 0,
//                     "job": 3,
//                     "arrival": 201,
//                     "duration": 201,
//                     "violations": []
//                 },
//                 {
//                     "type": "job",
//                     "description": "Grundstrasse 4b, 6343 Risch-Rotkreuz, Switzerland",
//                     "location": [
//                         8.429819,
//                         47.144988
//                     ],
//                     "id": 2,
//                     "setup": 0,
//                     "service": 0,
//                     "waiting_time": 0,
//                     "job": 2,
//                     "arrival": 311,
//                     "duration": 311,
//                     "violations": []
//                 },
//                 {
//                     "type": "job",
//                     "description": "Mattenstrasse 1, 6343 Rotkreuz, Switzerland",
//                     "location": [
//                         8.430382,
//                         47.142902
//                     ],
//                     "id": 1,
//                     "setup": 0,
//                     "service": 0,
//                     "waiting_time": 0,
//                     "job": 1,
//                     "arrival": 390,
//                     "duration": 390,
//                     "violations": []
//                 },
//                 {
//                     "type": "end",
//                     "location": [
//                         8.432927,
//                         47.143519
//                     ],
//                     "setup": 0,
//                     "service": 0,
//                     "waiting_time": 0,
//                     "arrival": 449,
//                     "duration": 449,
//                     "violations": [],
//                     "description": "End at Suurstoffi 1, 6343 Risch-Rotkreuz, Switzerland"
//                 }
//             ],
//             "violations": []
//         }
//     ]
// }';
// return;

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

        if (!isset($data['features'])) {
            http_response_code(404);
            echo json_encode(['message' => 'Address not found']);
            return;
        }

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
    if (!isset($request['addresses'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Addresses not provided']);
        return;
    }
    if (count($request['addresses']) < 3) {
        http_response_code(400);
        echo json_encode(['message' => 'At least 3 addresses are required']);
        return;
    }
    if (!isset($request['date']) || !isset($request['time']) || $request['date'] == "" || $request['time'] == "") {
        http_response_code(400);
        echo json_encode(['message' => 'Date or time not provided']);
        return;
    }
    if (!isset($request['vehicle']) || $request['vehicle'] == "") {
        http_response_code(400);
        echo json_encode(['message' => 'Vehicle not provided']);
        return;
    }

    $addresses = [];
    foreach ($request['addresses'] as $address) {
        if (!isset($address['street']) || !isset($address['zip']) || !isset($address['city']) || $address['street'] == "" || $address['zip'] == "" || $address['city'] == "") {
            http_response_code(400);
            echo json_encode(['message' => 'Address is not valid']);
            return;
        }
        $addresses[] = $address['street'] . ", " . $address['zip'] . " " . $address['city'] . ", Switzerland";
    }

    $jobs = getJobsFromAddresses($addresses);

    $start = $jobs[0]->location;
    $end = $jobs[count($jobs) - 1]->location;

    $jobsWithoutStartAndEnd = array_slice($jobs, 1, count($jobs) - 2);

    $vehicles = [
        [
            "id" => 1,
            "profile" => "driving-car",
            "start" => $start,
            "end" => $end
        ]
    ];

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, "https://api.openrouteservice.org/optimization");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);

    curl_setopt($ch, CURLOPT_POST, TRUE);

    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "jobs" => $jobsWithoutStartAndEnd,
        "vehicles" => $vehicles,
    ]));

    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Accept: application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization: 5b3ce3597851110001cf6248d1aa126574e44c94aaaa83c89563c666",
        "Content-Type: application/json; charset=utf-8"
    ));

    $response = curl_exec($ch);
    curl_close($ch);

    $response = json_decode($response, true);

    $response['message'] = "Das ist die schnellste Route für das Fahrzeug " . $request['vehicle'] . " am " . $request['date'] . " um " . $request['time'] . " Uhr.";
    $response['routes'][0]['steps'][0]['description'] = "Start at " . $addresses[0];
    $response['routes'][0]['steps'][count($response['routes'][0]['steps']) - 1]['description'] = "End at " . $addresses[count($addresses) - 1];

    // set cookie how many times the user calculated a route for each vehicle
    $response['vehicle_bike_count'] = isset($_COOKIE['vehicle_bike']) ? $_COOKIE['vehicle_bike'] : 0;
    $response['vehicle_car_count'] = isset($_COOKIE['vehicle_car']) ? $_COOKIE['vehicle_car'] : 0;
    $response['vehicle_foot_count'] = isset($_COOKIE['vehicle_foot']) ? $_COOKIE['vehicle_foot'] : 0;

    $cookieName = "vehicle_" . $request['vehicle'];
    if (!isset($_COOKIE[$cookieName])) {
        setcookie($cookieName, 1, time() + 60 * 60 * 24 * 365, "/");
        $response[$cookieName . '_count'] = 1;
    } else {
        $newCount = $_COOKIE[$cookieName] + 1;
        setcookie($cookieName, $newCount, time() + 60 * 60 * 24 * 365, "/");
        $response[$cookieName . '_count'] = $newCount;
    }

    echo json_encode($response);
}
