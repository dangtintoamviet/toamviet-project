window.onscroll = function () {
    const btn = document.getElementById("goToTop");
    if (!btn) return;

    if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
        btn.style.display = "flex";
    } else {
        btn.style.display = "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleForm() {
    const form = document.getElementById("chatForm");
    if (!form) return;

    form.style.display =
        form.style.display === "none" || form.style.display === ""
            ? "block"
            : "none";
}

function openMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("mobileMenuOverlay");

    if (menu) {
        menu.style.transform = "translateX(0)";
    }

    if (overlay) {
        overlay.classList.remove("hidden");
    }

    document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("mobileMenuOverlay");

    if (menu) {
        menu.style.transform = "translateX(100%)";
    }

    if (overlay) {
        overlay.classList.add("hidden");
    }

    document.body.style.overflow = "";
}

function initMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("mobileMenuOverlay");

    if (!menu || !overlay) return;

    overlay.onclick = closeMobileMenu;

    document.querySelectorAll("#mobileMenu .has-sub").forEach((item) => {
        item.onclick = function () {
            const subMenu = this.nextElementSibling;
            if (!subMenu) return;

            const isOpen = subMenu.style.display === "block";
            subMenu.style.display = isOpen ? "none" : "block";
            this.classList.toggle("active", !isOpen);
        };
    });

    document.querySelectorAll("#mobileMenu a").forEach((link) => {
        link.addEventListener("click", function () {
            closeMobileMenu();
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(initMobileMenu, 300);
    setTimeout(initMobileMenu, 800);
});
