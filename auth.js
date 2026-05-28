// SMART ROUTING: If user is already logged in, redirect them immediately to your landing hub
if (localStorage.getItem("isLoggedIn") === "true") {
  window.location.href = "doubt.html";
}

let currentMode = "login"; // Modes: "login", "signup", "reset_email", "reset_password", "reset_success", "auth_success"
let emailUnderRecovery = "";

// Toggles layout smoothly between login and register variants
function toggleMode(e) {
  e.preventDefault();
  currentMode = (currentMode === "login") ? "signup" : "login";
  updateUI();
}

// Shift interface to password recovery module mode
function switchToResetEmailMode(e) {
  e.preventDefault();
  currentMode = "reset_email";
  updateUI();
}

// Clear views and slide backend back into log-in configurations
function returnToLoginLayout(e) {
  if (e) e.preventDefault();
  document.getElementById("authForm").reset();
  currentMode = "login";
  updateUI();
}

// FINAL ENTRY: Triggered when user clicks the "OK" button on success screen
function enterApplicationWorkspace(e) {
  if (e) e.preventDefault();
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "doubt.html"; // Open active AI panel arrays
}

// Master UI state rendering coordinator tracking matrix elements
function updateUI() {
  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const nameField = document.getElementById("nameField");
  const emailField = document.getElementById("emailField");
  const passwordField = document.getElementById("passwordField");
  const resetFields = document.getElementById("resetFields");
  const submitBtn = document.getElementById("submitBtn");
  const forgotWrapper = document.getElementById("forgotWrapper");
  const authToggleContainer = document.getElementById("authToggleContainer");
  const authForm = document.getElementById("authForm");
  const resetSuccessBlock = document.getElementById("resetSuccessBlock");
  const authSuccessBlock = document.getElementById("authSuccessBlock");

  // Force type resets across data input elements for dynamic views visibility loops
  document.getElementById("authPassword").type = "password";
  document.getElementById("newPassword").type = "password";
  document.getElementById("confirmNewPassword").type = "password";
  document.getElementById("togglePasswordCheckbox").checked = false;
  document.getElementById("toggleResetPasswordCheckbox").checked = false;

  // Global defaults setup
  authForm.style.display = "block";
  resetSuccessBlock.style.display = "none";
  authSuccessBlock.style.display = "none";

  if (currentMode === "signup") {
    formTitle.innerText = "Create Account";
    formSubtitle.innerText = "Join DOPA AI and upgrade your learning speeds.";
    nameField.style.display = "flex";
    emailField.style.display = "flex";
    passwordField.style.display = "flex";
    resetFields.style.display = "none";
    forgotWrapper.style.display = "none";
    authToggleContainer.style.display = "block";
    submitBtn.innerText = "Sign Up";
    
    document.getElementById("authEmail").required = true;
    document.getElementById("authPassword").required = true;

  } else if (currentMode === "login") {
    formTitle.innerText = "Welcome Back";
    formSubtitle.innerText = "Login to continue your smart learning journey.";
    nameField.style.display = "none";
    emailField.style.display = "flex";
    passwordField.style.display = "flex";
    resetFields.style.display = "none";
    forgotWrapper.style.display = "block";
    authToggleContainer.style.display = "block";
    submitBtn.innerText = "Log In";
    
    document.getElementById("authEmail").required = true;
    document.getElementById("authPassword").required = true;

  } else if (currentMode === "reset_email") {
    formTitle.innerText = "Password Reset";
    formSubtitle.innerText = "Enter your account email address to verify identity.";
    nameField.style.display = "none";
    emailField.style.display = "flex";
    passwordField.style.display = "none";
    resetFields.style.display = "none";
    forgotWrapper.style.display = "none";
    authToggleContainer.style.display = "none";
    submitBtn.innerText = "Continue";
    
    document.getElementById("authEmail").required = true;
    document.getElementById("authPassword").required = false;

  } else if (currentMode === "reset_password") {
    formTitle.innerText = "Create New Password";
    formSubtitle.innerText = "Type your brand new secure password twice below.";
    nameField.style.display = "none";
    emailField.style.display = "none";
    passwordField.style.display = "none";
    resetFields.style.display = "block";
    forgotWrapper.style.display = "none";
    authToggleContainer.style.display = "none";
    submitBtn.innerText = "Continue";
    
    document.getElementById("authEmail").required = false;
    document.getElementById("authPassword").required = false;

  } else if (currentMode === "reset_success") {
    authForm.style.display = "none";
    authToggleContainer.style.display = "none";
    resetSuccessBlock.style.display = "block";
    formTitle.innerText = "Account Updated";
    formSubtitle.innerText = "Database restructuring logs execution verified.";

  } else if (currentMode === "auth_success") {
    // Hide standard forms completely and show the success confirmation template card
    authForm.style.display = "none";
    authToggleContainer.style.display = "none";
    authSuccessBlock.style.display = "block";
    formTitle.innerText = "Access Granted";
    formSubtitle.innerText = "Identity parameters matched successfully.";
  }
}

// Global generic string type toggler function handler
function togglePasswordVisibility(inputFieldId, checkboxId) {
  const inputTarget = document.getElementById(inputFieldId);
  const clickCheckbox = document.getElementById(checkboxId);
  if (inputTarget && clickCheckbox) {
    inputTarget.type = clickCheckbox.checked ? "text" : "password";
  }
}

// Multi-Field Visibility Controller for Reset view fields
function toggleResetFieldsVisibility() {
  const newPassField = document.getElementById("newPassword");
  const confirmPassField = document.getElementById("confirmNewPassword");
  const masterCheckbox = document.getElementById("toggleResetPasswordCheckbox");

  const type = masterCheckbox.checked ? "text" : "password";
  newPassField.type = type;
  confirmPassField.type = type;
}

// Form Submission Parser and router gate interceptor
function handleAuth(e) {
  e.preventDefault();
  
  // Standard Email Regex evaluation pattern string structural gate
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (currentMode === "signup") {
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;
    const name = document.getElementById("authName").value.trim();
    
    if (!name) { alert("Please fill in your name!"); return; }
    
    // Catch malformed rubbish data submissions immediately
    if (!emailPattern.test(email)) {
      alert("Please enter a valid structured email address (e.g. name@gmail.com)!");
      return;
    }

    if (password.length < 4) {
      alert("Security rule: Password must be at least 4 characters long!");
      return;
    }

    // CHECK FOR EXISTING RECORD: Block user from signing up an email that already exists
    if (localStorage.getItem(`user_${email}`)) {
      alert("An account with this email already exists on this browser! Please switch to Log In mode.");
      return;
    }

    localStorage.setItem(`user_${email}`, JSON.stringify({ name: name, password: password }));
    
    // Configure success messages dynamically for registering accounts
    document.getElementById("successStatusTitle").innerText = "Account Created! 🎉";
    document.getElementById("successStatusDesc").innerText = `Welcome to the squad, ${name}! Your student registration is completely verified.`;
    
    currentMode = "auth_success";
    updateUI();

  } else if (currentMode === "login") {
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;
    
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email format!");
      return;
    }

    const savedUser = localStorage.getItem(`user_${email}`);
    
    if (!savedUser) {
      alert("No account found with this email. Please sign up first!");
      return;
    }
    
    const userData = JSON.parse(savedUser);
    if (userData.password === password) {
      // Configure success messages dynamically for standard logins
      document.getElementById("successStatusTitle").innerText = "Login Successful! ✅";
      document.getElementById("successStatusDesc").innerText = `Welcome back, ${userData.name}! Ready to continue your premium learning track?`;
      
      currentMode = "auth_success";
      updateUI();
    } else {
      alert("Incorrect password! Please try again.");
    }

  } else if (currentMode === "reset_email") {
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email format!");
      return;
    }

    const savedUser = localStorage.getItem(`user_${email}`);
    
    if (!savedUser) {
      alert("No account found with this email address!");
      return;
    }
    
    emailUnderRecovery = email;
    currentMode = "reset_password";
    updateUI();

  } else if (currentMode === "reset_password") {
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmNewPassword").value;
    
    if (!newPass || !confirmPass) {
      alert("Please fill in both fields!");
      return;
    }

    if (newPass.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    
    if (newPass !== confirmPass) {
      alert("Passwords do not match! Try retyping configuration entries.");
      return;
    }
    
    const savedUser = localStorage.getItem(`user_${emailUnderRecovery}`);
    const userData = JSON.parse(savedUser);
    userData.password = newPass;
    localStorage.setItem(`user_${emailUnderRecovery}`, JSON.stringify(userData));
    
    currentMode = "reset_success";
    updateUI();
  }
}