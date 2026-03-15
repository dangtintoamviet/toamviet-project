async function loadComponent(id, file) {
  try {
    const response = await fetch(file);
    const data = await response.text();
    document.getElementById(id).innerHTML = data;
  } catch (error) {
    console.error("Không load được component:", file);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("site-header")) {
    loadComponent("site-header", "./components/header.html");
  }

  if (document.getElementById("site-footer")) {
    loadComponent("site-footer", "./components/footer.html");
  }

  if (document.getElementById("site-mobile-menu")) {
    loadComponent("site-mobile-menu", "./components/mobile-menu.html");
  }
});
