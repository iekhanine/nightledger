import "./AdminApp.css";

import {
  createBan,
  createCaptureDevice,
  createInvite,
  createPatron,
  getEvent,
  getSignedPhotoUrl,
  listAngelShotSettings,
  listAudit,
  listBans,
  listCaptureDevices,
  listEvents,
  listInvites,
  listPatrons,
  listStaff,
  saveAngelShotSetting,
  saveEventReview,
  signOut,
  subscribeToEvents,
} from "../lib/api.js";

const state = {
  context: null,
  tab: "dashboard",
  events: [],
  patrons: [],
  bans: [],
  staff: [],
  invites: [],
  devices: [],
  latestEnrollment: null,
  angelTypes: [],
  audit: [],
  selectedEvent: null,
  selectedEventPhotos: [],
  loading: true,
  error: "",
  unsubscribe: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function roleCanManage() {
  return ["owner", "manager"].includes(state.context.membership.role);
}

function eventLabel(event) {
  if (event.event_type === "angel_shot") {
    return `Angel Shot${event.angel_shot_type ? ` · ${event.angel_shot_type.replaceAll("_", " ")}` : ""}`;
  }

  if (event.event_type) {
    return event.event_type.replaceAll("_", " ");
  }

  return "Logged HOLD";
}

async function loadAll({ quiet = false } = {}) {
  if (!quiet) {
    state.loading = true;
    state.error = "";
    render();
  }

  try {
    const venueId = state.context.venue.id;

    const [
      events,
      patrons,
      bans,
      staff,
      invites,
      devices,
      angelTypes,
      audit,
    ] = await Promise.all([
      listEvents(venueId),
      listPatrons(venueId),
      listBans(venueId),
      listStaff(venueId),
      roleCanManage() ? listInvites(venueId) : Promise.resolve([]),
      roleCanManage() ? listCaptureDevices(venueId) : Promise.resolve([]),
      listAngelShotSettings(venueId),
      roleCanManage() ? listAudit(venueId) : Promise.resolve([]),
    ]);

    state.events = events;
    state.patrons = patrons;
    state.bans = bans;
    state.staff = staff;
    state.invites = invites;
    state.devices = devices;
    state.angelTypes = angelTypes;
    state.audit = audit;
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function openEvent(eventId) {
  state.loading = true;
  state.error = "";
  render();

  try {
    const event = await getEvent(eventId);

    const photos = await Promise.all(
      (event.nl_event_photos || []).map(async (photo) => ({
        ...photo,
        signedUrl: await getSignedPhotoUrl(photo.storage_path),
      })),
    );

    state.selectedEvent = event;
    state.selectedEventPhotos = photos;
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

function existingReview() {
  return state.selectedEvent?.nl_event_reviews?.[0] || {};
}

function reviewValue(key) {
  return existingReview()[key] ?? "";
}

function reviewChecked(key) {
  return reviewValue(key) ? "checked" : "";
}

async function submitReview() {
  if (!state.selectedEvent) return;

  const form = document.getElementById("reviewForm");
  const data = new FormData(form);

  const review = {
    incident_summary: data.get("incident_summary"),
    outcome: data.get("outcome"),
    help_requester_description: data.get("help_requester_description"),
    person_of_concern_description: data.get("person_of_concern_description"),
    identity_clue: data.get("identity_clue"),
    identity_source: data.get("identity_source"),
    identity_confidence: data.get("identity_confidence"),
    witnesses: data.get("witnesses"),
    security_involved: data.has("security_involved"),
    service_refused: data.has("service_refused"),
    patron_removed: data.has("patron_removed"),
    police_contacted: data.has("police_contacted"),
    police_report_number: data.get("police_report_number"),
    ems_contacted: data.has("ems_contacted"),
    cctv_available: data.has("cctv_available"),
    cctv_reference: data.get("cctv_reference"),
    trespass_notice: data.has("trespass_notice"),
    venue_ban: data.has("venue_ban"),
    corrective_actions: data.get("corrective_actions"),
    follow_up_required: data.has("follow_up_required"),
    manager_notes: data.get("manager_notes"),
  };

  state.loading = true;
  render();

  try {
    await saveEventReview({
      event: state.selectedEvent,
      form: review,
    });

    const eventId = state.selectedEvent.id;
    await loadAll({ quiet: true });
    await openEvent(eventId);
  } catch (error) {
    state.error = error.message;
    state.loading = false;
    render();
  }
}

function navHtml() {
  const tabs = [
    ["dashboard", "Dashboard"],
    ["events", "Events"],
    ["patrons", "Patrons"],
    ["bans", "Bans"],
    ["staff", "Staff"],
    ["devices", "Devices"],
    ["settings", "Settings"],
    ["audit", "Audit"],
  ];

  return `
    <nav class="nl-admin-nav">
      ${tabs.map(([id, label]) => `
        <button
          type="button"
          class="${state.tab === id ? "active" : ""}"
          data-tab="${id}"
        >
          ${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function eventRows(events = state.events) {
  if (!events.length) {
    return `<div class="nl-admin-empty">No events yet.</div>`;
  }

  return events.map((event) => `
    <button
      type="button"
      class="nl-admin-event-row"
      data-event-id="${event.id}"
    >
      <span class="nl-admin-event-time">
        ${escapeHtml(formatDateTime(event.event_at))}
      </span>

      <span class="nl-admin-event-kind ${event.event_type === "angel_shot" ? "angel" : ""}">
        ${escapeHtml(eventLabel(event))}
      </span>

      <span class="nl-admin-event-staff">
        ${escapeHtml(
        event.nl_user_profiles?.display_name ||
        event.nl_capture_devices?.label ||
        (event.capture_mode === "guest_device" ? "Unlogged device" : "Staff")
      )}
      </span>

      <span class="nl-admin-event-review ${event.review_status === "reviewed" ? "reviewed" : ""}">
        ${event.review_status === "reviewed" ? "Reviewed" : "Needs review"}
      </span>

      <span class="nl-admin-event-photo-count">
        ${event.nl_event_photos?.length || 0} photo${event.nl_event_photos?.length === 1 ? "" : "s"}
      </span>
    </button>
  `).join("");
}

function dashboardHtml() {
  const total = state.events.length;
  const angel = state.events.filter((event) => event.event_type === "angel_shot").length;
  const pending = state.events.filter((event) => event.review_status !== "reviewed").length;
  const activeBans = state.bans.filter((ban) => ban.active).length;

  return `
    <section class="nl-admin-stats">
      <article><span>EVENTS</span><strong>${total}</strong></article>
      <article><span>NEEDS REVIEW</span><strong>${pending}</strong></article>
      <article><span>ANGEL SHOTS</span><strong>${angel}</strong></article>
      <article><span>ACTIVE BANS</span><strong>${activeBans}</strong></article>
    </section>

    <section class="nl-admin-panel">
      <div class="nl-admin-panel-head">
        <div>
          <span>LIVE EVENT STREAM</span>
          <h2>Recent activity</h2>
        </div>
      </div>

      <div class="nl-admin-event-list">
        ${eventRows(state.events.slice(0, 20))}
      </div>
    </section>
  `;
}

function eventsHtml() {
  return `
    <section class="nl-admin-panel">
      <div class="nl-admin-panel-head">
        <div>
          <span>INCIDENT RECORDS</span>
          <h2>Events</h2>
        </div>
      </div>

      <div class="nl-admin-event-list">
        ${eventRows()}
      </div>
    </section>
  `;
}

function patronsHtml() {
  const rows = state.patrons.length
    ? state.patrons.map((patron) => `
        <article class="nl-patron-row">
          <div>
            <strong>${escapeHtml(patron.display_name)}</strong>
            <span>
              ${patron.possible_name ? `Possible: ${escapeHtml(patron.possible_name)} · ` : ""}
              ${escapeHtml(patron.identity_confidence)}
            </span>
          </div>

          <span class="nl-status-chip">${escapeHtml(patron.status)}</span>
          <p>${escapeHtml(patron.descriptors || "No descriptors")}</p>
        </article>
      `).join("")
    : `<div class="nl-admin-empty">No patron records yet.</div>`;

  return `
    <section class="nl-admin-split">
      <div class="nl-admin-panel">
        <div class="nl-admin-panel-head">
          <div>
            <span>PRIVATE RECORDS</span>
            <h2>Patrons</h2>
          </div>
        </div>

        <div class="nl-patron-list">${rows}</div>
      </div>

      ${
        roleCanManage()
          ? `
            <form id="newPatronForm" class="nl-admin-panel nl-admin-form-panel">
              <div class="nl-admin-panel-head">
                <div>
                  <span>NEW RECORD</span>
                  <h2>Create patron</h2>
                </div>
              </div>

              <div class="nl-admin-form-body">
                <label>
                  Display name
                  <input name="display_name" placeholder="Unknown Patron #0047" />
                </label>

                <label>
                  Possible name
                  <input name="possible_name" placeholder="Optional" />
                </label>

                <label>
                  Confidence
                  <select name="identity_confidence">
                    <option value="unknown">Unknown</option>
                    <option value="possible">Possible</option>
                    <option value="likely">Likely</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </label>

                <label>
                  Descriptors
                  <textarea name="descriptors" rows="4"></textarea>
                </label>

                <button type="submit">Create patron record</button>
              </div>
            </form>
          `
          : ""
      }
    </section>
  `;
}

function bansHtml() {
  const banRows = state.bans.length
    ? state.bans.map((ban) => `
        <article class="nl-ban-row">
          <strong>${escapeHtml(ban.nl_patrons?.display_name || "Patron")}</strong>
          <span>${ban.active ? "ACTIVE" : "INACTIVE"}</span>
          <p>${escapeHtml(ban.reason)}</p>
          <small>
            Started: ${escapeHtml(formatDateTime(ban.starts_at))}
            ${ban.ends_at ? ` · Ends: ${escapeHtml(formatDateTime(ban.ends_at))}` : ""}
          </small>
        </article>
      `).join("")
    : `<div class="nl-admin-empty">No bans recorded.</div>`;

  return `
    <section class="nl-admin-split">
      <div class="nl-admin-panel">
        <div class="nl-admin-panel-head">
          <div>
            <span>VENUE ACCESS</span>
            <h2>Bans</h2>
          </div>
        </div>

        <div class="nl-ban-list">${banRows}</div>
      </div>

      ${
        roleCanManage()
          ? `
            <form id="newBanForm" class="nl-admin-panel nl-admin-form-panel">
              <div class="nl-admin-panel-head">
                <div>
                  <span>NEW BAN</span>
                  <h2>Ban patron</h2>
                </div>
              </div>

              <div class="nl-admin-form-body">
                <label>
                  Patron
                  <select name="patron_id" required>
                    <option value="">Choose patron</option>
                    ${state.patrons.map((patron) => `
                      <option value="${patron.id}">
                        ${escapeHtml(patron.display_name)}
                      </option>
                    `).join("")}
                  </select>
                </label>

                <label>
                  Reason
                  <textarea name="reason" rows="4" required></textarea>
                </label>

                <label>
                  End date (optional)
                  <input name="ends_at" type="date" />
                </label>

                <button type="submit">Create ban</button>
              </div>
            </form>
          `
          : ""
      }
    </section>
  `;
}

function staffHtml() {
  const staffRows = state.staff.length
    ? state.staff.map((row) => `
        <article class="nl-staff-row">
          <strong>${escapeHtml(row.nl_user_profiles?.display_name || row.user_id)}</strong>
          <span>${escapeHtml(row.role)}</span>
        </article>
      `).join("")
    : `<div class="nl-admin-empty">No staff.</div>`;

  return `
    <section class="nl-admin-split">
      <div class="nl-admin-panel">
        <div class="nl-admin-panel-head">
          <div>
            <span>ACCESS</span>
            <h2>Staff</h2>
          </div>
        </div>

        <div class="nl-staff-list">${staffRows}</div>
      </div>

      ${
        roleCanManage()
          ? `
            <form id="inviteForm" class="nl-admin-panel nl-admin-form-panel">
              <div class="nl-admin-panel-head">
                <div>
                  <span>INVITE</span>
                  <h2>Staff access code</h2>
                </div>
              </div>

              <div class="nl-admin-form-body">
                <label>
                  Role
                  <select name="role">
                    <option value="bartender">Bartender</option>
                    <option value="security">Security</option>
                    <option value="manager">Manager</option>
                  </select>
                </label>

                <button type="submit">Generate invite</button>

                <div class="nl-invite-list">
                  ${state.invites.slice(0, 8).map((invite) => `
                    <div>
                      <strong>${escapeHtml(invite.code)}</strong>
                      <span>${escapeHtml(invite.role)} · ${invite.used_at ? "used" : "unused"}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            </form>
          `
          : ""
      }
    </section>
  `;
}

function devicesHtml() {
  if (
    !roleCanManage()
  ) {
    return `
      <section
        class="nl-admin-panel"
      >
        <div
          class="nl-admin-empty"
        >
          Manager access is required.
        </div>
      </section>
    `;
  }

  const origin =
    window.location.origin;

  return `
    <section
      class="nl-admin-split"
    >
      <div
        class="nl-admin-panel"
      >
        <div
          class="nl-admin-panel-head"
        >
          <div>
            <span>
              NO-LOGIN CAPTURE
            </span>

            <h2>
              Capture devices
            </h2>
          </div>
        </div>

        <div
          class="nl-staff-list"
        >
          ${
            state.devices.length
              ? state.devices
                  .map(
                    (
                      device
                    ) => `
                      <article
                        class="nl-staff-row"
                      >
                        <div>
                          <strong>
                            ${escapeHtml(
                              device.label
                            )}
                          </strong>

                          <span>
                            ${device.active
                              ? "active"
                              : "disabled"}
                            · ${escapeHtml(
                              device.token_prefix
                            )}…
                          </span>
                        </div>

                        <span>
                          ${
                            device.last_seen_at
                              ? escapeHtml(
                                  formatDateTime(
                                    device.last_seen_at
                                  )
                                )
                              : "never used"
                          }
                        </span>
                      </article>
                    `
                  )
                  .join(
                    ""
                  )
              : `
                <div
                  class="nl-admin-empty"
                >
                  No capture devices enrolled yet.
                </div>
              `
          }
        </div>
      </div>

      <form
        id="deviceForm"
        class="nl-admin-panel nl-admin-form-panel"
      >
        <div
          class="nl-admin-panel-head"
        >
          <div>
            <span>
              ENROLL
            </span>

            <h2>
              No-login device
            </h2>
          </div>
        </div>

        <div
          class="nl-admin-form-body"
        >
          <label>
            Device label

            <input
              name="label"
              placeholder="Back Bar iPhone"
              required
            />
          </label>

          <button
            type="submit"
          >
            Generate enrollment link
          </button>

          ${
            state.latestEnrollment
              ? `
                <div
                  class="nl-enrollment-link"
                >
                  <strong>
                    Open this once on the phone:
                  </strong>

                  <code>
                    ${escapeHtml(
                      `${origin}/?enroll=${state.latestEnrollment.token}`
                    )}
                  </code>
                </div>
              `
              : ""
          }
        </div>
      </form>
    </section>
  `;
}

function settingsHtml() {
  return `
    <section class="nl-admin-panel">
      <div class="nl-admin-panel-head">
        <div>
          <span>VENUE PROTOCOL</span>
          <h2>Angel Shot types</h2>
        </div>
      </div>

      <div class="nl-settings-list">
        ${state.angelTypes.map((item) => `
          <form class="nl-setting-row" data-angel-setting="${item.id}">
            <input
              name="label"
              value="${escapeHtml(item.label)}"
              ${roleCanManage() ? "" : "disabled"}
            />

            <input
              name="description"
              placeholder="What this code means at this venue"
              value="${escapeHtml(item.description || "")}"
              ${roleCanManage() ? "" : "disabled"}
            />

            <input
              name="response_note"
              placeholder="Staff response protocol"
              value="${escapeHtml(item.response_note || "")}"
              ${roleCanManage() ? "" : "disabled"}
            />

            ${roleCanManage() ? `<button type="submit">Save</button>` : ""}
          </form>
        `).join("")}
      </div>
    </section>
  `;
}


function auditHtml() {
  if (!roleCanManage()) {
    return `
      <section class="nl-admin-panel">
        <div class="nl-admin-empty">
          Manager access is required to view the audit log.
        </div>
      </section>
    `;
  }

  const rows = state.audit.length
    ? state.audit.map((row) => `
        <article class="nl-audit-row">
          <span>${escapeHtml(formatDateTime(row.created_at))}</span>
          <strong>${escapeHtml(row.action)}</strong>
          <span>${escapeHtml(row.entity_type)}</span>
          <span>${escapeHtml(row.nl_user_profiles?.display_name || "System")}</span>
        </article>
      `).join("")
    : `<div class="nl-admin-empty">No audit entries yet.</div>`;

  return `
    <section class="nl-admin-panel">
      <div class="nl-admin-panel-head">
        <div>
          <span>SECURITY / CHANGE HISTORY</span>
          <h2>Audit Log</h2>
        </div>
      </div>

      <div class="nl-audit-list">
        ${rows}
      </div>
    </section>
  `;
}

function eventDrawerHtml() {
  const event = state.selectedEvent;
  if (!event) return "";

  return `
    <div class="nl-drawer-backdrop" id="drawerBackdrop"></div>

    <aside class="nl-event-drawer">
      <header>
        <div>
          <span>${escapeHtml(eventLabel(event))}</span>
          <h2>${escapeHtml(formatDateTime(event.event_at))}</h2>
        </div>

        <button type="button" id="closeDrawer">×</button>
      </header>

      <section class="nl-drawer-summary">
        <div>
          <span>Staff</span>
          <strong>${escapeHtml(
              event.nl_user_profiles?.display_name ||
              event.nl_capture_devices?.label ||
              (event.capture_mode === "guest_device" ? "Unlogged device" : "Staff")
            )}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>${escapeHtml(event.status)}</strong>
        </div>

        <div>
          <span>Review</span>
          <strong>${escapeHtml(event.review_status)}</strong>
        </div>
      </section>

      ${
        event.quick_note || event.possible_name || event.location_note
          ? `
            <section class="nl-mobile-capture-summary">
              <h3>Mobile capture</h3>
              ${event.possible_name ? `<p><strong>Possible name:</strong> ${escapeHtml(event.possible_name)}</p>` : ""}
              ${event.location_note ? `<p><strong>Location:</strong> ${escapeHtml(event.location_note)}</p>` : ""}
              ${event.quick_note ? `<p>${escapeHtml(event.quick_note)}</p>` : ""}
            </section>
          `
          : ""
      }

      ${
        state.selectedEventPhotos.length
          ? `
            <section class="nl-admin-photo-grid">
              ${state.selectedEventPhotos.map((photo) => `
                <figure>
                  <img src="${photo.signedUrl}" alt="Event evidence" />
                  <figcaption>${escapeHtml(photo.subject_role)}</figcaption>
                </figure>
              `).join("")}
            </section>
          `
          : ""
      }

      ${
        event.nl_event_actions?.length
          ? `
            <section class="nl-event-timeline">
              <h3>Timeline</h3>

              ${event.nl_event_actions
                .slice()
                .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
                .map((action) => `
                  <div>
                    <time>${escapeHtml(formatDateTime(action.occurred_at))}</time>
                    <strong>${escapeHtml(action.action_type.replaceAll("_", " "))}</strong>
                  </div>
                `)
                .join("")}
            </section>
          `
          : ""
      }

      ${
        roleCanManage()
          ? `
            <form id="reviewForm" class="nl-review-form">
              <section>
                <h3>What happened?</h3>

                <label>
                  Incident summary
                  <textarea name="incident_summary" rows="5">${escapeHtml(reviewValue("incident_summary"))}</textarea>
                </label>

                <label>
                  Outcome
                  <textarea name="outcome" rows="3">${escapeHtml(reviewValue("outcome"))}</textarea>
                </label>
              </section>

              <section>
                <h3>People</h3>

                <label>
                  Person requesting help
                  <textarea name="help_requester_description" rows="3">${escapeHtml(reviewValue("help_requester_description"))}</textarea>
                </label>

                <label>
                  Person of concern
                  <textarea name="person_of_concern_description" rows="3">${escapeHtml(reviewValue("person_of_concern_description"))}</textarea>
                </label>

                <label>
                  Identity clue / possible name
                  <input
                    name="identity_clue"
                    value="${escapeHtml(reviewValue("identity_clue") || event.possible_name || "")}"
                  />
                </label>

                <label>
                  Identity source
                  <select name="identity_source">
                    ${[
                      ["", "Not recorded"],
                      ["payment_tab", "Payment tab / card name"],
                      ["patron_stated", "Patron stated"],
                      ["staff_recognition", "Staff recognition"],
                      ["other_guest", "Other guest"],
                      ["government_id", "Government ID"],
                      ["other", "Other"],
                    ].map(([value, label]) => `
                      <option
                        value="${value}"
                        ${reviewValue("identity_source") === value ? "selected" : ""}
                      >
                        ${label}
                      </option>
                    `).join("")}
                  </select>
                </label>

                <label>
                  Identity confidence
                  <select name="identity_confidence">
                    ${["unknown", "possible", "likely", "confirmed"].map((option) => `
                      <option
                        value="${option}"
                        ${(reviewValue("identity_confidence") || "unknown") === option ? "selected" : ""}
                      >
                        ${option}
                      </option>
                    `).join("")}
                  </select>
                </label>

                <label>
                  Witnesses
                  <textarea name="witnesses" rows="3">${escapeHtml(reviewValue("witnesses"))}</textarea>
                </label>
              </section>

              <section>
                <h3>Response</h3>

                <div class="nl-check-grid">
                  ${[
                    ["security_involved", "Security involved"],
                    ["service_refused", "Service refused"],
                    ["patron_removed", "Patron removed"],
                    ["police_contacted", "Police contacted"],
                    ["ems_contacted", "EMS contacted"],
                    ["cctv_available", "CCTV available"],
                    ["trespass_notice", "Trespass notice"],
                    ["venue_ban", "Venue ban"],
                    ["follow_up_required", "Follow-up required"],
                  ].map(([key, label]) => `
                    <label class="nl-check">
                      <input type="checkbox" name="${key}" ${reviewChecked(key)} />
                      <span>${label}</span>
                    </label>
                  `).join("")}
                </div>

                <label>
                  Police report number
                  <input name="police_report_number" value="${escapeHtml(reviewValue("police_report_number"))}" />
                </label>

                <label>
                  CCTV reference
                  <input name="cctv_reference" value="${escapeHtml(reviewValue("cctv_reference"))}" />
                </label>
              </section>

              <section>
                <h3>Follow-up</h3>

                <label>
                  Corrective actions
                  <textarea name="corrective_actions" rows="4">${escapeHtml(reviewValue("corrective_actions"))}</textarea>
                </label>

                <label>
                  Manager notes
                  <textarea name="manager_notes" rows="5">${escapeHtml(reviewValue("manager_notes"))}</textarea>
                </label>
              </section>

              <button type="submit" class="nl-save-review">SAVE REVIEW</button>
            </form>
          `
          : `<div class="nl-admin-readonly">Manager access is required to complete the full review.</div>`
      }
    </aside>
  `;
}

function contentHtml() {
  switch (state.tab) {
    case "events":
      return eventsHtml();
    case "patrons":
      return patronsHtml();
    case "bans":
      return bansHtml();
    case "staff":
      return staffHtml();
    case "devices":
      return devicesHtml();
    case "settings":
      return settingsHtml();
    case "audit":
      return auditHtml();
    default:
      return dashboardHtml();
  }
}

function render() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <main class="nl-admin">
      <header class="nl-admin-topbar">
        <div>
          <span>NightLedger</span>
          <strong>${escapeHtml(state.context.venue.name)}</strong>
        </div>

        <div class="nl-admin-top-actions">
          <a href="/">Quick Capture</a>
          <button type="button" id="logoutButton">Sign out</button>
        </div>
      </header>

      ${navHtml()}

      ${state.error ? `<div class="nl-admin-error">${escapeHtml(state.error)}</div>` : ""}

      ${
        state.loading
          ? `<div class="nl-admin-loading">Loading…</div>`
          : contentHtml()
      }
    </main>

    ${eventDrawerHtml()}
  `;

  wire();
}

function wire() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      state.selectedEvent = null;
      render();
    });
  });

  document.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openEvent(button.dataset.eventId);
    });
  });

  document.getElementById("closeDrawer")?.addEventListener("click", () => {
    state.selectedEvent = null;
    state.selectedEventPhotos = [];
    render();
  });

  document.getElementById("drawerBackdrop")?.addEventListener("click", () => {
    state.selectedEvent = null;
    state.selectedEventPhotos = [];
    render();
  });

  document.getElementById("reviewForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitReview();
  });

  document.getElementById("newPatronForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      await createPatron({
        venueId: state.context.venue.id,
        displayName: data.get("display_name"),
        possibleName: data.get("possible_name"),
        identityConfidence: data.get("identity_confidence"),
        descriptors: data.get("descriptors"),
      });
      await loadAll();
    } catch (error) {
      state.error = error.message;
      render();
    }
  });

  document.getElementById("newBanForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rawEnd = data.get("ends_at");

    try {
      await createBan({
        venueId: state.context.venue.id,
        patronId: data.get("patron_id"),
        eventId: null,
        reason: data.get("reason"),
        endsAt: rawEnd ? new Date(`${rawEnd}T23:59:59`).toISOString() : null,
      });
      await loadAll();
    } catch (error) {
      state.error = error.message;
      render();
    }
  });

  document.getElementById("inviteForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      await createInvite({
        venueId: state.context.venue.id,
        role: data.get("role"),
      });
      await loadAll();
    } catch (error) {
      state.error = error.message;
      render();
    }
  });

  document.getElementById("deviceForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    try {
      const result = await createCaptureDevice({
        venueId: state.context.venue.id,
        label: data.get("label"),
      });

      state.latestEnrollment = result;
      state.devices = await listCaptureDevices(state.context.venue.id);
      render();
    } catch (error) {
      state.error = error.message;
      render();
    }
  });

  document.querySelectorAll("[data-angel-setting]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const current = state.angelTypes.find((item) => item.id === form.dataset.angelSetting);
      if (!current) return;

      const data = new FormData(form);

      try {
        await saveAngelShotSetting({
          ...current,
          label: data.get("label"),
          description: data.get("description"),
          response_note: data.get("response_note"),
          active: true,
        });
        await loadAll();
      } catch (error) {
        state.error = error.message;
        render();
      }
    });
  });

  document.getElementById("logoutButton")?.addEventListener("click", async () => {
    await signOut();
    window.location.href = "/";
  });
}

export async function renderAdmin(context) {
  state.context = context;

  state.unsubscribe?.();
  state.unsubscribe = subscribeToEvents(context.venue.id, () => {
    loadAll({ quiet: true });
  });

  await loadAll();
}
