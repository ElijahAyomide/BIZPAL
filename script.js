const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

// Wait until page loads
document.addEventListener("DOMContentLoaded", () => {

    // NAV LINKS
    const homeLink = document.getElementById("homepage");
    const otherLinks = document.querySelectorAll("#other-pages");

    const dealsSection = document.querySelector(".deals");
    const businessSection = document.querySelector(".business");
    const dashboardSection = document.querySelector(".dashboard");

    // HOME
    homeLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // OTHER NAV LINKS
    otherLinks[0].addEventListener("click", (e) => {
        e.preventDefault();
        dealsSection.scrollIntoView({ behavior: "smooth" });
    });

    otherLinks[1].addEventListener("click", (e) => {
        e.preventDefault();
        businessSection.scrollIntoView({ behavior: "smooth" });
    });

    otherLinks[2].addEventListener("click", (e) => {
        e.preventDefault();
        dashboardSection.scrollIntoView({ behavior: "smooth" });
    });



    // HERO BUTTONS
    const seeHowBtn = document.querySelector(".login-btn");
    // const getStartedBtns = document.querySelectorAll(".get-started-btn");

    seeHowBtn.addEventListener("click", () => {
        dashboardSection.scrollIntoView({ behavior: "smooth" });
    });

    getStartedBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            alert("Welcome to BizPal! Account setup coming soon.");
        });
    });



    // // NAVBAR BUTTONS
    // const loginBtn = document.getElementById("login-btn");
    // const getStartedNav = document.getElementById("get-started-btn");

    // loginBtn.addEventListener("click", () => {
    //     alert("Login page coming soon.");
    // });

    // getStartedNav.addEventListener("click", () => {
    //     alert("Create your BizPal account!");
    // });



    // PRICING BUTTONS
    const freePlanBtn = document.querySelector(".free-btn");
    const upgradeBtn = document.querySelector(".pay-btn");

    freePlanBtn.addEventListener("click", () => {
        alert("You selected the FREE plan!");
    });

    upgradeBtn.addEventListener("click", () => {
        alert("Redirecting to payment for Pro Plan...");
    });



    // FOOTER LINKS
    const footerLinks = document.querySelectorAll("#quick-links a");

    footerLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            alert("This page will be available soon.");
        });
    });

});