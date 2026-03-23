async function loadComponent(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${filePath}`);
    }

    const html = await response.text();
    target.innerHTML = html;
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
      mobileMenuFile: "mobile-menu-root.html",
      isHomePage: true
    };
  }

  return {
    basePath: "..",
    headerFile: "header-inner.html",
    footerFile: "footer-inner.html",
    mobileMenuFile: "mobile-menu-inner.html",
    isHomePage: false
  };
}

function ensureFavicon(basePath) {
  const faviconHref = `${basePath}/assets/images/icons/favicon.png`;

  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.setAttribute("rel", "icon");
    favicon.setAttribute("type", "image/png");
    document.head.appendChild(favicon);
  }

  favicon.setAttribute("href", faviconHref);

  let shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
  if (!shortcutIcon) {
    shortcutIcon = document.createElement("link");
    shortcutIcon.setAttribute("rel", "shortcut icon");
    shortcutIcon.setAttribute("type", "image/png");
    document.head.appendChild(shortcutIcon);
  }

  shortcutIcon.setAttribute("href", faviconHref);

  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement("link");
    appleTouchIcon.setAttribute("rel", "apple-touch-icon");
    document.head.appendChild(appleTouchIcon);
  }

  appleTouchIcon.setAttribute("href", faviconHref);
}

function ensureHeaderSpacer() {
  const siteHeader = document.getElementById("site-header");
  if (!siteHeader) return null;

  let spacer = document.getElementById("header-spacer");

  if (!spacer) {
    spacer = document.createElement("div");
    spacer.id = "header-spacer";
    siteHeader.insertAdjacentElement("afterend", spacer);
  }

  return spacer;
}

function setupFixedHeaderSpacing() {
  const siteHeader = document.getElementById("site-header");
  if (!siteHeader) return;

  const innerHeader = siteHeader.querySelector("header");
  const spacer = ensureHeaderSpacer();
  if (!spacer) return;

  const context = getPageContext();

  siteHeader.style.position = "fixed";
  siteHeader.style.top = "0";
  siteHeader.style.left = "0";
  siteHeader.style.right = "0";
  siteHeader.style.zIndex = "1000";
  siteHeader.style.background = "#ffffff";
  siteHeader.style.boxShadow = "0 1px 0 rgba(0,0,0,0.04)";
  siteHeader.style.margin = "0";

  if (innerHeader) {
    innerHeader.style.position = "static";
    innerHeader.style.top = "auto";
    innerHeader.style.left = "auto";
    innerHeader.style.right = "auto";
    innerHeader.style.zIndex = "auto";
    innerHeader.style.margin = "0";
  }

  const headerHeight = Math.ceil(siteHeader.offsetHeight || 0);

  spacer.style.width = "100%";
  spacer.style.margin = "0";
  spacer.style.padding = "0";

  if (context.isHomePage) {
    spacer.style.height = `${headerHeight}px`;
  } else {
    const extraGap = window.innerWidth <= 768 ? 14 : 20;
    spacer.style.height = `${headerHeight + extraGap}px`;
  }
}

function watchHeaderSpacing() {
  let tries = 0;

  const timer = setInterval(() => {
    tries += 1;
    setupFixedHeaderSpacing();

    const siteHeader = document.getElementById("site-header");
    if ((siteHeader && siteHeader.offsetHeight > 0) || tries > 30) {
      clearInterval(timer);
    }
  }, 120);
}

document.addEventListener("DOMContentLoaded", async function () {
  const context = getPageContext();
  const tasks = [];

  ensureFavicon(context.basePath);

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

  watchHeaderSpacing();
  window.addEventListener("resize", setupFixedHeaderSpacing);

  setTimeout(setupFixedHeaderSpacing, 300);
  setTimeout(setupFixedHeaderSpacing, 800);
});
