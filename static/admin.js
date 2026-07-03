const BASE = window.API_BASE_URL;
const API = window.apiPath('/api/admin');
const DELIVERY_API = window.deliveryApiPath('/api/admin/delivery');


// ── Toast ─────────────────────────────────────────────────────────
function setStatus(msg, type = "success") {
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.innerText = msg;

    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 250); }, 3000);
}


// ── Analytics ─────────────────────────────────────────────────────
async function loadAnalytics() {
    const res  = await fetch(`${API}/analytics`);
    const data = await res.json();
    document.getElementById("ordersCount").innerText = data.orders;
    document.getElementById("revenue").innerText     = data.revenue;
    document.getElementById("pending").innerText     = data.pending;
}


// ── Products ──────────────────────────────────────────────────────
async function loadProducts() {
    const res  = await fetch(`${BASE}/api/products`);
    const data = await res.json();

    const table       = document.getElementById("productsTable");
    const stockSelect = document.getElementById("stockProductId");
    const prev        = stockSelect ? stockSelect.value : "";

    table.innerHTML = "";
    if (stockSelect) stockSelect.innerHTML = `<option value="">Select a product…</option>`;

    data.forEach(p => {
        table.innerHTML += `
        <tr>
            <td>${p.id}</td><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td>
            <td><button class="btn-primary" onclick="deleteProduct(${p.id})">Delete</button></td>
        </tr>`;
        if (stockSelect)
            stockSelect.innerHTML += `<option value="${p.id}">${p.name} (current: ${p.stock})</option>`;
    });

    if (stockSelect && prev) stockSelect.value = prev;
}

async function createProduct() {
    const fileInput = document.getElementById("imageFile");
    const file      = fileInput.files[0];
    let imageUrl    = document.getElementById("image").value.trim();

    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes  = await fetch(`${BASE}/api/admin/upload-image`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) { setStatus(uploadData.error || "Image upload failed", "error"); return; }
        imageUrl = uploadData.imageUrl;
    }

    const body = {
        name: document.getElementById("name").value,
        brand: document.getElementById("brand").value,
        price: document.getElementById("price").value,
        stock: document.getElementById("stock").value,
        description: document.getElementById("description").value,
        category: document.getElementById("category").value,
        subcategory: document.getElementById("subcategory").value,
        image: imageUrl,
    };

    await fetch(`${API}/products`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    setStatus("Product created");
    fileInput.value = "";
    document.getElementById("image").value = "";
    loadProducts();
}

async function updateStock() {
    const id    = document.getElementById("stockProductId").value;
    const stock = document.getElementById("stockNewValue").value;
    if (!id || stock === "") { setStatus("Product ID and stock value are required", "error"); return; }
    const res  = await fetch(`${API}/products/${id}/stock`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ stock }) });
    const data = await res.json();
    if (!res.ok || data.error) { setStatus(data.error || "Failed to update stock", "error"); return; }
    setStatus("Stock updated");
    document.getElementById("stockNewValue").value = "";
    loadProducts();
}

async function deleteProduct(id) {
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
    setStatus("Product deleted");
    loadProducts();
}


// ── Edit Product Modal ─────────────────────────────────────────────
function openEditProductModal(id) {
    const p = _allProducts.find(prod => prod.id === id);
    if (!p) { setStatus("Product not found", "error"); return; }

    document.getElementById("edit-product-id").value      = p.id;
    document.getElementById("edit-name").value             = p.name || "";
    document.getElementById("edit-brand").value             = p.brand || "";
    document.getElementById("edit-price").value             = p.price || "";
    document.getElementById("edit-stock").value             = p.stock || "";
    document.getElementById("edit-description").value       = p.description || "";
    document.getElementById("edit-category").value          = p.category || "";
    document.getElementById("edit-subcategory").value       = p.subcategory || "";
    document.getElementById("edit-imageFile").value         = "";

    const imgPreview = document.getElementById("edit-current-image");
    if (p.image) {
        imgPreview.src = p.image;
        imgPreview.style.display = "block";
    } else {
        imgPreview.style.display = "none";
    }

    document.getElementById("editProductModal").classList.add("open");
}

function closeEditProductModal() {
    document.getElementById("editProductModal").classList.remove("open");
}

async function saveProductEdit() {
    const id = document.getElementById("edit-product-id").value;
    const fileInput = document.getElementById("edit-imageFile");
    const file = fileInput.files[0];

    let imageUrl = document.getElementById("edit-current-image").src;
    const existing = _allProducts.find(p => p.id === parseInt(id));
    if (!file && existing) imageUrl = existing.image;

    if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes  = await fetch(`${BASE}/api/admin/upload-image`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) { setStatus(uploadData.error || "Image upload failed", "error"); return; }
        imageUrl = uploadData.imageUrl;
    }

    const body = {
        name: document.getElementById("edit-name").value,
        brand: document.getElementById("edit-brand").value,
        price: document.getElementById("edit-price").value,
        stock: document.getElementById("edit-stock").value,
        description: document.getElementById("edit-description").value,
        category: document.getElementById("edit-category").value,
        subcategory: document.getElementById("edit-subcategory").value,
        image: imageUrl,
    };

    const res  = await fetch(`${API}/products/${id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setStatus(data.error || "Failed to update product", "error"); return; }

    setStatus("Product updated");
    closeEditProductModal();
    loadProducts();
}













let _allProducts = [];  // cache for edit modal

async function loadProducts() {
    const res  = await fetch(`${BASE}/api/products`);
    const data = await res.json();
    _allProducts = data;

    const table       = document.getElementById("productsTable");
    const stockSelect = document.getElementById("stockProductId");
    const prev        = stockSelect ? stockSelect.value : "";

    table.innerHTML = "";
    if (stockSelect) stockSelect.innerHTML = `<option value="">Select a product…</option>`;

    data.forEach(p => {
        table.innerHTML += `
        <tr>
            <td>${p.id}</td><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td>
            <td>
                <button class="btn-icon" title="Edit" onclick="openEditProductModal(${p.id})">✏️</button>
                <button class="btn-primary" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>`;
        if (stockSelect)
            stockSelect.innerHTML += `<option value="${p.id}">${p.name} (current: ${p.stock})</option>`;
    });

    if (stockSelect && prev) stockSelect.value = prev;
}
















// ── Orders ────────────────────────────────────────────────────────
let _allPartners = [];   // cache for the assign modal

async function loadOrders() {
    // Fetch from the delivery backend so we get partner info + correct status
    const res  = await fetch(`${DELIVERY_API}/orders`);
    const data = await res.json();

    const table = document.getElementById("ordersTable");
    table.innerHTML = "";

    data.forEach(o => {
        const partnerInfo = o.partner_name
            ? `<span style="color:#276749;font-weight:600;">${o.partner_name}</span>`
            : `<span style="color:#a0aec0;">Unassigned</span>`;

        // Which action buttons to show depends on current status
        let actions = "";

        if (o.status === "processing") {
            actions = `<button class="btn-sm btn-sm-green" onclick="confirmOrder(${o.id})">Confirm</button>`;
        }
        if (o.status === "confirmed") {
            actions = `<button class="btn-sm btn-sm-green" onclick="openAssignModal(${o.id})">Assign Partner</button>`;
        }
        if (!["delivered","cancelled"].includes(o.status)) {
            actions += ` <button class="btn-sm btn-sm-red" onclick="cancelOrder(${o.id})">Cancel</button>`;
        }
        actions += ` <button class="btn-sm btn-sm-gray" onclick="deleteOrder(${o.id})">Delete</button>`;

        table.innerHTML += `
        <tr>
            <td>${o.id}</td>
            <td>${o.user_name || "—"}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${o.products}">${o.products || "—"}</td>
            <td>KSh ${Number(o.total || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td>${partnerInfo}</td>
            <td>${o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
            <td style="white-space:nowrap">${actions}</td>
        </tr>`;
    });
}

async function confirmOrder(id) {
    const res  = await fetch(`${DELIVERY_API}/orders/${id}/confirm`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to confirm order", "error"); return; }
    setStatus(`Order #${id} confirmed`);
    loadOrders();
}

async function cancelOrder(id) {
    if (!confirm(`Cancel order #${id}? This cannot be undone.`)) return;
    const res  = await fetch(`${DELIVERY_API}/orders/${id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to cancel order", "error"); return; }
    setStatus(`Order #${id} cancelled`);
    loadOrders();
}

async function deleteOrder(id) {
    await fetch(`${API}/orders/${id}`, { method: "DELETE" });
    setStatus("Order deleted");
    loadOrders();
}

// Legacy "mark delivered" button removed — delivery is now done by the
// delivery partner via OTP verification. Only the partner can mark delivered.


// ── Assign Partner Modal ──────────────────────────────────────────
let _pendingAssignOrderId = null;

function openAssignModal(orderId) {
    _pendingAssignOrderId = orderId;
    document.getElementById("assignOrderLabel").textContent = `#${orderId}`;

    const select = document.getElementById("assignPartnerSelect");
    select.innerHTML = `<option value="">Choose a partner…</option>`;
    _allPartners
        .filter(p => p.status === "active")
        .forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.full_name} (${p.vehicle_type}) — ${p.phone}</option>`;
        });

    document.getElementById("assignModal").classList.add("open");
}

function closeAssignModal() {
    document.getElementById("assignModal").classList.remove("open");
    _pendingAssignOrderId = null;
}

async function confirmAssign() {
    const partnerId = document.getElementById("assignPartnerSelect").value;
    if (!partnerId) { setStatus("Please choose a partner", "error"); return; }

    const res  = await fetch(`${DELIVERY_API}/orders/${_pendingAssignOrderId}/assign`, {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ partner_id: parseInt(partnerId) }),
    });
    const data = await res.json();
    closeAssignModal();
    if (!res.ok) { setStatus(data.error || "Failed to assign order", "error"); return; }
    setStatus(`Order #${_pendingAssignOrderId} assigned successfully`);
    loadOrders();
}


// ── Delivery Partners ─────────────────────────────────────────────
async function loadPartners() {
    const res  = await fetch(`${DELIVERY_API}/partners`);
    const data = await res.json();
    _allPartners = data;      // keep a local cache for the assign modal

    const grid = document.getElementById("partnerGrid");
    if (!data.length) {
        grid.innerHTML = `<p style="color:#718096;grid-column:1/-1;">No delivery partners yet. Add one above.</p>`;
        return;
    }

    grid.innerHTML = data.map(p => `
        <div class="partner-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <h4>${p.full_name}</h4>
                <span class="badge-${p.status}">${p.status}</span>
            </div>
            <div class="p-meta">
                📧 ${p.email}<br>
                📞 ${p.phone}<br>
                🚗 ${p.vehicle_type}
            </div>
            <div class="p-actions">
                <button class="btn-sm btn-sm-yellow" onclick="resetPartnerPassword(${p.id})">Reset Password</button>
                <button class="btn-sm ${p.status === 'active' ? 'btn-sm-red' : 'btn-sm-green'}"
                        onclick="togglePartnerStatus(${p.id}, '${p.status}')">
                    ${p.status === "active" ? "Deactivate" : "Activate"}
                </button>
            </div>
        </div>`
    ).join("");
}

async function createPartner() {
    const full_name    = document.getElementById("dp-name").value.trim();
    const email        = document.getElementById("dp-email").value.trim();
    const phone        = document.getElementById("dp-phone").value.trim();
    const password     = document.getElementById("dp-password").value;
    const vehicle_type = document.getElementById("dp-vehicle").value;

    if (!full_name || !email || !phone || !password) {
        setStatus("All fields are required to add a partner", "error"); return;
    }

    const res  = await fetch(`${DELIVERY_API}/partners`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ full_name, email, phone, password, vehicle_type }),
    });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to create partner", "error"); return; }

    setStatus(`Partner ${full_name} added successfully`);
    document.getElementById("dp-name").value     = "";
    document.getElementById("dp-email").value    = "";
    document.getElementById("dp-phone").value    = "";
    document.getElementById("dp-password").value = "";
    loadPartners();
}

async function togglePartnerStatus(id, currentStatus) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const res  = await fetch(`${DELIVERY_API}/partners/${id}/status`, {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to update partner status", "error"); return; }
    setStatus(`Partner ${newStatus === "active" ? "activated" : "deactivated"}`);
    loadPartners();
}

// ── Password Reset Modal ──────────────────────────────────────────
let _tempPassword = "";

async function resetPartnerPassword(id) {
    if (!confirm("Generate a new temporary password for this partner?")) return;
    const res  = await fetch(`${DELIVERY_API}/partners/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to reset password", "error"); return; }

    _tempPassword = data.temporary_password;
    document.getElementById("pwdReveal").textContent = _tempPassword;
    document.getElementById("pwdModal").classList.add("open");
}

function closePwdModal() {
    document.getElementById("pwdModal").classList.remove("open");
    _tempPassword = "";
}

function copyTempPassword() {
    navigator.clipboard.writeText(_tempPassword).then(() => setStatus("Password copied to clipboard"));
}


// ── Contact Messages ──────────────────────────────────────────────
async function loadContactMessages() {
    const res      = await fetch(window.apiPath('/api/admin/contact-messages'));
    const messages = await res.json();
    const tbody    = document.querySelector('#contact-messages-table tbody');
    tbody.innerHTML = "";
    messages.forEach(msg => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${msg.name}</td>
            <td>${msg.email}</td>
            <td>${msg.message}</td>
            <td>${new Date(msg.created_at).toLocaleString()}</td>`;
        tbody.appendChild(row);
    });
}


// ── Init ──────────────────────────────────────────────────────────
loadAnalytics();
loadProducts();
loadOrders();
loadPartners();
loadContactMessages();
