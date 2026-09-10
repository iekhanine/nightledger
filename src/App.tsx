import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  BarChart3,
  BookOpenCheck,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  FileDown,
  FileText,
  Flag,
  History,
  IdCard,
  Image as ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareWarning,
  PhoneCall,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";

/* ==========================================================
   NIGHTLEDGER 001
   Product model
   ========================================================== */

type View =
  | "overview"
  | "incidents"
  | "patrons"
  | "flags"
  | "shift"
  | "licensing"
  | "reports";

type StaffRole =
  | "Bartender"
  | "Security"
  | "Manager"
  | "Owner";

type IdentityConfidence =
  | "Unknown"
  | "Possible"
  | "Likely"
  | "Confirmed";

type PatronStatus =
  | "Watch"
  | "Banned"
  | "Cleared"
  | "Review";

type IncidentSeverity =
  | "Low"
  | "Moderate"
  | "High"
  | "Critical";

type IncidentStatus =
  | "Open"
  | "Reviewed"
  | "Closed";

type Incident = {
  id: string;
  occurredAt: string;
  type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  patronId?: string;
  patron: string;
  staff: string;
  summary: string;
  policeCalled: boolean;
  reportNumber?: string;
  correctiveAction: string;
};

type PatronPhoto = {
  id: string;
  label: string;
  source: string;
  capturedAt: string;
  primary: boolean;
};

type PatronRecord = {
  id: string;
  displayLabel: string;
  observedName?: string;
  nameSource?: string;
  identityConfidence: IdentityConfidence;
  status: PatronStatus;
  firstSeen: string;
  lastSeen: string;
  descriptors: string;
  incidentCount: number;
  activeBan?: string;
  notes: string;
  photos: PatronPhoto[];
};

type PatronFlag = {
  id: string;
  createdAt: string;
  createdBy: string;
  role: StaffRole;
  patronId?: string;
  displayLabel: string;
  reason: string;
  details: string;
  identityHint?: string;
  identitySource?: string;
  confidence: IdentityConfidence;
  hasPhoto: boolean;
  reviewStatus:
    | "Pending"
    | "Reviewed"
    | "Linked";
};

type ShiftNote = {
  time: string;
  author: string;
  text: string;
  kind:
    | "handoff"
    | "security"
    | "management";
};

/* ==========================================================
   NIGHTLEDGER 002
   Prototype seed data
   ========================================================== */

const seedIncidents: Incident[] = [
  {
    id: "INC-2026-0042",
    occurredAt: "Sep 9 · 12:38 AM",
    type: "Refusal to leave",
    severity: "Moderate",
    status: "Reviewed",
    patronId: "PTR-0047",
    patron: "Unknown Patron #0047",
    staff: "Alex R. / Jamie K.",
    summary:
      "Patron was refused further service and asked to leave after repeated verbal disruption near the east bar.",
    policeCalled: false,
    correctiveAction:
      "Service refused, patron escorted out, door staff notified for remainder of night.",
  },
  {
    id: "INC-2026-0041",
    occurredAt: "Sep 7 · 1:12 AM",
    type: "Fight / disturbance",
    severity: "High",
    status: "Closed",
    patronId: "PTR-0043",
    patron: "Possible name: Marcus R.",
    staff: "Security Team",
    summary:
      "Physical altercation began near rear hallway. Staff separated both parties and removed them through separate exits.",
    policeCalled: true,
    reportNumber: "RPD-26-18452",
    correctiveAction:
      "Patron banned for 90 days. Camera footage retained and manager follow-up completed.",
  },
  {
    id: "INC-2026-0040",
    occurredAt: "Sep 5 · 11:06 PM",
    type: "Medical",
    severity: "Critical",
    status: "Closed",
    patron: "Guest",
    staff: "Morgan T.",
    summary:
      "Guest became unresponsive while seated. Staff initiated emergency response and contacted EMS.",
    policeCalled: false,
    correctiveAction:
      "EMS response documented. Staff debrief completed.",
  },
  {
    id: "INC-2026-0039",
    occurredAt: "Sep 4 · 10:44 PM",
    type: "Noise complaint",
    severity: "Low",
    status: "Closed",
    patron: "N/A",
    staff: "Manager",
    summary:
      "Neighbor called venue regarding exterior patio volume.",
    policeCalled: false,
    correctiveAction:
      "Patio music reduced. Exterior door checks increased for remaining operating hours.",
  },
];

const seedPatrons: PatronRecord[] = [
  {
    id: "PTR-0047",
    displayLabel: "Unknown Patron #0047",
    observedName: "Daniel P.",
    nameSource: "Name displayed on payment card / open tab",
    identityConfidence: "Possible",
    status: "Review",
    firstSeen: "Sep 9, 2026",
    lastSeen: "Sep 9, 2026",
    descriptors:
      "Dark jacket, gray cap, forearm tattoo. Approx. 6 ft.",
    incidentCount: 1,
    notes:
      "Name is an identity hint only. Staff did not verify government ID. Card may not belong to patron.",
    photos: [
      {
        id: "PH-0118",
        label: "Door camera",
        source: "Entry camera",
        capturedAt: "Sep 9 · 12:11 AM",
        primary: true,
      },
      {
        id: "PH-0119",
        label: "East bar camera",
        source: "Security camera",
        capturedAt: "Sep 9 · 12:34 AM",
        primary: false,
      },
    ],
  },
  {
    id: "PTR-0043",
    displayLabel: "Possible name: Marcus R.",
    observedName: "Marcus R.",
    nameSource: "Name displayed on payment card / open tab",
    identityConfidence: "Likely",
    status: "Banned",
    firstSeen: "Aug 22, 2026",
    lastSeen: "Sep 7, 2026",
    descriptors:
      "Black hoodie, beard, left-hand ring.",
    incidentCount: 3,
    activeBan: "90 days · expires Dec 6, 2026",
    notes:
      "Same observed name appeared on two separate tabs. Identity still not treated as legally verified.",
    photos: [
      {
        id: "PH-0102",
        label: "Rear hallway",
        source: "Security camera",
        capturedAt: "Sep 7 · 1:10 AM",
        primary: true,
      },
      {
        id: "PH-0091",
        label: "Front door",
        source: "Door staff upload",
        capturedAt: "Aug 22 · 11:52 PM",
        primary: false,
      },
    ],
  },
  {
    id: "PTR-0038",
    displayLabel: "Unknown Patron #0038",
    identityConfidence: "Unknown",
    status: "Watch",
    firstSeen: "Aug 19, 2026",
    lastSeen: "Aug 28, 2026",
    descriptors:
      "Red baseball cap, neck tattoo, usually arrives with group of 3–4.",
    incidentCount: 2,
    notes:
      "No reliable name information available.",
    photos: [
      {
        id: "PH-0082",
        label: "Patio camera",
        source: "Security camera",
        capturedAt: "Aug 28 · 10:04 PM",
        primary: true,
      },
    ],
  },
];

const seedFlags: PatronFlag[] = [
  {
    id: "FLG-0097",
    createdAt: "Sep 9 · 12:41 AM",
    createdBy: "Jamie K.",
    role: "Bartender",
    patronId: "PTR-0047",
    displayLabel: "Unknown Patron #0047",
    reason: "Refusal to leave",
    details:
      "Would not leave after service was refused. Raised voice at staff. Security escorted out.",
    identityHint: "Daniel P.",
    identitySource: "Name displayed on open-tab payment card",
    confidence: "Possible",
    hasPhoto: true,
    reviewStatus: "Linked",
  },
  {
    id: "FLG-0096",
    createdAt: "Sep 8 · 11:16 PM",
    createdBy: "Sam T.",
    role: "Bartender",
    displayLabel: "Unidentified patron",
    reason: "Repeated harassment",
    details:
      "Two separate guests complained about comments. Patron left voluntarily after warning.",
    confidence: "Unknown",
    hasPhoto: false,
    reviewStatus: "Pending",
  },
  {
    id: "FLG-0095",
    createdAt: "Sep 7 · 1:15 AM",
    createdBy: "Chris M.",
    role: "Security",
    patronId: "PTR-0043",
    displayLabel: "Possible name: Marcus R.",
    reason: "Fight / disturbance",
    details:
      "Removed after physical altercation. Manager requested 90-day ban review.",
    identityHint: "Marcus R.",
    identitySource: "Name shown on POS tab",
    confidence: "Likely",
    hasPhoto: true,
    reviewStatus: "Reviewed",
  },
];

const shiftNotes: ShiftNote[] = [
  {
    time: "1:48 AM",
    author: "Jamie K.",
    kind: "handoff",
    text: "Close complete. Rear door latch is sticking again. Facilities ticket submitted.",
  },
  {
    time: "12:42 AM",
    author: "Alex R.",
    kind: "security",
    text: "Patron removed from east bar after refusal to leave. FLG-0097 linked to INC-2026-0042.",
  },
  {
    time: "10:15 PM",
    author: "Morgan T.",
    kind: "management",
    text: "Second-floor event ended normally. Deposit envelope transferred to safe.",
  },
];

/* ==========================================================
   NIGHTLEDGER 003
   Navigation
   ========================================================== */

const navItems = [
  {
    id: "overview" as View,
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "incidents" as View,
    label: "Incidents",
    icon: ShieldAlert,
  },
  {
    id: "patrons" as View,
    label: "Patron Records",
    icon: UserRound,
  },
  {
    id: "flags" as View,
    label: "Staff Flags",
    icon: Flag,
  },
  {
    id: "shift" as View,
    label: "Shift Log",
    icon: ClipboardList,
  },
  {
    id: "licensing" as View,
    label: "Licensing",
    icon: BookOpenCheck,
  },
  {
    id: "reports" as View,
    label: "Reports",
    icon: FileDown,
  },
];

/* ==========================================================
   NIGHTLEDGER 004
   Badges
   ========================================================== */

function ConfidenceBadge({
  confidence,
}: {
  confidence: IdentityConfidence;
}) {
  return (
    <span
      className={`confidence-badge confidence-${confidence.toLowerCase()}`}
    >
      {confidence}
    </span>
  );
}

function PatronStatusBadge({
  status,
}: {
  status: PatronStatus;
}) {
  return (
    <span
      className={`patron-status patron-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: IncidentSeverity;
}) {
  return (
    <span
      className={`severity-badge severity-${severity.toLowerCase()}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: IncidentStatus;
}) {
  return (
    <span
      className={`status-badge status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

/* ==========================================================
   NIGHTLEDGER 010
   App
   ========================================================== */

export default function App() {
  const [view, setView] =
    useState<View>("overview");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [incidentModalOpen, setIncidentModalOpen] =
    useState(false);

  const [flagModalOpen, setFlagModalOpen] =
    useState(false);

  const [selectedPatronId, setSelectedPatronId] =
    useState<string | null>(null);

  const [role, setRole] =
    useState<StaffRole>("Bartender");

  const [search, setSearch] =
    useState("");

  const [toast, setToast] =
    useState<string | null>(null);

  const [patrons, setPatrons] =
    useState<PatronRecord[]>(
      seedPatrons
    );

  const [flags, setFlags] =
    useState<PatronFlag[]>(
      seedFlags
    );

  const [incidents, setIncidents] =
    useState<Incident[]>(
      seedIncidents
    );

  const filteredIncidents =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return incidents;
      }

      return incidents.filter(
        (incident) =>
          [
            incident.id,
            incident.type,
            incident.patron,
            incident.staff,
            incident.summary,
            incident.reportNumber ??
              "",
          ].some((value) =>
            value
              .toLowerCase()
              .includes(q)
          )
      );
    }, [
      incidents,
      search,
    ]);

  const filteredPatrons =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return patrons;
      }

      return patrons.filter(
        (patron) =>
          [
            patron.id,
            patron.displayLabel,
            patron.observedName ??
              "",
            patron.descriptors,
            patron.notes,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(q)
          )
      );
    }, [
      patrons,
      search,
    ]);

  const selectedPatron =
    selectedPatronId
      ? patrons.find(
          (patron) =>
            patron.id ===
            selectedPatronId
        ) ?? null
      : null;

  function showToast(
    message: string
  ) {
    setToast(message);

    window.setTimeout(
      () =>
        setToast(null),
      2400
    );
  }

  function savePrototypeIncident(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nextNumber =
      43 +
      incidents.length -
      seedIncidents.length;

    const newIncident: Incident = {
      id:
        `INC-2026-${String(
          nextNumber
        ).padStart(4, "0")}`,
      occurredAt:
        "Sep 9 · 10:24 PM",
      type:
        "Staff-created prototype incident",
      severity:
        "Moderate",
      status:
        "Open",
      patron:
        "Unidentified patron",
      staff:
        `${role} demo user`,
      summary:
        "Prototype record created from the New Incident workflow.",
      policeCalled:
        false,
      correctiveAction:
        "Pending manager review.",
    };

    setIncidents(
      (current) => [
        newIncident,
        ...current,
      ]
    );

    setIncidentModalOpen(
      false
    );

    setView(
      "incidents"
    );

    showToast(
      "Incident saved to the prototype register."
    );
  }

  function savePrototypeFlag(
    data: {
      nameHint: string;
      nameSource: string;
      confidence: IdentityConfidence;
      reason: string;
      details: string;
      hasPhoto: boolean;
    }
  ) {
    const nextPatronNumber =
      48 +
      patrons.length -
      seedPatrons.length;

    const patronId =
      `PTR-${String(
        nextPatronNumber
      ).padStart(4, "0")}`;

    const displayLabel =
      data.nameHint.trim()
        ? `Possible name: ${data.nameHint.trim()}`
        : `Unknown Patron #${String(
            nextPatronNumber
          ).padStart(4, "0")}`;

    const newPatron: PatronRecord = {
      id:
        patronId,
      displayLabel,
      observedName:
        data.nameHint.trim() ||
        undefined,
      nameSource:
        data.nameSource.trim() ||
        undefined,
      identityConfidence:
        data.confidence,
      status:
        "Review",
      firstSeen:
        "Sep 9, 2026",
      lastSeen:
        "Sep 9, 2026",
      descriptors:
        "New record — descriptors pending manager review.",
      incidentCount:
        0,
      notes:
        "Created from a staff flag. Identity information is observational and must not be treated as verified unless separately confirmed.",
      photos:
        data.hasPhoto
          ? [
              {
                id:
                  `PH-DEMO-${nextPatronNumber}`,
                label:
                  "Staff upload",
                source:
                  `${role} flag`,
                capturedAt:
                  "Sep 9 · 10:24 PM",
                primary:
                  true,
              },
            ]
          : [],
    };

    const newFlag: PatronFlag = {
      id:
        `FLG-${String(
          98 +
            flags.length -
            seedFlags.length
        ).padStart(
          4,
          "0"
        )}`,
      createdAt:
        "Sep 9 · 10:24 PM",
      createdBy:
        `${role} demo user`,
      role,
      patronId,
      displayLabel,
      reason:
        data.reason,
      details:
        data.details,
      identityHint:
        data.nameHint.trim() ||
        undefined,
      identitySource:
        data.nameSource.trim() ||
        undefined,
      confidence:
        data.confidence,
      hasPhoto:
        data.hasPhoto,
      reviewStatus:
        "Pending",
    };

    setPatrons(
      (current) => [
        newPatron,
        ...current,
      ]
    );

    setFlags(
      (current) => [
        newFlag,
        ...current,
      ]
    );

    setFlagModalOpen(
      false
    );

    setSelectedPatronId(
      patronId
    );

    setView(
      "patrons"
    );

    showToast(
      "Patron flag created and queued for manager review."
    );
  }

  return (
    <div className="app-shell">
      {/* ====================================================
          NIGHTLEDGER 020 — sidebar
          ==================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck
              size={21}
            />
          </div>

          <div>
            <strong>
              NightLedger
            </strong>

            <span>
              by OneTime Labs
            </span>
          </div>
        </div>

        <div className="venue-card">
          <Building2
            size={17}
          />

          <div>
            <strong>
              Harbor House
            </strong>

            <span>
              Racine, Wisconsin
            </span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  className={
                    view ===
                    item.id
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setView(
                      item.id
                    );
                    setSidebarOpen(
                      false
                    );
                  }}
                >
                  <Icon
                    size={16}
                  />

                  {
                    item.label
                  }
                </button>
              );
            }
          )}
        </nav>

        <div className="sidebar-foot">
          <LockKeyhole
            size={13}
          />

          <span>
            Patron photos and incident
            records are private operational
            records — never public profiles.
          </span>
        </div>
      </aside>

      <button
        type="button"
        className={`mobile-backdrop ${
          sidebarOpen
            ? "show"
            : ""
        }`}
        onClick={() =>
          setSidebarOpen(
            false
          )
        }
        aria-label="Close menu"
      />

      {/* ====================================================
          NIGHTLEDGER 030 — top bar
          ==================================================== */}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
            >
              <Menu
                size={18}
              />
            </button>

            <div>
              <span className="eyebrow">
                LICENSED PREMISES
              </span>

              <h1>
                {
                  navItems.find(
                    (item) =>
                      item.id ===
                      view
                  )?.label
                }
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="role-select">
              <span>
                Acting as
              </span>

              <select
                value={
                  role
                }
                onChange={
                  (event) =>
                    setRole(
                      event
                        .target
                        .value as StaffRole
                    )
                }
              >
                <option>
                  Bartender
                </option>
                <option>
                  Security
                </option>
                <option>
                  Manager
                </option>
                <option>
                  Owner
                </option>
              </select>
            </div>

            <div className="global-search">
              <Search
                size={14}
              />

              <input
                value={
                  search
                }
                onChange={
                  (event) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                }
                placeholder="Search patrons, incidents, aliases..."
              />
            </div>

            <button
              type="button"
              className="secondary-action top-flag"
              onClick={() =>
                setFlagModalOpen(
                  true
                )
              }
            >
              <Flag
                size={14}
              />
              Flag Patron
            </button>

            <button
              type="button"
              className="primary-action"
              onClick={() =>
                setIncidentModalOpen(
                  true
                )
              }
            >
              <Plus
                size={15}
              />
              New Incident
            </button>
          </div>
        </header>

        <div className="prototype-strip">
          <strong>
            Prototype
          </strong>

          <span>
            Demo records only. NightLedger stores identity clues
            separately from verified identity and never treats a
            payment-card name as proof of who the patron is.
          </span>
        </div>

        <div className="content">
          {view ===
            "overview" && (
            <Overview
              role={
                role
              }
              patrons={
                patrons
              }
              flags={
                flags
              }
              incidents={
                incidents
              }
              onNewIncident={() =>
                setIncidentModalOpen(
                  true
                )
              }
              onFlagPatron={() =>
                setFlagModalOpen(
                  true
                )
              }
              onOpenPatrons={() =>
                setView(
                  "patrons"
                )
              }
              onOpenReports={() =>
                setView(
                  "reports"
                )
              }
            />
          )}

          {view ===
            "incidents" && (
            <IncidentsView
              incidents={
                filteredIncidents
              }
            />
          )}

          {view ===
            "patrons" && (
            <PatronsView
              patrons={
                filteredPatrons
              }
              selectedPatron={
                selectedPatron
              }
              onSelect={
                setSelectedPatronId
              }
              onCloseDetail={() =>
                setSelectedPatronId(
                  null
                )
              }
              onFlagPatron={() =>
                setFlagModalOpen(
                  true
                )
              }
            />
          )}

          {view ===
            "flags" && (
            <FlagsView
              flags={
                flags
              }
              role={
                role
              }
            />
          )}

          {view ===
            "shift" && (
            <ShiftLogView
              onToast={
                showToast
              }
            />
          )}

          {view ===
            "licensing" && (
            <LicensingView />
          )}

          {view ===
            "reports" && (
            <ReportsView
              onToast={
                showToast
              }
            />
          )}
        </div>
      </main>

      {incidentModalOpen && (
        <IncidentModal
          role={
            role
          }
          patrons={
            patrons
          }
          onClose={() =>
            setIncidentModalOpen(
              false
            )
          }
          onSubmit={
            savePrototypeIncident
          }
        />
      )}

      {flagModalOpen && (
        <FlagPatronModal
          role={
            role
          }
          onClose={() =>
            setFlagModalOpen(
              false
            )
          }
          onSave={
            savePrototypeFlag
          }
        />
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2
            size={16}
          />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   NIGHTLEDGER 100
   Overview
   ========================================================== */

function Overview({
  role,
  patrons,
  flags,
  incidents,
  onNewIncident,
  onFlagPatron,
  onOpenPatrons,
  onOpenReports,
}: {
  role: StaffRole;
  patrons: PatronRecord[];
  flags: PatronFlag[];
  incidents: Incident[];
  onNewIncident: () => void;
  onFlagPatron: () => void;
  onOpenPatrons: () => void;
  onOpenReports: () => void;
}) {
  const pendingFlags =
    flags.filter(
      (flag) =>
        flag.reviewStatus ===
        "Pending"
    ).length;

  const activeWatch =
    patrons.filter(
      (patron) =>
        patron.status ===
          "Watch" ||
        patron.status ===
          "Review"
    ).length;

  return (
    <>
      <section className="metric-grid">
        <article>
          <div className="metric-icon">
            <ShieldAlert
              size={18}
            />
          </div>

          <div>
            <span>
              Incidents / 30 days
            </span>
            <strong>
              {incidents.length +
                10}
            </strong>
            <small>
              3 required manager review
            </small>
          </div>
        </article>

        <article>
          <div className="metric-icon">
            <Flag
              size={18}
            />
          </div>

          <div>
            <span>
              Pending staff flags
            </span>
            <strong>
              {
                pendingFlags
              }
            </strong>
            <small>
              Bartender / security intake
            </small>
          </div>
        </article>

        <article>
          <div className="metric-icon">
            <UserRound
              size={18}
            />
          </div>

          <div>
            <span>
              Watch / review
            </span>
            <strong>
              {
                activeWatch
              }
            </strong>
            <small>
              Photo-linked patron records
            </small>
          </div>
        </article>

        <article>
          <div className="metric-icon">
            <BookOpenCheck
              size={18}
            />
          </div>

          <div>
            <span>
              Documentation
            </span>
            <strong className="good">
              Ready
            </strong>
            <small>
              Last packet: Aug 31
            </small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel recent-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">
                OPERATIONS
              </span>

              <h2>
                Recent Incidents
              </h2>
            </div>

            <button
              type="button"
              className="text-button"
            >
              View all
              <ChevronRight
                size={14}
              />
            </button>
          </header>

          <div className="incident-list">
            {incidents
              .slice(
                0,
                4
              )
              .map(
                (incident) => (
                  <div
                    className="incident-row"
                    key={
                      incident.id
                    }
                  >
                    <div className="incident-time">
                      <strong>
                        {
                          incident.occurredAt.split(
                            " · "
                          )[0]
                        }
                      </strong>

                      <span>
                        {
                          incident.occurredAt.split(
                            " · "
                          )[1]
                        }
                      </span>
                    </div>

                    <div className="incident-summary">
                      <strong>
                        {
                          incident.type
                        }
                      </strong>

                      <span>
                        {
                          incident.summary
                        }
                      </span>
                    </div>

                    <div className="incident-row-badges">
                      <SeverityBadge
                        severity={
                          incident.severity
                        }
                      />

                      <StatusBadge
                        status={
                          incident.status
                        }
                      />
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </div>
                )
              )}
          </div>
        </article>

        <aside className="dashboard-side">
          <article className="panel action-panel">
            <span className="eyebrow">
              QUICK ACTION
            </span>

            <h2>
              Staff sees something?
              Flag it immediately.
            </h2>

            <p>
              Bartenders and security can create a lightweight
              patron flag without having to complete a full
              incident report during a busy shift.
            </p>

            <button
              type="button"
              className="primary-action wide"
              onClick={
                onFlagPatron
              }
            >
              <Flag
                size={15}
              />
              Flag Patron as {
                role
              }
            </button>
          </article>

          <article className="panel identity-panel">
            <span className="eyebrow">
              IDENTITY MODEL
            </span>

            <h2>
              Evidence, not assumptions.
            </h2>

            <div className="identity-example">
              <CreditCard
                size={17}
              />

              <div>
                <strong>
                  “Daniel P.”
                </strong>

                <span>
                  Source: payment card / open tab
                </span>
              </div>

              <ConfidenceBadge
                confidence="Possible"
              />
            </div>

            <p>
              A card name is stored as an identity clue — never
              as confirmed identity. The card could belong to
              another person, be borrowed, or be stolen.
            </p>
          </article>
        </aside>
      </section>

      <section className="panel patron-preview">
        <header className="panel-header">
          <div>
            <span className="eyebrow">
              PATRON RECORDS
            </span>

            <h2>
              Visual Reference
            </h2>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={
              onOpenPatrons
            }
          >
            Open Patron Records
            <ChevronRight
              size={14}
            />
          </button>
        </header>

        <div className="patron-preview-grid">
          {patrons
            .slice(
              0,
              3
            )
            .map(
              (patron) => (
                <article
                  key={
                    patron.id
                  }
                >
                  <div className="photo-placeholder">
                    <UserRound
                      size={24}
                    />
                    <span>
                      {
                        patron.photos.length
                      } photos
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        patron.displayLabel
                      }
                    </strong>

                    <span>
                      {
                        patron.descriptors
                      }
                    </span>

                    <div className="inline-badges">
                      <PatronStatusBadge
                        status={
                          patron.status
                        }
                      />

                      <ConfidenceBadge
                        confidence={
                          patron.identityConfidence
                        }
                      />
                    </div>
                  </div>
                </article>
              )
            )}
        </div>
      </section>

      <section className="panel compliance-panel compliance-wide">
        <header className="panel-header compact">
          <div>
            <span className="eyebrow">
              LICENSING READINESS
            </span>

            <h2>
              Documentation Health
            </h2>
          </div>

          <span className="score">
            92%
          </span>
        </header>

        <div className="health-row">
          <div>
            <span>
              Open incidents
            </span>
            <strong>
              1
            </strong>
          </div>

          <div>
            <span>
              Pending staff flags
            </span>
            <strong>
              {
                pendingFlags
              }
            </strong>
          </div>

          <div>
            <span>
              Police / EMS references
            </span>
            <strong>
              Complete
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="secondary-action"
          onClick={
            onOpenReports
          }
        >
          <FileDown
            size={14}
          />
          Build Licensing Review Packet
        </button>

        <button
          type="button"
          className="secondary-action"
          onClick={
            onNewIncident
          }
        >
          <Plus
            size={14}
          />
          Full Incident Report
        </button>
      </section>
    </>
  );
}

/* ==========================================================
   NIGHTLEDGER 200
   Incidents
   ========================================================== */

function IncidentsView({
  incidents,
}: {
  incidents: Incident[];
}) {
  return (
    <section className="panel data-panel">
      <header className="panel-header">
        <div>
          <span className="eyebrow">
            INCIDENT REGISTER
          </span>

          <h2>
            Incident Reports
          </h2>
        </div>

        <div className="table-count">
          {
            incidents.length
          } shown
        </div>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                Report
              </th>
              <th>
                Occurred
              </th>
              <th>
                Type
              </th>
              <th>
                Patron
              </th>
              <th>
                Severity
              </th>
              <th>
                Police / EMS
              </th>
              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {incidents.map(
              (incident) => (
                <tr
                  key={
                    incident.id
                  }
                >
                  <td>
                    <strong className="mono">
                      {
                        incident.id
                      }
                    </strong>
                  </td>

                  <td>
                    {
                      incident.occurredAt
                    }
                  </td>

                  <td>
                    {
                      incident.type
                    }
                  </td>

                  <td>
                    {
                      incident.patron
                    }
                  </td>

                  <td>
                    <SeverityBadge
                      severity={
                        incident.severity
                      }
                    />
                  </td>

                  <td>
                    {
                      incident.policeCalled
                        ? incident.reportNumber ||
                          "Called"
                        : "No"
                    }
                  </td>

                  <td>
                    <StatusBadge
                      status={
                        incident.status
                      }
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {incidents.length ===
        0 && (
        <div className="empty-state">
          <Search
            size={25}
          />

          <strong>
            No matching incidents
          </strong>

          <span>
            Try another search.
          </span>
        </div>
      )}
    </section>
  );
}

/* ==========================================================
   NIGHTLEDGER 300
   Patron records
   ========================================================== */

function PatronsView({
  patrons,
  selectedPatron,
  onSelect,
  onCloseDetail,
  onFlagPatron,
}: {
  patrons: PatronRecord[];
  selectedPatron: PatronRecord | null;
  onSelect: (
    patronId: string
  ) => void;
  onCloseDetail: () => void;
  onFlagPatron: () => void;
}) {
  return (
    <section className="patron-layout">
      <article className="panel data-panel">
        <header className="panel-header">
          <div>
            <span className="eyebrow">
              PRIVATE OPERATIONAL RECORDS
            </span>

            <h2>
              Patron Records
            </h2>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={
              onFlagPatron
            }
          >
            <Flag
              size={14}
            />
            Flag New Patron
          </button>
        </header>

        <div className="patron-grid">
          {patrons.map(
            (patron) => (
              <button
                type="button"
                className={`patron-card ${
                  selectedPatron?.id ===
                  patron.id
                    ? "selected"
                    : ""
                }`}
                key={
                  patron.id
                }
                onClick={() =>
                  onSelect(
                    patron.id
                  )
                }
              >
                <div className="patron-photo">
                  <UserRound
                    size={28}
                  />

                  <span>
                    {
                      patron.photos.length
                    } photo{
                      patron.photos.length ===
                      1
                        ? ""
                        : "s"
                    }
                  </span>
                </div>

                <div className="patron-card-body">
                  <div className="patron-title-row">
                    <strong>
                      {
                        patron.displayLabel
                      }
                    </strong>

                    <PatronStatusBadge
                      status={
                        patron.status
                      }
                    />
                  </div>

                  <span className="patron-id">
                    {
                      patron.id
                    }
                  </span>

                  {patron.observedName && (
                    <div className="identity-line">
                      <CreditCard
                        size={13}
                      />

                      <span>
                        Observed name:
                        {" "}
                        <strong>
                          {
                            patron.observedName
                          }
                        </strong>
                      </span>

                      <ConfidenceBadge
                        confidence={
                          patron.identityConfidence
                        }
                      />
                    </div>
                  )}

                  <p>
                    {
                      patron.descriptors
                    }
                  </p>

                  <div className="patron-meta">
                    <span>
                      First seen:
                      {" "}
                      {
                        patron.firstSeen
                      }
                    </span>

                    <span>
                      {
                        patron.incidentCount
                      } linked incident{
                        patron.incidentCount ===
                        1
                          ? ""
                          : "s"
                      }
                    </span>
                  </div>
                </div>
              </button>
            )
          )}
        </div>
      </article>

      {selectedPatron && (
        <PatronDetail
          patron={
            selectedPatron
          }
          onClose={
            onCloseDetail
          }
        />
      )}
    </section>
  );
}

function PatronDetail({
  patron,
  onClose,
}: {
  patron: PatronRecord;
  onClose: () => void;
}) {
  return (
    <aside className="panel patron-detail">
      <header>
        <div>
          <span className="eyebrow">
            {
              patron.id
            }
          </span>

          <h2>
            {
              patron.displayLabel
            }
          </h2>
        </div>

        <button
          type="button"
          className="icon-button show"
          onClick={
            onClose
          }
        >
          <X
            size={16}
          />
        </button>
      </header>

      <div className="photo-gallery">
        {patron.photos.length >
        0 ? (
          patron.photos.map(
            (photo) => (
              <div
                className="gallery-photo"
                key={
                  photo.id
                }
              >
                <ImageIcon
                  size={24}
                />

                <strong>
                  {
                    photo.label
                  }
                </strong>

                <span>
                  {
                    photo.source
                  }
                </span>

                <small>
                  {
                    photo.capturedAt
                  }
                </small>
              </div>
            )
          )
        ) : (
          <div className="no-photo">
            <Camera
              size={24}
            />

            No photos attached
          </div>
        )}
      </div>

      <section className="detail-section">
        <span className="detail-label">
          Identity
        </span>

        {patron.observedName ? (
          <>
            <div className="detail-value-row">
              <strong>
                {
                  patron.observedName
                }
              </strong>

              <ConfidenceBadge
                confidence={
                  patron.identityConfidence
                }
              />
            </div>

            <p>
              Source:
              {" "}
              {
                patron.nameSource
              }
            </p>
          </>
        ) : (
          <p>
            No identity information available.
          </p>
        )}

        <div className="identity-warning">
          <AlertTriangle
            size={14}
          />

          <span>
            Observed names are clues, not proof. A payment card,
            tab name, verbal name, or third-party statement may
            be incorrect.
          </span>
        </div>
      </section>

      <section className="detail-section">
        <span className="detail-label">
          Record
        </span>

        <dl className="detail-list">
          <div>
            <dt>
              Status
            </dt>
            <dd>
              <PatronStatusBadge
                status={
                  patron.status
                }
              />
            </dd>
          </div>

          <div>
            <dt>
              First seen
            </dt>
            <dd>
              {
                patron.firstSeen
              }
            </dd>
          </div>

          <div>
            <dt>
              Last seen
            </dt>
            <dd>
              {
                patron.lastSeen
              }
            </dd>
          </div>

          <div>
            <dt>
              Incidents
            </dt>
            <dd>
              {
                patron.incidentCount
              }
            </dd>
          </div>

          {patron.activeBan && (
            <div>
              <dt>
                Active ban
              </dt>
              <dd>
                {
                  patron.activeBan
                }
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="detail-section">
        <span className="detail-label">
          Descriptors
        </span>

        <p>
          {
            patron.descriptors
          }
        </p>
      </section>

      <section className="detail-section">
        <span className="detail-label">
          Internal notes
        </span>

        <p>
          {
            patron.notes
          }
        </p>
      </section>
    </aside>
  );
}

/* ==========================================================
   NIGHTLEDGER 400
   Staff flags
   ========================================================== */

function FlagsView({
  flags,
  role,
}: {
  flags: PatronFlag[];
  role: StaffRole;
}) {
  return (
    <section className="panel data-panel">
      <header className="panel-header">
        <div>
          <span className="eyebrow">
            FRONTLINE INTAKE
          </span>

          <h2>
            Staff Flags
          </h2>
        </div>

        <div className="table-count">
          Acting as {
            role
          }
        </div>
      </header>

      <div className="flag-list">
        {flags.map(
          (flag) => (
            <article
              key={
                flag.id
              }
              className="flag-row"
            >
              <div className="flag-icon">
                <Flag
                  size={16}
                />
              </div>

              <div>
                <div className="flag-title">
                  <strong>
                    {
                      flag.displayLabel
                    }
                  </strong>

                  <span>
                    {
                      flag.id
                    }
                  </span>
                </div>

                <p>
                  {
                    flag.details
                  }
                </p>

                <div className="flag-meta">
                  <span>
                    {
                      flag.createdAt
                    }
                  </span>

                  <span>
                    {
                      flag.createdBy
                    } · {
                      flag.role
                    }
                  </span>

                  {flag.hasPhoto && (
                    <span>
                      <Camera
                        size={11}
                      />
                      photo
                    </span>
                  )}

                  {flag.identityHint && (
                    <span>
                      <CreditCard
                        size={11}
                      />
                      {
                        flag.identityHint
                      }
                    </span>
                  )}

                  <ConfidenceBadge
                    confidence={
                      flag.confidence
                    }
                  />
                </div>
              </div>

              <div className="flag-review">
                <span
                  className={`review-state ${flag.reviewStatus.toLowerCase()}`}
                >
                  {
                    flag.reviewStatus
                  }
                </span>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}

/* ==========================================================
   NIGHTLEDGER 500
   Shift log
   ========================================================== */

function ShiftLogView({
  onToast,
}: {
  onToast: (
    message: string
  ) => void;
}) {
  return (
    <section className="shift-layout">
      <article className="panel">
        <header className="panel-header">
          <div>
            <span className="eyebrow">
              TEAM HANDOFF
            </span>

            <h2>
              Shift Log
            </h2>
          </div>
        </header>

        <div className="timeline shift-timeline">
          {shiftNotes.map(
            (note) => (
              <div
                className="timeline-row"
                key={`${note.time}-${note.author}`}
              >
                <span
                  className={`timeline-dot ${note.kind}`}
                />

                <time>
                  {
                    note.time
                  }
                </time>

                <div>
                  <strong>
                    {
                      note.author
                    }
                  </strong>

                  <p>
                    {
                      note.text
                    }
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </article>

      <aside className="panel shift-entry">
        <span className="eyebrow">
          NEW HANDOFF NOTE
        </span>

        <h2>
          Add to Shift Log
        </h2>

        <label>
          Note type
        </label>

        <select>
          <option>
            Handoff
          </option>
          <option>
            Security
          </option>
          <option>
            Management
          </option>
        </select>

        <label>
          Note
        </label>

        <textarea
          placeholder="What should the next shift know?"
        />

        <button
          type="button"
          className="primary-action wide"
          onClick={() =>
            onToast(
              "Shift note added."
            )
          }
        >
          Add Shift Note
        </button>
      </aside>
    </section>
  );
}

/* ==========================================================
   NIGHTLEDGER 600
   Licensing
   ========================================================== */

function LicensingView() {
  return (
    <section className="licensing-layout">
      <article className="panel">
        <header className="panel-header">
          <div>
            <span className="eyebrow">
              LICENSED PREMISES HISTORY
            </span>

            <h2>
              Licensing &amp; Regulatory Record
            </h2>
          </div>
        </header>

        <div className="license-timeline">
          <div>
            <span className="license-dot good" />
            <time>
              Aug 31, 2026
            </time>
            <section>
              <strong>
                Monthly compliance packet archived
              </strong>
              <p>
                Incident summary, police-reference log,
                corrective actions, and manager attestations.
              </p>
            </section>
          </div>

          <div>
            <span className="license-dot" />
            <time>
              Jul 18, 2026
            </time>
            <section>
              <strong>
                Good Neighbor meeting notes
              </strong>
              <p>
                Exterior noise controls and closing-time
                sidewalk monitoring reviewed.
              </p>
            </section>
          </div>

          <div>
            <span className="license-dot warning" />
            <time>
              Jun 29, 2026
            </time>
            <section>
              <strong>
                Formal concern received
              </strong>
              <p>
                Management response and corrective-action plan
                attached to record.
              </p>
            </section>
          </div>
        </div>
      </article>

      <aside className="panel">
        <span className="eyebrow">
          DOCUMENTATION
        </span>

        <h2>
          Venue Readiness
        </h2>

        <div className="readiness-list">
          <div>
            <CheckCircle2
              size={16}
            />
            Incident reports current
          </div>

          <div>
            <CheckCircle2
              size={16}
            />
            Police references attached
          </div>

          <div>
            <CheckCircle2
              size={16}
            />
            Corrective actions documented
          </div>

          <div>
            <AlertTriangle
              size={16}
            />
            1 manager review outstanding
          </div>
        </div>
      </aside>
    </section>
  );
}

/* ==========================================================
   NIGHTLEDGER 700
   Reports
   ========================================================== */

function ReportsView({
  onToast,
}: {
  onToast: (
    message: string
  ) => void;
}) {
  return (
    <>
      <section className="panel reports-hero">
        <div>
          <span className="eyebrow">
            EXPORT CENTER
          </span>

          <h2>
            Build the record before you need it.
          </h2>

          <p>
            Generate an operational packet for management,
            insurance, legal review, licensing meetings, or
            law-enforcement follow-up.
          </p>
        </div>

        <FileDown
          size={52}
        />
      </section>

      <section className="report-grid">
        <ReportCard
          icon={
            <FileText
              size={19}
            />
          }
          title="Licensing Review Packet"
          description="Incident history, police references, corrective actions, active bans, staff flags, and manager review status."
          onClick={() =>
            onToast(
              "Licensing Review Packet generated."
            )
          }
        />

        <ReportCard
          icon={
            <BarChart3
              size={19}
            />
          }
          title="Incident Summary"
          description="Counts and trends by incident type, severity, response, and disposition."
          onClick={() =>
            onToast(
              "Incident Summary generated."
            )
          }
        />

        <ReportCard
          icon={
            <Users
              size={19}
            />
          }
          title="Patron Watch Register"
          description="Current watch, review, and ban records with linked incident history."
          onClick={() =>
            onToast(
              "Patron Watch Register generated."
            )
          }
        />

        <ReportCard
          icon={
            <History
              size={19}
            />
          }
          title="Staff Flag Audit"
          description="Frontline reports with timestamps, role, review status, and linked patron records."
          onClick={() =>
            onToast(
              "Staff Flag Audit generated."
            )
          }
        />
      </section>
    </>
  );
}

function ReportCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <article className="panel report-card">
      <div className="report-icon">
        {
          icon
        }
      </div>

      <strong>
        {
          title
        }
      </strong>

      <p>
        {
          description
        }
      </p>

      <button
        type="button"
        className="secondary-action"
        onClick={
          onClick
        }
      >
        <FileDown
          size={14}
        />
        Generate
      </button>
    </article>
  );
}

/* ==========================================================
   NIGHTLEDGER 800
   New incident modal
   ========================================================== */

function IncidentModal({
  role,
  patrons,
  onClose,
  onSubmit,
}: {
  role: StaffRole;
  patrons: PatronRecord[];
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="modal"
        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >
        <header>
          <div>
            <span className="eyebrow">
              INCIDENT INTAKE · {
                role.toUpperCase()
              }
            </span>

            <h2>
              New Incident Report
            </h2>

            <p>
              Capture objective facts, response, and corrective
              action. Identity clues remain separate from
              verified identity.
            </p>
          </div>

          <button
            type="button"
            className="icon-button show"
            onClick={
              onClose
            }
          >
            <X
              size={17}
            />
          </button>
        </header>

        <form
          onSubmit={
            onSubmit
          }
        >
          <div className="form-grid two">
            <label>
              Incident type
              <select required>
                <option value="">
                  Select type
                </option>
                <option>
                  Fight / disturbance
                </option>
                <option>
                  Refusal to leave
                </option>
                <option>
                  Intoxicated patron
                </option>
                <option>
                  Threat / harassment
                </option>
                <option>
                  Property damage
                </option>
                <option>
                  Medical
                </option>
                <option>
                  Noise complaint
                </option>
                <option>
                  Suspected drug activity
                </option>
                <option>
                  Other
                </option>
              </select>
            </label>

            <label>
              Severity
              <select required>
                <option>
                  Low
                </option>
                <option>
                  Moderate
                </option>
                <option>
                  High
                </option>
                <option>
                  Critical
                </option>
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                defaultValue="2026-09-09"
                required
              />
            </label>

            <label>
              Time
              <input
                type="time"
                defaultValue="22:24"
                required
              />
            </label>
          </div>

          <label>
            Link patron record
            <select>
              <option>
                No patron selected
              </option>

              {patrons.map(
                (patron) => (
                  <option
                    key={
                      patron.id
                    }
                  >
                    {
                      patron.displayLabel
                    } · {
                      patron.id
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Staff involved
            <input
              placeholder="Names of staff / security involved"
            />
          </label>

          <label>
            What happened?
            <textarea
              placeholder="Objective summary of what staff observed and what occurred..."
              required
            />
          </label>

          <div className="form-grid two">
            <label>
              Police / EMS response
              <select>
                <option>
                  No
                </option>
                <option>
                  Police
                </option>
                <option>
                  EMS
                </option>
                <option>
                  Police + EMS
                </option>
              </select>
            </label>

            <label>
              Report / case number
              <input
                placeholder="If available"
              />
            </label>
          </div>

          <label>
            Corrective action taken
            <textarea
              placeholder="Service refused, patron removed, ban issued, footage retained, staff coaching, policy change, etc."
            />
          </label>

          <div className="attachment-row">
            <button
              type="button"
              className="secondary-action"
            >
              <Camera
                size={14}
              />
              Add Photo / Evidence
            </button>

            <span>
              Photos, video references, receipts, and witness statements
            </span>
          </div>

          <footer>
            <button
              type="button"
              className="secondary-action"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-action"
            >
              Save Incident
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

/* ==========================================================
   NIGHTLEDGER 900
   Flag patron modal
   ========================================================== */

function FlagPatronModal({
  role,
  onClose,
  onSave,
}: {
  role: StaffRole;
  onClose: () => void;
  onSave: (
    data: {
      nameHint: string;
      nameSource: string;
      confidence: IdentityConfidence;
      reason: string;
      details: string;
      hasPhoto: boolean;
    }
  ) => void;
}) {
  const [
    nameHint,
    setNameHint,
  ] =
    useState("");

  const [
    nameSource,
    setNameSource,
  ] =
    useState(
      "Name displayed on payment card / open tab"
    );

  const [
    confidence,
    setConfidence,
  ] =
    useState<IdentityConfidence>(
      "Possible"
    );

  const [
    reason,
    setReason,
  ] =
    useState(
      "Behavior concern"
    );

  const [
    details,
    setDetails,
  ] =
    useState("");

  const [
    hasPhoto,
    setHasPhoto,
  ] =
    useState(true);

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onSave({
      nameHint,
      nameSource,
      confidence,
      reason,
      details:
        details.trim() ||
        "Frontline staff flag created for manager review.",
      hasPhoto,
    });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="modal flag-modal"
        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >
        <header>
          <div>
            <span className="eyebrow">
              QUICK FLAG · {
                role.toUpperCase()
              }
            </span>

            <h2>
              Flag a Patron
            </h2>

            <p>
              Designed for busy frontline staff. Capture enough
              information to recognize and review the patron later.
            </p>
          </div>

          <button
            type="button"
            className="icon-button show"
            onClick={
              onClose
            }
          >
            <X
              size={17}
            />
          </button>
        </header>

        <form
          onSubmit={
            submit
          }
        >
          <div className="flag-callout">
            <Camera
              size={18}
            />

            <div>
              <strong>
                Photo-first is okay.
              </strong>

              <span>
                You do not need to know the patron's name to create
                a record.
              </span>
            </div>
          </div>

          <label>
            Reason for flag
            <select
              value={
                reason
              }
              onChange={
                (event) =>
                  setReason(
                    event
                      .target
                      .value
                  )
              }
            >
              <option>
                Behavior concern
              </option>
              <option>
                Refusal to leave
              </option>
              <option>
                Harassment
              </option>
              <option>
                Fight / threat
              </option>
              <option>
                Suspected theft
              </option>
              <option>
                Property damage
              </option>
              <option>
                Repeated intoxication issue
              </option>
              <option>
                Other
              </option>
            </select>
          </label>

          <label>
            What happened?
            <textarea
              value={
                details
              }
              onChange={
                (event) =>
                  setDetails(
                    event
                      .target
                      .value
                  )
              }
              placeholder="Short factual note for the manager and next shift..."
            />
          </label>

          <div className="photo-toggle">
            <div>
              <Camera
                size={16}
              />

              <span>
                Attach patron photo
              </span>
            </div>

            <button
              type="button"
              className={
                hasPhoto
                  ? "toggle active"
                  : "toggle"
              }
              onClick={() =>
                setHasPhoto(
                  (value) =>
                    !value
                )
              }
            >
              {
                hasPhoto
                  ? "PHOTO ATTACHED"
                  : "NO PHOTO"
              }
            </button>
          </div>

          <div className="identity-divider">
            <span>
              Optional identity clues
            </span>
          </div>

          <div className="identity-help">
            <CreditCard
              size={16}
            />

            <p>
              If the patron opened a tab, staff may have an observed
              cardholder name. Record it as a clue only. Do not store
              the full card number, CVV, magnetic-stripe data, or a
              photo of the card.
            </p>
          </div>

          <div className="form-grid two">
            <label>
              Observed / possible name
              <input
                value={
                  nameHint
                }
                onChange={
                  (event) =>
                    setNameHint(
                      event
                        .target
                        .value
                    )
                }
                placeholder="Example: Daniel P."
              />
            </label>

            <label>
              Identity confidence
              <select
                value={
                  confidence
                }
                onChange={
                  (event) =>
                    setConfidence(
                      event
                        .target
                        .value as IdentityConfidence
                    )
                }
              >
                <option>
                  Unknown
                </option>
                <option>
                  Possible
                </option>
                <option>
                  Likely
                </option>
                <option>
                  Confirmed
                </option>
              </select>
            </label>
          </div>

          <label>
            Name source
            <select
              value={
                nameSource
              }
              onChange={
                (event) =>
                  setNameSource(
                    event
                      .target
                      .value
                  )
              }
            >
              <option>
                Name displayed on payment card / open tab
              </option>
              <option>
                Patron stated name verbally
              </option>
              <option>
                Staff recognized patron
              </option>
              <option>
                Name provided by another guest
              </option>
              <option>
                Government ID checked by staff
              </option>
              <option>
                Other
              </option>
            </select>
          </label>

          <div className="identity-warning large">
            <AlertTriangle
              size={15}
            />

            <span>
              Even a cardholder name may belong to someone else.
              The card could be borrowed, shared, or stolen.
              NightLedger keeps the name source and confidence
              visible so staff do not silently turn a clue into a fact.
            </span>
          </div>

          <footer>
            <button
              type="button"
              className="secondary-action"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-action"
            >
              <Flag
                size={14}
              />
              Create Staff Flag
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
