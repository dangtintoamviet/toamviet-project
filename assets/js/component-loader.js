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

function getHeaderHost() {
  return (
    document.getElementById("site-header") ||
    document.getElementById("siteHeader")
  );
}

function getFooterHost() {
  return (
    document.getElementById("site-footer") ||
    document.getElementById("siteFooter")
  );
}

function getMobileMenuHost() {
  return (
    document.getElementById("site-mobile-menu") ||
    document.getElementById("siteMobileMenu")
  );
}

function getInnerHeaderElement() {
  const headerHost = getHeaderHost();
  if (!headerHost) return null;

  return (
    headerHost.querySelector(".site-header") ||
    headerHost.querySelector("header") ||
    headerHost.firstElementChild
  );
}

function ensureHeaderSpacer() {
  const headerHost = getHeaderHost();
  if (!headerHost) return null;

  let spacer = document.getElementById("header-spacer");

  if (!spacer) {
    spacer = document.createElement("div");
    spacer.id = "header-spacer";
    headerHost.insertAdjacentElement("afterend", spacer);
  }

  return spacer;
}

function setupFixedHeaderSpacing() {
  const headerHost = getHeaderHost();
  if (!headerHost) return;

  const innerHeader = getInnerHeaderElement();
  const spacer = ensureHeaderSpacer();
  if (!spacer) return;

  const context = getPageContext();

  headerHost.style.position = "fixed";
  headerHost.style.top = "0";
  headerHost.style.left = "0";
  headerHost.style.right = "0";
  headerHost.style.width = "100%";
  headerHost.style.zIndex = "1000";
  headerHost.style.background = "#ffffff";
  headerHost.style.boxShadow = "0 1px 0 rgba(0,0,0,0.04)";
  headerHost.style.margin = "0";

  if (innerHeader) {
    innerHeader.style.position = "static";
    innerHeader.style.top = "auto";
    innerHeader.style.left = "auto";
    innerHeader.style.right = "auto";
    innerHeader.style.margin = "0";
    innerHeader.style.zIndex = "auto";
  }

  const headerHeight = Math.ceil(headerHost.getBoundingClientRect().height || headerHost.offsetHeight || 0);

  document.documentElement.style.setProperty("--site-header-height", `${headerHeight}px`);

  spacer.style.display = "block";
  spacer.style.width = "100%";
  spacer.style.margin = "0";
  spacer.style.padding = "0";
  spacer.style.pointerEvents = "none";
  spacer.style.flex = "0 0 auto";

  if (context.isHomePage) {
    spacer.style.height = `${headerHeight}px`;
    document.body.classList.remove("has-fixed-header-gap");
  } else {
    spacer.style.height = `${headerHeight}px`;
    document.body.classList.add("has-fixed-header-gap");
  }
}

function watchHeaderSpacing() {
  if (window.__toamvietHeaderSpacingBound) return;
  window.__toamvietHeaderSpacingBound = true;

  let tries = 0;

  const timer = setInterval(() => {
    tries += 1;
    setupFixedHeaderSpacing();

    const headerHost = getHeaderHost();
    if ((headerHost && headerHost.offsetHeight > 0) || tries > 40) {
      clearInterval(timer);
    }
  }, 120);

  window.addEventListener("resize", setupFixedHeaderSpacing);
  window.addEventListener("orientationchange", setupFixedHeaderSpacing);
  window.addEventListener("load", setupFixedHeaderSpacing);

  const headerHost = getHeaderHost();
  if (!headerHost) return;

  const innerHeader = getInnerHeaderElement();

  if ("ResizeObserver" in window) {
    if (window.__toamvietHeaderResizeObserver) {
      window.__toamvietHeaderResizeObserver.disconnect();
    }

    const observer = new ResizeObserver(() => {
      setupFixedHeaderSpacing();
    });

    observer.observe(headerHost);
    if (innerHeader && innerHeader !== headerHost) {
      observer.observe(innerHeader);
    }

    window.__toamvietHeaderResizeObserver = observer;
  }
}

window.setupFixedHeaderSpacing = setupFixedHeaderSpacing;
window.watchHeaderSpacing = watchHeaderSpacing;

document.addEventListener("DOMContentLoaded", async function () {
  const context = getPageContext();
  const tasks = [];

  ensureFavicon(context.basePath);

  const headerHost =
    document.getElementById("site-header") ||
    document.getElementById("siteHeader");

  const footerHost =
    document.getElementById("site-footer") ||
    document.getElementById("siteFooter");

  const mobileMenuHost =
    document.getElementById("site-mobile-menu") ||
    document.getElementById("siteMobileMenu");

  if (headerHost) {
    tasks.push(
      loadComponent(
        headerHost.id,
        `${context.basePath}/components/${context.headerFile}`
      )
    );
  }

  if (footerHost) {
    tasks.push(
      loadComponent(
        footerHost.id,
        `${context.basePath}/components/${context.footerFile}`
      )
    );
  }

  if (mobileMenuHost) {
    tasks.push(
      loadComponent(
        mobileMenuHost.id,
        `${context.basePath}/components/${context.mobileMenuFile}`
      )
    );
  }

  await Promise.all(tasks);

  setupFixedHeaderSpacing();
  watchHeaderSpacing();

  setTimeout(setupFixedHeaderSpacing, 200);
  setTimeout(setupFixedHeaderSpacing, 500);
  setTimeout(setupFixedHeaderSpacing, 1000);
});
