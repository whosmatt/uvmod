// not the best solution, but it works without dependencies

const navbarContainer = document.getElementById("navbar-placeholder");

if (navbarContainer) {
    fetch('navbar.html')
        .then(response => response.text())
        .then(content => {
            navbarContainer.outerHTML = content;
        })
        .then(() => {
            const navLinks = document.querySelectorAll(".nav-link");
            navLinks.forEach(link => {
                if (link.pathname === window.location.pathname) {
                    link.parentElement.classList.add("active");
                } else if (link.pathname.endsWith("index.html") && window.location.pathname.endsWith("/")) {
                    link.parentElement.classList.add("active");
                }
            })
        })
}
