async function loadComponent(targetId, filePath) {
const target = document.getElementById(targetId);
if (!target) return;

try {
const response = await fetch(filePath);

```
if (!response.ok) {
  throw new Error(`Không load được: ${filePath}`);
}

const html = await response.text();
target.innerHTML = html;
```

} catch (error) {
console.error("Component load lỗi:", filePath, error);
}
}

function getBasePath() {
const path = window.location.pathname.toLowerCase();

const isRoot =
path.endsWith("/index.html") ||
path.endsWith("/") ||
(!path.includes("/pages/") &&
!path.includes("/user/") &&
!path.includes("/auth/") &&
!path.includes("/admin/"));

return isRoot ? "." : "..";
}

document.addEventListener("DOMContentLoaded", async function () {

const basePath = getBasePath();

const tasks = [];

if (document.getElementById("site-header")) {
tasks.push(
loadComponent(
"site-header",
`${basePath}/components/header-inner.html`
)
);
}

if (document.getElementById("site-footer")) {
tasks.push(
loadComponent(
"site-footer",
`${basePath}/components/footer-inner.html`
)
);
}

if (document.getElementById("site-mobile-menu")) {
tasks.push(
loadComponent(
"site-mobile-menu",
`${basePath}/components/mobile-menu-inner.html`
)
);
}

await Promise.all(tasks);

});
