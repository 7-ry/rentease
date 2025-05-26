class User {
  constructor(email, password, firstName, lastName, birthDate) {
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthDate = birthDate;
  }
}

const USER_KEY = 'users';

document.addEventListener('DOMContentLoaded', () => {
  const registrationForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password'); // Get password input
  const confirmPasswordInput = document.getElementById('confirmPassword');

  // Define the regex pattern directly in JS for explicit testing
  const passwordPattern =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{6,}$/;

  if (registrationForm) {
    registrationForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const passwordValue = passwordInput ? passwordInput.value : '';

      // Perform overall form validation first (excluding explicit password pattern for a moment)
      // We will rely on our JS check for the pattern.
      // The HTML `pattern` attribute will still provide browser hints and CSS pseudo-classes like :invalid
      if (!registrationForm.checkValidity()) {
        // This check will catch required fields, email format, minlength (other than password pattern if it was missed)
        registrationForm.classList.add('was-validated');
        console.error(
          'Form is not valid due to HTML5 constraints (e.g., required, minlength, type). Check other fields.'
        );
        // Find the first invalid field and focus it for better UX
        const firstInvalidField = registrationForm.querySelector(':invalid');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      // Explicitly check password with JS regex test
      if (passwordInput && !passwordPattern.test(passwordValue)) {
        console.error(
          'VALIDATION FAIL (Password JS Regex): Password does not meet complexity requirements.'
        );
        registrationForm.classList.add('was-validated');
        alert(
          'Password does not meet complexity requirements. Please check the specified format (letters, numbers, special char, min 6).'
        );
        passwordInput.focus();
        return;
      }

      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('email').value;
      const birthDate = document.getElementById('birthdayDate').value;
      const confirmPassword = confirmPasswordInput
        ? confirmPasswordInput.value
        : '';

      if (passwordValue !== confirmPassword) {
        if (confirmPasswordInput)
          confirmPasswordInput.setCustomValidity('Passwords do not match.');
        registrationForm.classList.add('was-validated');
        if (confirmPasswordInput) confirmPasswordInput.reportValidity();
        return;
      } else {
        if (confirmPasswordInput) confirmPasswordInput.setCustomValidity('');
      }

      registrationForm.classList.remove('was-validated');

      const newUser = new User(
        email,
        passwordValue,
        firstName,
        lastName,
        birthDate
      );

      try {
        const existingUsers = JSON.parse(localStorage.getItem(USER_KEY)) || [];
        if (existingUsers.some((user) => user.email === email)) {
          alert('An account with this email address already exists.');
          document.getElementById('email').focus();
          registrationForm.classList.add('was-validated');
          return;
        }

        existingUsers.push(newUser);
        localStorage.setItem(USER_KEY, JSON.stringify(existingUsers));

        sessionStorage.setItem('currentUserEmail', newUser.email);
        sessionStorage.setItem('loginTimestamp', Date.now().toString());

        alert('Registration successful! You are now logged in.');
        window.location.href = 'home.html';
      } catch (err) {
        console.error('Error storing data:', err);
        alert('An error occurred during registration. Please try again.');
      }
    });
  } else {
    console.warn('ID "registerForm" not found');
  }

  const birthdayDateInput = document.getElementById('birthdayDate');
  if (birthdayDateInput) {
    const today = new Date();
    const maxBirthDate = new Date(today);
    maxBirthDate.setFullYear(today.getFullYear() - 18);
    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(today.getFullYear() - 120);
    const formatDate = (date) => date.toISOString().split('T')[0];
    birthdayDateInput.max = formatDate(maxBirthDate);
    birthdayDateInput.min = formatDate(minBirthDate);
  }

  // Add live password match validation
  if (passwordInput && confirmPasswordInput) {
    const validatePasswordMatch = () => {
      if (
        passwordInput.value !== confirmPasswordInput.value &&
        confirmPasswordInput.value !== ''
      ) {
        confirmPasswordInput.setCustomValidity('Passwords do not match.');
      } else {
        confirmPasswordInput.setCustomValidity('');
      }
    };
    passwordInput.addEventListener('input', validatePasswordMatch);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
  }
});
