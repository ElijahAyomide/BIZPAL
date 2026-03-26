// --- Login ---
const loginForm = document.getElementById("login-form");
const loginFeedback = document.getElementById("login-feedback");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const submitButton = loginForm.querySelector("button[type='submit']");

    if (!email || !password) {
      loginFeedback.textContent = "Please enter your email and password.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";
    }

    loginFeedback.textContent = "";

    try {
      const response = await fetch(
        "https://bizpal-api.onrender.com/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.message || data?.error || "Login failed. Please try again.";
        throw new Error(errorMessage);
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      if (data.data?.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      loginFeedback.style.color = "green";
      loginFeedback.textContent =
        data.message || "Login successful! Redirecting...";
      submitButton.disabled = true;
      setTimeout(() => {
        window.location.href = "/Dashboard/dashboard.html";
      }, 1500);
      return;
    } catch (error) {
      loginFeedback.style.color = "red";
      loginFeedback.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Log In to Bizpal";
      }
    }
  });
}

// --- Register ---
const registerForm = document.getElementById("register-form");
const feedback = document.getElementById("register-feedback");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const businessName = String(formData.get("businessName") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const terms = document.getElementById("terms");
    const submitButton = registerForm.querySelector("button[type='submit']");

    if (
      !businessName ||
      !name ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      feedback.textContent = "Please fill in all required fields.";
      return;
    }

    if (password !== confirmPassword) {
      feedback.textContent = "Passwords do not match.";
      return;
    }

    if (!terms || !terms.checked) {
      feedback.textContent = "Please accept the terms to continue.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";
    }

    feedback.textContent = "";

    try {
      const response = await fetch(
        "https://bizpal-api.onrender.com/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            businessName,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.message ||
          data?.error ||
          "Registration failed. Please try again.";
        throw new Error(errorMessage);
      }

      feedback.textContent = "";
      // Show verification modal
      const verifyModal = document.getElementById("verify-modal");
      if (verifyModal) {
        verifyModal.style.display = "flex";
        verifyModal.dataset.email = email;
        const firstOtp = verifyModal.querySelector(".otp-box");
        if (firstOtp) firstOtp.focus();
      }
    } catch (error) {
      feedback.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create My Account";
      }
    }
  });
}

// --- OTP Input Behaviour ---
document.querySelectorAll(".otp-box").forEach((box, i, boxes) => {
  box.addEventListener("input", () => {
    box.value = box.value.replace(/\D/g, "");
    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
  });
  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    text.split("").forEach((ch, j) => {
      if (boxes[i + j]) boxes[i + j].value = ch;
    });
    const next = Math.min(i + text.length, boxes.length - 1);
    boxes[next].focus();
  });
});

// --- Email Verification ---
const verifyBtn = document.getElementById("verify-btn");
const verifyFeedback = document.getElementById("verify-feedback");

if (verifyBtn) {
  verifyBtn.addEventListener("click", async () => {
    const modal = document.getElementById("verify-modal");
    const email = modal?.dataset.email || "";
    const boxes = document.querySelectorAll(".otp-box");
    const code = Array.from(boxes)
      .map((b) => b.value)
      .join("");

    if (code.length !== 6) {
      verifyFeedback.textContent = "Please enter the full 6-digit code.";
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";
    verifyFeedback.textContent = "";

    try {
      const response = await fetch(
        "https://bizpal-api.onrender.com/api/v1/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Verification failed. Please try again.",
        );
      }

      window.location.href = "login.html";
    } catch (error) {
      verifyFeedback.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify Email";
    }
  });
}
