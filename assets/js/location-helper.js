/*
========================================================
LOCATION HELPER
Dùng chung cho toàn bộ website ToamViet
========================================================
*/

(function () {

    if (!window.LOCATIONS_DATA) {
        console.warn("LOCATIONS_DATA chưa được load từ locations.js");
        window.LOCATIONS_DATA = [];
    }

    function slugify(text) {
        return (text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }

    function getAllLocations() {
        return window.LOCATIONS_DATA || [];
    }

    function getProvinces() {
        return getAllLocations().map(function (p) {
            return p.name;
        });
    }

    function getProvinceByName(name) {
        return getAllLocations().find(function (p) {
            return p.name === name;
        });
    }

    function getWardsByProvince(name) {

        const province = getProvinceByName(name);

        if (!province) return [];

        if (Array.isArray(province.wards)) return province.wards;

        if (Array.isArray(province.children)) {
            return province.children.map(function (w) {
                return w.name || w;
            });
        }

        return [];
    }

    function renderProvinceOptions(selectElement) {

        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Chọn tỉnh/thành</option>';

        getAllLocations().forEach(function (province) {

            const option = document.createElement("option");

            option.value = province.name;
            option.textContent = province.name;

            selectElement.appendChild(option);
        });
    }

    function renderWardOptions(selectElement, provinceName) {

        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Chọn phường/xã</option>';

        const wards = getWardsByProvince(provinceName);

        wards.forEach(function (ward) {

            const name = typeof ward === "string"
                ? ward
                : ward.name || ward.ward || "";

            if (!name) return;

            const option = document.createElement("option");

            option.value = name;
            option.textContent = name;

            selectElement.appendChild(option);
        });
    }

    window.locationHelper = {

        getAllLocations,

        getProvinces,

        getProvinceByName,

        getWardsByProvince,

        renderProvinceOptions,

        renderWardOptions,

        slugify
    };

})();
