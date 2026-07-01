// search.js — drop this in your project and include it before </body>
// Requires: an <input id="search-input"> and a <div id="search-results"> in your HTML

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

let debounceTimer = null;

// ── Event listener ─────────────────────────────────────────────────────────────
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();

  if (!query) {
    clearResults();
    return;
  }

  // Wait 300ms after the user stops typing before searching
  debounceTimer = setTimeout(() => fetchResults(query), 300);
});

// Close results when clicking outside
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    clearResults();
  }
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
async function fetchResults(query) {
  showLoading();

  try {
    const res = await fetch(window.apiPath(`/api/search?q=${encodeURIComponent(query)}`));
    if (!res.ok) throw new Error("Search request failed");

    const products = await res.json();
    renderResults(products, query);
  } catch (err) {
    showError();
    console.error("Search error:", err);
  }
}

// ── Render ─────────────────────────────────────────────────────────────────────
function renderResults(products, query) {
  searchResults.innerHTML = "";

  if (products.length === 0) {
    searchResults.innerHTML = `
      <div class="search-empty">
        No products found for "<strong>${escapeHtml(query)}</strong>"
      </div>`;
    show(searchResults);
    return;
  }

  const list = document.createElement("ul");
  list.className = "search-list";

  products.forEach((product) => {
    const li = document.createElement("li");
    li.className = "search-item";
    li.innerHTML = `
      ${product.image
        ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="search-thumb" />`
        : `<div class="search-thumb search-thumb--placeholder"></div>`
      }
      <div class="search-info">
        <span class="search-name">${highlight(product.name, query)}</span>
        <span class="search-desc">${highlight(truncate(product.description, 80), query)}</span>
      </div>
      ${product.price != null
        ? `<span class="search-price">Ksh${Number(product.price).toFixed(2)}</span>`
        : ""
      }
    `;

    // Navigate to the product page on click
    li.addEventListener("click", () => {
      window.location.href = `product-detail.html?id=${product.id}`; // Adjust URL pattern to match your site
    });

    list.appendChild(li);
  });

  searchResults.appendChild(list);
  show(searchResults);
}

function showLoading() {
  searchResults.innerHTML = `<div class="search-loading">Searching…</div>`;
  show(searchResults);
}

function showError() {
  searchResults.innerHTML = `<div class="search-error">Something went wrong. Please try again.</div>`;
  show(searchResults);
}

function clearResults() {
  searchResults.innerHTML = "";
  hide(searchResults);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function highlight(text, query) {
  if (!text) return "";
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapeHtml(text).replace(
    new RegExp(`(${escaped})`, "gi"),
    "<mark>$1</mark>"
  );
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function show(el) { el.style.display = "block"; }
function hide(el) { el.style.display = "none"; }
