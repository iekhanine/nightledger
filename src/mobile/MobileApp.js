import "./MobileApp.css";

import {
  classifyEvent,
  createHold,
  finishEvent,
  getAngelShotTypes,
  guestClassifyEvent,
  guestCreateHold,
  guestFinishEvent,
  guestUpdateEventQuick,
  saveQuickDetails,
  uploadEventPhoto,
} from "../lib/api.js";

const HOLD_MS =
  700;

const MOVE_CANCEL_PX =
  24;

const LOCAL_HOLDS_KEY =
  "nightledger_local_holds_v1";

const EVENT_TYPES = [
  {
    id:
      "angel_shot",

    label:
      "ANGEL SHOT",
  },

  {
    id:
      "fight",

    label:
      "FIGHT",
  },

  {
    id:
      "threat",

    label:
      "THREAT",
  },

  {
    id:
      "harassment",

    label:
      "HARASSMENT",
  },

  {
    id:
      "refusal",

    label:
      "REFUSAL",
  },

  {
    id:
      "intoxication",

    label:
      "INTOXICATED",
  },

  {
    id:
      "theft",

    label:
      "THEFT",
  },

  {
    id:
      "medical",

    label:
      "MEDICAL",
  },

  {
    id:
      "other",

    label:
      "OTHER",
  },
];

const DEFAULT_ANGEL_TYPES = [
  {
    code:
      "neat",

    label:
      "NEAT",
  },

  {
    code:
      "rocks",

    label:
      "ON THE ROCKS",
  },

  {
    code:
      "twist",

    label:
      "WITH A TWIST",
  },
];

const state = {
  context:
    null,

  event:
    null,

  angelTypes:
    [],

  step:
    "hold",

  holdTimer:
    null,

  holdPoint:
    null,

  busy:
    false,

  error:
    "",
};

function timeText(
  iso
) {
  return new Date(
    iso
  ).toLocaleTimeString(
    [],
    {
      hour:
        "numeric",

      minute:
        "2-digit",

      second:
        "2-digit",
    }
  );
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function loadLocalHolds() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          LOCAL_HOLDS_KEY
        ) || "[]"
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveLocalEvent(
  event
) {
  const events =
    loadLocalHolds();

  const index =
    events.findIndex(
      (
        item
      ) =>
        item.id ===
        event.id
    );

  if (
    index >= 0
  ) {
    events[
      index
    ] = event;
  } else {
    events.unshift(
      event
    );
  }

  localStorage.setItem(
    LOCAL_HOLDS_KEY,
    JSON.stringify(
      events.slice(
        0,
        100
      )
    )
  );
}

function createLocalHold() {
  const now =
    new Date()
      .toISOString();

  const event = {
    id:
      `local-${crypto.randomUUID()}`,

    client_event_id:
      crypto.randomUUID(),

    event_at:
      now,

    client_event_at:
      now,

    event_type:
      null,

    angel_shot_type:
      null,

    status:
      "logged_hold",

    quick_note:
      null,

    possible_name:
      null,

    location_note:
      null,

    local_only:
      true,
  };

  saveLocalEvent(
    event
  );

  return event;
}

async function startHold() {
  if (
    state.busy ||
    state.event
  ) {
    return;
  }

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    const clientEventId =
      crypto.randomUUID();

    const clientEventAt =
      new Date()
        .toISOString();

    if (
      state
        .context
        .captureMode ===
      "authenticated"
    ) {
      state.event =
        await createHold(
          state
            .context
            .venue
            .id,
          clientEventId
        );
    } else if (
      state
        .context
        .captureMode ===
      "guest_device"
    ) {
      state.event =
        await guestCreateHold(
          {
            deviceToken:
              state
                .context
                .deviceToken,

            clientEventId,

            clientEventAt,
          }
        );
    } else {
      state.event =
        createLocalHold();
    }

    state.step =
      "type";
  } catch (
    error
  ) {
    // A network/backend failure must not erase the fact that the user held.
    state.event =
      createLocalHold();

    state.error =
      "";

    state.step =
      "type";
  } finally {
    state.busy =
      false;

    render();
  }
}

async function chooseType(
  type
) {
  if (
    !state.event ||
    state.busy
  ) {
    return;
  }

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    if (
      state
        .event
        .local_only
    ) {
      state.event = {
        ...state.event,

        event_type:
          type,

        classified_at:
          new Date()
            .toISOString(),

        status:
          "classified",
      };

      saveLocalEvent(
        state.event
      );
    } else if (
      state
        .context
        .captureMode ===
      "guest_device"
    ) {
      state.event =
        await guestClassifyEvent(
          {
            deviceToken:
              state
                .context
                .deviceToken,

            eventId:
              state
                .event
                .id,

            eventType:
              type,
          }
        );
    } else {
      state.event =
        await classifyEvent(
          {
            eventId:
              state
                .event
                .id,

            eventType:
              type,
          }
        );
    }

    if (
      type ===
      "angel_shot"
    ) {
      if (
        state
          .context
          .captureMode ===
        "authenticated"
      ) {
        state.angelTypes =
          await getAngelShotTypes(
            state
              .context
              .venue
              .id
          );
      } else if (
        state
          .context
          .captureMode ===
        "guest_device"
      ) {
        state.angelTypes =
          state
            .context
            .angelTypes ||
          DEFAULT_ANGEL_TYPES;
      } else {
        state.angelTypes =
          DEFAULT_ANGEL_TYPES;
      }

      state.step =
        "angel";
    } else {
      state.step =
        "details";
    }
  } catch (
    error
  ) {
    state.error =
      error.message;
  } finally {
    state.busy =
      false;

    render();
  }
}

async function chooseAngelType(
  code
) {
  if (
    !state.event ||
    state.busy
  ) {
    return;
  }

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    if (
      state
        .event
        .local_only
    ) {
      state.event = {
        ...state.event,

        event_type:
          "angel_shot",

        angel_shot_type:
          code,

        classified_at:
          new Date()
            .toISOString(),

        status:
          "classified",
      };

      saveLocalEvent(
        state.event
      );
    } else if (
      state
        .context
        .captureMode ===
      "guest_device"
    ) {
      state.event =
        await guestClassifyEvent(
          {
            deviceToken:
              state
                .context
                .deviceToken,

            eventId:
              state
                .event
                .id,

            eventType:
              "angel_shot",

            angelShotType:
              code,
          }
        );
    } else {
      state.event =
        await classifyEvent(
          {
            eventId:
              state
                .event
                .id,

            eventType:
              "angel_shot",

            angelShotType:
              code,
          }
        );
    }

    state.step =
      "details";
  } catch (
    error
  ) {
    state.error =
      error.message;
  } finally {
    state.busy =
      false;

    render();
  }
}

async function saveDetails() {
  if (
    !state.event ||
    state.busy
  ) {
    return;
  }

  const quickNote =
    document
      .getElementById(
        "quickNote"
      )
      ?.value
      .trim() ||
    "";

  const possibleName =
    document
      .getElementById(
        "possibleName"
      )
      ?.value
      .trim() ||
    "";

  const locationNote =
    document
      .getElementById(
        "locationNote"
      )
      ?.value
      .trim() ||
    "";

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    if (
      state
        .event
        .local_only
    ) {
      state.event = {
        ...state.event,

        quick_note:
          quickNote ||
          null,

        possible_name:
          possibleName ||
          null,

        location_note:
          locationNote ||
          null,
      };

      saveLocalEvent(
        state.event
      );
    } else if (
      state
        .context
        .captureMode ===
      "guest_device"
    ) {
      state.event =
        await guestUpdateEventQuick(
          {
            deviceToken:
              state
                .context
                .deviceToken,

            eventId:
              state
                .event
                .id,

            quickNote,

            possibleName,

            locationNote,
          }
        );
    } else {
      state.event =
        await saveQuickDetails(
          {
            eventId:
              state
                .event
                .id,

            quickNote,

            possibleName,

            locationNote,
          }
        );
    }
  } catch (
    error
  ) {
    state.error =
      error.message;
  } finally {
    state.busy =
      false;

    render();
  }
}

async function attachPhotos(
  files
) {
  if (
    !state.event ||
    !files.length
  ) {
    return;
  }

  if (
    state
      .context
      .captureMode !==
    "authenticated"
  ) {
    // Signed-out mode intentionally guarantees the HOLD timestamp first.
    // Photo upload can be added after device-scoped signed uploads are implemented.
    state.error =
      "Photo selected. Sign-in is not required for the HOLD; private photo upload is available when the device has an authenticated session.";

    render();
    return;
  }

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    for (
      const file of
      files
    ) {
      await uploadEventPhoto(
        {
          event:
            state.event,

          file,

          subjectRole:
            "unknown",
        }
      );
    }
  } catch (
    error
  ) {
    state.error =
      error.message;
  } finally {
    state.busy =
      false;

    render();
  }
}

async function done() {
  if (
    !state.event ||
    state.busy
  ) {
    return;
  }

  state.busy =
    true;

  state.error =
    "";

  render();

  try {
    if (
      state
        .event
        .local_only
    ) {
      state.event = {
        ...state.event,

        status:
          "captured",

        finished_at:
          new Date()
            .toISOString(),
      };

      saveLocalEvent(
        state.event
      );
    } else if (
      state
        .context
        .captureMode ===
      "guest_device"
    ) {
      state.event =
        await guestFinishEvent(
          {
            deviceToken:
              state
                .context
                .deviceToken,

            eventId:
              state
                .event
                .id,
          }
        );
    } else {
      state.event =
        await finishEvent(
          state
            .event
            .id
        );
    }

    state.step =
      "saved";
  } catch (
    error
  ) {
    state.error =
      error.message;
  } finally {
    state.busy =
      false;

    render();
  }
}

function reset() {
  state.event =
    null;

  state.step =
    "hold";

  state.angelTypes =
    [];

  state.error =
    "";

  render();
}

function wireHold(
  button
) {
  if (
    !button
  ) {
    return;
  }

  const cancel =
    () => {
      if (
        state.holdTimer
      ) {
        clearTimeout(
          state
            .holdTimer
        );
      }

      state.holdTimer =
        null;

      state.holdPoint =
        null;

      button.classList.remove(
        "holding"
      );
    };

  button.addEventListener(
    "pointerdown",
    (
      event
    ) => {
      if (
        event.button !==
          undefined &&
        event.button !==
          0
      ) {
        return;
      }

      state.holdPoint =
        {
          x:
            event.clientX,

          y:
            event.clientY,
        };

      button.classList.add(
        "holding"
      );

      state.holdTimer =
        window.setTimeout(
          () => {
            cancel();
            startHold();
          },
          HOLD_MS
        );
    }
  );

  button.addEventListener(
    "pointermove",
    (
      event
    ) => {
      if (
        !state.holdPoint
      ) {
        return;
      }

      const dx =
        event.clientX -
        state
          .holdPoint
          .x;

      const dy =
        event.clientY -
        state
          .holdPoint
          .y;

      if (
        Math.sqrt(
          dx * dx +
            dy * dy
        ) >
        MOVE_CANCEL_PX
      ) {
        cancel();
      }
    }
  );

  [
    "pointerup",
    "pointercancel",
    "pointerleave",
  ].forEach(
    (
      eventName
    ) => {
      button.addEventListener(
        eventName,
        cancel
      );
    }
  );

  button.addEventListener(
    "contextmenu",
    (
      event
    ) => {
      event.preventDefault();
    }
  );
}

function holdHtml() {
  return `
    <main
      class="nl-mobile-home"
    >
      <button
        type="button"
        id="holdButton"
        class="nl-hold-button"
        aria-label="Press and hold to log an event"
        ${
          state.busy
            ? "disabled"
            : ""
        }
      >
        <span
          class="nl-hold-fill"
          aria-hidden="true"
        ></span>

        <span
          class="nl-hold-dot"
          aria-hidden="true"
        ></span>

        <strong>
          ${
            state.busy
              ? "SAVING"
              : "HOLD"
          }
        </strong>
      </button>
    </main>
  `;
}

function typeHtml() {
  return `
    <main
      class="nl-mobile-step"
    >
      <section
        class="nl-mobile-stamp"
      >
        <span>
          LOGGED HOLD
        </span>

        <strong>
          ${escapeHtml(
            timeText(
              state
                .event
                .event_at
            )
          )}
        </strong>
      </section>

      <section
        class="nl-mobile-type-grid"
      >
        ${EVENT_TYPES
          .map(
            (
              item
            ) => `
              <button
                type="button"
                class="nl-mobile-type ${
                  item.id ===
                  "angel_shot"
                    ? "angel"
                    : ""
                }"
                data-event-type="${item.id}"
                ${
                  state.busy
                    ? "disabled"
                    : ""
                }
              >
                ${item.label}
              </button>
            `
          )
          .join(
            ""
          )}
      </section>

      <button
        type="button"
        class="nl-mobile-done"
        id="doneNow"
        ${
          state.busy
            ? "disabled"
            : ""
        }
      >
        DONE
      </button>
    </main>
  `;
}

function angelHtml() {
  return `
    <main
      class="nl-mobile-step"
    >
      <section
        class="nl-mobile-stamp"
      >
        <span>
          ANGEL SHOT
        </span>

        <strong>
          ${escapeHtml(
            timeText(
              state
                .event
                .event_at
            )
          )}
        </strong>
      </section>

      <section
        class="nl-mobile-angel-grid"
      >
        ${state.angelTypes
          .map(
            (
              item
            ) => `
              <button
                type="button"
                class="nl-mobile-angel"
                data-angel-type="${escapeHtml(
                  item.code
                )}"
                ${
                  state.busy
                    ? "disabled"
                    : ""
                }
              >
                ${escapeHtml(
                  item.label
                )}
              </button>
            `
          )
          .join(
            ""
          )}
      </section>

      <button
        type="button"
        class="nl-mobile-back"
        id="backToTypes"
      >
        BACK
      </button>

      <button
        type="button"
        class="nl-mobile-done"
        id="doneNow"
        ${
          state.busy
            ? "disabled"
            : ""
        }
      >
        DONE
      </button>
    </main>
  `;
}

function detailsHtml() {
  const label =
    state
      .event
      .event_type ===
    "angel_shot"
      ? `ANGEL SHOT · ${
          state
            .event
            .angel_shot_type ||
          ""
        }`
      : (
          state
            .event
            .event_type ||
          "LOGGED HOLD"
        );

  return `
    <main
      class="nl-mobile-step"
    >
      <section
        class="nl-mobile-stamp"
      >
        <span>
          ${escapeHtml(
            label
              .replaceAll(
                "_",
                " "
              )
              .toUpperCase()
          )}
        </span>

        <strong>
          ${escapeHtml(
            timeText(
              state
                .event
                .event_at
            )
          )}
        </strong>
      </section>

      <input
        id="photoInput"
        type="file"
        accept="image/*"
        multiple
        hidden
      />

      <button
        type="button"
        class="nl-mobile-photo"
        id="addPhoto"
        ${
          state.busy
            ? "disabled"
            : ""
        }
      >
        + ADD PHOTO
      </button>

      <details
        class="nl-mobile-details"
      >
        <summary>
          ADD DETAILS
        </summary>

        <div
          class="nl-mobile-detail-fields"
        >
          <input
            id="possibleName"
            type="text"
            placeholder="Possible name"
            value="${escapeHtml(
              state
                .event
                .possible_name ||
              ""
            )}"
          />

          <input
            id="locationNote"
            type="text"
            placeholder="Where in the venue?"
            value="${escapeHtml(
              state
                .event
                .location_note ||
              ""
            )}"
          />

          <textarea
            id="quickNote"
            rows="3"
            placeholder="Quick note"
          >${escapeHtml(
            state
              .event
              .quick_note ||
            ""
          )}</textarea>

          <button
            type="button"
            id="saveDetails"
            ${
              state.busy
                ? "disabled"
                : ""
            }
          >
            SAVE DETAILS
          </button>
        </div>
      </details>

      ${
        state.error
          ? `
            <div
              class="nl-mobile-error"
            >
              ${escapeHtml(
                state.error
              )}
            </div>
          `
          : ""
      }

      <button
        type="button"
        class="nl-mobile-done"
        id="doneNow"
        ${
          state.busy
            ? "disabled"
            : ""
        }
      >
        ${
          state.busy
            ? "SAVING"
            : "DONE"
        }
      </button>
    </main>
  `;
}

function savedHtml() {
  return `
    <main
      class="nl-mobile-saved"
    >
      <section>
        <span>
          SAVED
        </span>

        <strong>
          ${escapeHtml(
            timeText(
              state
                .event
                .event_at
            )
          )}
        </strong>
      </section>

      <button
        type="button"
        id="readyButton"
      >
        READY
      </button>
    </main>
  `;
}

function wire() {
  wireHold(
    document.getElementById(
      "holdButton"
    )
  );

  document
    .querySelectorAll(
      "[data-event-type]"
    )
    .forEach(
      (
        button
      ) => {
        button.addEventListener(
          "click",
          () => {
            chooseType(
              button.dataset
                .eventType
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-angel-type]"
    )
    .forEach(
      (
        button
      ) => {
        button.addEventListener(
          "click",
          () => {
            chooseAngelType(
              button.dataset
                .angelType
            );
          }
        );
      }
    );

  document
    .getElementById(
      "backToTypes"
    )
    ?.addEventListener(
      "click",
      () => {
        state.step =
          "type";

        render();
      }
    );

  document
    .getElementById(
      "addPhoto"
    )
    ?.addEventListener(
      "click",
      () => {
        document
          .getElementById(
            "photoInput"
          )
          ?.click();
      }
    );

  document
    .getElementById(
      "photoInput"
    )
    ?.addEventListener(
      "change",
      (
        event
      ) => {
        const files =
          Array.from(
            event
              .target
              .files ||
              []
          );

        attachPhotos(
          files
        );
      }
    );

  document
    .getElementById(
      "saveDetails"
    )
    ?.addEventListener(
      "click",
      saveDetails
    );

  document
    .querySelectorAll(
      "#doneNow"
    )
    .forEach(
      (
        button
      ) => {
        button.addEventListener(
          "click",
          done
        );
      }
    );

  document
    .getElementById(
      "readyButton"
    )
    ?.addEventListener(
      "click",
      reset
    );
}

function render() {
  const app =
    document.getElementById(
      "app"
    );

  switch (
    state.step
  ) {
    case "type":
      app.innerHTML =
        typeHtml();
      break;

    case "angel":
      app.innerHTML =
        angelHtml();
      break;

    case "details":
      app.innerHTML =
        detailsHtml();
      break;

    case "saved":
      app.innerHTML =
        savedHtml();
      break;

    default:
      app.innerHTML =
        holdHtml();
      break;
  }

  wire();
}

export async function renderMobile(
  context
) {
  state.context =
    context;

  state.angelTypes =
    context
      .angelTypes ||
    [];

  render();
}
