/**
 * @file flats.js
 * Manages the display, filtering, sorting, and favoriting of flat listings.
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
    console.log('No user logged in. Redirecting to login.');
    window.location.href = 'login.html';
    return false;
  }

  if (!loginTimestampStr) {
    console.log(
      'Login timestamp not found. Session invalid. Redirecting to login.'
    );
    sessionStorage.removeItem('currentUserEmail'); // Clear partial session data
    alert('Your session is invalid. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  const loginTimestamp = parseInt(loginTimestampStr, 10);
  const currentTime = Date.now();

  if (currentTime - loginTimestamp > SESSION_DURATION_MS) {
    console.log('Session expired. Redirecting to login.');
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('loginTimestamp');
    alert('Your session has expired. Please log in again.');
    window.location.href = 'login.html';
    return false;
  }

  // Optional: Refresh timestamp to implement sliding session
  // sessionStorage.setItem('loginTimestamp', Date.now().toString());
  console.log('Session valid.');
  return true;
}

let allFlatsArray = []; // Store the original full list of flats, loaded from localStorage
const FLATS_STORAGE_KEY = 'renteaseFlats'; // localStorage key for all flats
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
  const sortOptions = [
    { id: 'sortCityLink', sortBy: 'city', defaultText: 'City' },
    { id: 'sortPriceLink', sortBy: 'price', defaultText: 'Price' },
    { id: 'sortAreaLink', sortBy: 'area', defaultText: 'Area' },
  ];

  sortOptions.forEach((opt) => {
    const linkElement = document.getElementById(opt.id);
    if (linkElement) {
      if (currentSortBy === opt.sortBy) {
        // Append sort direction indicator if this option is the current sort key
        linkElement.textContent =
          opt.defaultText + SORT_INDICATORS[currentSortOrder];
      } else {
        // Reset to default text if not the current sort key
        linkElement.textContent = opt.defaultText;
      }
    }
  });
}

/**
 * Renders the provided list of flats into the HTML table.
 * @param {Array<Object>} flatsToDisplay - An array of flat objects to display.
 */
function renderFlatsTable(flatsToDisplay) {
  const tbody = document.querySelector('#table tbody');
  if (!tbody) {
    console.error('#table tbody not found. Cannot display flats.');
    return;
  }
  tbody.innerHTML = ''; // Clear existing rows before rendering new ones

  if (flatsToDisplay && flatsToDisplay.length > 0) {
    flatsToDisplay.forEach((flat) => {
      // createFlatRow handles appending the row to the tbody
      createFlatRow(flat, tbody, allFlatsArray);
    });
  } else {
    // Display a message if no flats match filters or none are available
    console.log('No flats to display.');
    const tr = tbody.insertRow();
    const td = tr.insertCell();
    td.colSpan = 9; // Adjusted colspan to match the number of columns including favorite
    td.textContent =
      'No flats match the current filters or no flats available.';
    td.style.textAlign = 'center';
  }
}

/**
 * Creates a table row (<tr>) for a single flat and appends it to the table body.
 * Also handles the favorite button functionality for the flat.
 * @param {Object} flatData - The flat object containing its properties.
 * @param {HTMLElement} tbody - The <tbody> element of the table where the row will be appended.
 * @param {Array<Object>} masterFlatsArray - The reference to the master list of all flats (allFlatsArray).
 */
function createFlatRow(flatData, tbody, masterFlatsArray) {
  const newTr = document.createElement('tr');

  // Define which properties to display in which order
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

  // Create a <td> for each property and append to the row
  propertiesToDisplay.forEach((propValue) => {
    const td = document.createElement('td');
    td.textContent =
      propValue !== undefined && propValue !== null
        ? propValue.toString()
        : 'N/A'; // Display 'N/A' for undefined or null properties
    newTr.appendChild(td);
  });

  // Create the favorite button cell
  const favTd = document.createElement('td');
  const favButton = document.createElement('input');
  favButton.type = 'checkbox';
  favButton.className = 'form-check-input';
  favButton.checked = flatData.isFavorite || false; // Set initial state from flatData

  // Event listener for the favorite button
  favButton.addEventListener('change', () => {
    const targetFlatIdentifingProps = getCoreProperties(flatData);
    // Find the corresponding flat in the master list to update its favorite status
    const targetFlatInMaster = masterFlatsArray.find(
      (f) =>
        JSON.stringify(getCoreProperties(f)) ===
        JSON.stringify(targetFlatIdentifingProps)
    );

    if (targetFlatInMaster) {
      targetFlatInMaster.isFavorite = favButton.checked;
    }
    // Update the master list in localStorage
    localStorage.setItem(FLATS_STORAGE_KEY, JSON.stringify(masterFlatsArray));

    // Update the separate list of favorite flats in localStorage
    let favoriteFlats =
      JSON.parse(localStorage.getItem(favoriteFLATS_STORAGE_KEY)) || [];
    const currentFlatCorePropsString = JSON.stringify(
      getCoreProperties(flatData)
    );

    if (favButton.checked) {
      // Add to favorites if not already present
      if (
        !favoriteFlats.some(
          (favFlat) =>
            JSON.stringify(getCoreProperties(favFlat)) ===
            currentFlatCorePropsString
        )
      ) {
        favoriteFlats.push(targetFlatInMaster ? targetFlatInMaster : flatData);
      }
      console.log('Added to favorites list:', flatData.city);
    } else {
      // Remove from favorites
      favoriteFlats = favoriteFlats.filter(
        (favFlat) =>
          JSON.stringify(getCoreProperties(favFlat)) !==
          currentFlatCorePropsString
      );
      console.log('Removed from favorites list:', flatData.city);
    }
    localStorage.setItem(
      favoriteFLATS_STORAGE_KEY,
      JSON.stringify(favoriteFlats)
    );
    console.log('Updated favoriteFlats in localStorage.');

    // Re-apply filters and sorting, then re-render the table to reflect changes
    applyFiltersAndRender();
  });

  favTd.appendChild(favButton);
  newTr.appendChild(favTd);
  tbody.appendChild(newTr);
}

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

/**
 * Applies the current filter and sort criteria to the `allFlatsArray`
 * and then calls `renderFlatsTable` to update the displayed table.
 * Also updates sort indicators.
 */
function applyFiltersAndRender() {
  // Get filter values from input fields
  const filterCity = document
    .getElementById('filterCity')
    .value.trim()
    .toLowerCase();
  const filterMinPrice = parseFloat(
    document.getElementById('filterMinPrice').value
  );
  const filterMaxPrice = parseFloat(
    document.getElementById('filterMaxPrice').value
  );
  const filterMinArea = parseFloat(
    document.getElementById('filterMinArea').value
  );
  const filterMaxArea = parseFloat(
    document.getElementById('filterMaxArea').value
  );

  let filteredFlats = [...allFlatsArray]; // Start with a copy of all flats

  // Apply city filter (case-insensitive)
  if (filterCity) {
    filteredFlats = filteredFlats.filter(
      (flat) => flat.city && flat.city.toLowerCase().includes(filterCity)
    );
  }
  // Apply min price filter
  if (!isNaN(filterMinPrice)) {
    filteredFlats = filteredFlats.filter(
      (flat) =>
        flat.price !== undefined && parseFloat(flat.price) >= filterMinPrice
    );
  }
  // Apply max price filter
  if (!isNaN(filterMaxPrice)) {
    filteredFlats = filteredFlats.filter(
      (flat) =>
        flat.price !== undefined && parseFloat(flat.price) <= filterMaxPrice
    );
  }
  // Apply min area filter
  if (!isNaN(filterMinArea)) {
    filteredFlats = filteredFlats.filter(
      (flat) =>
        flat.area !== undefined && parseFloat(flat.area) >= filterMinArea
    );
  }
  // Apply max area filter
  if (!isNaN(filterMaxArea)) {
    filteredFlats = filteredFlats.filter(
      (flat) =>
        flat.area !== undefined && parseFloat(flat.area) <= filterMaxArea
    );
  }

  // Apply sorting if a sort key is set
  if (currentSortBy) {
    filteredFlats.sort((a, b) => {
      let valA = a[currentSortBy];
      let valB = b[currentSortBy];

      // Convert to number for price and area for correct numerical sorting
      if (currentSortBy === 'price' || currentSortBy === 'area') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (typeof valA === 'string') {
        // Convert to lowercase for case-insensitive string sorting
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      // Comparison logic based on sort order
      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0; // Equal values
    });
  }

  renderFlatsTable(filteredFlats); // Render the filtered and sorted flats
  updateSortIndicators(); // Update the sort direction indicators in the UI
}

// Main execution block after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeNavbar();
  // Check if user is logged in, redirect to login page if not
  if (!validateSession()) {
    return; // Stop further execution if session is invalid
  }

  // Load initial flats from localStorage
  const storedFlats = localStorage.getItem(FLATS_STORAGE_KEY);
  if (storedFlats) {
    allFlatsArray = JSON.parse(storedFlats);
  } else {
    allFlatsArray = []; // Initialize with an empty array if no flats are stored
  }

  // Initial render of the flats table (applies default filters/sort)
  applyFiltersAndRender();

  // Setup filter button listener
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  if (applyFiltersButton) {
    applyFiltersButton.addEventListener('click', applyFiltersAndRender);
  }

  // Setup reset button listener
  const resetOptionsButton = document.getElementById('resetOptions');
  if (resetOptionsButton) {
    resetOptionsButton.addEventListener('click', () => {
      // Clear all filter input fields
      document.getElementById('filterCity').value = '';
      document.getElementById('filterMinPrice').value = '';
      document.getElementById('filterMaxPrice').value = '';
      document.getElementById('filterMinArea').value = '';
      document.getElementById('filterMaxArea').value = '';

      // Reset sort state to default
      currentSortBy = null;
      currentSortOrder = 'asc';

      // Re-apply (now empty) filters and default sort, then re-render
      applyFiltersAndRender();
    });
  }

  // Setup sort option listeners for each sortable column link
  const sortOptions = document.querySelectorAll('.sort-option');
  sortOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default link behavior
      const sortBy = e.target.dataset.sortBy; // Get sort key from data-sort-by attribute

      // Toggle sort order if the same column is clicked again, otherwise set to ascending
      if (currentSortBy === sortBy) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortBy = sortBy;
        currentSortOrder = 'asc';
      }

      console.log(`Sorting by: ${currentSortBy}, Order: ${currentSortOrder}`);
      // Apply new sort criteria and re-render table
      applyFiltersAndRender();
    });
  });

  // Initial call to set sort indicators correctly based on currentSortBy and currentSortOrder
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
