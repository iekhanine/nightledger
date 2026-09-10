const STORE_KEY = "nightledger_mobile_v2_3";

export function loadStore() {
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

export function saveStore(
  store
) {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify(
      store
    )
  );
}

export function nowIso() {
  return new Date()
    .toISOString();
}

export function uid(
  prefix
) {
  const cryptoApi =
    globalThis.crypto;

  const raw =
    cryptoApi?.randomUUID
      ? cryptoApi.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `${prefix}-${raw}`;
}

export function formatTime(
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

export function formatDate(
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

export function escapeHtml(
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

export function vibrate(
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

export function logLaunch() {
  const store =
    loadStore();

  store.launches.unshift(
    {
      id:
        uid(
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
