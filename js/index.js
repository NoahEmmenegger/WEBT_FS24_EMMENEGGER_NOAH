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
                ${getInput(index, 'street', address.street, validate(address.street, ['required', 'min:5']))}
                ${getInput(index, 'city', address.city, validate(address.city, ['required', 'min:5']))}
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
    if (rules.includes('min:5') && value.length < 5) {
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

function calculateRoute() {
    let xhr = new XMLHttpRequest();
    xhr.onerror = function () {
        alert('We are sorry, a programm error occured. Please contact support.');
    };
    xhr.ontimeout = function () {
        alert('The remote system could not response in time. Please check the connection.');
    };
    xhr.onload = function () {
        let response = parseJSON(xhr.responseText);
        // verify http code and JSON format
        if (xhr.status == 200 && response != null) {
            showEmails(response);
        } else {
            alert('We are sorry, a programm error occured. Please contact support.');
            console.error(
                "Error during request: HTTP status = '" + xhr.status + "' / responseText = '" + xhr.responseText + "'"
            );
        }
    };

    // create request JSON document
    let body = {};

    // send document to backend using a POST request
    xhr.open('POST', 'backend.php', true);
    xhr.send(JSON.stringify(body));
}

generateAddressInputs(addresses);
