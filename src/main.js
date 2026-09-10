import "./base.css";

import {
  getGuestCaptureContext,
  getMyContext,
  getSession,
} from "./lib/api.js";

import {
  renderAuth,
  renderNoMembership,
} from "./auth/AuthView.js";

import {
  renderMobile,
} from "./mobile/MobileApp.js";

import {
  renderAdmin,
} from "./admin/AdminApp.js";

const DEVICE_TOKEN_KEY =
  "nightledger_capture_device_token";

function isAdminRoute() {
  const path =
    window.location.pathname;

  return (
    path ===
      "/admin" ||
    path.startsWith(
      "/admin/"
    )
  );
}

function consumeEnrollmentToken() {
  const url =
    new URL(
      window.location.href
    );

  const token =
    url.searchParams.get(
      "enroll"
    );

  if (
    token
  ) {
    localStorage.setItem(
      DEVICE_TOKEN_KEY,
      token
    );

    url.searchParams.delete(
      "enroll"
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  return (
    token ||
    localStorage.getItem(
      DEVICE_TOKEN_KEY
    )
  );
}

async function clearDevPwaState() {
  if (
    !import.meta.env.DEV
  ) {
    return;
  }

  if (
    "serviceWorker" in
    navigator
  ) {
    const registrations =
      await navigator
        .serviceWorker
        .getRegistrations();

    await Promise.all(
      registrations.map(
        (
          registration
        ) =>
          registration.unregister()
      )
    );
  }

  if (
    "caches" in
    window
  ) {
    const keys =
      await caches.keys();

    await Promise.all(
      keys
        .filter(
          (
            key
          ) =>
            key
              .toLowerCase()
              .includes(
                "nightledger"
              )
        )
        .map(
          (
            key
          ) =>
            caches.delete(
              key
            )
        )
    );
  }
}

async function getMobileContext() {
  const session =
    await getSession();

  if (
    session
  ) {
    try {
      const context =
        await getMyContext();

      if (
        context
          ?.membership
      ) {
        return {
          ...context,

          captureMode:
            "authenticated",
        };
      }
    } catch {
      // Do not block frontline capture because account context failed.
    }
  }

  const deviceToken =
    consumeEnrollmentToken();

  if (
    deviceToken
  ) {
    try {
      const guest =
        await getGuestCaptureContext(
          deviceToken
        );

      if (
        guest
          ?.venue_id
      ) {
        return {
          captureMode:
            "guest_device",

          deviceToken,

          venue:
            {
              id:
                guest.venue_id,

              name:
                guest.venue_name,
            },

          membership:
            null,

          angelTypes:
            guest.angel_shot_types ||
            [],
        };
      }
    } catch {
      // Invalid/expired device token falls through to local-only capture.
    }
  }

  return {
    captureMode:
      "local_only",

    deviceToken:
      null,

    venue:
      null,

    membership:
      null,

    angelTypes:
      [],
  };
}

async function bootAdmin() {
  const session =
    await getSession();

  if (
    !session
  ) {
    renderAuth(
      {
        message:
          "Management sign-in",

        onComplete:
          bootAdmin,
      }
    );

    return;
  }

  const context =
    await getMyContext();

  if (
    !context
      ?.membership
  ) {
    renderNoMembership(
      {
        allowBootstrap:
          true,

        onComplete:
          bootAdmin,
      }
    );

    return;
  }

  await renderAdmin(
    context
  );
}

async function boot() {
  await clearDevPwaState();

  if (
    isAdminRoute()
  ) {
    await bootAdmin();
  } else {
    const context =
      await getMobileContext();

    await renderMobile(
      context
    );
  }

  if (
    import.meta.env.PROD &&
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
      },
      {
        once:
          true,
      }
    );
  }
}

boot().catch(
  (
    error
  ) => {
    const app =
      document.getElementById(
        "app"
      );

    app.innerHTML = `
      <main
        style="
          min-height:100vh;
          display:grid;
          place-items:center;
          padding:20px;
          color:#f0b9bf;
          font-family:system-ui,sans-serif;
          text-align:center;
        "
      >
        <div>
          <strong>
            NightLedger could not start.
          </strong>

          <div
            style="
              margin-top:8px;
              font-size:12px;
              color:#9eb0b8;
            "
          >
            ${String(
              error.message
            )}
          </div>
        </div>
      </main>
    `;
  }
);
