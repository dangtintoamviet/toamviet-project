(function () {
    "use strict";

    let locationData = [];

    function normalizeProvince(item) {
        if (!item || typeof item !== "object") {
            return null;
        }

        const name = item.name || item.province || item.city || "";
        if (!name) return null;

        return {
            name: name,
            slug: item.slug || "",
            wards: Array.isArray(item.wards)
                ? item.wards
                : Array.isArray(item.children)
                    ? item.children
                    : Array.isArray(item.phuongXa)
                        ? item.phuongXa
                        : []
        };
    }

    async function loadLocations() {
        try {
            const res = await fetch("../assets/data/vietnam-address.json");

            if (!res.ok) {
                throw new Error("Không thể tải file vietnam-address.json");
            }

            const data = await res.json();

            if (!Array.isArray(data)) {
                throw new Error("Dữ liệu địa chỉ không đúng định dạng mảng");
            }

            locationData = data
                .map(normalizeProvince)
                .filter(Boolean);

            const citySelect = document.getElementById("city");
            if (!citySelect) return locationData;

            citySelect.innerHTML = '<option value="">Chọn tỉnh/thành</option>';

            locationData.forEach(function (city) {
                const option = document.createElement("option");
                option.value = city.name;
                option.textContent = city.name;
                citySelect.appendChild(option);
            });

            if (locationData.length > 0 && citySelect.options.length > 1) {
                citySelect.selectedIndex = 1;
                updateWards();
            }

            return locationData;
        } catch (error) {
            console.error("Lỗi loadLocations:", error);
            locationData = [];
            return [];
        }
    }

    function updateWards() {
        const citySelect = document.getElementById("city");
        const wardSelect = document.getElementById("ward");

        if (!citySelect || !wardSelect) return;

        const cityName = citySelect.value;
        wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

        const foundCity = locationData.find(function (c) {
            return c.name === cityName;
        });

        if (!foundCity || !Array.isArray(foundCity.wards)) return;

        foundCity.wards.forEach(function (ward) {
            const wardName =
                typeof ward === "string"
                    ? ward
                    : (ward.name || ward.ward || ward.commune || "");

            if (!wardName) return;

            const option = document.createElement("option");
            option.value = wardName;
            option.textContent = wardName;
            wardSelect.appendChild(option);
        });

        if (wardSelect.options.length > 1) {
            wardSelect.selectedIndex = 1;
        }
    }

    function getAllLocations() {
        return locationData.slice();
    }

    function getProvinceByName(name) {
        return locationData.find(function (item) {
            return item.name === name;
        }) || null;
    }

    window.locationHelper = {
        loadLocations: loadLocations,
        updateWards: updateWards,
        getAllLocations: getAllLocations,
        getProvinceByName: getProvinceByName
    };

    window.addEventListener("load", loadLocations);
})();
