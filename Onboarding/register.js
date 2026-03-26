import api from "../api.js";

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

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    let hasError = false;

    if (password.value !== confirmPassword.value) {
        errorMsg.textContent = "Passwords do not match.";
        hasError = true;
    } else {
        errorMsg.textContent = "";
    }

    if (!/^0[7-9][01]\d{8}$/.test(phone.value)) {
        phoneError.textContent = "Enter a valid 11-digit Nigerian phone number.";
        hasError = true;
    } else {
        phoneError.textContent = "";
    }

    if (hasError) return;
    await createAccount();
});

async function createAccount() {
    const username = document.querySelector("input[name='username']").value.trim();
    const businessNameInput = document.querySelector("input[name='businessName']").value.trim();
    const businessName = businessNameInput || `${username}'s Business`;
    const email = document.querySelector("input[type='email']").value.trim();
    const phoneNumber = phone.value.trim();

    const btn = document.querySelector("button[type='submit']");
    btn.textContent = "Creating account...";
    btn.disabled = true;

    try {
        const data = await api("/api/v1/auth/register", "POST", {
            name: username,
            businessName,
            email,
            phone: phoneNumber,
            password: password.value,
        });

        if (data.success) {
            window.location.href = `./successful.html?name=${username}&businessName=${businessName}`;
        } else {
            errorMsg.textContent = data.message || "Registration failed.";
        }

    } catch (err) {
        errorMsg.textContent = err.message || "Something went wrong. Try again.";
    } finally {
        btn.textContent = "Create My Account";
        btn.disabled = false;
    }
}