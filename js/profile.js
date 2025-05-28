const USER_KEY = 'users';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

function initializeNavbar() {
  const userGreetingNameSpan = document.getElementById('userGreetingName');
  const logoutLink = document.getElementById('logoutLink');
  const currentUserEmail = sessionStorage.getItem('currentUserEmail');

  if (currentUserEmail && userGreetingNameSpan) {
    const users = JSON.parse(localStorage.getItem(USER_KEY)) || [];
    const currentUser = users.find(
      (user) =>
        user._email === currentUserEmail || user.email === currentUserEmail
    );
    if (currentUser) {
      userGreetingNameSpan.textContent =
        currentUser._firstName || currentUser.firstName || currentUserEmail;
    } else {
      userGreetingNameSpan.textContent = currentUserEmail;
    }
  } else if (userGreetingNameSpan) {
    userGreetingNameSpan.textContent = 'Guest';
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentUserEmail');
      sessionStorage.removeItem('loginTimestamp');
      alert('You have been logged out.');
      window.location.href = 'login.html';
    });
  }

  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage) {
    const navLinks = {
      'home.html': document.getElementById('navHomeLink'),
      'new-flats.html': document.getElementById('navNewFlatLink'),
      'flats.html': document.getElementById('navAllFlatsLink'),
      'profile.html': document.getElementById('navProfileLink'),
    };
    Object.values(navLinks).forEach(
      (link) => link && link.classList.remove('active', 'fw-bold')
    );
    if (navLinks[currentPage]) {
      navLinks[currentPage].classList.add('active', 'fw-bold');
      navLinks[currentPage].setAttribute('aria-current', 'page');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  validateSession();
  initializeNavbar();

  const updateForm = document.getElementById('updateForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const birthdayDateInput = document.getElementById('birthdayDate');
  const passwordInput = document.getElementById('password');

  // Load current user's data
  const currentUserEmail = sessionStorage.getItem('currentUserEmail');
  if (!currentUserEmail) {
    console.error('No current user email found in session storage.');
    alert('Session error. Please log in again.');
    window.location.href = 'login.html';
    return; // Stop execution if no user email
  }

  let users = JSON.parse(localStorage.getItem(USER_KEY)) || [];
  const currentUser = users.find(
    (user) =>
      user._email === currentUserEmail || user.email === currentUserEmail
  );

  if (currentUser) {
    firstNameInput.value =
      currentUser._firstName || currentUser.firstName || '';
    lastNameInput.value = currentUser._lastName || currentUser.lastName || '';
    birthdayDateInput.value =
      currentUser._birthDate || currentUser.birthDate || '';
    passwordInput.value = currentUser._password || currentUser.password || '';
  } else {
    console.error('Current user not found in localStorage.');
    alert('Error loading profile data. Please try logging in again.');
    return; // Stop if user data can't be loaded
  }

  // Set min/max for birthday input
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

  const passwordPattern =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{6,}$/;

  if (updateForm) {
    updateForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const passwordInput = document.getElementById('password'); // Get password input
      const passwordValue = passwordInput ? passwordInput.value : '';

      // The HTML `pattern` attribute will still provide browser hints and CSS pseudo-classes like :invalid
      if (!updateForm.checkValidity()) {
        console.error(
          'Form is not valid due to HTML5 constraints (e.g., required, minlength, type). Check other fields.'
        );
        return;
      }

      // Explicitly check password with JS regex test
      if (passwordInput && !passwordPattern.test(passwordValue)) {
        console.error(
          'VALIDATION FAIL (Password JS Regex): Password does not meet complexity requirements.'
        );
        updateForm.classList.add('was-validated');
        alert(
          'Password does not meet complexity requirements. Please check the specified format (letters, numbers, special char, min 6).'
        );
        passwordInput.focus();
        return;
      }

      if (!updateForm.checkValidity()) {
        updateForm.classList.add('was-validated');
        return;
      }

      const updatedFirstName = firstNameInput.value;
      const updatedLastName = lastNameInput.value;
      const updatedBirthDate = birthdayDateInput.value;
      const updatedPassword = passwordInput.value;

      // Find user index to update
      const userIndex = users.findIndex(
        (user) =>
          user._email === currentUserEmail || user.email === currentUserEmail
      );

      if (userIndex !== -1) {
        // Update user details (using original property names for consistency if they exist, else new)
        if (users[userIndex].hasOwnProperty('_firstName')) {
          users[userIndex]._firstName = updatedFirstName;
        } else {
          users[userIndex].firstName = updatedFirstName;
        }

        if (users[userIndex].hasOwnProperty('_lastName')) {
          users[userIndex]._lastName = updatedLastName;
        } else {
          users[userIndex].lastName = updatedLastName;
        }

        if (users[userIndex].hasOwnProperty('_birthDate')) {
          users[userIndex]._birthDate = updatedBirthDate;
        } else {
          users[userIndex].birthDate = updatedBirthDate;
        }

        if (users[userIndex].hasOwnProperty('_password')) {
          users[userIndex]._password = updatedPassword;
        } else {
          users[userIndex].password = updatedPassword;
        }

        localStorage.setItem(USER_KEY, JSON.stringify(users));
        alert('Profile updated successfully!');
        updateForm.classList.remove('was-validated'); // Reset validation state
        window.location.href = 'home.html';
      } else {
        console.error('Could not find user to update in localStorage.');
        alert('Error updating profile. Please try again.');
      }
    });
  } else {
    console.warn('ID "updateForm" not found');
  }

  console.log('Session validated for:', currentUserEmail);
});

function validateSession() {
  const currentUserEmail = sessionStorage.getItem('currentUserEmail');
  const loginTimestamp = sessionStorage.getItem('loginTimestamp');

  if (!currentUserEmail || !loginTimestamp) {
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('loginTimestamp');
    alert('Your session has expired or is invalid. Please log in again.');
    window.location.href = 'login.html';
    throw new Error('Session Invalid'); // Stop script execution
  }

  const now = new Date().getTime();
  if (now - parseInt(loginTimestamp) > SESSION_DURATION_MS) {
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('loginTimestamp');
    alert('Your session has timed out. Please log in again.');
    window.location.href = 'login.html';
    throw new Error('Session Timeout'); // Stop script execution
  }
  console.log('Session validated for:', currentUserEmail);
}
