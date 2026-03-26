const API_BASE_URL = "https://bizpal-api.onrender.com/api/v1";

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value);
}

function setFeedback(message, isError = true) {
  const feedback = document.getElementById("dashboard-feedback");
  if (!feedback) return;

  feedback.textContent = message || "";
  feedback.style.color = isError ? "#d03636" : "#2a6070";
}

function setLoading(isLoading) {
  const feedback = document.getElementById("dashboard-feedback");
  if (!feedback) return;

  feedback.classList.toggle("loading", isLoading);
  feedback.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function formatDateTime(dateString) {
  if (!dateString) return "";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getFollowUpDate(item) {
  return (
    item?.follow_up_date ||
    item?.scheduled_at ||
    item?.created_at ||
    item?.due_date ||
    ""
  );
}

function createListItem({ name, note, time }) {
  const li = document.createElement("li");
  li.className = "data-list-item";

  const topRow = document.createElement("div");
  topRow.className = "item-top-row";

  const nameEl = document.createElement("p");
  nameEl.className = "item-name";
  nameEl.textContent = name || "Customer";

  const timeEl = document.createElement("span");
  timeEl.className = "item-time";
  timeEl.textContent = time || "";

  topRow.appendChild(nameEl);
  topRow.appendChild(timeEl);

  const noteEl = document.createElement("p");
  noteEl.className = "item-note";
  noteEl.textContent = note || "No details provided.";

  li.appendChild(topRow);
  li.appendChild(noteEl);
  return li;
}

function renderList({ listId, emptyId, items, mapper }) {
  const listEl = document.getElementById(listId);
  const emptyEl = document.getElementById(emptyId);
  if (!listEl || !emptyEl) return;

  listEl.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  items.forEach((item) => {
    listEl.appendChild(createListItem(mapper(item)));
  });
}

function setCurrentDate() {
  const dateEl = document.getElementById("current-date");
  if (!dateEl) return;

  const now = new Date();
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchDashboardData() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load dashboard data.");
  }

  return payload;
}

async function initializeDashboard() {
  setCurrentDate();
  setLoading(true);
  setFeedback("Loading dashboard data...", false);

  try {
    const response = await fetchDashboardData();
    const data = response?.data || {};
    const stats = data?.stats || {};

    setText("total-customers-value", stats.totalCustomers ?? 0);
    setText("total-notes-value", stats.totalNotes ?? 0);
    setText("pending-followups-value", stats.pendingFollowUps ?? 0);
    setText("completed-followups-value", stats.completedFollowUps ?? 0);

    renderList({
      listId: "recent-activity-list",
      emptyId: "recent-activity-empty",
      items: data?.recentActivity || [],
      mapper: (item) => ({
        name: item?.customer_name || "Customer",
        note: item?.note || "No note text",
        time: formatDateTime(item?.created_at),
      }),
    });

    renderList({
      listId: "upcoming-followups-list",
      emptyId: "upcoming-followups-empty",
      items: data?.upcomingFollowUps || [],
      mapper: (item) => ({
        name: item?.customer_name || "Customer",
        note: item?.note || item?.title || "Follow-up",
        time: formatDateTime(getFollowUpDate(item)),
      }),
    });

    setFeedback("");
  } catch (error) {
    setText("total-customers-value", 0);
    setText("total-notes-value", 0);
    setText("pending-followups-value", 0);
    setText("completed-followups-value", 0);

    renderList({
      listId: "recent-activity-list",
      emptyId: "recent-activity-empty",
      items: [],
      mapper: () => ({}),
    });

    renderList({
      listId: "upcoming-followups-list",
      emptyId: "upcoming-followups-empty",
      items: [],
      mapper: () => ({}),
    });

    setFeedback(
      error instanceof Error
        ? error.message
        : "Could not load dashboard data. Please try again.",
      true,
    );
  } finally {
    setLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
