/**
 * @file new-flats.js
 * Handles the form for adding new flats and populating the city dropdown.
 */

// Session Timeout Configuration
const SESSION_DURATION_MINUTES = 60;
const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000;

/**
 * Checks if the current user session is valid (exists and not expired).
 * If invalid, clears session data and redirects to login.
 * @returns {boolean} True if the session is valid, false otherwise.
 */
function validateSession() {
  const currentUserEmail = sessionStorage.getItem('currentUserEmail');
  const loginTimestampStr = sessionStorage.getItem('loginTimestamp');

  if (!currentUserEmail) {
    console.log('No user logged in (new-flats.js). Redirecting to login.');
    window.location.href = 'login.html';
    return false;
  }

  if (!loginTimestampStr) {
    console.log(
      'Login timestamp not found (new-flats.js). Session invalid. Redirecting to login.'
    );
    sessionStorage.removeItem('currentUserEmail');
    alert('Your session is invalid. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  const loginTimestamp = parseInt(loginTimestampStr, 10);
  const currentTime = Date.now();

  if (currentTime - loginTimestamp > SESSION_DURATION_MS) {
    console.log('Session expired (new-flats.js). Redirecting to login.');
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('loginTimestamp');
    alert('Your session has expired. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  console.log('Session valid (new-flats.js).');
  return true;
}

class Flat {
  constructor(city, street, number, area, ac, yearBuilt, price, availableDate) {
    this.city = city;
    this.street = street;
    this.number = number;
    this.area = area;
    this.ac = ac;
    this.yearBuilt = yearBuilt;
    this.price = price;
    this.availableDate = availableDate;
  }
}

const FLATS_STORAGE_KEY = 'renteaseFlats';

document.addEventListener('DOMContentLoaded', () => {
  if (!validateSession()) {
    return; // Stop further execution if session is invalid
  }
  initializeNavbar(); // Call should be here

  const citySelect = document.getElementById('citySelect');
  const LOCAL_CITIES_JSON_PATH = 'js/bc-cities.json';

  if (citySelect) {
    fetch(LOCAL_CITIES_JSON_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - Could not find ${LOCAL_CITIES_JSON_PATH}. Make sure the file exists and is correctly formatted.`
          );
        }
        return response.json();
      })
      .then((cityArray) => {
        if (Array.isArray(cityArray) && cityArray.length > 0) {
          const uniqueCities = new Set(cityArray); // Ensure uniqueness if not already unique
          const sortedCities = Array.from(uniqueCities).sort(); // Sort alphabetically

          sortedCities.forEach((cityName) => {
            if (typeof cityName === 'string' && cityName.trim() !== '') {
              const option = document.createElement('option');
              option.value = cityName.trim();
              option.textContent = cityName.trim();
              citySelect.appendChild(option);
            }
          });
        } else {
          console.warn(
            `No cities found in ${LOCAL_CITIES_JSON_PATH} or it is not a valid array.`
          );
          addDefaultCityOption('Could not load cities');
        }
      })
      .catch((error) => {
        console.error('Error fetching or processing local city data:', error);
        addDefaultCityOption('Error loading cities');
      });
  } else {
    console.warn('City select dropdown with ID "citySelect" not found.');
  }

  function addDefaultCityOption(message) {
    if (citySelect && citySelect.options.length <= 1) {
      // Only if it's just the "Choose..." option
      const option = document.createElement('option');
      option.value = '';
      option.textContent = message;
      option.disabled = true;
      citySelect.appendChild(option);
    }
  }

  const registrationForm = document.getElementById('registerForm');

  /**
   * Returns an object containing the core identifying properties of a flat.
   * Used for comparing flats, especially when checking for existence in the favorites list.
   * @param {Object} flat - The flat object.
   * @returns {Object} An object with core properties (city, street, number, area, yearBuilt).
   */
  const getCoreProperties = (flat) => {
    return {
      city: flat.city,
      street: flat.street,
      number: flat.number,
      area: flat.area,
      yearBuilt: flat.yearBuilt,
    };
  };

  if (registrationForm) {
    registrationForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // Form validation check (Bootstrap)
      if (!registrationForm.checkValidity()) {
        registrationForm.classList.add('was-validated');
        // Find the first invalid field and focus it for better UX
        const firstInvalidField = registrationForm.querySelector(
          ':invalid:not(fieldset)'
        ); // :not(fieldset) to avoid issues with fieldset
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      const city = document.getElementById('citySelect').value;
      const street = document.getElementById('street').value;
      const number = document.getElementById('streetNumber').value;
      const area = document.getElementById('area').value;
      const ac = document.getElementById('ac').checked;
      const yearBuilt = document.getElementById('yearBuilt').value;
      const price = document.getElementById('price').value;
      const availableDate = document.getElementById('availableDate').value;

      const newFlat = new Flat(
        city,
        street,
        number,
        area,
        ac,
        yearBuilt,
        price,
        availableDate
      );

      try {
        const existingFlats =
          JSON.parse(localStorage.getItem(FLATS_STORAGE_KEY)) || [];

        const newFlatCorePropsString = JSON.stringify(
          getCoreProperties(newFlat)
        ); // Stringify new flat's core props

        // Corrected duplicate check using stringified core properties
        if (
          existingFlats.some(
            (flat) =>
              JSON.stringify(getCoreProperties(flat)) === newFlatCorePropsString
          )
        ) {
          alert(
            'A flat with these core details (City, Street, Number, Area, Year Built) already exists.'
          );
          registrationForm.classList.remove('was-validated'); // Reset validation display for this specific alert
          return;
        }

        existingFlats.push(newFlat);
        localStorage.setItem(FLATS_STORAGE_KEY, JSON.stringify(existingFlats));

        alert('Flat added successfully!'); // Unified alert message

        // Reset form fields
        registrationForm.reset(); // More concise way to reset form
        document.getElementById('citySelect').value = ''; // Explicitly reset select if .reset() doesn't cover it well
        registrationForm.classList.remove('was-validated'); // Clear validation styling
      } catch (err) {
        console.error('Error saving to localStorage:', err);
        alert('An error occurred while saving the flat. Please try again.');
      }
    });
  } else {
    console.warn('ID "registerForm" not found in new-flats.html');
  }
});

function initializeNavbar() {
  const userGreetingNameSpan = document.getElementById('userGreetingName');
  const currentUserEmail = sessionStorage.getItem('currentUserEmail');

  if (currentUserEmail && userGreetingNameSpan) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = users.find(
      (user) =>
        user._email === currentUserEmail || user.email === currentUserEmail
    );
    if (currentUser) {
      userGreetingNameSpan.textContent =
        currentUser._firstName || currentUser.firstName || currentUserEmail; // Fallback to email if name not found
    } else {
      userGreetingNameSpan.textContent = currentUserEmail; // Fallback if user object not found
    }
  } else if (userGreetingNameSpan) {
    userGreetingNameSpan.textContent = 'Guest'; // Or hide the greeting
  }

  // Optional: Set active nav link
  const currentPage = window.location.pathname.split('/').pop(); // e.g., "home.html"
  if (currentPage) {
    const navLinks = {
      'home.html': document.getElementById('navHomeLink'),
      'new-flats.html': document.getElementById('navNewFlatLink'),
      'flats.html': document.getElementById('navAllFlatsLink'),
      'profile.html': document.getElementById('navProfileLink'),
    };
    // Remove 'active' from all
    Object.values(navLinks).forEach(
      (link) => link && link.classList.remove('active', 'fw-bold')
    );
    // Add 'active' and 'fw-bold' to current page's link
    if (navLinks[currentPage]) {
      navLinks[currentPage].classList.add('active', 'fw-bold');
      navLinks[currentPage].setAttribute('aria-current', 'page');
    }
  }

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentUserEmail');
      sessionStorage.removeItem('loginTimestamp');
      alert('You have been logged out.');
      window.location.href = 'login.html';
    });
  }
}
