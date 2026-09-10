import { supabase } from "./supabase.js";

/* ==========================================================
   AUTH
   ========================================================== */

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUp(email, password) {
  const emailRedirectTo =
    `${window.location.origin}/admin?auth=confirmed`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function completeAuthRedirect() {
  /*
   * Supabase's normal browser confirmation flow is handled by
   * detectSessionInUrl in src/lib/supabase.js.
   *
   * This helper also supports a ?code= callback if the project is
   * ever switched to a code-based auth flow.
   */
  const url =
    new URL(
      window.location.href
    );

  const code =
    url.searchParams.get(
      "code"
    );

  if (
    code
  ) {
    const {
      error,
    } =
      await supabase
        .auth
        .exchangeCodeForSession(
          code
        );

    if (
      error
    ) {
      throw error;
    }

    url.searchParams.delete(
      "code"
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }
}

export function cleanAuthCallbackUrl() {
  const url =
    new URL(
      window.location.href
    );

  let changed =
    false;

  [
    "auth",
    "type",
    "token_hash",
  ].forEach(
    (
      key
    ) => {
      if (
        url.searchParams.has(
          key
        )
      ) {
        url.searchParams.delete(
          key
        );

        changed =
          true;
      }
    }
  );

  if (
    changed
  ) {
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/* ==========================================================
   USER / VENUE CONTEXT
   ========================================================== */

export async function getMyContext() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("nl_memberships")
    .select(`
      id,
      role,
      active,
      venue_id,
      nl_venues (
        id,
        name,
        timezone,
        organization_id,
        nl_organizations (
          id,
          name
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      user,
      membership: null,
      venue: null,
      organization: null,
    };
  }

  return {
    user,
    membership: {
      id: data.id,
      role: data.role,
      active: data.active,
      venue_id: data.venue_id,
    },
    venue: data.nl_venues,
    organization: data.nl_venues?.nl_organizations || null,
  };
}

export async function bootstrapVenue({
  organizationName,
  venueName,
  displayName,
}) {
  const { data, error } = await supabase.rpc("nl_bootstrap_owner", {
    p_org_name: organizationName,
    p_venue_name: venueName,
    p_display_name: displayName || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function acceptInvite(code) {
  const { data, error } = await supabase.rpc("nl_accept_invite", {
    p_code: code.trim().toUpperCase(),
  });

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   AUTHENTICATED FRONTLINE CAPTURE
   ========================================================== */

export async function createHold(venueId, clientEventId) {
  const { data, error } = await supabase.rpc("nl_create_hold", {
    p_venue_id: venueId,
    p_client_event_id: clientEventId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function classifyEvent({
  eventId,
  eventType,
  angelShotType = null,
}) {
  const { data, error } = await supabase.rpc("nl_classify_event", {
    p_event_id: eventId,
    p_event_type: eventType,
    p_angel_shot_type: angelShotType,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function saveQuickDetails({
  eventId,
  quickNote,
  possibleName,
  locationNote,
}) {
  const { data, error } = await supabase.rpc("nl_update_event_quick", {
    p_event_id: eventId,
    p_quick_note: quickNote || null,
    p_possible_name: possibleName || null,
    p_location_note: locationNote || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function finishEvent(eventId) {
  const { data, error } = await supabase.rpc("nl_finish_event", {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   NO-LOGIN / ENROLLED DEVICE CAPTURE
   ========================================================== */

export async function getGuestCaptureContext(deviceToken) {
  const { data, error } = await supabase.rpc(
    "nl_guest_capture_context",
    {
      p_device_token: deviceToken,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function createCaptureDevice({
  venueId,
  label,
}) {
  const { data, error } = await supabase.rpc(
    "nl_create_capture_device",
    {
      p_venue_id: venueId,
      p_label: label,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function listCaptureDevices(venueId) {
  const { data, error } = await supabase
    .from("nl_capture_devices")
    .select(`
      id,
      venue_id,
      label,
      token_prefix,
      active,
      last_seen_at,
      created_at
    `)
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function guestCreateHold({
  deviceToken,
  clientEventId,
  clientEventAt,
}) {
  const { data, error } = await supabase.rpc(
    "nl_guest_create_hold",
    {
      p_device_token: deviceToken,
      p_client_event_id: clientEventId,
      p_client_event_at: clientEventAt,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function guestClassifyEvent({
  deviceToken,
  eventId,
  eventType,
  angelShotType = null,
}) {
  const { data, error } = await supabase.rpc(
    "nl_guest_classify_event",
    {
      p_device_token: deviceToken,
      p_event_id: eventId,
      p_event_type: eventType,
      p_angel_shot_type: angelShotType,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function guestUpdateEventQuick({
  deviceToken,
  eventId,
  quickNote,
  possibleName,
  locationNote,
}) {
  const { data, error } = await supabase.rpc(
    "nl_guest_update_event_quick",
    {
      p_device_token: deviceToken,
      p_event_id: eventId,
      p_quick_note: quickNote || null,
      p_possible_name: possibleName || null,
      p_location_note: locationNote || null,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function guestFinishEvent({
  deviceToken,
  eventId,
}) {
  const { data, error } = await supabase.rpc(
    "nl_guest_finish_event",
    {
      p_device_token: deviceToken,
      p_event_id: eventId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   ANGEL SHOT SETTINGS
   ========================================================== */

export async function getAngelShotTypes(venueId) {
  const { data, error } = await supabase
    .from("nl_angel_shot_types")
    .select(`
      id,
      code,
      label,
      description,
      response_note,
      sort_order
    `)
    .eq("venue_id", venueId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function listAngelShotSettings(venueId) {
  return getAngelShotTypes(venueId);
}

export async function saveAngelShotSetting(row) {
  const { data, error } = await supabase
    .from("nl_angel_shot_types")
    .update({
      label: row.label,
      description: row.description || null,
      response_note: row.response_note || null,
      active: row.active,
    })
    .eq("id", row.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   PHOTOS
   ========================================================== */

export async function compressImage(
  file,
  maxDimension = 1600,
  quality = 0.82,
) {
  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > height && width > maxDimension) {
    height = Math.round(height * (maxDimension / width));
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.round(width * (maxDimension / height));
    height = maxDimension;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process image.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not compress image."));
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function uploadEventPhoto({
  event,
  file,
  subjectRole = "unknown",
}) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("You are not signed in.");
  }

  const blob = await compressImage(file);
  const fileId = crypto.randomUUID();

  const path =
    `${event.venue_id}/${event.id}/${user.id}/${Date.now()}-${fileId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("nightledger-private")
    .upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("nl_event_photos")
    .insert({
      event_id: event.id,
      venue_id: event.venue_id,
      uploaded_by: user.id,
      storage_path: path,
      event_at: event.event_at,
      subject_role: subjectRole,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage
      .from("nightledger-private")
      .remove([path]);

    throw error;
  }

  return data;
}

export async function getSignedPhotoUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from("nightledger-private")
    .createSignedUrl(storagePath, 3600);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/* ==========================================================
   ADMIN EVENTS
   ========================================================== */

export async function listEvents(
  venueId,
  limit = 100,
) {
  const { data, error } = await supabase
    .from("nl_events")
    .select(`
      *,
      nl_user_profiles!nl_events_created_by_fkey (
        display_name
      ),
      nl_capture_devices (
        id,
        label
      ),
      nl_event_photos (
        id,
        storage_path,
        subject_role,
        attached_at
      )
    `)
    .eq("venue_id", venueId)
    .order("event_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getEvent(eventId) {
  const { data, error } = await supabase
    .from("nl_events")
    .select(`
      *,
      nl_user_profiles!nl_events_created_by_fkey (
        display_name
      ),
      nl_capture_devices (
        id,
        label
      ),
      nl_event_actions (
        id,
        action_type,
        action_data,
        occurred_at
      ),
      nl_event_photos (
        id,
        storage_path,
        subject_role,
        caption,
        attached_at
      ),
      nl_event_reviews (*),
      nl_event_patrons (
        relationship,
        nl_patrons (*)
      )
    `)
    .eq("id", eventId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveEventReview({
  event,
  form,
}) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("You are not signed in.");
  }

  const payload = {
    event_id: event.id,
    venue_id: event.venue_id,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    incident_summary: form.incident_summary || null,
    outcome: form.outcome || null,
    help_requester_description:
      form.help_requester_description || null,
    person_of_concern_description:
      form.person_of_concern_description || null,
    identity_clue: form.identity_clue || null,
    identity_source: form.identity_source || null,
    identity_confidence:
      form.identity_confidence || "unknown",
    witnesses: form.witnesses || null,
    security_involved:
      Boolean(form.security_involved),
    service_refused:
      Boolean(form.service_refused),
    patron_removed:
      Boolean(form.patron_removed),
    police_contacted:
      Boolean(form.police_contacted),
    police_report_number:
      form.police_report_number || null,
    ems_contacted:
      Boolean(form.ems_contacted),
    cctv_available:
      Boolean(form.cctv_available),
    cctv_reference:
      form.cctv_reference || null,
    trespass_notice:
      Boolean(form.trespass_notice),
    venue_ban:
      Boolean(form.venue_ban),
    corrective_actions:
      form.corrective_actions || null,
    follow_up_required:
      Boolean(form.follow_up_required),
    manager_notes:
      form.manager_notes || null,
  };

  const { data, error } = await supabase
    .from("nl_event_reviews")
    .upsert(payload, {
      onConflict: "event_id",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const { error: eventError } = await supabase
    .from("nl_events")
    .update({
      review_status: "reviewed",
    })
    .eq("id", event.id);

  if (eventError) {
    throw eventError;
  }

  return data;
}

/* ==========================================================
   PATRONS / BANS
   ========================================================== */

export async function listPatrons(venueId) {
  const { data, error } = await supabase
    .from("nl_patrons")
    .select("*")
    .eq("venue_id", venueId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createPatron({
  venueId,
  displayName,
  possibleName,
  identityConfidence,
  descriptors,
  status = "watch",
}) {
  const { data, error } = await supabase
    .from("nl_patrons")
    .insert({
      venue_id: venueId,
      display_name:
        displayName || "Unknown Patron",
      possible_name:
        possibleName || null,
      identity_confidence:
        identityConfidence || "unknown",
      descriptors:
        descriptors || null,
      status,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function linkPatronToEvent({
  eventId,
  patronId,
  venueId,
  relationship,
}) {
  const { error } = await supabase
    .from("nl_event_patrons")
    .upsert(
      {
        event_id: eventId,
        patron_id: patronId,
        venue_id: venueId,
        relationship,
      },
      {
        onConflict:
          "event_id,patron_id",
      },
    );

  if (error) {
    throw error;
  }
}

export async function listBans(venueId) {
  const { data, error } = await supabase
    .from("nl_bans")
    .select(`
      *,
      nl_patrons (
        id,
        display_name,
        possible_name
      )
    `)
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createBan({
  venueId,
  patronId,
  eventId,
  reason,
  endsAt,
}) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("You are not signed in.");
  }

  const { data, error } = await supabase
    .from("nl_bans")
    .insert({
      venue_id: venueId,
      patron_id: patronId,
      event_id: eventId || null,
      reason,
      ends_at: endsAt || null,
      active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ==========================================================
   STAFF / INVITES
   ========================================================== */

export async function listStaff(venueId) {
  const { data, error } = await supabase
    .from("nl_memberships")
    .select(`
      id,
      role,
      active,
      created_at,
      user_id,
      nl_user_profiles (
        display_name
      )
    `)
    .eq("venue_id", venueId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createInvite({
  venueId,
  role,
  expiresHours = 72,
}) {
  const { data, error } = await supabase.rpc(
    "nl_create_invite",
    {
      p_venue_id: venueId,
      p_role: role,
      p_expires_hours: expiresHours,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function listInvites(venueId) {
  const { data, error } = await supabase
    .from("nl_staff_invites")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/* ==========================================================
   AUDIT
   ========================================================== */

export async function listAudit(
  venueId,
  limit = 200,
) {
  const { data, error } = await supabase
    .from("nl_audit_log")
    .select(`
      id,
      entity_type,
      entity_id,
      action,
      details,
      created_at,
      actor_user_id
    `)
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/* ==========================================================
   REALTIME
   ========================================================== */

export function subscribeToEvents(
  venueId,
  callback,
) {
  const channel = supabase
    .channel(
      `nightledger-events-${venueId}`,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "nl_events",
        filter:
          `venue_id=eq.${venueId}`,
      },
      callback,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(
      channel,
    );
  };
}
