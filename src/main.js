import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const BUCKET = "pookies-media";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    })
  : null;

const fallbackMemories = [
  ["first-vc", "14 October", "14 OCT", "Our first video call", "The beginning of seeing each other and talking. A little screen, a very big start.", ["first-vc"]],
  ["almost-hour-call", "15 October", "15 OCT", "The almost-one-hour call", "A call that made time disappear. We had so much to say and somehow it still wasn't enough.", ["almost-hour-call"]],
  ["first-meet", "21 October", "21 OCT", "The pink helmet & chaat", "Our first meeting, the iconic pink helmet, and a chaat date I'll always remember.", ["first-meet", "chaat-date"]],
  ["biryani-date", "23 October", "23 OCT", "Biryani date", "Our biryani chapter, complete with the inside joke that stays ours.", ["biryani-date"]],
  ["proposal", "27 October", "27 OCT", "The question in Shillong", "You were in Shillong. You asked, and I said YES. The day our story became ours.", ["proposal"]],
  ["sunset-date", "27 October", "27 OCT", "The redo & the sunset", "A redo date, a sunset, and the lovely feeling that this was only the beginning.", ["sunset-date"]],
  ["soft-launch", "29 October", "29 OCT", "A perfectly planned date", "A cute planned date, and my very first soft launch.", ["soft-launch"]],
  ["rapido-premium", "31 October", "31 OCT", "Rapido Premium", "My personal college-drop and date partner. The sweetest kind of everyday care.", ["rapido-premium"]],
  ["zilpi-date", "1 November", "01 NOV", "An entire day at Zilpi", "One whole day together. The kind of day that makes you wish evenings were longer.", ["zilpi-date"]],
  ["flowers", "3 November", "03 NOV", "Flowers & being fed", "You fed me with your hands and gifted me flowers. A day full of the little things.", ["flowers"]],
  ["distance-days", "6–17 November", "06–17 NOV", "Twelve days apart", "Twelve days of distance and Diwali. Missing you made the hello after feel even sweeter.", ["distance-days"]],
  ["movie-date", "18 November", "18 NOV", "Movie date & our first kiss", "Back together for a movie date, and our very first kiss.", ["movie-date"]],
  ["game-date", "19 November", "19 NOV", "Game date, another kiss", "A game date, more laughter, and another kiss to keep close.", ["game-date"]],
  ["flight-show", "22 November", "22 NOV", "Flight show & workshop", "A workshop, a flight show, and another day tucked into our story.", ["flight-show"]],
  ["temple-date", "24 November", "24 NOV", "Temple & food date", "A little peace together, followed by something delicious.", ["temple-date"]],
  ["home-date", "25 November", "25 NOV", "Cooking together at home", "We cooked, ate together at your home, and spent some private time. A soft, lovely kind of day.", ["home-date"]]
].map(([id, date_label, short_date, title, caption, placeholder_ids], sort_order) => ({
  id, event_date: [
    "2026-10-14", "2026-10-15", "2026-10-21", "2026-10-23", "2026-10-27", "2026-10-27",
    "2026-10-29", "2026-10-31", "2026-11-01", "2026-11-03", "2026-11-06", "2026-11-18",
    "2026-11-19", "2026-11-22", "2026-11-24", "2026-11-25"
  ][sort_order],
  date_label, short_date, title, caption, sort_order: (sort_order + 1) * 10, placeholder_ids, media: []
}));

let memories = [...fallbackMemories];
let assets = {};
let tracks = [];
let currentUser = null;
let isAdmin = false;
let activeMemoryId = null;
let lightboxItems = [];
let lightboxIndex = 0;
let lastFocused = null;
const mediaById = new Map();
const fallbackReasons = [
  "You make ordinary days feel like something worth keeping.",
  "I love your little acts of care, especially the college drops.",
  "You're my favourite notification and my favourite person.",
  "Our silly inside jokes are a whole language of their own.",
  "You make me feel seen, safe, and very, very loved.",
  "You fed me with your hands and somehow made my whole week.",
  "Because after every little date, I can't wait for the next one.",
  "Because even a call with you makes time disappear."
];
const letterEntries = [
  ["Open when you miss me", "I miss you too, more than this little note can say. Close your eyes and imagine the longest hug, one forehead kiss, and me saving you a spot right next to me. We'll be together again soon. ♡"],
  ["Open when you're sad", "You don't have to fix everything right now. Take a breath, drink some water, and remember I'm on your team on the hard days too. You can tell me anything, or we can just sit together quietly. I love you."],
  ["Open when you can't sleep", "Put your phone down after this, loosen your shoulders, and imagine us watching the sky together. There's no rush to solve tomorrow tonight. Let your eyes get heavy; I'll be right here when you wake up. ♡"],
  ["Open when you need a hug", "This note is a very official voucher for one extra-long hug, redeemable the next time I see you. Until then: arms around yourself, one deep breath, and a little reminder that you are so loved."],
  ["Open when you need a smile", "Remember the pink helmet, the biryani lore, and how quickly one work message turned into all of this? My favourite plot twist. Now smile a little for me, pookie. ♡"]
];

const byId = id => document.getElementById(id);
function nextSortOrder(items) {
  const maxSortOrder = items.reduce((max, item) =>
    Number.isInteger(item.sort_order) ? Math.max(max, item.sort_order) : max, 0);
  if (maxSortOrder >= 2147483647) throw new Error("The sort order has reached the database integer limit.");
  return maxSortOrder + 1;
}
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const statusMessage = (message, kind = "") => {
  const node = byId("uploadAnnouncer");
  node.textContent = message;
  node.className = `upload-status ${kind ? `admin-${kind}` : ""}`;
  node.style.display = "block";
  window.clearTimeout(statusMessage.timeout);
  statusMessage.timeout = window.setTimeout(() => { node.style.display = "none"; }, 8000);
};
const setCloudStatus = message => { byId("cloudStatus").textContent = message; };
const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function assertCloud() {
  if (!supabase) throw new Error("Supabase isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the site.");
}

function assertAdmin() {
  if (!supabase) throw new Error("Supabase isn't configured. Add the project URL and publishable/anon key first.");
  if (!isAdmin) throw new Error("Sign in with the Supabase account provisioned as this scrapbook's admin.");
}

function errorText(error) {
  return error?.message || String(error);
}

async function loadScrapbook() {
  assertCloud();
  const [memoryResult, mediaResult, assetResult, trackResult] = await Promise.all([
    supabase.from("memories").select("*").order("sort_order", { ascending: true }),
    supabase.from("memory_media").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("site_assets").select("*"),
    supabase.from("playlist_tracks").select("*").order("sort_order", { ascending: true })
  ]);
  for (const result of [memoryResult, mediaResult, assetResult, trackResult]) {
    if (result.error) throw result.error;
  }
  const media = mediaResult.data || [];
  mediaById.clear();
  media.forEach(item => mediaById.set(item.id, item));
  memories = (memoryResult.data || []).map(memory => ({
    ...memory,
    placeholder_ids: fallbackMemories.find(entry => entry.id === memory.id)?.placeholder_ids || [memory.id],
    media: media.filter(item => item.memory_id === memory.id)
  }));
  assets = Object.fromEntries((assetResult.data || []).map(asset => [asset.asset_key, asset]));
  tracks = trackResult.data || [];
  renderTimeline();
  renderGallery();
  renderAnniversaryVideo();
  renderHandwrittenLetter();
  renderPlaylist();
  syncSiteAssetButtons();
  if (activeMemoryId && memories.some(memory => memory.id === activeMemoryId)) openMemory(activeMemoryId, false);
  setCloudStatus(isAdmin ? "Cloud connected · admin editing enabled" : "Cloud connected · public view");
}

function makeCard({ id, caption, alt, url, kind = "photo", editable = true }, context = "gallery") {
  const card = document.createElement("article");
  card.className = "polaroid";
  card.dataset.photoId = id;
  card.dataset.caption = caption || "";
  card.dataset.alt = alt || caption || "Scrapbook memory photograph";
  card.dataset.mediaId = id;
  const showActions = isAdmin && editable;
  const mediaHtml = url
    ? kind === "video"
      ? `<video src="${escapeHTML(url)}" controls playsinline preload="metadata" aria-label="${escapeHTML(caption)}"></video>`
      : `<img src="${escapeHTML(url)}" alt="${escapeHTML(alt || caption)}" loading="lazy">`
    : `<div class="photo-placeholder"><span class="placeholder-icon" aria-hidden="true">♡</span><strong>${escapeHTML(id)}</strong><small>Add your photo · ${escapeHTML(id)}.jpg</small></div>`;
  card.innerHTML = `<span class="photo-tape"></span><div class="photo-frame">${mediaHtml}</div><div class="polaroid-caption">${escapeHTML(caption || "")}</div>${showActions ? `<div class="photo-actions cloud-actions"><label class="quiet-button">${kind === "video" ? "Replace video" : "Replace photo"}<input class="upload-hidden cloud-media-upload" type="file" accept="${kind === "video" ? "video/*" : "image/*"}" data-kind="${kind}" data-media-id="${url ? id : ""}" data-memory-id="${escapeHTML(context)}"></label>${url ? `<button class="quiet-button cloud-remove-media" type="button" data-kind="${kind}" data-media-id="${escapeHTML(id)}">Remove</button>` : ""}</div>` : ""}`;
  return card;
}

function renderTimeline() {
  const track = byId("timelineTrack");
  track.innerHTML = memories.map(memory => `
    <button type="button" class="timeline-stop" data-memory-id="${escapeHTML(memory.id)}" aria-label="Open ${escapeHTML(memory.date_label)} memory: ${escapeHTML(memory.title)}">
      <time>${escapeHTML(memory.short_date)}</time><strong>${escapeHTML(memory.title)}</strong><span>${escapeHTML(memory.caption)}</span>
    </button>`).join("");
}

function renderGallery() {
  const gallery = byId("masonry");
  gallery.replaceChildren();
  memories.forEach((memory, memoryIndex) => {
    const photos = memory.media.filter(item => item.media_type === "photo");
    const cards = photos.length
      ? photos.map(item => ({ id: item.id, caption: item.caption || memory.title, alt: item.caption || memory.title, url: item.public_url, editable: true }))
      : memory.placeholder_ids.map(id => ({ id, caption: memory.title, alt: `${memory.title} photo placeholder`, url: "", editable: false }));
    cards.forEach((item, index) => {
      const card = makeCard(item, memory.id);
      card.dataset.memoryId = memory.id;
      card.style.setProperty("--tilt", index % 2 ? ".8deg" : "-.7deg");
      gallery.appendChild(card);
    });
  });
}

function adminMemoryFields(memory) {
  if (!isAdmin) return "";
  return `<form class="admin-form memory-edit-form cloud-actions" data-memory-form="${escapeHTML(memory.id)}">
    <label>Event date<input name="event_date" type="date" value="${escapeHTML(memory.event_date)}" required></label>
    <label>Date label<input name="date_label" value="${escapeHTML(memory.date_label)}" required></label>
    <label>Short date<input name="short_date" value="${escapeHTML(memory.short_date)}" required></label>
    <label>Title<input name="title" value="${escapeHTML(memory.title)}" required></label>
    <label>Caption<textarea name="caption">${escapeHTML(memory.caption)}</textarea></label>
    <button class="pill-button" type="submit">Save memory details</button>
    <button class="quiet-button cloud-delete-memory" type="button" data-memory-id="${escapeHTML(memory.id)}">Delete this memory</button>
  </form>`;
}

function openMemory(memoryId, focus = true) {
  const index = memories.findIndex(memory => memory.id === memoryId);
  if (index < 0) return;
  activeMemoryId = memoryId;
  const memory = memories[index];
  const media = memory.media || [];
  const photos = media.filter(item => item.media_type === "photo");
  const videos = media.filter(item => item.media_type === "video");
  const panel = byId("memoryModalPanel");
  panel.innerHTML = `<button class="modal-close" type="button" aria-label="Close memory">×</button>
    <p class="eyebrow">${escapeHTML(memory.date_label)} · a page from our story</p>
    <h2 id="modalTitle">${escapeHTML(memory.title)}</h2>
    <p class="modal-caption">${escapeHTML(memory.caption)}</p>
    ${isAdmin ? adminMemoryFields(memory) : ""}
    <div class="modal-photos" id="cloudMemoryPhotos"></div>
    ${videos.map(video => `<div class="video-scrap memory-video"><div class="video-window"><video src="${escapeHTML(video.public_url)}" controls playsinline preload="metadata"></video></div>${isAdmin ? `<button class="quiet-button cloud-remove-media" type="button" data-kind="video" data-media-id="${escapeHTML(video.id)}">Remove video</button>` : ""}</div>`).join("")}
    ${isAdmin ? `<div class="admin-media-controls cloud-actions">
      <label class="quiet-button">＋ Add photos<input class="upload-hidden cloud-media-upload" type="file" accept="image/*" multiple data-kind="photo" data-memory-id="${escapeHTML(memory.id)}"></label>
      <label class="quiet-button">${videos.length ? "Replace video" : "＋ Add video"}<input class="upload-hidden cloud-media-upload" type="file" accept="video/*" data-kind="video" data-memory-id="${escapeHTML(memory.id)}" data-media-id="${escapeHTML(videos[0]?.id || "")}"></label>
      <span class="small-note">Photos and videos publish to the shared scrapbook after upload.</span>
    </div>` : ""}
    <div class="memory-nav"><button class="quiet-button" type="button" data-memory-step="-1">← Previous memory</button><button class="quiet-button" type="button" data-memory-step="1">Next memory →</button></div>`;
  const container = byId("cloudMemoryPhotos");
  if (photos.length) {
    photos.forEach(photo => container.appendChild(makeCard({
      id: photo.id, caption: photo.caption || memory.title, alt: photo.caption || memory.title,
      url: photo.public_url, editable: true
    }, memory.id)));
  } else {
    const placeholderIds = memory.placeholder_ids?.length ? memory.placeholder_ids : [memory.id];
    placeholderIds.forEach((id, i) => container.appendChild(makeCard({
      id, caption: i ? `${memory.title} · another little moment` : memory.title,
      alt: `${memory.title} photo placeholder`, url: "", editable: false
    }, memory.id)));
  }
  const modal = byId("memoryModal");
  modal.classList.add("show");
  document.body.classList.add("locked");
  if (focus) panel.querySelector(".modal-close").focus();
}

function openLightbox(card, scope) {
  lightboxItems = [...scope.querySelectorAll(".polaroid[data-media-id]")].filter(item => item.isConnected);
  if (!lightboxItems.includes(card)) lightboxItems = [card];
  lightboxIndex = lightboxItems.indexOf(card);
  drawLightbox();
  byId("lightbox").classList.add("show");
  document.body.classList.add("locked");
  byId("lightboxClose").focus();
}

function drawLightbox() {
  const card = lightboxItems[lightboxIndex];
  if (!card) return;
  const frame = byId("lightboxFrame");
  frame.innerHTML = "";
  const source = card.querySelector("img");
  if (source) {
    const image = document.createElement("img");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    frame.appendChild(image);
  } else {
    const placeholder = card.querySelector(".photo-placeholder");
    if (placeholder) frame.appendChild(placeholder.cloneNode(true));
  }
  byId("lightboxCaption").textContent = card.dataset.caption || "";
  const multiple = lightboxItems.length > 1;
  byId("lightboxPrev").hidden = !multiple;
  byId("lightboxNext").hidden = !multiple;
}

function closeOverlay(id) {
  byId(id).classList.remove("show");
  if (!document.querySelector(".modal.show, .lightbox.show, .celebration.show")) document.body.classList.remove("locked");
  if (lastFocused?.focus) lastFocused.focus();
}

function renderAnniversaryVideo() {
  const video = byId("anniversaryVideo");
  const placeholder = byId("videoPlaceholder");
  const asset = assets["anniversary-video"];
  if (asset?.public_url) {
    video.src = asset.public_url;
    video.hidden = false;
    video.controls = true;
    placeholder.hidden = true;
    byId("videoPlay").hidden = true;
  } else {
    video.removeAttribute("src");
    video.load();
    video.hidden = true;
    placeholder.hidden = false;
    byId("videoPlay").hidden = !isAdmin;
  }
}

function renderHandwrittenLetter() {
  const card = byId("letterImage")?.querySelector(".polaroid");
  if (!card) return;
  const asset = assets["handwritten-letter"];
  const frame = card.querySelector(".photo-frame");
  const caption = "The letter, in my own handwriting";
  card.dataset.mediaId = "handwritten-letter";
  card.dataset.caption = caption;
  frame.innerHTML = asset?.public_url
    ? `<img src="${escapeHTML(asset.public_url)}" alt="The handwritten anniversary letter" loading="lazy">`
    : `<div class="photo-placeholder"><span class="placeholder-icon">♡</span><strong>handwritten-letter</strong><small>Add the handwritten-letter.jpg image</small></div>`;
  card.querySelector(".photo-actions")?.classList.remove("cloud-actions");
}

function renderPlaylist() {
  const playlist = byId("playlistTracks");
  playlist.innerHTML = "";
  const displayedTracks = tracks.length ? tracks : [{
    id: "tera-naam-doon", title: "Tera Naam Doon", description: "Our song · add its audio in admin mode", public_url: ""
  }];
  displayedTracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "track";
    row.innerHTML = `<div class="album-art">${index ? "♡" : "♫"}</div><div><strong>${escapeHTML(track.title)}</strong><small>${escapeHTML(track.description || "")}</small></div><div class="track-actions"><button type="button" class="quiet-button playlist-play" data-url="${escapeHTML(track.public_url || "")}">▶ Play</button>${isAdmin && track.public_url ? `<button type="button" class="quiet-button cloud-remove-track" data-track-id="${escapeHTML(track.id)}">Remove</button>` : ""}</div>`;
    playlist.appendChild(row);
    if (isAdmin && tracks.length && track.id !== "tera-naam-doon") {
      const edit = document.createElement("div");
      edit.className = "playlist-admin-row cloud-actions";
      edit.innerHTML = `<input aria-label="Track title" name="title" value="${escapeHTML(track.title)}"><input aria-label="Track description" name="description" value="${escapeHTML(track.description || "")}"><button type="button" class="quiet-button save-track" data-track-id="${escapeHTML(track.id)}">Save</button>`;
      playlist.appendChild(edit);
    }
  });
}

function setAdminMode(user) {
  currentUser = user;
  isAdmin = user?.app_metadata?.pookies_admin === true || user?.app_metadata?.pookies_admin === "true";
  document.body.classList.toggle("admin-mode", isAdmin);
  byId("adminButton").textContent = isAdmin ? "Sign out" : "Admin sign in";
  setCloudStatus(isAdmin ? "Cloud connected · admin editing enabled" : supabase ? "Cloud connected · public view" : "Cloud setup needed");
  renderTimeline();
  renderGallery();
  renderPlaylist();
  renderHandwrittenLetter();
  if (activeMemoryId) openMemory(activeMemoryId, false);
}

function showDialog(id) {
  lastFocused = document.activeElement;
  byId(id).classList.add("show");
  document.body.classList.add("locked");
  byId(id).querySelector("button")?.focus();
}

function updateProgress(message, percent) {
  const node = byId("uploadAnnouncer");
  node.style.display = "block";
  node.className = "upload-status";
  node.replaceChildren();
  const label = document.createElement("div");
  label.textContent = message;
  const progress = document.createElement("progress");
  progress.className = "upload-progress";
  progress.max = 100;
  progress.value = percent;
  progress.setAttribute("aria-label", "Upload progress");
  node.append(label, progress);
}

async function adminAccessToken() {
  assertAdmin();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error("Your admin session expired. Sign in again.");
  return data.session.access_token;
}

function storageUpload(file, storagePath, progressCallback) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await adminAccessToken();
      const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath}`);
      xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
      xhr.setRequestHeader("authorization", `Bearer ${token}`);
      xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.addEventListener("progress", event => {
        if (event.lengthComputable) progressCallback(Math.round(event.loaded / event.total * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let reason = `Storage upload failed (${xhr.status}).`;
          try { reason = JSON.parse(xhr.responseText).message || reason; } catch { /* use the HTTP fallback */ }
          reject(new Error(reason));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error while uploading to Supabase Storage.")));
      xhr.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));
      xhr.send(file);
    } catch (error) { reject(error); }
  });
}

async function removeStoredObject(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

function publicUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function safeFilename(filename) {
  return filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "upload";
}

function validateFile(file, kind) {
  const accepted = kind === "photo" ? file.type.startsWith("image/") : kind === "video" ? file.type.startsWith("video/") : file.type.startsWith("audio/");
  if (!accepted) throw new Error(`Choose a valid ${kind} file.`);
  if (file.size > 500 * 1024 * 1024) throw new Error("Files must be 500 MB or smaller.");
}

async function uploadMediaForMemory(memoryId, file, kind, replaceId = "") {
  assertAdmin();
  validateFile(file, kind);
  const old = replaceId ? mediaById.get(replaceId) : null;
  const path = `memories/${memoryId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  let databaseSaved = false;
  let cleanupWarning = "";
  try {
    await storageUpload(file, path, percent => updateProgress(`Uploading ${file.name} · ${percent}%`, percent));
    const url = publicUrl(path);
    if (old) {
      const { error } = await supabase.from("memory_media").update({
        storage_path: path, public_url: url, media_type: kind
      }).eq("id", replaceId);
      if (error) throw error;
      try { await removeStoredObject(old.storage_path); }
      catch (error) { cleanupWarning = `New media is saved, but the replaced file could not be removed from Storage: ${errorText(error)}`; }
    } else {
      const { error } = await supabase.from("memory_media").insert({
        memory_id: memoryId, media_type: kind, storage_path: path, public_url: url,
        caption: "",
        sort_order: nextSortOrder([...mediaById.values()].filter(item => item.memory_id === memoryId))
      });
      if (error) throw error;
    }
    databaseSaved = true;
  } catch (error) {
    if (!databaseSaved) {
      try { await removeStoredObject(path); }
      catch (cleanupError) {
        throw new Error(`${errorText(error)} The uploaded file may remain in Storage because cleanup failed: ${errorText(cleanupError)}`);
      }
    }
    throw error;
  }
  return cleanupWarning;
}

async function uploadSiteAsset(assetKey, file, kind) {
  assertAdmin();
  validateFile(file, kind);
  const path = `site/${assetKey}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  try {
    await storageUpload(file, path, percent => updateProgress(`Uploading ${file.name} · ${percent}%`, percent));
    const previous = assets[assetKey];
    const { error } = await supabase.from("site_assets").upsert({
      asset_key: assetKey, storage_path: path, public_url: publicUrl(path), updated_at: new Date().toISOString()
    }, { onConflict: "asset_key" });
    if (error) throw error;
    if (previous?.storage_path) {
      try { await removeStoredObject(previous.storage_path); }
      catch (cleanupError) { return `The new asset is saved, but the replaced object could not be removed: ${errorText(cleanupError)}`; }
    }
  } catch (error) {
    try { await removeStoredObject(path); } catch (cleanupError) { console.error("Could not clean up an incomplete upload:", cleanupError); }
    throw error;
  }
  return "";
}

async function withBusy(button, action) {
  if (button.disabled) return;
  button.disabled = true;
  try {
    await action();
  } catch (error) {
    console.error("Scrapbook update failed:", error);
    statusMessage(errorText(error), "error");
  } finally { button.disabled = false; }
}

async function refreshAfterSave(message) {
  await loadScrapbook();
  statusMessage(message, "success");
}

function closeMemory() {
  byId("memoryModal").classList.remove("show");
  activeMemoryId = null;
  if (!document.querySelector(".modal.show, .lightbox.show, .celebration.show")) document.body.classList.remove("locked");
  if (lastFocused?.focus) lastFocused.focus();
}

function openAdminDialog() {
  if (!supabase) {
    byId("adminLoginStatus").textContent = "Cloud editing is unavailable until you configure the Supabase project URL and publishable/anon key.";
    showDialog("adminModal");
    return;
  }
  if (isAdmin) {
    withBusy(byId("adminButton"), async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAdminMode(null);
      statusMessage("You are signed out. The scrapbook is now in public read-only mode.", "success");
    });
    return;
  }
  showDialog("adminModal");
}

async function signIn(event) {
  event.preventDefault();
  const status = byId("adminLoginStatus");
  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Signing in…";
  try {
    assertCloud();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: byId("adminEmail").value.trim(),
      password: byId("adminPassword").value
    });
    if (error) throw error;
    if (!(data.user?.app_metadata?.pookies_admin === true || data.user?.app_metadata?.pookies_admin === "true")) {
      await supabase.auth.signOut();
      throw new Error("This account is not authorized as the scrapbook admin. Add the pookies_admin app-metadata claim in Supabase.");
    }
    setAdminMode(data.user);
    await loadScrapbook();
    closeOverlay("adminModal");
    byId("adminPassword").value = "";
    statusMessage("Signed in. You can now edit and upload scrapbook memories.", "success");
  } catch (error) {
    status.textContent = errorText(error);
    status.classList.add("admin-error");
  } finally { button.disabled = false; }
}

async function handlePhotoUpload(input) {
  const files = [...input.files];
  const memoryId = input.dataset.memoryId;
  const kind = input.dataset.kind;
  const replaceId = input.dataset.mediaId || "";
  if (!files.length || !memoryId) return;
  assertAdmin();
  let savedCount = 0;
  const warnings = [];
  let uploadFailure = "";
  for (const [index, file] of files.entries()) {
    statusMessage(`Saving ${index + 1} of ${files.length}: ${file.name}`);
    try {
      const warning = await uploadMediaForMemory(memoryId, file, kind, files.length === 1 ? replaceId : "");
      savedCount += 1;
      if (warning) warnings.push(warning);
    } catch (error) {
      uploadFailure = errorText(error);
      break;
    }
  }
  if (savedCount) await loadScrapbook();
  if (uploadFailure) {
    throw new Error(`${savedCount} of ${files.length} files were saved. ${uploadFailure}`);
  }
  if (warnings.length) throw new Error(`${savedCount} file(s) saved. ${warnings.join(" ")}`);
  statusMessage(`${savedCount} ${kind === "photo" ? "photo(s)" : "video"} saved to the shared scrapbook.`, "success");
}

async function removeMedia(mediaId) {
  assertAdmin();
  const media = mediaById.get(mediaId);
  if (!media) throw new Error("This media record no longer exists. Refresh and try again.");
  const { error } = await supabase.from("memory_media").delete().eq("id", mediaId);
  if (error) throw error;
  let cleanupError = null;
  try { await removeStoredObject(media.storage_path); } catch (error) { cleanupError = error; }
  await loadScrapbook();
  if (cleanupError) throw new Error(`The media record was removed, but its Storage object could not be deleted: ${errorText(cleanupError)}`);
  statusMessage("Media removed from the scrapbook.", "success");
}

async function removeSiteAsset(assetKey) {
  assertAdmin();
  const asset = assets[assetKey];
  if (!asset) return;
  const { error } = await supabase.from("site_assets").delete().eq("asset_key", assetKey);
  if (error) throw error;
  let cleanupError = null;
  try { await removeStoredObject(asset.storage_path); } catch (error) { cleanupError = error; }
  await loadScrapbook();
  if (cleanupError) throw new Error(`The site asset was removed, but its Storage object could not be deleted: ${errorText(cleanupError)}`);
  statusMessage("The site asset was removed.", "success");
}

async function addPlaylistTrack(file) {
  assertAdmin();
  validateFile(file, "audio");
  const title = byId("playlistTitle").value.trim() || file.name.replace(/\.[^.]+$/, "");
  const path = `playlist/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  try {
    await storageUpload(file, path, percent => updateProgress(`Uploading ${file.name} · ${percent}%`, percent));
    const { error } = await supabase.from("playlist_tracks").insert({
      title, description: byId("playlistDescription").value.trim(),
      storage_path: path, public_url: publicUrl(path), sort_order: nextSortOrder(tracks)
    });
    if (error) throw error;
  } catch (error) {
    try { await removeStoredObject(path); }
    catch (cleanupError) {
      throw new Error(`${errorText(error)} The uploaded playlist file may remain in Storage because cleanup failed: ${errorText(cleanupError)}`);
    }
    throw error;
  }
  byId("playlistTitle").value = "";
  byId("playlistDescription").value = "";
  await refreshAfterSave("Playlist track saved.");
}

function makeLetterUploadControls() {
  const wrapper = document.querySelector("#letter .letter-feature .asset-upload-row");
  if (!wrapper || wrapper.querySelector("#removeLetterAsset")) return;
  const button = document.createElement("button");
  button.id = "removeLetterAsset";
  button.type = "button";
  button.className = "quiet-button";
  button.textContent = "Remove letter image";
  button.hidden = !assets["handwritten-letter"];
  wrapper.appendChild(button);
}

function syncSiteAssetButtons() {
  const videoAdmin = document.querySelector("#video .video-caption .admin-only");
  if (videoAdmin && !byId("removeAnniversaryVideo")) {
    const button = document.createElement("button");
    button.id = "removeAnniversaryVideo";
    button.type = "button";
    button.className = "quiet-button";
    button.textContent = "Remove video";
    videoAdmin.appendChild(button);
  }
  if (byId("removeAnniversaryVideo")) byId("removeAnniversaryVideo").hidden = !assets["anniversary-video"];
  makeLetterUploadControls();
}

function renderAdminState() {
  document.body.classList.toggle("admin-mode", isAdmin);
  byId("adminButton").textContent = isAdmin ? "Sign out" : "Admin sign in";
  setCloudStatus(isAdmin ? "Cloud connected · admin editing enabled" : supabase ? "Cloud connected · public view" : "Cloud setup needed");
  syncSiteAssetButtons();
  renderTimeline();
  renderGallery();
  renderPlaylist();
  renderHandwrittenLetter();
}

function wireInteractions() {
  const musicToggle = byId("musicToggle");
  const audio = byId("songPlayer");
  const syncMusicToggle = () => {
    const playing = !audio.paused && !audio.ended;
    musicToggle.textContent = playing ? "♫ Pause music" : "♫ Our music";
    musicToggle.setAttribute("aria-pressed", String(playing));
  };
  audio.addEventListener("play", syncMusicToggle);
  audio.addEventListener("pause", syncMusicToggle);
  audio.addEventListener("ended", syncMusicToggle);
  syncMusicToggle();
  byId("adminButton").addEventListener("click", openAdminDialog);
  byId("adminLoginForm").addEventListener("submit", signIn);
  byId("memoryEditorForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const save = form.querySelector("button[type=submit]");
    withBusy(save, async () => {
      assertAdmin();
      const id = byId("editMemoryId").value.trim();
      const { data: existing, error: existingError } = await supabase.from("memories").select("id").eq("id", id).maybeSingle();
      if (existingError) throw existingError;
      if (existing) throw new Error("That memory ID is already in use.");
      const { error } = await supabase.from("memories").insert({
        id,
        event_date: byId("editMemoryEventDate").value,
        date_label: byId("editMemoryDate").value.trim(),
        short_date: byId("editMemoryShortDate").value.trim(),
        title: byId("editMemoryTitle").value.trim(),
        caption: byId("editMemoryCaption").value.trim(),
        sort_order: (Math.max(0, ...memories.map(memory => memory.sort_order)) || 0) + 10
      });
      if (error) throw error;
      byId("memoryEditorForm").reset();
      closeOverlay("memoryEditorModal");
      await refreshAfterSave("New memory added.");
    });
  });
  byId("addMemoryButton").addEventListener("click", () => showDialog("memoryEditorModal"));

  document.addEventListener("click", event => {
    const target = event.target;
    if (target.closest("[data-close-admin]")) {
      closeOverlay(target.closest("#memoryEditorModal") ? "memoryEditorModal" : "adminModal");
      return;
    }
    const stop = target.closest("[data-memory-id]");
    if (stop && stop.classList.contains("timeline-stop")) {
      event.preventDefault(); event.stopImmediatePropagation();
      lastFocused = stop;
      openMemory(stop.dataset.memoryId);
      return;
    }
    const nav = target.closest("[data-memory-step]");
    if (nav) {
      event.preventDefault(); event.stopImmediatePropagation();
      const index = memories.findIndex(memory => memory.id === activeMemoryId);
      const next = (index + Number(nav.dataset.memoryStep) + memories.length) % memories.length;
      openMemory(memories[next].id);
      return;
    }
    const close = target.closest("#memoryModal .modal-close");
    if (close) { event.preventDefault(); event.stopImmediatePropagation(); closeMemory(); return; }
    const remove = target.closest(".cloud-remove-media");
    if (remove) {
      event.preventDefault(); event.stopImmediatePropagation();
      withBusy(remove, () => removeMedia(remove.dataset.mediaId));
      return;
    }
    const removeMemoryButton = target.closest(".cloud-delete-memory");
    if (removeMemoryButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      const memoryId = removeMemoryButton.dataset.memoryId;
      if (!window.confirm("Delete this memory and its media from the public scrapbook?")) return;
      withBusy(removeMemoryButton, async () => {
        assertAdmin();
        const memory = memories.find(item => item.id === memoryId);
        const paths = memory?.media.map(item => item.storage_path) || [];
        const { error } = await supabase.from("memories").delete().eq("id", memoryId);
        if (error) throw error;
        let cleanupError = null;
        if (paths.length) {
          try {
            const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
            if (storageError) cleanupError = storageError;
          } catch (error) { cleanupError = error; }
        }
        closeMemory();
        await loadScrapbook();
        if (cleanupError) throw new Error(`Memory deleted, but some Storage files could not be removed: ${errorText(cleanupError)}`);
        statusMessage("Memory deleted.", "success");
      });
      return;
    }
    const trackPlay = target.closest(".playlist-play");
    if (trackPlay) {
      event.preventDefault(); event.stopImmediatePropagation();
      const url = trackPlay.dataset.url;
      if (!url) { statusMessage("The playlist audio hasn't been uploaded yet."); return; }
      if (audio.src === url && !audio.paused) audio.pause();
      else { audio.src = url; audio.play().catch(error => {
        syncMusicToggle();
        statusMessage(`Could not play this track: ${errorText(error)}`, "error");
      }); }
      return;
    }
    if (target.id === "musicToggle") {
      event.preventDefault(); event.stopImmediatePropagation();
      const firstTrack = tracks[0];
      if (!audio.src && firstTrack?.public_url) audio.src = firstTrack.public_url;
      if (!audio.src) { statusMessage("Add a playlist track in admin mode to set up your music."); return; }
      if (audio.paused) audio.play().catch(error => {
        syncMusicToggle();
        statusMessage(`Could not play the song: ${errorText(error)}`, "error");
      });
      else audio.pause();
      return;
    }
    const saveMemory = target.closest(".memory-edit-form button[type=submit]");
    if (saveMemory) {
      event.preventDefault(); event.stopImmediatePropagation();
      const form = saveMemory.closest(".memory-edit-form");
      withBusy(saveMemory, async () => {
        assertAdmin();
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from("memories").update(payload).eq("id", form.dataset.memoryForm);
        if (error) throw error;
        await refreshAfterSave("Memory details saved.");
      });
      return;
    }
    const saveTrack = target.closest(".save-track");
    if (saveTrack) {
      event.preventDefault(); event.stopImmediatePropagation();
      withBusy(saveTrack, async () => {
        assertAdmin();
        const row = saveTrack.closest(".playlist-admin-row");
        const payload = {
          title: row.querySelector('[name="title"]').value.trim(),
          description: row.querySelector('[name="description"]').value.trim()
        };
        const { error } = await supabase.from("playlist_tracks").update(payload).eq("id", saveTrack.dataset.trackId);
        if (error) throw error;
        await refreshAfterSave("Playlist details saved.");
      });
      return;
    }
    const removeTrack = target.closest(".cloud-remove-track");
    if (removeTrack) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!window.confirm("Remove this playlist track?")) return;
      withBusy(removeTrack, async () => {
        assertAdmin();
        const track = tracks.find(item => item.id === removeTrack.dataset.trackId);
        const { error } = await supabase.from("playlist_tracks").delete().eq("id", removeTrack.dataset.trackId);
        if (error) throw error;
        let cleanupError = null;
        try { await removeStoredObject(track?.storage_path); } catch (error) { cleanupError = error; }
        await loadScrapbook();
        if (cleanupError) throw new Error(`Playlist track removed, but its Storage file could not be deleted: ${errorText(cleanupError)}`);
        statusMessage("Playlist track removed.", "success");
      });
      return;
    }
    if (target.id === "removeLetterAsset") withBusy(target, () => removeSiteAsset("handwritten-letter"));
    if (target.id === "removeAnniversaryVideo") withBusy(target, () => removeSiteAsset("anniversary-video"));
    if (target.closest("#masonry .polaroid")) {
      const card = target.closest(".polaroid");
      if (target.closest(".cloud-actions")) { event.stopImmediatePropagation(); return; }
      if (target.closest("video")) { event.stopImmediatePropagation(); return; }
      event.preventDefault(); event.stopImmediatePropagation();
      lastFocused = card;
      openLightbox(card, byId("masonry"));
      return;
    }
    const memoryPhoto = target.closest("#memoryModal .modal-photos .polaroid");
    if (memoryPhoto) {
      if (target.closest(".cloud-actions")) { event.stopImmediatePropagation(); return; }
      event.preventDefault(); event.stopImmediatePropagation();
      lastFocused = memoryPhoto;
      openLightbox(memoryPhoto, byId("cloudMemoryPhotos"));
      return;
    }
    if (target.id === "lightboxClose" || target.id === "lightbox") { event.preventDefault(); closeOverlay("lightbox"); return; }
    if (target.id === "lightboxPrev" || target.id === "lightboxNext") {
      event.preventDefault();
      lightboxIndex = (lightboxIndex + (target.id === "lightboxNext" ? 1 : -1) + lightboxItems.length) % lightboxItems.length;
      drawLightbox();
      return;
    }
  }, true);

  document.addEventListener("submit", event => {
    const form = event.target.closest(".memory-edit-form");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const save = event.submitter || form.querySelector('button[type="submit"]');
    withBusy(save, async () => {
      assertAdmin();
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.updated_at = new Date().toISOString();
      const { error } = await supabase.from("memories").update(payload).eq("id", form.dataset.memoryForm);
      if (error) throw error;
      await refreshAfterSave("Memory details saved.");
    });
  }, true);

  document.addEventListener("change", event => {
    const input = event.target;
    if (input.matches(".cloud-media-upload")) {
      event.preventDefault(); event.stopImmediatePropagation();
      const files = [...input.files];
      withBusy(input, async () => {
        await handlePhotoUpload(input);
      });
      input.value = "";
      return;
    }
    if (input.id === "anniversaryVideoUpload") {
      event.preventDefault(); event.stopImmediatePropagation();
      const file = input.files[0];
      if (file) withBusy(input, async () => {
        const warning = await uploadSiteAsset("anniversary-video", file, "video");
        await loadScrapbook();
        if (warning) throw new Error(warning);
        statusMessage("Anniversary video saved and published.", "success");
      });
      input.value = "";
      return;
    }
    if (input.id === "handwrittenLetterUpload") {
      event.preventDefault(); event.stopImmediatePropagation();
      const file = input.files[0];
      if (file) withBusy(input, async () => {
        const warning = await uploadSiteAsset("handwritten-letter", file, "photo");
        await loadScrapbook();
        if (warning) throw new Error(warning);
        statusMessage("Handwritten letter saved and published.", "success");
      });
      input.value = "";
      return;
    }
    if (input.id === "playlistUpload") {
      event.preventDefault(); event.stopImmediatePropagation();
      const file = input.files[0];
      if (file) withBusy(input, () => addPlaylistTrack(file));
      input.value = "";
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      for (const id of ["adminModal", "memoryEditorModal", "memoryModal", "lightbox"]) {
        if (byId(id).classList.contains("show")) { closeOverlay(id); if (id === "memoryModal") activeMemoryId = null; break; }
      }
    } else if (byId("lightbox").classList.contains("show") && event.key === "ArrowRight") {
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; drawLightbox();
    } else if (byId("lightbox").classList.contains("show") && event.key === "ArrowLeft") {
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; drawLightbox();
    }
  });
}

async function initialize() {
  wireInteractions();
  if (!supabase) {
    renderTimeline();
    renderGallery();
    renderPlaylist();
    renderHandwrittenLetter();
    setCloudStatus("Cloud setup needed · public demo only");
    return;
  }
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session?.user?.app_metadata?.pookies_admin === true || session?.user?.app_metadata?.pookies_admin === "true") {
      currentUser = session.user;
      isAdmin = true;
    } else if (session) {
      await supabase.auth.signOut();
      currentUser = null;
    }
    await loadScrapbook();
    renderAdminState();
  } catch (error) {
    console.error("Could not connect to the shared scrapbook:", error);
    setCloudStatus("Cloud connection failed");
    statusMessage(`Couldn't load the shared scrapbook: ${errorText(error)}`, "error");
    renderTimeline();
    renderGallery();
    renderPlaylist();
  }
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    queueMicrotask(async () => {
      if (session?.user?.app_metadata?.pookies_admin === true || session?.user?.app_metadata?.pookies_admin === "true") {
        isAdmin = true;
        currentUser = session.user;
        renderAdminState();
        try { await loadScrapbook(); } catch (error) { statusMessage(`Could not refresh data after sign-in: ${errorText(error)}`, "error"); }
      } else if (!session) {
        isAdmin = false;
        currentUser = null;
        renderAdminState();
      }
    });
  });
}

initialize();
