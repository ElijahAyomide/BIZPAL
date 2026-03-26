const API_BASE_URL = "https://bizpal-api.onrender.com/api/v1";

const customerPageState = {
  customers: [],
  activeFilter: "all",
  searchTerm: "",
};

const leadPageState = {
  leads: [],
  customerMap: new Map(),
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function setCustomersFeedback(message, isError = true, isLoading = false) {
  const feedback = document.getElementById("customers-feedback");
  if (!feedback) return;

  feedback.textContent = message || "";
  feedback.style.color = isError ? "#c0392b" : "#2a6070";
  feedback.classList.toggle("loading", isLoading);
  feedback.classList.toggle("hidden", !message);
}

function extractCustomers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.customers)) return payload.customers;
  if (Array.isArray(payload?.data?.customers)) return payload.data.customers;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractSingleCustomer(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    if (payload.data.customer) return payload.data.customer;
    return payload.data;
  }
  if (payload?.customer) return payload.customer;
  return payload;
}

function normalizeStatus(customer) {
  const rawStatus = String(
    customer?.lead_status ||
      customer?.status ||
      customer?.customer_status ||
      "new",
  )
    .toLowerCase()
    .trim();

  if (rawStatus.includes("close")) {
    return "closed";
  }
  if (rawStatus.includes("interest")) {
    return "interested";
  }
  if (rawStatus.includes("negotia")) {
    return "negotiating";
  }
  if (rawStatus.includes("contact")) {
    return "contacted";
  }
  return "new";
}

function formatStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getSubtitle(customer) {
  return customer?.notes || customer?.business_type || "No additional details";
}

function getLastContact(customer) {
  const dateString =
    customer?.last_contact || customer?.updated_at || customer?.created_at;
  if (!dateString) return "-";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}hr${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return parsed.toLocaleDateString();
}

function getAvatarColorClass(index) {
  const colors = ["blue", "green", "yellow", "purple", "red"];
  return colors[index % colors.length];
}

function getCustomerId(customer) {
  return customer?.id || customer?._id || customer?.customer_id || null;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "--";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function setNodeText(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = String(value ?? "-");
}

function setDetailFeedback(message, isError = true, isLoading = false) {
  const node = document.getElementById("detail-feedback");
  if (!node) return;

  node.textContent = message || "";
  node.style.color = isError ? "#c0392b" : "#2a6070";
  node.classList.toggle("loading", isLoading);
  node.classList.toggle("hidden", !message);
}

function getDaysInPipeline(customer) {
  const createdAt = customer?.created_at;
  if (!createdAt) return "-";
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "-";
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

function renderDetailTimeline(customer) {
  const timeline = document.getElementById("detail-timeline");
  if (!timeline) return;

  const noteText = customer?.notes || "No notes available yet.";
  const created = formatDate(customer?.created_at);
  const updated = formatDate(customer?.updated_at);

  timeline.innerHTML = `
    <div class="timeline-item yellow">
      <p><strong>Latest Note:</strong> ${escapeHtml(noteText)}</p>
      <small>${escapeHtml(updated)}</small>
    </div>
    <div class="timeline-item purple">
      <p><strong>Status:</strong> ${escapeHtml(formatStatusLabel(normalizeStatus(customer)))}</p>
      <small>Updated ${escapeHtml(updated)}</small>
    </div>
    <div class="timeline-item blue">
      <p><strong>Customer added to BizPal</strong></p>
      <small>${escapeHtml(created)}</small>
    </div>
  `;
}

function hydrateCustomerDetail(customer) {
  const name = customer?.name || "Unnamed Customer";
  const status = formatStatusLabel(normalizeStatus(customer));
  const subtitle = [
    customer?.location,
    customer?.business_type,
    customer?.created_at
      ? `Customer since ${formatDate(customer.created_at)}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  setNodeText("detail-breadcrumb-name", name);
  setNodeText("detail-name", name);
  setNodeText("detail-subtitle", subtitle || "Customer details");
  setNodeText("detail-avatar", getInitials(name));

  setNodeText("detail-phone", customer?.phone || "-");
  setNodeText("detail-email", customer?.email || "-");
  setNodeText("detail-status-chip", status);
  setNodeText("detail-status-row", status);

  setNodeText("detail-full-name", name);
  setNodeText("detail-phone-row", customer?.phone || "-");
  setNodeText("detail-email-row", customer?.email || "-");
  setNodeText("detail-business-type", customer?.business_type || "-");
  setNodeText("detail-location", customer?.location || "-");
  setNodeText("detail-added-on", formatDate(customer?.created_at));

  setNodeText("detail-deal-value", customer?.deal_value || "-");
  setNodeText("detail-lead-source", customer?.lead_source || "-");
  setNodeText("detail-days-pipeline", getDaysInPipeline(customer));
  setNodeText("detail-next-followup", customer?.next_followup || "-");
  setNodeText(
    "detail-notes-count",
    customer?.notes_count || (customer?.notes ? "1 note" : "0 notes"),
  );

  const statusRow = document.getElementById("detail-status-row");
  if (statusRow) {
    statusRow.classList.toggle(
      "neutral",
      status.toLowerCase() !== "interested",
    );
  }

  const nextFollowup = document.getElementById("detail-next-followup");
  if (nextFollowup) {
    const nextFollowupText = String(
      customer?.next_followup || "",
    ).toLowerCase();
    nextFollowup.classList.toggle(
      "danger-text",
      nextFollowupText.includes("overdue"),
    );
  }

  renderDetailTimeline(customer);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function updateCustomerSummary(allCustomers) {
  const summary = document.getElementById("customers-summary-text");
  const allTab = document.getElementById("tab-all");
  const activeTab = document.getElementById("tab-active");
  const closedTab = document.getElementById("tab-closed");
  if (!summary || !allTab || !activeTab || !closedTab) return;

  const activeCount = allCustomers.filter(
    (customer) => normalizeStatus(customer) !== "closed",
  ).length;
  const closedCount = allCustomers.filter(
    (customer) => normalizeStatus(customer) === "closed",
  ).length;

  summary.textContent = `${allCustomers.length} customers total, ${activeCount} active leads`;
  allTab.textContent = `All (${allCustomers.length})`;
  activeTab.textContent = `Active Leads (${activeCount})`;
  closedTab.textContent = `Closed (${closedCount})`;
}

function getFilteredCustomers() {
  const searchTerm = customerPageState.searchTerm.toLowerCase();

  return customerPageState.customers.filter((customer) => {
    const status = normalizeStatus(customer);
    const matchesFilter =
      customerPageState.activeFilter === "all" ||
      (customerPageState.activeFilter === "closed" && status === "closed") ||
      (customerPageState.activeFilter === "active" && status !== "closed");

    if (!matchesFilter) return false;
    if (!searchTerm) return true;

    const haystack = [
      customer?.name,
      customer?.phone,
      customer?.email,
      customer?.location,
      customer?.business_type,
      customer?.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm);
  });
}

function renderCustomers() {
  const tableBody = document.getElementById("customers-table-body");
  const emptyState = document.getElementById("customers-empty-state");
  if (!tableBody || !emptyState) return;

  const customers = getFilteredCustomers();
  tableBody.innerHTML = "";

  if (customers.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  customers.forEach((customer, index) => {
    const row = document.createElement("div");
    row.className = "customers-table customers-table-row";
    row.setAttribute("role", "row");

    const status = normalizeStatus(customer);
    const subtitle = escapeHtml(getSubtitle(customer));
    const location = escapeHtml(customer?.location || "-");
    const name = escapeHtml(customer?.name || "Unnamed Customer");
    const phone = escapeHtml(customer?.phone || "-");
    const lastContact = escapeHtml(getLastContact(customer));
    const statusLabel = escapeHtml(formatStatusLabel(status));
    const customerId = getCustomerId(customer);
    const viewHref = customerId
      ? `/Dashboard/other-pages/customer-detail.html?id=${encodeURIComponent(String(customerId))}`
      : "javascript:void(0)";
    const viewClass = customerId ? "" : "disabled-link";

    row.innerHTML = `
			<div class="customer-name-wrap">
				<span class="avatar-dot ${getAvatarColorClass(index)}"></span>
				<div>
					<h3>${name}</h3>
					<p>${subtitle}</p>
				</div>
			</div>
			<span>${phone}</span>
			<span>${location}</span>
			<span><small class="status-pill ${status}">${statusLabel}</small></span>
			<span>${lastContact}</span>
      <div class="action-links"><a class="${viewClass}" href="${viewHref}">View</a><a class="disabled-link" href="javascript:void(0)">Edit</a></div>
		`;

    tableBody.appendChild(row);
  });
}

async function fetchCustomerById(id) {
  const response = await fetch(
    `${API_BASE_URL}/customers/${encodeURIComponent(String(id))}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load customer details.");
  }

  return extractSingleCustomer(payload);
}

async function initializeCustomerDetailPage() {
  const detailRoot = document.getElementById("customer-detail-root");
  if (!detailRoot) return;

  const params = new URLSearchParams(window.location.search);
  const customerId = params.get("id");

  if (!customerId) {
    setDetailFeedback("Missing customer id in URL.");
    return;
  }

  setDetailFeedback("Loading customer details...", false, true);

  try {
    const customer = await fetchCustomerById(customerId);
    hydrateCustomerDetail(customer || {});
    setDetailFeedback("");
  } catch (error) {
    setDetailFeedback(
      error instanceof Error
        ? error.message
        : "Could not load customer details. Please try again.",
    );
  }
}

async function fetchCustomers() {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load customers.");
  }

  return extractCustomers(payload);
}

function extractLeads(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (Array.isArray(payload?.data?.leads)) return payload.data.leads;
  return [];
}

function normalizeLeadStatus(lead) {
  const rawStatus = String(lead?.status || lead?.stage || "new")
    .toLowerCase()
    .trim();

  if (rawStatus.includes("lost")) return "lost";
  if (rawStatus.includes("close") || rawStatus.includes("won")) return "closed";
  if (rawStatus.includes("interest")) return "interested";
  if (rawStatus.includes("negotia")) return "negotiating";
  if (rawStatus.includes("contact")) return "contacted";
  return "new";
}

function formatLeadStatusLabel(status) {
  if (status === "new") return "New Leads";
  if (status === "closed") return "Closed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatLeadValue(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString();
}

function getLeadPillClass(status) {
  if (status === "new") return "new-lead-pill";
  if (status === "contacted") return "contacted-pill";
  if (status === "interested") return "interested-pill";
  if (status === "negotiating") return "negotiating-pill";
  if (status === "closed") return "closed-won-pill";
  return "lost-pill";
}

function setLeadsFeedback(message, isError = true) {
  const feedback = document.getElementById("leads-feedback");
  if (!feedback) return;
  feedback.textContent = message || "";
  feedback.style.color = isError ? "#c0392b" : "#2a6070";
  feedback.classList.toggle("hidden", !message);
}

function renderLeadsTable() {
  const tbody = document.getElementById("leads-table-body");
  const emptyNode = document.getElementById("leads-empty");
  if (!tbody || !emptyNode) return;

  tbody.innerHTML = "";
  if (!leadPageState.leads.length) {
    emptyNode.classList.remove("hidden");
    return;
  }

  emptyNode.classList.add("hidden");

  leadPageState.leads.forEach((lead) => {
    const row = document.createElement("tr");
    const normalizedStatus = normalizeLeadStatus(lead);
    const statusLabel = formatLeadStatusLabel(normalizedStatus);
    const statusClass = getLeadPillClass(normalizedStatus);
    const customer = leadPageState.customerMap.get(
      String(lead?.customer_id || ""),
    );
    const customerName =
      customer?.name || `Customer #${lead?.customer_id || "-"}`;
    const contact =
      customer?.email || customer?.phone || `ID: ${lead?.customer_id || "-"}`;
    const lastActivity = getLastContact({
      last_contact: lead?.contact_date,
      updated_at: lead?.updated_at,
      created_at: lead?.created_at,
    });
    const value = formatLeadValue(lead?.deal_value);
    const customerId = lead?.customer_id;
    const href = customerId
      ? `/Dashboard/other-pages/customer-detail.html?id=${encodeURIComponent(String(customerId))}`
      : "javascript:void(0)";

    row.innerHTML = `
      <td class="lead-name">${escapeHtml(customerName)}</td>
      <td class="lead-contact">${escapeHtml(contact)}</td>
      <td><span class="lead-stage-pill ${statusClass}">${escapeHtml(statusLabel)}</span></td>
      <td class="lead-value">${escapeHtml(value)}</td>
      <td class="lead-activity">${escapeHtml(lastActivity)}</td>
      <td><a class="lead-view-btn" href="${href}">View Details</a></td>
    `;

    tbody.appendChild(row);
  });
}

function updateLeadsSummary() {
  const leads = leadPageState.leads;
  const total = leads.length;

  const closedCount = leads.filter(
    (lead) => normalizeLeadStatus(lead) === "closed",
  ).length;
  const winRate = total ? Math.round((closedCount / total) * 100) : 0;
  const totalValue = leads.reduce(
    (sum, lead) => sum + (Number(lead?.deal_value) || 0),
    0,
  );

  let grade = "C GRADE";
  if (winRate >= 60) grade = "A GRADE";
  else if (winRate >= 40) grade = "B GRADE";

  setNodeText("pipeline-grade", grade);
  setNodeText("total-leads-value", total);
  setNodeText("closed-won-value", closedCount);
  setNodeText("win-rate-value", `${winRate}%`);
  setNodeText("pipeline-value", `${(totalValue / 1000000).toFixed(1)}M`);
}

function updateStageRow(stageKey, count, total) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  const fill = document.getElementById(`stage-${stageKey}-fill`);
  const pill = document.getElementById(`stage-${stageKey}-pill`);
  const pct = document.getElementById(`stage-${stageKey}-pct`);
  if (fill) fill.style.width = `${percent}%`;
  if (pill) pill.textContent = `${count} Lead${count === 1 ? "" : "s"}`;
  if (pct) pct.textContent = `${percent}%`;
}

function updateLeadStageMetrics() {
  const leads = leadPageState.leads;
  const total = leads.length;

  const counts = {
    new: 0,
    contacted: 0,
    interested: 0,
    negotiating: 0,
    closed: 0,
    lost: 0,
  };

  leads.forEach((lead) => {
    const status = normalizeLeadStatus(lead);
    counts[status] = (counts[status] || 0) + 1;
  });

  Object.keys(counts).forEach((stageKey) => {
    updateStageRow(stageKey, counts[stageKey], total);
  });
}

async function fetchLeads() {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load leads.");
  }

  return extractLeads(payload);
}

async function initializeLeadsPage() {
  const leadsTable = document.getElementById("leads-table-body");
  if (!leadsTable) return;

  setLeadsFeedback("Loading leads...", false);

  try {
    const [leads, customers] = await Promise.all([
      fetchLeads(),
      fetchCustomers().catch(() => []),
    ]);

    leadPageState.leads = leads;
    leadPageState.customerMap = new Map(
      customers.map((customer) => [String(getCustomerId(customer)), customer]),
    );

    updateLeadsSummary();
    updateLeadStageMetrics();
    renderLeadsTable();
    setLeadsFeedback("");
  } catch (error) {
    leadPageState.leads = [];
    leadPageState.customerMap = new Map();
    updateLeadsSummary();
    updateLeadStageMetrics();
    renderLeadsTable();
    setLeadsFeedback(
      error instanceof Error
        ? error.message
        : "Could not load leads. Please try again.",
    );
  }
}

async function initializeCustomersList() {
  const tableBody = document.getElementById("customers-table-body");
  if (!tableBody) return;

  setCustomersFeedback("Loading customers...", false, true);

  try {
    const customers = await fetchCustomers();
    customerPageState.customers = customers;
    updateCustomerSummary(customers);
    renderCustomers();
    setCustomersFeedback("");
  } catch (error) {
    customerPageState.customers = [];
    updateCustomerSummary([]);
    renderCustomers();
    setCustomersFeedback(
      error instanceof Error
        ? error.message
        : "Could not load customers. Please try again.",
    );
  }
}

function initializeCustomersFilters() {
  const searchInput = document.getElementById("customers-search");
  const tabButtons = document.querySelectorAll(".tab-btn[data-filter]");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      customerPageState.searchTerm = String(event.target.value || "").trim();
      renderCustomers();
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      customerPageState.activeFilter = button.dataset.filter || "all";
      tabButtons.forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderCustomers();
    });
  });
}

function setCreateCustomerFeedback(message, isError = true) {
  const feedback = document.getElementById("create-customer-feedback");
  if (!feedback) return;

  feedback.textContent = message || "";
  feedback.style.color = isError ? "#c0392b" : "#1b7f4f";
}

async function createCustomer(payload) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to create customer.");
  }

  return data;
}

async function handleCreateCustomerSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitBtn = document.getElementById("save-customer-btn");
  if (!form || !submitBtn) return;

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const businessType = String(formData.get("business_type") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !phone) {
    setCreateCustomerFeedback("Name and phone are required.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  setCreateCustomerFeedback("");

  try {
    await createCustomer({
      name,
      phone,
      email,
      business_type: businessType,
      location,
      notes,
    });

    setCreateCustomerFeedback("Customer saved successfully.", false);
    setTimeout(() => {
      window.location.href = "/Dashboard/other-pages/customer.html";
    }, 1200);
  } catch (error) {
    setCreateCustomerFeedback(
      error instanceof Error
        ? error.message
        : "Could not save customer. Please try again.",
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Customer ->";
  }
}

/* ── Create Lead helpers ──────────────────────────── */

function initializePillGroup(groupId, hiddenInputId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll(".cl-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      group
        .querySelectorAll(".cl-pill")
        .forEach((p) => p.classList.remove("cl-pill-active"));
      pill.classList.add("cl-pill-active");
      const hidden = document.getElementById(hiddenInputId);
      if (hidden) hidden.value = pill.dataset.value;
    });
  });
}

function initializeCreateLeadPage() {
  const form = document.getElementById("create-lead-form");
  if (!form) return;

  initializePillGroup("lead-status-group", "lead-status-value");
  initializePillGroup("lead-source-group", "lead-source-value");

  const nameInput = document.getElementById("lead-customer-name");
  const checkIcon = document.getElementById("name-check-icon");
  const customerIdInput = document.getElementById("lead-customer-id");
  const customerList = document.getElementById("lead-customers-list");

  let leadCustomers = [];
  const getNameKey = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const resolveCustomerByName = (nameValue) => {
    const lookup = getNameKey(nameValue);
    if (!lookup) return null;
    return (
      leadCustomers.find((customer) => getNameKey(customer?.name) === lookup) ||
      null
    );
  };

  const syncSelectedCustomer = () => {
    if (!nameInput || !customerIdInput || !checkIcon) return;
    const matchedCustomer = resolveCustomerByName(nameInput.value);
    const matchedId = matchedCustomer ? getCustomerId(matchedCustomer) : null;

    customerIdInput.value = matchedId ? String(matchedId) : "";
    checkIcon.style.display = matchedId ? "flex" : "none";
  };

  if (nameInput) {
    nameInput.addEventListener("input", syncSelectedCustomer);
    nameInput.addEventListener("change", syncSelectedCustomer);
    nameInput.addEventListener("blur", syncSelectedCustomer);

    fetchCustomers()
      .then((customers) => {
        leadCustomers = customers;
        if (customerList) {
          customerList.innerHTML = "";
          customers.forEach((customer) => {
            const name = String(customer?.name || "").trim();
            if (!name) return;
            const option = document.createElement("option");
            option.value = name;
            customerList.appendChild(option);
          });
        }
        syncSelectedCustomer();
      })
      .catch(() => {
        leadCustomers = [];
      });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-lead-btn");
    const feedback = document.getElementById("create-lead-feedback");

    const status = document.getElementById("lead-status-value")?.value || "";
    const source = document.getElementById("lead-source-value")?.value || "";
    const customerName = String(form.customer_name?.value || "").trim();
    const customerId = String(customerIdInput?.value || "").trim();

    if (!customerName) {
      feedback.textContent = "Customer name is required.";
      feedback.className = "cl-feedback error";
      feedback.style.display = "block";
      return;
    }

    if (!customerId) {
      feedback.textContent =
        "Select a valid customer name from the customer list.";
      feedback.className = "cl-feedback error";
      feedback.style.display = "block";
      return;
    }

    if (!status) {
      feedback.textContent = "Lead status is required.";
      feedback.className = "cl-feedback error";
      feedback.style.display = "block";
      return;
    }

    const payload = {
      customer_id: customerId,
      status,
      stage: status,
      source,
      deal_value: form.deal_value.value
        ? Number(form.deal_value.value)
        : undefined,
      contact_date: form.first_contacted_date.value || undefined,
      notes: form.notes.value.trim() || undefined,
    };

    if (!payload.customer_id) {
      feedback.textContent = "Customer id is required.";
      feedback.className = "cl-feedback error";
      feedback.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Saving...";
    feedback.style.display = "none";

    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to save lead.");
      feedback.textContent = "Lead saved successfully. Redirecting...";
      feedback.className = "cl-feedback success";
      feedback.style.display = "block";
      btn.disabled = true;
      btn.textContent = "Saved";

      setTimeout(() => {
        window.location.href = "/Dashboard/other-pages/leads.html";
      }, 1200);
    } catch (err) {
      feedback.textContent =
        err instanceof Error ? err.message : "Failed to save lead.";
      feedback.className = "cl-feedback error";
      feedback.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Save Lead \u2192";
    }
  });
}

function initializeCustomersPages() {
  const addCustomerBtn = document.getElementById("add-customer-btn");
  if (addCustomerBtn) {
    addCustomerBtn.addEventListener("click", () => {
      window.location.href = "/Dashboard/other-pages/create-customer.html";
    });
  }

  const addLeadBtn = document.getElementById("add-lead-btn");
  if (addLeadBtn) {
    addLeadBtn.addEventListener("click", () => {
      window.location.href = "/Dashboard/other-pages/create-lead.html";
    });
  }

  const createCustomerForm = document.getElementById("create-customer-form");
  if (createCustomerForm) {
    createCustomerForm.addEventListener("submit", handleCreateCustomerSubmit);
  }

  initializeCustomersFilters();
  initializeCustomersList();
  initializeCustomerDetailPage();
  initializeLeadsPage();
  initializeCreateLeadPage();
}

document.addEventListener("DOMContentLoaded", initializeCustomersPages);
