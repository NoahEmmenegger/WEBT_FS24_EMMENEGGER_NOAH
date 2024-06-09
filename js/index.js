let addresses = [
    { street: 'Suurstoffi 1', city: 'Risch-Rotkreuz', zip: '6343' },
    { street: 'Mattenstrasse 1', city: 'Rotkreuz', zip: '6343' },
    { street: 'Grundstrasse 4b', city: 'Risch-Rotkreuz', zip: '6343' },
    { street: 'Forrenstrasse 2', city: 'Rotkreuz', zip: '6343' },
    { street: 'Suurstoffi 1', city: 'Risch-Rotkreuz', zip: '6343' },
];

function generateAddressInputs(addresses) {
    const addressInputs = addresses.map((address, index) => {
        return `
            <h3>${
                index === 0 ? 'Startadresse' : index === addresses.length - 1 ? 'Zieladresse' : `Address ${index + 1}`
            }</h3>
            <div class="address-input">
                ${getInput(index, 'street', address.street, validate(address.street, ['required', 'min:2']))}
                ${getInput(index, 'city', address.city, validate(address.city, ['required', 'min:2']))}
                ${getInput(index, 'zip', address.zip, validate(address.zip, ['required', 'number', 'min:4']))}
            </div>
        `;
    });

    document.getElementById('addresses').innerHTML = addressInputs.join('');
}

function getInput(index, key, value, error = '') {
    return `
        <div>
            <label for="${key}-${index}">
                ${key.charAt(0).toUpperCase() + key.slice(1)}:
                ${error ? `<span style="color: red;">${error}</span>` : ''}
            </label>
            <input
                type="text"
                id="${key}-${index}"
                value="${value}"
                onchange="updateAddress(${index}, '${key}', this.value)"
            />
        </div>`;
}

function addAddress() {
    addresses.push({ street: '', number: '', city: '', zip: '' });
    generateAddressInputs(addresses);
}

function validate(value, rules) {
    if (rules.includes('required') && !value) {
        return 'This field is required';
    }
    if (rules.includes('min:2') && value.length < 2) {
        return 'This field must be at least 5 characters long';
    }
    if (rules.includes('number') && isNaN(value)) {
        return 'This field must be a number';
    }
    if (rules.includes('min:4') && value.length < 4) {
        return 'This field must be at least 4 characters long';
    }
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
    // display route on map
    console.log(response);
    document.getElementById('route').innerHTML = `
       <div>
            <h3>Das ist die schnellste Route!</h3>
            <p>Wir haben aus den eingegebenen Adressen die folgende Route berechnet. Es wurde die schnellste Route gewählt. Sie sollen für möglichst schnelle Ankunft die Route befolgen.</p>
            <p>Benötigte Zeit: ${(response.summary.duration / 60).toFixed(2)} Minuten </p>
            ${response.routes[0].steps
                .map((step, index) => {
                    return `
                    <div>
                        <p>${index + 1}. ${step.description}</p>
                    </div>
                `;
                })
                .join('')}
        </div>
    `;
}

function showErrorMessage(message) {
    document.getElementById('route').innerHTML = `
        <div>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function showLoading() {
    document.getElementById('route').innerHTML = `
        <div>
            <h3>Loading...</h3>
        </div>
    `;
}

function calculateRoute() {
    showLoading();
    let xhr = new XMLHttpRequest();
    xhr.onerror = function () {
        showErrorMessage('The remote system could not be reached. Please check the connection.');
    };
    xhr.ontimeout = function () {
        showErrorMessage('The remote system did not respond in time. Please try again later.');
    };
    xhr.onload = function () {
        let response = parseJSON(xhr.responseText);
        // verify http code and JSON format
        if (xhr.status == 200 && response != null) {
            showRoute(response);
            const locations = response.routes[0].steps.map((step) => {
                return step.location.reverse();
            });

            // Hinzufügen der Marker für die Standorte
            locations.forEach((location, index) => {
                L.marker(location)
                    .addTo(map)
                    .bindPopup(`Standort ${index + 1}`)
                    .openPopup();
            });

            // Erstellen eines Polylinienpfads durch die Standorte
            const polyline = L.polyline(locations, { color: 'blue' }).addTo(map);
            map.fitBounds(polyline.getBounds());
        } else {
            showErrorMessage(response.message);
            console.error(
                "Error during request: HTTP status = '" + xhr.status + "' / responseText = '" + xhr.responseText + "'"
            );
        }
    };

    // create request JSON document
    let body = {
        addresses,
    };

    // send document to backend using a POST request
    xhr.open('POST', 'backend.php', true);
    xhr.send(JSON.stringify(body));
}

generateAddressInputs(addresses);

const map = L.map('map').setView([47.195, 8.525], 13); // Zentrum der Karte auf Zug, Schweiz

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);
