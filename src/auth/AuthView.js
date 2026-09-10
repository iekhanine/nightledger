import "./AuthView.css";

import {
  acceptInvite,
  bootstrapVenue,
  signIn,
  signUp,
} from "../lib/api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderConfirmationPending({
  email,
  onComplete,
}) {
  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML = `
    <main
      class="nl-auth"
    >
      <section
        class="nl-auth-card"
      >
        <div
          class="nl-auth-mark"
        >
          NL
        </div>

        <h1>
          Check your email
        </h1>

        <p>
          NightLedger sent a confirmation link to:
        </p>

        <div
          class="nl-auth-email"
        >
          ${escapeHtml(
            email
          )}
        </div>

        <p
          class="nl-auth-note"
        >
          Once confirmed, the link returns you directly to NightLedger Admin.
          You should not need to enter your password again.
        </p>

        <button
          type="button"
          id="confirmationContinue"
          class="nl-auth-secondary"
        >
          I already confirmed
        </button>

        <button
          type="button"
          id="confirmationBack"
          class="nl-auth-secondary"
        >
          Back to sign in
        </button>

        <div
          id="authError"
          class="nl-auth-error"
          aria-live="polite"
        ></div>
      </section>
    </main>
  `;

  document
    .getElementById(
      "confirmationContinue"
    )
    .addEventListener(
      "click",
      async () => {
        try {
          await onComplete();
        } catch (
          error
        ) {
          document
            .getElementById(
              "authError"
            )
            .textContent =
              error.message;
        }
      }
    );

  document
    .getElementById(
      "confirmationBack"
    )
    .addEventListener(
      "click",
      () => {
        renderAuth(
          {
            mode:
              "signin",

            message:
              "Management sign-in",

            onComplete,
          }
        );
      }
    );
}

export function renderAuth({
  mode = "signin",
  message = "",
  onComplete,
}) {
  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML = `
    <main
      class="nl-auth"
    >
      <section
        class="nl-auth-card"
      >
        <div
          class="nl-auth-mark"
        >
          NL
        </div>

        <h1>
          NightLedger
        </h1>

        <p>
          ${escapeHtml(
            message ||
            "Sign in to your venue."
          )}
        </p>

        <form
          id="authForm"
          class="nl-auth-form"
        >
          <input
            id="authEmail"
            type="email"
            placeholder="Email"
            autocomplete="email"
            required
          />

          <input
            id="authPassword"
            type="password"
            placeholder="Password"
            autocomplete="${
              mode ===
              "signup"
                ? "new-password"
                : "current-password"
            }"
            minlength="8"
            required
          />

          <button
            type="submit"
            id="authSubmit"
          >
            ${
              mode ===
              "signup"
                ? "Create account"
                : "Sign in"
            }
          </button>
        </form>

        <button
          type="button"
          id="toggleAuthMode"
          class="nl-auth-secondary"
        >
          ${
            mode ===
              "signup"
              ? "Already have an account?"
              : "Create account"
          }
        </button>

        <div
          id="authError"
          class="nl-auth-error"
          aria-live="polite"
        ></div>
      </section>
    </main>
  `;

  document
    .getElementById(
      "authForm"
    )
    .addEventListener(
      "submit",
      async (
        event
      ) => {
        event.preventDefault();

        const email =
          document
            .getElementById(
              "authEmail"
            )
            .value
            .trim();

        const password =
          document
            .getElementById(
              "authPassword"
            )
            .value;

        const errorBox =
          document.getElementById(
            "authError"
          );

        const submitButton =
          document.getElementById(
            "authSubmit"
          );

        errorBox.textContent =
          "";

        submitButton.disabled =
          true;

        submitButton.textContent =
          mode ===
          "signup"
            ? "Creating…"
            : "Signing in…";

        try {
          if (
            mode ===
            "signup"
          ) {
            const result =
              await signUp(
                email,
                password
              );

            /*
             * Confirm Email OFF:
             * Supabase returns a live session immediately.
             * NightLedger proceeds straight into venue setup.
             */
            if (
              result.session
            ) {
              await onComplete();
              return;
            }

            /*
             * Confirm Email ON:
             * Supabase intentionally returns no session yet.
             * The confirmation email now redirects back to /admin.
             */
            renderConfirmationPending(
              {
                email,
                onComplete,
              }
            );

            return;
          }

          await signIn(
            email,
            password
          );

          await onComplete();
        } catch (
          error
        ) {
          errorBox.textContent =
            error.message;

          submitButton.disabled =
            false;

          submitButton.textContent =
            mode ===
            "signup"
              ? "Create account"
              : "Sign in";
        }
      }
    );

  document
    .getElementById(
      "toggleAuthMode"
    )
    .addEventListener(
      "click",
      () => {
        renderAuth(
          {
            mode:
              mode ===
              "signup"
                ? "signin"
                : "signup",

            message,

            onComplete,
          }
        );
      }
    );
}

export function renderNoMembership({
  allowBootstrap,
  onComplete,
}) {
  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML = `
    <main
      class="nl-auth"
    >
      <section
        class="nl-auth-card nl-access-card"
      >
        <div
          class="nl-auth-mark"
        >
          NL
        </div>

        <h1>
          Venue Access
        </h1>

        <p>
          Join an existing NightLedger venue.
        </p>

        <form
          id="inviteForm"
          class="nl-auth-form"
        >
          <input
            id="inviteCode"
            type="text"
            placeholder="Invite code"
            autocomplete="off"
            maxlength="32"
            required
          />

          <button
            type="submit"
          >
            Join venue
          </button>
        </form>

        ${
          allowBootstrap
            ? `
              <div
                class="nl-auth-divider"
              >
                OR
              </div>

              <form
                id="bootstrapForm"
                class="nl-auth-form"
              >
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  autocomplete="name"
                />

                <input
                  id="orgName"
                  type="text"
                  placeholder="Organization"
                  required
                />

                <input
                  id="venueName"
                  type="text"
                  placeholder="Venue"
                  required
                />

                <button
                  type="submit"
                >
                  Create NightLedger venue
                </button>
              </form>
            `
            : ""
        }

        <div
          id="accessError"
          class="nl-auth-error"
          aria-live="polite"
        ></div>
      </section>
    </main>
  `;

  document
    .getElementById(
      "inviteForm"
    )
    .addEventListener(
      "submit",
      async (
        event
      ) => {
        event.preventDefault();

        const code =
          document
            .getElementById(
              "inviteCode"
            )
            .value;

        const errorBox =
          document.getElementById(
            "accessError"
          );

        errorBox.textContent =
          "";

        try {
          await acceptInvite(
            code
          );

          await onComplete();
        } catch (
          error
        ) {
          errorBox.textContent =
            error.message;
        }
      }
    );

  document
    .getElementById(
      "bootstrapForm"
    )
    ?.addEventListener(
      "submit",
      async (
        event
      ) => {
        event.preventDefault();

        const errorBox =
          document.getElementById(
            "accessError"
          );

        errorBox.textContent =
          "";

        try {
          await bootstrapVenue(
            {
              organizationName:
                document
                  .getElementById(
                    "orgName"
                  )
                  .value
                  .trim(),

              venueName:
                document
                  .getElementById(
                    "venueName"
                  )
                  .value
                  .trim(),

              displayName:
                document
                  .getElementById(
                    "displayName"
                  )
                  .value
                  .trim(),
            }
          );

          await onComplete();
        } catch (
          error
        ) {
          errorBox.textContent =
            error.message;
        }
      }
    );
}
