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
