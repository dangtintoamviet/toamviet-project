// components/seo-content.js

// Nội dung SEO mẫu, admin mới sửa được
const SEO_CONTENT_TEXT = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit 
in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
`;

// Hàm render SEO content
function renderSeoContent(containerId = "seoContent") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="seo-wrapper">
            <button id="seoToggleBtn" class="seo-toggle-btn">Xem thêm nội dung SEO</button>
            <div id="seoText" class="seo-text collapsed">
                ${SEO_CONTENT_TEXT}
            </div>
        </div>
    `;

    const toggleBtn = document.getElementById("seoToggleBtn");
    const seoText = document.getElementById("seoText");

    toggleBtn.addEventListener("click", () => {
        seoText.classList.toggle("collapsed");
        if (seoText.classList.contains("collapsed")) {
            toggleBtn.textContent = "Xem thêm nội dung SEO";
        } else {
            toggleBtn.textContent = "Thu gọn nội dung SEO";
        }
    });
}
