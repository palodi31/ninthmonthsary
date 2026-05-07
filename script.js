const viewIds = ["homeView", "messagesView", "snapshotsView", "remindersView", "checklistView"];
const hashToView = {
  home: "homeView",
  messages: "messagesView",
  snapshots: "snapshotsView",
  reminders: "remindersView",
  checklist: "checklistView"
};
const viewToHash = Object.fromEntries(Object.entries(hashToView).map(([hash, view]) => [view, hash]));

const loveParticles = ["\u2665", "\u2726", "\u273F", "\u2661", "\uD83D\uDC96", "\uD83C\uDF80"];
const storageKey = "ninth-monthsary-checklist";
let hasCelebratedFullChecklist = false;

function getView(id) {
  return document.getElementById(id);
}

function showView(viewId, pushState = true) {
  const safeViewId = viewIds.includes(viewId) ? viewId : "homeView";

  viewIds.forEach((id) => {
    const view = getView(id);
    if (!view) return;
    view.classList.toggle("is-active", id === safeViewId);
  });

  const hash = viewToHash[safeViewId] || "home";
  if (pushState) {
    history.pushState({ viewId: safeViewId }, "", `#${hash}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeFromHash() {
  const cleanHash = window.location.hash.replace("#", "").trim();
  return hashToView[cleanHash] || "homeView";
}

function attachRouting() {
  document.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.tagName.toLowerCase() === "a") event.preventDefault();
      showView(element.dataset.route);
    });

    if (element.classList.contains("score-card")) {
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showView(element.dataset.route);
        }
      });
    }
  });

  window.addEventListener("popstate", () => showView(routeFromHash(), false));
}

function applySnapshotImages() {
  document.querySelectorAll(".polaroid-photo[data-photo]").forEach((slot) => {
    const photoPath = slot.dataset.photo.trim();
    if (!photoPath) return;

    slot.style.backgroundImage = `url("${photoPath}")`;
    slot.classList.add("has-photo");
  });
}

function createParticle(x, y) {
  const particle = document.createElement("span");
  particle.className = "love-particle";
  particle.textContent = loveParticles[Math.floor(Math.random() * loveParticles.length)];

  const angle = Math.random() * Math.PI * 2;
  const distance = 45 + Math.random() * 95;
  const xMove = Math.cos(angle) * distance;
  const yMove = Math.sin(angle) * distance - 25;
  const rotation = -80 + Math.random() * 160;
  const size = 0.9 + Math.random() * 1.2;

  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.setProperty("--x", `${xMove}px`);
  particle.style.setProperty("--y", `${yMove}px`);
  particle.style.setProperty("--r", `${rotation}deg`);
  particle.style.setProperty("--size", `${size}rem`);

  document.body.appendChild(particle);
  particle.addEventListener("animationend", () => particle.remove());
}

function sparkleAt(x, y, count = 16) {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => createParticle(x, y), i * 18);
  }
}

function attachSparkles() {
  const sparkleButton = document.getElementById("sparkleButton");
  sparkleButton?.addEventListener("click", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    sparkleAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
  });

  document.querySelectorAll(".primary-love-btn, .score-card, .wax-seal").forEach((element) => {
    element.addEventListener("click", (event) => {
      sparkleAt(event.clientX, event.clientY, 10);
    });
  });
}

function loadChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveChecklistState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function updateChecklistProgress() {
  const checkboxes = [...document.querySelectorAll(".date-checklist input[type='checkbox']")];
  const checked = checkboxes.filter((box) => box.checked).length;
  const total = checkboxes.length;
  const percent = total ? Math.round((checked / total) * 100) : 0;

  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const progress = progressBar?.closest(".progress");

  if (progressText) progressText.textContent = `${checked}/${total} done`;
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progress) progress.setAttribute("aria-valuenow", String(percent));

  if (total > 0 && checked === total && !hasCelebratedFullChecklist) {
    hasCelebratedFullChecklist = true;
    sparkleAt(window.innerWidth / 2, Math.min(window.innerHeight * 0.45, 420), 42);
  }

  if (checked !== total) {
    hasCelebratedFullChecklist = false;
  }
}

function attachChecklist() {
  const checkboxes = [...document.querySelectorAll(".date-checklist input[type='checkbox']")];
  const savedState = loadChecklistState();

  checkboxes.forEach((checkbox) => {
    checkbox.checked = Boolean(savedState[checkbox.dataset.task]);
    checkbox.addEventListener("change", () => {
      const nextState = loadChecklistState();
      nextState[checkbox.dataset.task] = checkbox.checked;
      saveChecklistState(nextState);
      updateChecklistProgress();
    });
  });

  document.getElementById("resetChecklist")?.addEventListener("click", () => {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    localStorage.removeItem(storageKey);
    updateChecklistProgress();
  });

  updateChecklistProgress();
}

function attachRandomReminder() {
  const button = document.getElementById("randomReminder");
  const notes = [...document.querySelectorAll(".sticky-note")];
  if (!button || notes.length === 0) return;

  button.addEventListener("click", () => {
    notes.forEach((note) => note.classList.remove("is-picked"));
    const chosen = notes[Math.floor(Math.random() * notes.length)];
    chosen.classList.add("is-picked");
    chosen.scrollIntoView({ behavior: "smooth", block: "center" });

    const rect = chosen.getBoundingClientRect();
    sparkleAt(rect.left + rect.width / 2, rect.top + 22, 18);
  });
}

function boot() {
  attachRouting();
  attachSparkles();
  applySnapshotImages();
  attachChecklist();
  attachRandomReminder();
  history.replaceState({ viewId: routeFromHash() }, "", window.location.hash || "#home");
  showView(routeFromHash(), false);
}

document.addEventListener("DOMContentLoaded", boot);
