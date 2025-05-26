const USER_KEY = 'users';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!loginForm.checkValidity()) {
        console.error(
          'VALIDATION FAIL (Form): loginForm.checkValidity() returned false.'
        );

        loginForm.reportValidity();
        console.error('Form is not valid');
        return;
      }

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }

      try {
        const existingUsers = JSON.parse(localStorage.getItem(USER_KEY)) || [];
        console.log('Existing users from localStorage:', existingUsers);

        const foundUser = existingUsers.find(
          (user) => user.email === email && user.password === password
        );

        if (foundUser) {
          sessionStorage.setItem('currentUserEmail', foundUser.email);
          sessionStorage.setItem('loginTimestamp', Date.now().toString());
          console.log(
            'User logged in:',
            foundUser.email,
            'Timestamp:',
            sessionStorage.getItem('loginTimestamp')
          );
          window.location.href = 'home.html';
        } else {
          console.log('Login failed: Invalid email or password.');
          alert('Invalid email or password.');
        }
      } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
      }
    });
  } else {
    console.warn('Login form with ID "loginForm" not found in login.html');
  }
});
