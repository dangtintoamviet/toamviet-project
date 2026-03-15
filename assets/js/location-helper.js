/*
========================================================
LOCATION HELPER
Dùng chung cho toàn bộ website ToamViet
Nguồn dữ liệu gốc: assets/data/vietnam-address.json
Cấu trúc: Tỉnh/Thành -> Phường/Xã
========================================================
*/

(function () {
    "use strict";

    let locationData = [];

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

    function normalizeProvince(item) {
        if (!item || typeof item !== "object") return null;

        const name = item.name || item.province || item.city || "";
        if (!name) return null;

        return {
            name: name,
            slug: item.slug || slugify(name),
            wards: Array.isArray(item.wards)
                ? item.wards
                : Array.isArray(item.children)
                    ? item.children
                    : []
        };
    }

    async function loadLocations() {
        try {
            const response = await fetch("../assets/data/vietnam-address.json");

            if (!response.ok) {
                throw new Error("Không thể tải file vietnam-address.json");
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Dữ liệu địa chỉ không đúng định dạng mảng");
            }

            locationData = data
                .map(normalizeProvince)
                .filter(Boolean);

            return locationData;
        } catch (error) {
            console.error("Lỗi loadLocations:", error);
            locationData = [];
            return [];
        }
    }

    function getAllLocations() {
        return locationData.slice();
    }

    function getProvinces() {
        return locationData.map(function (province) {
            return province.name;
        });
    }

    function getProvinceByName(name) {
        return locationData.find(function (province) {
            return province.name === name;
        }) || null;
    }

    function getWardsByProvince(name) {
        const province = getProvinceByName(name);
        if (!province) return [];

        return Array.isArray(province.wards) ? province.wards : [];
    }

    function renderProvinceOptions(selectElement, selectedValue) {
        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Chọn tỉnh/thành</option>';

        locationData.forEach(function (province) {
            const option = document.createElement("option");
            option.value = province.name;
            option.textContent = province.name;

            if (selectedValue && selectedValue === province.name) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });
    }

    function renderWardOptions(selectElement, provinceName, selectedValue) {
        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Chọn phường/xã</option>';

        const wards = getWardsByProvince(provinceName);

        wards.forEach(function (ward) {
            const wardName =
                typeof ward === "string"
                    ? ward
                    : (ward.name || ward.ward || ward.commune || "");

            if (!wardName) return;

            const option = document.createElement("option");
            option.value = wardName;
            option.textContent = wardName;

            if (selectedValue && selectedValue === wardName) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });
    }

    async function initLocationSelectors(citySelector, wardSelector, options) {
        const citySelect =
            typeof citySelector === "string"
                ? document.querySelector(citySelector)
                : citySelector;

        const wardSelect =
            typeof wardSelector === "string"
                ? document.querySelector(wardSelector)
                : wardSelector;

        const config = options || {};
        const defaultCity = config.defaultCity || "";
        const defaultWard = config.defaultWard || "";
        const autoSelectFirstCity = config.autoSelectFirstCity !== false;
        const autoSelectFirstWard = config.autoSelectFirstWard !== false;
        const onCityChange =
            typeof config.onCityChange === "function"
                ? config.onCityChange
                : null;
        const onWardChange =
            typeof config.onWardChange === "function"
                ? config.onWardChange
                : null;

        if (!citySelect || !wardSelect) {
            return;
        }

        if (!locationData.length) {
            await loadLocations();
        }

        renderProvinceOptions(citySelect, defaultCity);

        if (!citySelect.value && autoSelectFirstCity && citySelect.options.length > 1) {
            citySelect.selectedIndex = 1;
        }

        renderWardOptions(wardSelect, citySelect.value, defaultWard);

        if (!wardSelect.value && autoSelectFirstWard && wardSelect.options.length > 1) {
            wardSelect.selectedIndex = 1;
        }

        citySelect.addEventListener("change", function () {
            renderWardOptions(wardSelect, citySelect.value, "");

            if (autoSelectFirstWard && wardSelect.options.length > 1) {
                wardSelect.selectedIndex = 1;
            }

            if (onCityChange) {
                onCityChange(citySelect.value, wardSelect.value);
            }
        });

        wardSelect.addEventListener("change", function () {
            if (onWardChange) {
                onWardChange(citySelect.value, wardSelect.value);
            }
        });
    }

    window.locationHelper = {
        loadLocations: loadLocations,
        getAllLocations: getAllLocations,
        getProvinces: getProvinces,
        getProvinceByName: getProvinceByName,
        getWardsByProvince: getWardsByProvince,
        renderProvinceOptions: renderProvinceOptions,
        renderWardOptions: renderWardOptions,
        initLocationSelectors: initLocationSelectors,
        slugify: slugify
    };
})();
