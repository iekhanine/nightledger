import "./styles.css";

/* ==========================================================
   NIGHTLEDGER MOBILE 001
   Local prototype state
   ========================================================== */

(() => {
  "use strict";

  const APP_KEY = "nightledger_mobile_prototype_v1";
  const PENDING_EXPIRY_MS = 15000;
  const HOLD_START_MS = 700;
  const HOLD_END_MS = 900;
  const MOVE_CANCEL_PX = 24;

  const state = {
    tab: "capture",
    launch: null,
    activeEvent: null,
    completedEvent: null,
    installPrompt: null,
    liveTimer: null,
    holdTimer: null,
    holdStartPoint: null,
    endHoldTimer: null,
    endHoldStartPoint: null,
  };

  const eventTypes = [
    "Fight / disturbance",
    "Threat",
    "Harassment",
    "Refusal to leave",
    "Intoxication concern",
    "Theft / suspected theft",
    "Medical",
    "Other",
  ];

  const quickActions = [
    "Security involved",
    "Service refused",
    "Patron removed",
    "Patron left voluntarily",
    "Police contacted",
    "EMS contacted",
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return `${prefix}-${id}`;
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(APP_KEY) || "{}");
      return {
        launches: Array.isArray(parsed.launches) ? parsed.launches : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
      };
    } catch {
      return {
        launches: [],
        events: [],
      };
    }
  }

  function saveStore(store) {
    localStorage.setItem(APP_KEY, JSON.stringify(store));
  }

  function expireOldPendingLaunches(store) {
    const now = Date.now();

    store.launches = store.launches.map((launch) => {
      if (
        launch.status === "pending" &&
        now - new Date(launch.openedAt).getTime() > PENDING_EXPIRY_MS
      ) {
        return {
          ...launch,
          status: "unconfirmed",
          resolvedAt: nowIso(),
        };
      }

      return launch;
    });
  }

  function createLaunch() {
    const store = loadStore();

    expireOldPendingLaunches(store);

    const launch = {
      id: uid("LCH"),
      openedAt: nowIso(),
      status: "pending",
      source:
        new URLSearchParams(window.location.search).get("quick") === "1"
          ? "home-screen-shortcut"
          : "app-open",
    };

    store.launches.unshift(launch);
    store.launches = store.launches.slice(0, 40);
    saveStore(store);

    state.launch = launch;
  }

  function updateLaunchStatus(status, extra = {}) {
    const store = loadStore();

    store.launches = store.launches.map((launch) =>
      launch.id === state.launch.id
        ? {
            ...launch,
            status,
            resolvedAt: nowIso(),
            ...extra,
          }
        : launch
    );

    saveStore(store);

    state.launch = {
      ...state.launch,
      status,
      resolvedAt: nowIso(),
      ...extra,
    };
  }

  function formatClock(iso) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatShortDate(iso) {
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  function durationText(startIso, endIso = nowIso()) {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const total = Math.max(0, Math.floor((end - start) / 1000));

    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function vibrate(pattern) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 010
     Event creation / timeline
     ======================================================== */

  function startEvent() {
    if (state.activeEvent) {
      return;
    }

    const confirmedAt = nowIso();

    state.activeEvent = {
      id: uid("EVT"),
      startedAt: state.launch.openedAt,
      confirmedAt,
      endedAt: null,
      type: "Unclassified event",
      actions: [
        {
          id: uid("ACT"),
          label: "Event confirmed",
          at: confirmedAt,
        },
      ],
      notes: [],
      photos: [],
      possibleName: "",
      nameSource: "Open tab / payment card name",
      confidence: "Possible",
    };

    updateLaunchStatus("confirmed", {
      eventId: state.activeEvent.id,
      confirmedAt,
    });

    persistActiveEvent();
    vibrate([25, 35, 25]);
    render();
  }

  function persistActiveEvent() {
    if (!state.activeEvent) {
      return;
    }

    const store = loadStore();
    const cleanEvent = {
      ...state.activeEvent,
      photos: state.activeEvent.photos.map((photo) => ({
        ...photo,
        dataUrl: photo.dataUrl || null,
      })),
    };

    const index = store.events.findIndex((event) => event.id === cleanEvent.id);

    if (index >= 0) {
      store.events[index] = cleanEvent;
    } else {
      store.events.unshift(cleanEvent);
    }

    store.events = store.events.slice(0, 30);
    saveStore(store);
  }

  function setEventType(type) {
    if (!state.activeEvent) {
      return;
    }

    state.activeEvent.type = type;
    state.activeEvent.actions.push({
      id: uid("ACT"),
      label: `Classified: ${type}`,
      at: nowIso(),
    });

    persistActiveEvent();
    render();
  }

  function logAction(label) {
    if (!state.activeEvent) {
      return;
    }

    const alreadyLogged =
      state.activeEvent.actions.some((action) => action.label === label);

    if (alreadyLogged) {
      state.activeEvent.actions = state.activeEvent.actions.filter(
        (action) => action.label !== label
      );
      persistActiveEvent();
      render();
      return;
    }

    state.activeEvent.actions.push({
      id: uid("ACT"),
      label,
      at: nowIso(),
    });

    persistActiveEvent();
    vibrate(18);
    render();
  }

  function addQuickNote(text) {
    if (!state.activeEvent || !text.trim()) {
      return;
    }

    const note = {
      id: uid("NOTE"),
      text: text.trim(),
      at: nowIso(),
    };

    state.activeEvent.notes.push(note);
    state.activeEvent.actions.push({
      id: uid("ACT"),
      label: `Note: ${text.trim()}`,
      at: note.at,
    });

    persistActiveEvent();
    render();
  }

  function endEvent() {
    if (!state.activeEvent) {
      return;
    }

    state.activeEvent.endedAt = nowIso();
    state.activeEvent.actions.push({
      id: uid("ACT"),
      label: "Event ended",
      at: state.activeEvent.endedAt,
    });

    persistActiveEvent();

    state.completedEvent = {
      ...state.activeEvent,
    };

    state.activeEvent = null;

    vibrate([35, 30, 35]);
    render();
  }

  function saveAfterEventReview() {
    if (!state.completedEvent) {
      return;
    }

    const nameEl = document.getElementById("possibleName");
    const sourceEl = document.getElementById("nameSource");
    const confidenceEl = document.getElementById("confidence");

    state.completedEvent.possibleName = nameEl?.value.trim() || "";
    state.completedEvent.nameSource = sourceEl?.value || "";
    state.completedEvent.confidence = confidenceEl?.value || "Possible";

    const store = loadStore();
    const index = store.events.findIndex(
      (event) => event.id === state.completedEvent.id
    );

    if (index >= 0) {
      store.events[index] = state.completedEvent;
      saveStore(store);
    }

    state.completedEvent = null;

    // The current launch is already resolved. Create a new "ready" capture
    // only when the page is actually opened again. This avoids false timestamps.
    state.tab = "recent";
    render();
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 020
     Photo capture
     ======================================================== */

  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Could not read photo."));
      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error("Could not open photo."));
        image.onload = () => {
          const max = 720;
          let width = image.width;
          let height = image.height;

          if (width > height && width > max) {
            height = Math.round((height * max) / width);
            width = max;
          } else if (height > max) {
            width = Math.round((width * max) / height);
            height = max;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoInput(file) {
    if (!state.activeEvent || !file) {
      return;
    }

    try {
      const dataUrl = await compressPhoto(file);

      const photo = {
        id: uid("PHO"),
        at: nowIso(),
        source: "Staff camera",
        dataUrl,
      };

      state.activeEvent.photos.push(photo);
      state.activeEvent.actions.push({
        id: uid("ACT"),
        label: "Photo attached",
        at: photo.at,
      });

      persistActiveEvent();
      vibrate(18);
      render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not add photo.");
    }
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 030
     Hold gesture safety
     ======================================================== */

  function attachHoldToStart(button) {
    if (!button) {
      return;
    }

    const cancel = () => {
      if (state.holdTimer) {
        clearTimeout(state.holdTimer);
      }

      state.holdTimer = null;
      state.holdStartPoint = null;
      button.classList.remove("holding");
    };

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      state.holdStartPoint = {
        x: event.clientX,
        y: event.clientY,
      };

      button.classList.add("holding");

      state.holdTimer = window.setTimeout(() => {
        cancel();
        startEvent();
      }, HOLD_START_MS);
    });

    button.addEventListener("pointermove", (event) => {
      if (!state.holdStartPoint) {
        return;
      }

      const dx = event.clientX - state.holdStartPoint.x;
      const dy = event.clientY - state.holdStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > MOVE_CANCEL_PX) {
        cancel();
      }
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
      button.addEventListener(name, cancel);
    });

    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  function attachHoldToEnd(button) {
    if (!button) {
      return;
    }

    const cancel = () => {
      if (state.endHoldTimer) {
        clearTimeout(state.endHoldTimer);
      }

      state.endHoldTimer = null;
      state.endHoldStartPoint = null;
      button.classList.remove("holding");
    };

    button.addEventListener("pointerdown", (event) => {
      state.endHoldStartPoint = {
        x: event.clientX,
        y: event.clientY,
      };

      button.classList.add("holding");

      state.endHoldTimer = window.setTimeout(() => {
        cancel();
        endEvent();
      }, HOLD_END_MS);
    });

    button.addEventListener("pointermove", (event) => {
      if (!state.endHoldStartPoint) {
        return;
      }

      const dx = event.clientX - state.endHoldStartPoint.x;
      const dy = event.clientY - state.endHoldStartPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > MOVE_CANCEL_PX) {
        cancel();
      }
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
      button.addEventListener(name, cancel);
    });

    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 100
     Rendering
     ======================================================== */

  function headerHtml() {
    return `
      <header class="nl-header">
        <div class="nl-brand">
          <div class="nl-logo" aria-hidden="true">NL</div>
          <div>
            <strong>NightLedger</strong>
            <span>Harbor House · Prototype</span>
          </div>
        </div>
        <div class="nl-role-chip">Jamie K. · Bartender</div>
      </header>
    `;
  }

  function launchMetaHtml() {
    return `
      <section class="nl-launch-meta">
        <div class="nl-launch-meta-top">
          <span class="nl-eyebrow">APP OPENED</span>
          <strong class="nl-live-time" id="launchTime">
            ${escapeHtml(formatClock(state.launch.openedAt))}
          </strong>
        </div>
        <p>
          This opening is logged as a <strong>launch</strong>, not an incident.
          If you do nothing, it remains an unconfirmed / possible accidental open.
        </p>
      </section>
    `;
  }

  function captureHomeHtml() {
    return `
      ${launchMetaHtml()}

      <section class="nl-capture">
        <div class="nl-capture-intro">
          <span class="nl-eyebrow">QUICK CAPTURE</span>
          <h1>Something happening?</h1>
          <p>
            Open the app, hold once, then put the phone away and deal with the situation.
            Details can wait.
          </p>
        </div>

        <div class="nl-hold-wrap">
          <button
            type="button"
            class="nl-hold-button"
            id="holdStart"
            aria-label="Press and hold to start an event"
          >
            <span class="nl-hold-progress" aria-hidden="true"></span>
            <span class="nl-hold-icon" aria-hidden="true">●</span>
            <strong>PRESS &amp; HOLD TO FLAG</strong>
            <span>Hold for less than one second</span>
          </button>

          <div class="nl-safety-note">
            <span class="nl-dot" aria-hidden="true"></span>
            <span>
              A quick tap does nothing. Moving your finger while holding cancels it.
              The event uses the app-open time as the initial timestamp and records the
              separate confirmation time too.
            </span>
          </div>
        </div>

        <div class="nl-secondary-row">
          <button type="button" class="nl-secondary-btn" id="markAccidental">
            Mark this launch accidental
          </button>

          <button type="button" class="nl-secondary-btn" id="openRecent">
            Recent activity
          </button>
        </div>
      </section>

      ${installHtml()}
    `;
  }

  function activeEventHtml() {
    const event = state.activeEvent;
    const doneLabels = new Set(event.actions.map((action) => action.label));

    return `
      <section class="nl-active-header">
        <div class="nl-active-state">
          <span class="nl-active-badge">ACTIVE EVENT</span>
          <strong class="nl-active-timer" id="activeTimer">
            ${durationText(event.startedAt)}
          </strong>
        </div>

        <h1>${escapeHtml(event.type)}</h1>
        <p>
          Started from app-open timestamp ${escapeHtml(formatClock(event.startedAt))}.
          Confirmed at ${escapeHtml(formatClock(event.confirmedAt))}.
        </p>
      </section>

      <div class="nl-section-title">What is happening?</div>

      <section class="nl-type-grid">
        ${eventTypes
          .map(
            (type) => `
              <button
                type="button"
                class="nl-event-type ${event.type === type ? "selected" : ""}"
                data-event-type="${escapeHtml(type)}"
              >
                ${escapeHtml(type)}
              </button>
            `
          )
          .join("")}
      </section>

      <div class="nl-section-title">One-tap timeline</div>

      <section class="nl-action-grid">
        ${quickActions
          .map(
            (label) => `
              <button
                type="button"
                class="nl-action-btn ${doneLabels.has(label) ? "done" : ""}"
                data-action="${escapeHtml(label)}"
              >
                ${doneLabels.has(label) ? "✓ " : ""}${escapeHtml(label)}
              </button>
            `
          )
          .join("")}
      </section>

      <input
        id="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
      />

      <button type="button" class="nl-photo-btn" id="addPhoto">
        <span aria-hidden="true">📷</span>
        Add patron / scene photo — only if safe
      </button>

      ${
        event.photos.length
          ? `
            <div class="nl-photo-strip">
              ${event.photos
                .map(
                  (photo, index) => `
                    <div class="nl-photo-thumb">
                      <img src="${photo.dataUrl}" alt="Captured event photo ${index + 1}" />
                      <span>${escapeHtml(formatClock(photo.at))}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }

      <div class="nl-section-title">Quick note</div>

      <div class="nl-quick-note">
        <input
          id="quickNote"
          type="text"
          maxlength="180"
          placeholder="Optional: red jacket, rear exit, etc."
          autocomplete="off"
        />
        <button type="button" class="nl-secondary-btn" id="saveQuickNote">
          Add
        </button>
      </div>

      <div class="nl-section-title">Timeline</div>

      <section class="nl-timeline">
        ${event.actions
          .slice()
          .sort((a, b) => new Date(a.at) - new Date(b.at))
          .map(
            (action) => `
              <div class="nl-timeline-row">
                <time>${escapeHtml(formatClock(action.at))}</time>
                <strong>${escapeHtml(action.label)}</strong>
              </div>
            `
          )
          .join("")}
      </section>

      <button
        type="button"
        class="nl-end-btn"
        id="holdEnd"
      >
        PRESS &amp; HOLD TO END EVENT
      </button>

      <p class="nl-footer-note">
        Photos are optional. Do not delay intervention or put staff in danger to capture one.
        CCTV or other evidence can be attached later in the management application.
      </p>
    `;
  }

  function reviewHtml() {
    const event = state.completedEvent;

    return `
      <section class="nl-review">
        <div class="nl-review-hero">
          <span class="nl-eyebrow">EVENT CAPTURED</span>
          <strong>${escapeHtml(event.type)}</strong>
          <p>
            ${escapeHtml(formatClock(event.startedAt))}
            → ${escapeHtml(formatClock(event.endedAt))}
            · ${escapeHtml(durationText(event.startedAt, event.endedAt))}
            · ${event.photos.length} photo${event.photos.length === 1 ? "" : "s"}
          </p>
        </div>

        <div class="nl-review-grid">
          <div class="nl-field">
            <label for="possibleName">Possible / observed name (optional)</label>
            <input
              id="possibleName"
              type="text"
              value="${escapeHtml(event.possibleName || "")}"
              placeholder="Example: Daniel P."
              autocomplete="off"
            />
          </div>

          <div class="nl-field">
            <label for="nameSource">Where did that name come from?</label>
            <select id="nameSource">
              <option>Open tab / payment card name</option>
              <option>Patron stated name</option>
              <option>Staff recognized patron</option>
              <option>Another guest provided name</option>
              <option>Government ID checked by staff</option>
              <option>Other</option>
            </select>
          </div>

          <div class="nl-field">
            <label for="confidence">Identity confidence</label>
            <select id="confidence">
              <option>Unknown</option>
              <option selected>Possible</option>
              <option>Likely</option>
              <option>Confirmed</option>
            </select>
          </div>

          <div class="nl-card-warning">
            <span aria-hidden="true">⚠</span>
            <span>
              A name from a tab or payment card is only an identity clue.
              The card may belong to someone else, be borrowed, shared, or stolen.
              Do not enter full card numbers, CVV, PIN data, or photograph the card.
            </span>
          </div>
        </div>

        <button type="button" class="nl-primary-btn" id="saveReview">
          Save quick review
        </button>

        <button type="button" class="nl-danger-ghost" id="skipReview">
          Skip — manager can complete it later
        </button>
      </section>
    `;
  }

  function recentHtml() {
    const store = loadStore();
    expireOldPendingLaunches(store);
    saveStore(store);

    const launches = store.launches.slice(0, 12);
    const events = store.events.slice(0, 8);

    return `
      <section class="nl-panel">
        <div class="nl-panel-head">
          <div>
            <span class="nl-eyebrow">DEVICE ACTIVITY</span>
            <h2>Launch log</h2>
          </div>
          <span class="nl-eyebrow">${launches.length} SHOWN</span>
        </div>

        <div class="nl-history">
          ${
            launches.length
              ? launches
                  .map(
                    (launch) => `
                      <div class="nl-history-item">
                        <span
                          class="nl-history-status ${escapeHtml(launch.status)}"
                          aria-hidden="true"
                        ></span>
                        <div>
                          <strong>${escapeHtml(launch.status)}</strong>
                          <span>${escapeHtml(launch.source || "app-open")}</span>
                        </div>
                        <time>
                          ${escapeHtml(formatShortDate(launch.openedAt))}
                          · ${escapeHtml(formatClock(launch.openedAt))}
                        </time>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="nl-empty">No launches recorded.</div>`
          }
        </div>
      </section>

      <section class="nl-panel">
        <div class="nl-panel-head">
          <div>
            <span class="nl-eyebrow">CAPTURED EVENTS</span>
            <h2>Recent events</h2>
          </div>
        </div>

        <div class="nl-history">
          ${
            events.length
              ? events
                  .map(
                    (event) => `
                      <div class="nl-history-item">
                        <span class="nl-history-status confirmed" aria-hidden="true"></span>
                        <div>
                          <strong>${escapeHtml(event.type || "Unclassified event")}</strong>
                          <span>
                            ${event.photos?.length || 0} photo${event.photos?.length === 1 ? "" : "s"}
                            ${event.possibleName ? ` · Possible name: ${escapeHtml(event.possibleName)}` : ""}
                          </span>
                        </div>
                        <time>
                          ${escapeHtml(formatShortDate(event.startedAt))}
                          · ${escapeHtml(formatClock(event.startedAt))}
                        </time>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="nl-empty">No events captured yet.</div>`
          }
        </div>
      </section>

      <button type="button" class="nl-primary-btn" id="returnCapture">
        Return to Quick Capture
      </button>
    `;
  }

  function settingsHtml() {
    return `
      <section class="nl-settings-list">
        <article class="nl-setting-card">
          <strong>Accidental-tap protection</strong>
          <p>
            Opening NightLedger logs a launch timestamp, but does not create an incident.
            A deliberate 700 ms hold is required. Moving the finger more than ${MOVE_CANCEL_PX}px
            cancels the hold.
          </p>
        </article>

        <article class="nl-setting-card">
          <strong>Timestamp model</strong>
          <p>
            When a bartender confirms an event, NightLedger keeps both timestamps:
            the moment the app opened and the moment staff deliberately confirmed the event.
          </p>
          <code>opened_at
confirmed_at
ended_at</code>
        </article>

        <article class="nl-setting-card">
          <strong>Production session behavior</strong>
          <p>
            Staff should sign in once at the beginning of their authenticated device session.
            The installed PWA then opens directly into Quick Capture rather than making a bartender
            navigate a login form during an incident.
          </p>
        </article>

        <article class="nl-setting-card">
          <strong>Patron photos</strong>
          <p>
            Staff photos are optional. The camera button opens the phone camera directly.
            Production storage should be private, venue-scoped, access-controlled, and audited.
          </p>
        </article>

        <article class="nl-setting-card">
          <strong>Payment-card identity clues</strong>
          <p>
            Store only the observed name and how staff obtained it. Never store PAN, CVV,
            PIN, magnetic-stripe data, or a photograph of the card.
          </p>
        </article>

        ${installHtml()}
      </section>
    `;
  }

  function installHtml() {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return "";
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    return `
      <section class="nl-install" id="installBox">
        <strong>Put NightLedger on the bartender's home screen</strong>
        <p>
          ${
            isIOS
              ? "On iPhone: use Safari → Share → Add to Home Screen. Once installed, it launches like an app."
              : "On supported Android / Chromium browsers, NightLedger can be installed as a standalone app."
          }
        </p>

        ${
          !isIOS
            ? `
              <button
                type="button"
                class="nl-secondary-btn"
                id="installApp"
                ${state.installPrompt ? "" : "disabled"}
              >
                ${state.installPrompt ? "Install NightLedger" : "Install option appears when browser allows"}
              </button>
            `
            : ""
        }
      </section>
    `;
  }

  function tabsHtml() {
    return `
      <nav class="nl-tabs" aria-label="NightLedger sections">
        <button
          type="button"
          class="nl-tab ${state.tab === "capture" ? "active" : ""}"
          data-tab="capture"
        >
          Capture
        </button>
        <button
          type="button"
          class="nl-tab ${state.tab === "recent" ? "active" : ""}"
          data-tab="recent"
        >
          Recent
        </button>
        <button
          type="button"
          class="nl-tab ${state.tab === "settings" ? "active" : ""}"
          data-tab="settings"
        >
          Setup
        </button>
      </nav>
    `;
  }

  function render() {
    clearInterval(state.liveTimer);

    const app = document.getElementById("app");

    let content;

    if (state.completedEvent) {
      content = reviewHtml();
    } else if (state.activeEvent) {
      content = activeEventHtml();
    } else if (state.tab === "recent") {
      content = recentHtml();
    } else if (state.tab === "settings") {
      content = settingsHtml();
    } else {
      content = captureHomeHtml();
    }

    app.innerHTML = `
      <div class="nl-app">
        <div class="nl-shell">
          ${headerHtml()}
          ${content}
          ${!state.activeEvent && !state.completedEvent ? tabsHtml() : ""}
          <div class="nl-footer-note">
            NightLedger prototype · OneTime Labs · Demo data stays on this device.
          </div>
        </div>
      </div>
    `;

    wire();
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 110
     Event wiring
     ======================================================== */

  function wire() {
    const holdStart = document.getElementById("holdStart");
    attachHoldToStart(holdStart);

    document.getElementById("markAccidental")?.addEventListener("click", () => {
      if (state.launch.status === "pending") {
        updateLaunchStatus("accidental");
      }

      state.tab = "recent";
      render();
    });

    document.getElementById("openRecent")?.addEventListener("click", () => {
      state.tab = "recent";
      render();
    });

    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.tab = button.dataset.tab;
        render();
      });
    });

    document.querySelectorAll("[data-event-type]").forEach((button) => {
      button.addEventListener("click", () => {
        setEventType(button.dataset.eventType);
      });
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        logAction(button.dataset.action);
      });
    });

    document.getElementById("addPhoto")?.addEventListener("click", () => {
      document.getElementById("cameraInput")?.click();
    });

    document.getElementById("cameraInput")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];

      if (file) {
        handlePhotoInput(file);
      }
    });

    document.getElementById("saveQuickNote")?.addEventListener("click", () => {
      const input = document.getElementById("quickNote");
      addQuickNote(input?.value || "");
    });

    document.getElementById("quickNote")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addQuickNote(event.currentTarget.value || "");
      }
    });

    attachHoldToEnd(document.getElementById("holdEnd"));

    document.getElementById("saveReview")?.addEventListener("click", () => {
      saveAfterEventReview();
    });

    document.getElementById("skipReview")?.addEventListener("click", () => {
      state.completedEvent = null;
      state.tab = "recent";
      render();
    });

    document.getElementById("returnCapture")?.addEventListener("click", () => {
      // A fresh launch timestamp should represent an actual app open.
      // For the prototype, returning to capture does not fake another app-open.
      state.tab = "capture";
      render();
    });

    document.getElementById("installApp")?.addEventListener("click", async () => {
      if (!state.installPrompt) {
        return;
      }

      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      render();
    });

    if (state.activeEvent) {
      state.liveTimer = window.setInterval(() => {
        const timer = document.getElementById("activeTimer");
        if (timer) {
          timer.textContent = durationText(state.activeEvent.startedAt);
        }
      }, 1000);
    }
  }

  /* ========================================================
     NIGHTLEDGER MOBILE 120
     PWA installation / service worker
     ======================================================== */

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    render();
  });

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The prototype still works without offline installation.
      });
    });
  }

  createLaunch();
  render();
})();
