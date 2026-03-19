/**
 * assets/js/seo-content.js
 * Quản lý khung SEO content: thu/bung, admin mới được chỉnh nội dung
 */

const SEO_CONTENT = {
    // key: trang, value: nội dung SEO
    "project": `Dự án bất động sản nổi bật, tư vấn đầu tư, phân phối căn hộ, nhà phố, biệt thự, nhà liền thổ tại các thành phố lớn và tỉnh lân cận.`,
    "home": `ToamViet cung cấp thông tin nhà đất, dự án, môi giới, doanh nghiệp bất động sản uy tín toàn quốc.`,
    "sale": `Tổng hợp các căn nhà, biệt thự, căn hộ đang rao bán tại các khu vực trọng điểm, kèm thông tin pháp lý và vị trí chi tiết.`,
    "rent": `Tổng hợp các căn hộ, nhà phố cho thuê tại Hà Nội, TP.HCM và các tỉnh thành khác.`
};

function renderSeoContent(containerId, pageKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const content = SEO_CONTENT[pageKey] || "";
    if (!content) return;

    // Tạo HTML khung SEO
    container.innerHTML = `
        <div class="seo-box">
            <button class="seo-toggle-btn" onclick="toggleSeoContent(this)">Hiển thị nội dung SEO</button>
            <div class="seo-text hidden">
                ${content}
            </div>
        </div>
    `;
}

function toggleSeoContent(btn) {
    const textDiv = btn.nextElementSibling;
    if (!textDiv) return;

    textDiv.classList.toggle("hidden");
    btn.textContent = textDiv.classList.contains("hidden") ? "Hiển thị nội dung SEO" : "Thu gọn nội dung SEO";
}
