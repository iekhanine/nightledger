import "./styles.css";

/* ==========================================================
   NIGHTLEDGER MOBILE V2
   Single-button capture
   ========================================================== */

const STORE_KEY = "nightledger_mobile_v2";
const HOLD_MS = 700;
const MOVE_CANCEL_PX = 24;

const state = {
  holdTimer: null,
  holdPoint: null,
};

function loadStore() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          STORE_KEY
        ) || "{}"
      );

    return {
      launches:
        Array.isArray(
          parsed.launches
        )
          ? parsed.launches
          : [],

      activeEvent:
        parsed.activeEvent ||
        null,

      events:
        Array.isArray(
          parsed.events
        )
          ? parsed.events
          : [],
    };
  } catch {
    return {
      launches: [],
      activeEvent: null,
      events: [],
    };
  }
}

function saveStore(
  store
) {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify(
      store
    )
  );
}

function nowIso() {
  return new Date()
    .toISOString();
}

function uid(
  prefix
) {
  const raw =
    crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `${prefix}-${raw}`;
}

function formatTime(
  iso
) {
  return new Date(
    iso
  ).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

function formatDate(
  iso
) {
  return new Date(
    iso
  ).toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
      year: "numeric",
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

function vibrate(
  pattern
) {
  if (
    "vibrate" in
    navigator
  ) {
    navigator.vibrate(
      pattern
    );
  }
}

/* ----------------------------------------------------------
   Launches are logged silently for accidental-open auditing.
   They are NOT shown to frontline staff and do NOT become events.
   ---------------------------------------------------------- */

function logLaunch() {
  const store =
    loadStore();

  store.launches.unshift(
    {
      id: uid(
        "LCH"
      ),
      openedAt:
        nowIso(),
      status:
        "opened",
    }
  );

  store.launches =
    store.launches.slice(
      0,
      100
    );

  saveStore(
    store
  );
}

/* ----------------------------------------------------------
   The deliberate hold creates THE incident timestamp.
   Everything attached to this quick event remains anchored to
   eventAt. Individual file-added timestamps are kept only as
   metadata for the later management view.
   ---------------------------------------------------------- */

function startEvent() {
  const store =
    loadStore();

  if (
    store.activeEvent
  ) {
    render();
    return;
  }

  const eventAt =
    nowIso();

  store.activeEvent = {
    id: uid(
      "EVT"
    ),

    eventAt,

    createdAt:
      eventAt,

    status:
      "open",

    photos: [],

    notes: [],
  };

  saveStore(
    store
  );

  vibrate(
    [
      30,
      30,
      30,
    ]
  );

  render();
}

function finishEvent() {
  const store =
    loadStore();

  if (
    !store.activeEvent
  ) {
    return;
  }

  const finished = {
    ...store.activeEvent,
    status:
      "captured",
    finishedAt:
      nowIso(),
  };

  store.events.unshift(
    finished
  );

  store.events =
    store.events.slice(
      0,
      100
    );

  store.activeEvent =
    null;

  saveStore(
    store
  );

  vibrate(
    20
  );

  render();
}

/* ----------------------------------------------------------
   Photos can come from the camera OR the existing photo library.
   No capture= attribute is used, so the phone can offer either.
   ---------------------------------------------------------- */

function compressPhoto(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onerror =
        () =>
          reject(
            new Error(
              "Could not read photo."
            )
          );

      reader.onload =
        () => {
          const image =
            new Image();

          image.onerror =
            () =>
              reject(
                new Error(
                  "Could not open photo."
                )
              );

          image.onload =
            () => {
              const max =
                960;

              let width =
                image.width;

              let height =
                image.height;

              if (
                width >
                  height &&
                width >
                  max
              ) {
                height =
                  Math.round(
                    height *
                      (
                        max /
                        width
                      )
                  );

                width =
                  max;
              } else if (
                height >
                max
              ) {
                width =
                  Math.round(
                    width *
                      (
                        max /
                        height
                      )
                  );

                height =
                  max;
              }

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const context =
                canvas.getContext(
                  "2d"
                );

              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );

              resolve(
                canvas.toDataURL(
                  "image/jpeg",
                  0.78
                )
              );
            };

          image.src =
            reader.result;
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function addPhotos(
  files
) {
  const store =
    loadStore();

  if (
    !store.activeEvent
  ) {
    return;
  }

  for (
    const file of
    files
  ) {
    try {
      const dataUrl =
        await compressPhoto(
          file
        );

      store.activeEvent.photos.push(
        {
          id: uid(
            "PHO"
          ),

          eventAt:
            store
              .activeEvent
              .eventAt,

          attachedAt:
            nowIso(),

          dataUrl,
        }
      );
    } catch {
      // Skip files that cannot be processed.
    }
  }

  saveStore(
    store
  );

  vibrate(
    16
  );

  render();
}

/* ----------------------------------------------------------
   Hold gesture
   ---------------------------------------------------------- */

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
          state.holdTimer
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
            startEvent();
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

      const distance =
        Math.sqrt(
          dx * dx +
            dy * dy
        );

      if (
        distance >
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

/* ----------------------------------------------------------
   Render
   ---------------------------------------------------------- */

function homeHtml() {
  return `
    <main class="nl-home">
      <button
        type="button"
        id="startButton"
        class="nl-start-button"
        aria-label="Press and hold to record something happening now"
      >
        <span
          class="nl-hold-fill"
          aria-hidden="true"
        ></span>

        <span
          class="nl-start-dot"
          aria-hidden="true"
        ></span>

        <strong>
          HOLD
        </strong>
      </button>
    </main>
  `;
}

function eventHtml(
  event
) {
  return `
    <main class="nl-event">
      <section
        class="nl-event-stamp"
      >
        <span>
          EVENT
        </span>

        <strong>
          ${escapeHtml(
            formatTime(
              event.eventAt
            )
          )}
        </strong>

        <small>
          ${escapeHtml(
            formatDate(
              event.eventAt
            )
          )}
        </small>
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
        id="addPhoto"
        class="nl-event-action nl-photo-action"
      >
        <span
          aria-hidden="true"
        >
          ＋
        </span>

        <strong>
          ADD PHOTO
        </strong>
      </button>

      ${
        event
          .photos
          .length
          ? `
            <section
              class="nl-photo-grid"
              aria-label="Attached photos"
            >
              ${event.photos
                .map(
                  (
                    photo,
                    index
                  ) => `
                    <figure>
                      <img
                        src="${photo.dataUrl}"
                        alt="Attached photo ${index + 1}"
                      />
                    </figure>
                  `
                )
                .join(
                  ""
                )}
            </section>
          `
          : ""
      }

      <button
        type="button"
        id="doneButton"
        class="nl-event-action nl-done-action"
      >
        DONE
      </button>
    </main>
  `;
}

function capturedHtml() {
  const store =
    loadStore();

  const latest =
    store.events[0];

  return `
    <main class="nl-captured">
      <section
        class="nl-captured-card"
      >
        <span>
          SAVED
        </span>

        <strong>
          ${escapeHtml(
            formatTime(
              latest.eventAt
            )
          )}
        </strong>

        <small>
          ${latest.photos.length}
          photo${
            latest.photos.length ===
            1
              ? ""
              : "s"
          }
        </small>
      </section>

      <button
        type="button"
        id="newCaptureButton"
        class="nl-new-capture"
      >
        READY
      </button>
    </main>
  `;
}

function render() {
  const app =
    document.getElementById(
      "app"
    );

  const store =
    loadStore();

  if (
    store.activeEvent
  ) {
    app.innerHTML =
      eventHtml(
        store.activeEvent
      );
  } else if (
    store.events.length &&
    sessionStorage.getItem(
      "nightledger_just_finished"
    ) ===
      "1"
  ) {
    app.innerHTML =
      capturedHtml();
  } else {
    app.innerHTML =
      homeHtml();
  }

  wire();
}

function wire() {
  wireHold(
    document.getElementById(
      "startButton"
    )
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

        if (
          files.length
        ) {
          addPhotos(
            files
          );
        }
      }
    );

  document
    .getElementById(
      "doneButton"
    )
    ?.addEventListener(
      "click",
      () => {
        finishEvent();

        sessionStorage.setItem(
          "nightledger_just_finished",
          "1"
        );

        render();
      }
    );

  document
    .getElementById(
      "newCaptureButton"
    )
    ?.addEventListener(
      "click",
      () => {
        sessionStorage.removeItem(
          "nightledger_just_finished"
        );

        render();
      }
    );
}

/* ----------------------------------------------------------
   Startup
   ---------------------------------------------------------- */

logLaunch();
render();

/* ----------------------------------------------------------
   PWA service worker
   ---------------------------------------------------------- */

if (
  "serviceWorker" in
  navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator
        .serviceWorker
        .register(
          "/sw.js"
        )
        .catch(
          () => {}
        );
    }
  );
}
