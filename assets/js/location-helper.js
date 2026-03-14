let locationData = [];

async function loadLocations() {
    const res = await fetch("../assets/data/vietnam-address.json");
    locationData = await res.json();

    const citySelect = document.getElementById("city");

    citySelect.innerHTML = '<option value="">Chọn tỉnh/thành</option>';

    locationData.forEach(city => {
        const option = document.createElement("option");
        option.value = city.name;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

function updateDistricts() {
    const city = document.getElementById("city").value;
    const districtSelect = document.getElementById("district");

    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';

    const found = locationData.find(c => c.name === city);
    if (!found) return;

    found.districts.forEach(d => {
        const option = document.createElement("option");
        option.value = d.name;
        option.textContent = d.name;
        districtSelect.appendChild(option);
    });
}

function updateWards() {
    const city = document.getElementById("city").value;
    const district = document.getElementById("district").value;
    const wardSelect = document.getElementById("ward");

    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

    const found = locationData.find(c => c.name === city);
    if (!found) return;

    const foundDistrict = found.districts.find(d => d.name === district);
    if (!foundDistrict) return;

    foundDistrict.wards.forEach(w => {
        const option = document.createElement("option");
        option.value = w;
        option.textContent = w;
        wardSelect.appendChild(option);
    });
}

window.addEventListener("load", loadLocations);
