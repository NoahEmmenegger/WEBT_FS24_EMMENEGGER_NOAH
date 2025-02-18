let addresses = [
    { street: 'Suurstoffi 1', city: 'Risch-Rotkreuz', zip: '6343' },
    { street: 'Mattenstrasse 1', city: 'Rotkreuz', zip: '6343' },
    { street: 'Grundstrasse 4b', city: 'Risch-Rotkreuz', zip: '6343' },
    { street: 'Forrenstrasse 2', city: 'Rotkreuz', zip: '6343' },
    { street: 'Chamerstrasse 172', city: 'Zug', zip: '6300' },
    { street: 'Bahnhofstrasse 1', city: 'Zug', zip: '6300' },
    { street: 'Gotthardstrasse 2', city: 'Zug', zip: '6300' },
    { street: 'Chamerstrasse 172', city: 'Zug', zip: '6300' },
    { street: 'Suurstoffi 1', city: 'Risch-Rotkreuz', zip: '6343' },
];

function generateAddressInputs(addresses) {
    const addressInputs = addresses.map((address, index) => {
        return `<h3 style="${
            index === 0 ? 'color: green;' : index === addresses.length - 1 ? 'color: red;' : ''
        } border-top: 1px solid black;">${
            index === 0 ? 'Startadresse' : index === addresses.length - 1 ? 'Zieladresse' : `Address ${index + 1}`
        } <button onclick="deleteAddress(${index})" style="background-color: var(--primary-color); color: white;">Delete</button></h3><div class="address-input">${getInput(
            index,
            'street',
            address.street,
            validate(address.street, ['required', 'min:2'])
        )}${getInput(index, 'city', address.city, validate(address.city, ['required', 'min:2']))}${getInput(
            index,
            'zip',
            address.zip,
            validate(address.zip, ['required', 'number', 'min:4'])
        )}</div>`;
    });

    document.getElementById('addresses').innerHTML = addressInputs.join('');
}

function getInput(index, key, value, error = '') {
    return `<div><label for="${key}-${index}">${key.charAt(0).toUpperCase() + key.slice(1)}:${
        error ? `<span style="color: red;">${error}</span>` : ''
    }</label><input type="text" id="${key}-${index}" value="${value}" onchange="updateAddress(${index}, '${key}', this.value)" /></div>`;
}

function addAddress() {
    addresses.splice(addresses.length - 1, 0, { street: '', city: '', zip: '' });
    generateAddressInputs(addresses);
}

function deleteAddress(index) {
    addresses.splice(index, 1);
    generateAddressInputs(addresses);
}

function validate(value, rules) {
    if (rules.includes('required') && !value) return 'This field is required';
    if (rules.includes('min:2') && value.length < 2) return 'This field must be at least 2 characters long';
    if (rules.includes('number') && isNaN(value)) return 'This field must be a number';
    if (rules.includes('min:4') && value.length < 4) return 'This field must be at least 4 characters long';
    return '';
}

function updateAddress(index, key, value) {
    addresses[index][key] = value;
    generateAddressInputs(addresses);
}

function parseJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function showRoute(response) {
    document.getElementById('route').innerHTML = `<div><h3>${
        response.message
    }</h3><p>Wir haben aus den eingegebenen Adressen die folgende Route berechnet. Es wurde die schnellste Route gewählt. Sie sollen für möglichst schnelle Ankunft die Route befolgen.</p><p>Benötigte Zeit: ${(
        response.summary.duration / 60
    ).toFixed(2)} Minuten </p><p>Benutzte Berechnung für Fahrrad: ${
        response['vehicle_bike_count']
    }</p><p>Benutzte Berechnung für Auto: ${response['vehicle_car_count']}</p><p>Benutzte Berechnung für Fussgänger: ${
        response['vehicle_foot_count']
    }</p>${response.routes[0].steps
        .map((step, index) => {
            return `<div><p>${index + 1}. ${step.description}</p></div>`;
        })
        .join('')}</div>`;
}

function showErrorMessage(message) {
    document.getElementById('route').innerHTML = `<div class="w3-panel w3-red"><h3>Error</h3><p>${message}</p></div>`;
}

function showLoading() {
    document.getElementById('route').innerHTML = `<div class="w3-panel w3-blue"><h3>Loading...</h3></div>`;
}

function validateRequest(addresses, date, time, vehicle) {
    let errors = [];
    if (!addresses) errors.push('Please enter addresses');
    if (addresses.length < 3) errors.push('Please enter at least 3 addresses');
    if (!date || date === '') {
        document.getElementById('date').parentNode.innerHTML += `<span style="color: red;">Please enter a date</span>`;
        errors.push('Please enter a date');
    }
    if (!time || time === '') {
        document.getElementById('time').parentNode.innerHTML += `<span style="color: red;">Please enter a time</span>`;
        errors.push('Please enter a time');
    }
    if (!vehicle || vehicle === '') {
        document.getElementById(
            'vehicle'
        ).parentNode.innerHTML += `<span style="color: red;">Please select a vehicle</span>`;
        errors.push('Please select a vehicle');
    }
    addresses.forEach((address) => {
        if (!address.street || !address.city || !address.zip) {
            errors.push('Please enter all address fields');
        }
    });
    if (errors.length > 0) throw new Error(errors.join('<br>'));
}

function calculateRoute() {
    showLoading();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const vehicle = document.getElementById('vehicle').value;

    try {
        validateRequest(addresses, date, time, vehicle);
    } catch (e) {
        showErrorMessage(e.message);
        return;
    }

    let body = { addresses, date, time, vehicle };

    let xhr = new XMLHttpRequest();
    xhr.onerror = () => showErrorMessage('The remote system could not be reached. Please check the connection.');
    xhr.ontimeout = () => showErrorMessage('The remote system did not respond in time. Please try again later.');
    xhr.onload = function () {
        let response = parseJSON(xhr.responseText);
        if (xhr.status == 200 && response != null) {
            showRoute(response);
            const locations = response.routes[0].steps.map((step) => {
                return { coord: step.location.reverse(), description: step.description };
            });

            L.Routing.control({
                waypoints: locations.map((location) => L.latLng(location.coord)),
                routeWhileDragging: false,
            }).addTo(map);

            const polyline = L.polyline(locations, { color: 'blue' }).addTo(map);
            map.fitBounds(polyline.getBounds());
        } else {
            showErrorMessage(response.message);
            console.error(
                "Error during request: HTTP status = '" + xhr.status + "' / responseText = '" + xhr.responseText + "'"
            );
        }
    };

    xhr.open('POST', 'backend.php', true);
    xhr.send(JSON.stringify(body));
}

function draw() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff5e00';
    ctx.strokeStyle = '#ff5e00';
    ctx.fillRect(0, 0, 100, 70);
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(200, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 40, 20, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(300, 40, 20, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(220, 40);
    ctx.lineTo(280, 40);
    ctx.stroke();
}

generateAddressInputs(addresses);

const map = L.map('map').setView([47.195, 8.525], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
