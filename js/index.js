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

generateAddressInputs(addresses);
