/**
 * @file home.js
 * Manages the display of favorite flat listings and allows their removal.
 * Based on flats.js but tailored for a favorites-only view.
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
    console.log('No user logged in (home.js). Redirecting to login.');
    window.location.href = 'login.html';
    return false;
  }

  if (!loginTimestampStr) {
    console.log(
      'Login timestamp not found (home.js). Session invalid. Redirecting to login.'
    );
    sessionStorage.removeItem('currentUserEmail');
    alert('Your session is invalid. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  const loginTimestamp = parseInt(loginTimestampStr, 10);
  const currentTime = Date.now();

  if (currentTime - loginTimestamp > SESSION_DURATION_MS) {
    console.log('Session expired (home.js). Redirecting to login.');
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('loginTimestamp');
    alert('Your session has expired. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  console.log('Session valid (home.js).');
  return true;
}

let allFlatsArray = []; // Store the list of favorite flats, loaded from localStorage
// const FLATS_STORAGE_KEY = 'renteaseFlats'; // Not directly used for loading in this favorites view
const favoriteFLATS_STORAGE_KEY = 'favoriteFlats'; // localStorage key for favorite flats

let currentSortBy = null; // Stores the current sort key (e.g., 'city', 'price')
let currentSortOrder = 'asc'; // Stores the current sort order ('asc' or 'desc')

const SORT_INDICATORS = {
  asc: ' ▲',
  desc: ' ▼',
};

/**
 * Updates the text content of sort option links to indicate the current sort column and direction.
 */
function updateSortIndicators() {
  // This function might be less relevant if home.html doesn't have sort UI,
  // but kept for now for structural consistency or if sorting favorites is desired.
  const sortOptions = [
    { id: 'sortCityLink', sortBy: 'city', defaultText: 'City' },
    { id: 'sortPriceLink', sortBy: 'price', defaultText: 'Price' },
    { id: 'sortAreaLink', sortBy: 'area', defaultText: 'Area' },
  ];

  sortOptions.forEach((opt) => {
    const linkElement = document.getElementById(opt.id);
    if (linkElement) {
      if (currentSortBy === opt.sortBy) {
        linkElement.textContent =
          opt.defaultText + SORT_INDICATORS[currentSortOrder];
      } else {
        linkElement.textContent = opt.defaultText;
      }
    }
  });
}

/**
 * Renders the provided list of flats (favorites) into the HTML table.
 * @param {Array<Object>} flatsToDisplay - An array of favorite flat objects to display.
 */
function renderFlatsTable(flatsToDisplay) {
  const tbody = document.querySelector('#table tbody'); // Ensure your home.html has a table with this ID
  if (!tbody) {
    console.error('#table tbody not found. Cannot display favorite flats.');
    return;
  }
  tbody.innerHTML = '';

  if (flatsToDisplay && flatsToDisplay.length > 0) {
    flatsToDisplay.forEach((flat) => {
      createFlatRow(flat, tbody);
    });
  } else {
    console.log('No favorite flats to display.');
    const tr = tbody.insertRow();
    const td = tr.insertCell();
    td.colSpan = 9;
    td.textContent = 'You have no favorite flats yet.';
    td.style.textAlign = 'center';
  }
}

/**
 * Creates a table row (<tr>) for a single favorite flat and appends it to the table body.
 * Includes a 'Remove' button to remove the flat from favorites.
 * @param {Object} flatData - The favorite flat object.
 * @param {HTMLElement} tbody - The <tbody> element to append the row to.
 */
function createFlatRow(flatData, tbody) {
  const newTr = document.createElement('tr');
  const propertiesToDisplay = [
    flatData.city,
    flatData.street,
    flatData.number,
    flatData.area,
    flatData.ac ? 'Yes' : 'No',
    flatData.yearBuilt,
    flatData.price,
    flatData.availableDate,
  ];

  propertiesToDisplay.forEach((propValue) => {
    const td = document.createElement('td');
    td.textContent =
      propValue !== undefined && propValue !== null
        ? propValue.toString()
        : 'N/A';
    newTr.appendChild(td);
  });

  const actionTd = document.createElement('td');
  const removeButton = document.createElement('button');
  removeButton.className = 'btn btn-danger btn-sm';
  removeButton.textContent = 'Remove';

  removeButton.addEventListener('click', () => {
    // 1. Remove from localStorage (favoriteFLATS_STORAGE_KEY)
    let favoriteFlats =
      JSON.parse(localStorage.getItem(favoriteFLATS_STORAGE_KEY)) || [];
    const currentFlatCorePropsString = JSON.stringify(
      getCoreProperties(flatData)
    );

    favoriteFlats = favoriteFlats.filter(
      (favFlat) =>
        JSON.stringify(getCoreProperties(favFlat)) !==
        currentFlatCorePropsString
    );
    localStorage.setItem(
      favoriteFLATS_STORAGE_KEY,
      JSON.stringify(favoriteFlats)
    );
    console.log('Removed from favorites in localStorage:', flatData.city);

    // 2. Remove from the in-memory allFlatsArray for the current view
    allFlatsArray = allFlatsArray.filter(
      (flatInArray) =>
        JSON.stringify(getCoreProperties(flatInArray)) !==
        currentFlatCorePropsString
    );

    // 3. Also, ensure the flat's isFavorite status is set to false in the main renteaseFlats storage
    // This is important if the user navigates back to the all flats page.
    const allRentEaseFlats =
      JSON.parse(localStorage.getItem('renteaseFlats')) || [];
    const mainFlatIndex = allRentEaseFlats.findIndex(
      (f) => JSON.stringify(getCoreProperties(f)) === currentFlatCorePropsString
    );
    if (mainFlatIndex > -1) {
      allRentEaseFlats[mainFlatIndex].isFavorite = false;
      localStorage.setItem('renteaseFlats', JSON.stringify(allRentEaseFlats));
      console.log('Updated isFavorite in renteaseFlats for:', flatData.city);
    }

    // 4. Re-apply filters/sort (if any) and re-render the favorites table
    applyFiltersAndRender();
  });

  actionTd.appendChild(removeButton);
  newTr.appendChild(actionTd);
  tbody.appendChild(newTr);
}

/**
 * Returns an object containing the core identifying properties of a flat.
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

/**
 * Applies current filter/sort criteria to `allFlatsArray` (favorites) and re-renders.
 */
function applyFiltersAndRender() {
  const filterCityInput = document.getElementById('filterCity');
  const filterMinPriceInput = document.getElementById('filterMinPrice');
  const filterMaxPriceInput = document.getElementById('filterMaxPrice');
  const filterMinAreaInput = document.getElementById('filterMinArea');
  const filterMaxAreaInput = document.getElementById('filterMaxArea');

  let filteredFlats = [...allFlatsArray];

  // Apply filters only if the corresponding input elements exist
  if (filterCityInput) {
    const filterCity = filterCityInput.value.trim().toLowerCase();
    if (filterCity) {
      filteredFlats = filteredFlats.filter(
        (flat) => flat.city && flat.city.toLowerCase().includes(filterCity)
      );
    }
  }
  if (filterMinPriceInput) {
    const filterMinPrice = parseFloat(filterMinPriceInput.value);
    if (!isNaN(filterMinPrice)) {
      filteredFlats = filteredFlats.filter(
        (flat) =>
          flat.price !== undefined && parseFloat(flat.price) >= filterMinPrice
      );
    }
  }
  if (filterMaxPriceInput) {
    const filterMaxPrice = parseFloat(filterMaxPriceInput.value);
    if (!isNaN(filterMaxPrice)) {
      filteredFlats = filteredFlats.filter(
        (flat) =>
          flat.price !== undefined && parseFloat(flat.price) <= filterMaxPrice
      );
    }
  }
  if (filterMinAreaInput) {
    const filterMinArea = parseFloat(filterMinAreaInput.value);
    if (!isNaN(filterMinArea)) {
      filteredFlats = filteredFlats.filter(
        (flat) =>
          flat.area !== undefined && parseFloat(flat.area) >= filterMinArea
      );
    }
  }
  if (filterMaxAreaInput) {
    const filterMaxArea = parseFloat(filterMaxAreaInput.value);
    if (!isNaN(filterMaxArea)) {
      filteredFlats = filteredFlats.filter(
        (flat) =>
          flat.area !== undefined && parseFloat(flat.area) <= filterMaxArea
      );
    }
  }

  if (currentSortBy) {
    filteredFlats.sort((a, b) => {
      let valA = a[currentSortBy];
      let valB = b[currentSortBy];
      if (currentSortBy === 'price' || currentSortBy === 'area') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  renderFlatsTable(filteredFlats);
  updateSortIndicators();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('currentUserEmail')) {
    alert('You must be logged in to view this page.');
    window.location.href = 'login.html';
    return;
  }
  initializeNavbar();

  // Load initial flats directly from favoriteFLATS_STORAGE_KEY
  const storedFavoriteFlats = localStorage.getItem(favoriteFLATS_STORAGE_KEY);
  if (storedFavoriteFlats) {
    allFlatsArray = JSON.parse(storedFavoriteFlats);
  } else {
    allFlatsArray = [];
  }

  applyFiltersAndRender();

  const applyFiltersButton = document.getElementById('applyFiltersButton');
  if (applyFiltersButton) {
    applyFiltersButton.addEventListener('click', applyFiltersAndRender);
  }

  const resetOptionsButton = document.getElementById('resetOptions');
  if (resetOptionsButton) {
    resetOptionsButton.addEventListener('click', () => {
      if (document.getElementById('filterCity'))
        document.getElementById('filterCity').value = '';
      if (document.getElementById('filterMinPrice'))
        document.getElementById('filterMinPrice').value = '';
      if (document.getElementById('filterMaxPrice'))
        document.getElementById('filterMaxPrice').value = '';
      if (document.getElementById('filterMinArea'))
        document.getElementById('filterMinArea').value = '';
      if (document.getElementById('filterMaxArea'))
        document.getElementById('filterMaxArea').value = '';
      currentSortBy = null;
      currentSortOrder = 'asc';
      applyFiltersAndRender();
    });
  }

  const sortOptions = document.querySelectorAll('.sort-option');
  sortOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const sortBy = e.target.dataset.sortBy;
      if (currentSortBy === sortBy) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortBy = sortBy;
        currentSortOrder = 'asc';
      }
      console.log(
        `Sorting by (favorites): ${currentSortBy}, Order: ${currentSortOrder}`
      );
      applyFiltersAndRender();
    });
  });

  updateSortIndicators();
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
