// assets/js/seo-content.js

const SEO_CONTENT = {
    home: `
        <p>ToamViet là nền tảng bất động sản cung cấp thông tin mua bán, cho thuê, dự án, doanh nghiệp và môi giới trên toàn quốc. Người dùng có thể tra cứu nhanh các khu vực nổi bật, cập nhật biến động thị trường và tiếp cận nguồn dữ liệu bất động sản ngày càng đầy đủ hơn.</p>
        <p>Hệ thống được xây dựng theo hướng tối ưu trải nghiệm tìm kiếm thực tế, giúp người dùng dễ dàng tiếp cận các nhóm nội dung quan trọng như nhà đất bán, nhà đất cho thuê, giá nhà đất, danh bạ doanh nghiệp, danh bạ môi giới và các dự án nổi bật.</p>
    `,
    project: `
        <p>Trang dự án bất động sản trên ToamViet là nơi tổng hợp các dự án đang có dữ liệu mua bán và cho thuê thực tế trên hệ thống. Người dùng có thể theo dõi nhanh thông tin về khu vực, loại hình, số lượng tin đăng, mức giá trung bình và các dự án đang được quan tâm tại từng tỉnh thành.</p>
        <p>Ngoài việc hỗ trợ tìm kiếm dự án theo khu vực và loại hình, trang còn đóng vai trò như một cụm nội dung SEO quan trọng giúp kết nối giữa chủ đầu tư, dự án, danh mục sản phẩm và các tin đăng chi tiết. Khi dữ liệu dự án được cập nhật đều đặn, khả năng hiển thị tự nhiên trên công cụ tìm kiếm cũng sẽ mạnh hơn theo từng cụm từ khóa liên quan.</p>
        <p>Về lâu dài, đây cũng là nền tảng để phát triển các trang danh mục dự án theo khu vực, theo phân khúc và theo từng chủ đầu tư, giúp người dùng có thêm góc nhìn tổng quan trước khi đi sâu vào từng dự án cụ thể.</p>
    `,
    sale: `
        <p>Trang nhà đất bán là nơi tổng hợp nguồn tin mua bán bất động sản được cập nhật liên tục trên hệ thống ToamViet. Người dùng có thể tra cứu theo vị trí, loại hình, mức giá, diện tích và nhiều bộ lọc khác để tìm được sản phẩm phù hợp với nhu cầu ở thực hoặc đầu tư.</p>
        <p>Việc bổ sung nội dung SEO ở cuối trang giúp tăng chiều sâu ngữ nghĩa cho toàn bộ danh mục, hỗ trợ tốt hơn cho các từ khóa dài liên quan đến mua bán căn hộ, nhà phố, biệt thự, đất nền và các sản phẩm bất động sản đặc thù tại từng khu vực.</p>
    `,
    rent: `
        <p>Trang nhà đất cho thuê giúp người dùng tiếp cận nhanh các sản phẩm cho thuê như căn hộ, nhà riêng, văn phòng, mặt bằng kinh doanh và nhiều loại hình khác. Các tin đăng được sắp xếp theo khu vực, mức giá và loại hình nhằm giúp quá trình tìm kiếm thuận tiện hơn.</p>
        <p>Bên cạnh vai trò hiển thị dữ liệu, phần nội dung SEO còn giúp trang tăng độ phủ từ khóa tự nhiên liên quan đến thuê nhà, thuê căn hộ, thuê văn phòng và các nhu cầu thuê bất động sản tại các thành phố lớn.</p>
    `,
    price: `
        <p>Trang giá nhà đất là nơi hỗ trợ người dùng theo dõi mặt bằng giá bất động sản theo khu vực, loại hình và từng nhóm sản phẩm. Nội dung tại đây giúp người mua, người bán và nhà đầu tư có thêm cơ sở tham khảo trước khi đưa ra quyết định.</p>
        <p>Khi được cập nhật đều đặn bằng dữ liệu thực tế, trang giá nhà đất sẽ đóng vai trò rất quan trọng trong chiến lược SEO tổng thể của hệ thống, đặc biệt với các nhóm từ khóa tra cứu giá theo quận huyện, tỉnh thành và loại hình bất động sản.</p>
    `
};

function getSeoContentByKey(pageKey) {
    return SEO_CONTENT[pageKey] || "";
}

function renderSeoContent(containerId = "seoContent", pageKey = "home") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const content = getSeoContentByKey(pageKey);
    if (!content) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="seo-wrapper">
            <div class="seo-text collapsed" id="${containerId}-text">
                ${content}
            </div>

            <button
                type="button"
                class="seo-toggle-btn"
                id="${containerId}-toggle"
                aria-expanded="false"
            >
                <span class="seo-toggle-label">Xem thêm</span>
                <i class="fa-solid fa-chevron-down seo-toggle-icon"></i>
            </button>
        </div>
    `;

    const toggleBtn = document.getElementById(`${containerId}-toggle`);
    const seoText = document.getElementById(`${containerId}-text`);
    const toggleLabel = toggleBtn.querySelector(".seo-toggle-label");

    if (!toggleBtn || !seoText || !toggleLabel) return;

    toggleBtn.addEventListener("click", () => {
        const isCollapsed = seoText.classList.contains("collapsed");

        if (isCollapsed) {
            seoText.classList.remove("collapsed");
            toggleBtn.classList.add("expanded");
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleLabel.textContent = "Thu gọn";
        } else {
            seoText.classList.add("collapsed");
            toggleBtn.classList.remove("expanded");
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleLabel.textContent = "Xem thêm";
        }
    });
}
