// assets/js/router.js

// Định nghĩa các router cho website
const ROUTES = {
  'du-an': '/du-an/:projectSlug', // Dự án (Danh mục)
  'tin-tuc': '/tin-tuc/:newsSlug', // Tin tức
  'nha-dat-ban': '/nha-dat-ban/:categorySlug', // Nhà đất bán theo phân loại
  'nha-dat-cho-thue': '/nha-dat-cho-thue/:categorySlug', // Nhà đất cho thuê theo phân loại
  'xay-dung': '/xay-dung/:categorySlug', // Xây dựng theo phân loại
};

// Hàm chuyển đổi slug thành URL chuẩn
function generateUrl(route, params) {
  return route.replace(/:(\w+)/g, (match, key) => params[key]);
}

// Hàm xử lý routing
function handleRouting() {
  const path = window.location.pathname;

  // Xử lý URL cho các danh mục, tin bán/cho thuê, tin tức
  for (const [type, route] of Object.entries(ROUTES)) {
    const regex = new RegExp(`^${route}$`);
    const match = path.match(regex);
    
    if (match) {
      const params = match.slice(1).reduce((acc, value, index) => {
        const keys = Object.keys(ROUTES);
        acc[keys[index]] = value;
        return acc;
      }, {});

      // Gọi callback render tương ứng
      if (type === 'du-an') {
        loadProjectDetail(params.projectSlug);  // Hàm load dự án
      } else if (type === 'tin-tuc') {
        loadNewsDetail(params.newsSlug);  // Hàm load tin tức
      } else if (type === 'nha-dat-ban' || type === 'nha-dat-cho-thue') {
        loadCategoryPosts(type, params.categorySlug);  // Hàm load tin bán/cho thuê theo loại
      } else if (type === 'xay-dung') {
        loadConstructionPosts(params.categorySlug);  // Hàm load tin xây dựng theo loại
      }
      
      break;
    }
  }
}

// Gọi hàm handleRouting khi trang được load
window.addEventListener('load', handleRouting);
