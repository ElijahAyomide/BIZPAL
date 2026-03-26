const form = document.querySelector("form");
const password = document.querySelector("input[type='password']");
const confirmPassword = document.querySelectorAll("input[type='password']")[1];
const phone = document.querySelector("input[type='number']");

const errorMsg = document.createElement("p");
errorMsg.style.color = "red";
errorMsg.style.fontSize = "0.85rem";
errorMsg.style.minHeight = "1rem";
confirmPassword.parentElement.appendChild(errorMsg);

const phoneError = document.createElement("p");
phoneError.style.color = "red";
phoneError.style.fontSize = "0.85rem";
phoneError.style.minHeight = "1rem";
phone.parentElement.appendChild(phoneError);

form.addEventListener("submit", function(e) {
    let hasError = false;

    
    if (password.value !== confirmPassword.value) {
        e.preventDefault();
        errorMsg.textContent = "Passwords do not match.";
        hasError = true;
    } else {
        errorMsg.textContent = "";
    }

    if (!/^0[7-9][01]\d{8}$/.test(phone.value)) {
        e.preventDefault();
        phoneError.textContent = "Enter a valid 11-digit Nigerian phone number.";
        hasError = true;
    } else {
        phoneError.textContent = "";
    }

    if (hasError) return;
});