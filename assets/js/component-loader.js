async function loadComponent(targetId, filePath) {
const target = document.getElementById(targetId);
if (!target) return;

try {
const response = await fetch(filePath);

```
if (!response.ok) {
  throw new Error(`HTTP ${response.status} - ${filePath}`);
}

const html = await response.text();
target.innerHTML = html;
```

} catch (error) {
console.error("Không load được component:", filePath, error);
}
}

function getPageContext() {
const path = window.location.pathname.toLowerCase();

const isRootPage =
path.endsWith("/index.html") ||
path.endsWith("/") ||
(!path.includes("/pages/") &&
!path.includes("/user/") &&
!path.includes("/auth/") &&
!path.includes("/admin/"));

if (isRootPage) {
return {
basePath: ".",
headerFile: "header-root.html",
footerFile: "footer-root.html",
mobileMenuFile: "mobile-menu-root.html"
};
}

return {
basePath: "..",
headerFile: "header-inner.html",
footerFile: "footer-inner.html",
mobileMenuFile: "mobile-menu-inner.html"
};
}

document.addEventListener("DOMContentLoaded", async function () {

const context = getPageContext();
const tasks = [];

if (document.getElementById("site-header")) {
tasks.push(
loadComponent(
"site-header",
`${context.basePath}/components/${context.headerFile}`
)
);
}

if (document.getElementById("site-footer")) {
tasks.push(
loadComponent(
"site-footer",
`${context.basePath}/components/${context.footerFile}`
)
);
}

if (document.getElementById("site-mobile-menu")) {
tasks.push(
loadComponent(
"site-mobile-menu",
`${context.basePath}/components/${context.mobileMenuFile}`
)
);
}

await Promise.all(tasks);

});
