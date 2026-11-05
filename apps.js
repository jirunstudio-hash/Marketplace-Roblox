/* =========================================
   ROBLOX MARKETPLACE DEMO (PRO NATIVE LOOP)
========================================= */

function $(id) {
  return document.getElementById(id);
}

const ITEMS = [
  {
    name: "Headless Horseman",
    price: 31000,
    creator: "Roblox",
    tradable: "No",
    type: "Characters",
    placement: "Full Body",
    created: "Aug 15, 2018",
    description: '"No, you must believe me. It was a horseman, a dead one. Headless."',
    defaultImg: "https://static.wikia.nocookie.net/roblox/images/3/37/Headless_Horseman_V2.png"
  },
  {
    name: "Korblox Deathspeaker",
    price: 17000,
    creator: "Roblox",
    tradable: "No",
    type: "Characters",
    placement: "Full Body",
    created: "Aug 15, 2018",
    description: "His tribe is widely considered the best and strongest of the twelve Korblox tribes.  No one dares challenge his authority.",
    defaultImg: "https://static.wikia.nocookie.net/roblox/images/2/27/Korblox_Deathspeaker.png"
  },
  {
    name: "silly happy patrick",
    price: 126,
    creator: "thechic UGC",
    tradable: "No",
    type: "Characters",
    placement: "Full Body",
    created: "Jun 07, 2026",
    description: "Variant of the happy patrick bundle available on thechic UGC, this variant is lighter than the original one.",
    defaultImg: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-117565355-Png/150/150/AvatarHeadshot/Png/noFilter"
  },
  {
    name: "Mini Spider Plushie",
    price: 126,
    creator: "frenchrxses",
    tradable: "No",
    type: "Characters",
    placement: "Full Body",
    created: "May 23, 2026",
    description: "⭐ Favorite for more or save for later!",
    defaultImg: "https://tr.rbxcdn.com/30DAY-Avatar-269F4F308F148C163BA6DAC0313E0E53-Png/420/420/Avatar/Png/noFilter"
  },
  {
    name: "Itachi Akatsuki Cloak",
    price: 89,
    creator: "AniHub",
    tradable: "No",
    type: "Bodysuit",
    placement: "Clothing | Outerwear",
    created: "Dec 29, 2025",
    description: "This is part of the Itachi Set",
    defaultImg: "https://tr.rbxcdn.com/180DAY-99b2f15085bc69f262c8e1e924d8e5d6/420/420/JacketAccessory/Png/noFilter"
  },
  {
    name: "Midnight Blue Horns",
    price: 70,
    creator: "Resurgence.",
    tradable: "No",
    type: "Head Accessories",
    placement: "Accessories | Head",
    created: "Aug 06, 2024",
    description: "Crowned with the deep, mysterious hues of the night sky, they exude an aura of calm power and enigmatic elegance, commanding the night with their tranquil strength. 🌌💙",
    defaultImg: "https://tr.rbxcdn.com/180DAY-8e86da0456c1aced681718a4a9a76825/420/420/Hat/Webp/noFilter"
  }
];

const DEFAULT_AVATAR = "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-117565355-Png/150/150/AvatarHeadshot/Png/noFilter";
const RECOMMENDATION_ORDER = [0, 1, 2, 3, 4, 5];

let video = null;
let still = null;
let viewer = null;

let selectedItem = 0;
let username = "sultan_owner";
let balance = 0;
let currentRole = "owner";
let cartCount = 0;
let chosenUser = null;
let searchTimer = null;
let searchSequence = 0;
let searchAbortController = null;
let isSendingGift = false;

let currentVideoURL = null;
let activeLoopData = { start: 0.0, end: 4.0 };

const photoURLs = new Map();
const cachedVideos = new Map();

/* =========================================
   SISTEM SINGKATAN ROBUX (K, M, B)
========================================= */
function formatRobux(num) {
  num = Number(num) || 0;
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("en-US");
}

function formatNumber(number) {
  return Number(number).toLocaleString("en-US");
}

function toast(message) {
  const element = $("toast");
  if (!element) return;

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    element.style.display = "none";
  }, 2800);
}

/* =========================================
   SISTEM LOGIN AUTHENTICATION (3 ROLE)
========================================= */
function checkAuthSession() {
  const sessionRaw = localStorage.getItem("roblox_auth_session");
  const authOverlay = $("auth-overlay");

  if (!sessionRaw) {
    if (authOverlay) authOverlay.style.display = "flex";
    return false;
  }

  try {
    const session = JSON.parse(sessionRaw);
    username = session.username;
    currentRole = session.role || "member";

    const savedBal = localStorage.getItem("robux_balance_" + username);
    if (savedBal !== null) {
      balance = Number(savedBal);
    } else {
      balance = session.defaultRobux || 0;
    }

    if (authOverlay) authOverlay.style.display = "none";
    updateUI();
    return true;
  } catch (e) {
    if (authOverlay) authOverlay.style.display = "flex";
    return false;
  }
}

function handleLoginSubmit() {
  const uInput = $("login-username").value.trim();
  const pInput = $("login-password").value.trim();
  const errBox = $("auth-error");

  if (!uInput || !pInput) {
    errBox.textContent = "Masukkan username dan password!";
    errBox.style.display = "block";
    return;
  }

  const accounts = typeof ACCOUNTS_CONFIG !== "undefined" ? ACCOUNTS_CONFIG : [];
  const foundAccount = accounts.find(
    a => a.username.toLowerCase() === uInput.toLowerCase() && String(a.password) === pInput
  );

  if (!foundAccount) {
    errBox.textContent = "Username atau password salah!";
    errBox.style.display = "block";
    return;
  }

  errBox.style.display = "none";

  const session = {
    username: foundAccount.username,
    role: foundAccount.role,
    defaultRobux: foundAccount.defaultRobux
  };
  localStorage.setItem("roblox_auth_session", JSON.stringify(session));

  username = foundAccount.username;
  currentRole = foundAccount.role;

  const existingBal = localStorage.getItem("robux_balance_" + username);
  if (existingBal === null) {
    balance = foundAccount.defaultRobux || 0;
    localStorage.setItem("robux_balance_" + username, balance);
  } else {
    balance = Number(existingBal);
  }

  $("auth-overlay").style.display = "none";
  updateUI();
  loadAvatarFromStorage();
  toast(`Berhasil masuk sebagai ${foundAccount.role.toUpperCase()} (@${username})`);
}

function handleLogout() {
  localStorage.removeItem("roblox_auth_session");
  closeSettings();
  $("login-username").value = "";
  $("login-password").value = "";
  $("auth-overlay").style.display = "flex";
  toast("Anda telah keluar akun.");
}

/* =========================================
   FOTO PROFIL HEADER
========================================= */
function chooseProfilePhoto() {
  const input = $("profile-upload");
  if (input) {
    input.value = "";
    input.click();
  }
}

function resetProfilePhoto() {
  localStorage.removeItem("korblox_custom_avatar");
  updateAvatarUI(DEFAULT_AVATAR);
  toast("Foto profil dikembalikan ke default.");
}

function updateAvatarUI(src) {
  const finalSrc = src || DEFAULT_AVATAR;
  const headerImg = $("header-avatar-img");
  const previewImg = $("setting-avatar-preview");
  if (headerImg) headerImg.src = finalSrc;
  if (previewImg) previewImg.src = finalSrc;
}

function loadAvatarFromStorage() {
  try {
    const saved = localStorage.getItem("korblox_custom_avatar");
    if (saved) {
      updateAvatarUI(saved);
    }
  } catch (e) {}
}

function compressAndSaveAvatar(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 150;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      const minDim = Math.min(img.width, img.height);
      const startX = (img.width - minDim) / 2;
      const startY = (img.height - minDim) / 2;

      ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
      const compressed = canvas.toDataURL("image/jpeg", 0.88);

      try {
        localStorage.setItem("korblox_custom_avatar", compressed);
        updateAvatarUI(compressed);
        toast("Foto profil berhasil diperbarui!");
      } catch (err) {
        toast("Gagal menyimpan foto ke memori browser.");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =========================================
   INDEXED DB (VIDEO & FOTO ITEM - 6 SLOT)
========================================= */
const DB_NAME = "RobloxCharacterVideoDB";
const DB_VERSION = 3;
const VIDEO_STORE = "videos";
const PHOTO_STORE = "recommendation_images";

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE);
      }
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error("Database tidak dapat dibuka."));
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error("Tutup tab lain yang memakai database ini."));
    };
  });

  return dbPromise;
}

async function dbGet(store, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function dbPut(store, key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Penyimpanan dibatalkan."));
  });
}

async function dbDelete(store, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Penghapusan dibatalkan."));
  });
}

async function initMediaCache() {
  for (let i = 0; i < ITEMS.length; i++) {
    try {
      const rec = await dbGet(VIDEO_STORE, i);
      if (rec && rec.blob) {
        cachedVideos.set(i, rec);
      }
    } catch (e) {}
  }
}

/* ========================================================
   PEMUTAR VIDEO NATIVE LOOP
======================================================== */
function attachCleanLooper(player, loop) {
  activeLoopData = {
    start: loop.start || 0.0,
    end: loop.end || (player.duration ? player.duration - 0.05 : 4.0)
  };

  player.ontimeupdate = () => {
    if (activeLoopData.end > 0 && player.currentTime >= activeLoopData.end) {
      player.currentTime = activeLoopData.start;
    }
  };
}

async function activateItemVideo(index) {
  let record = cachedVideos.get(index);
  if (!record) {
    record = await dbGet(VIDEO_STORE, index);
    if (record && record.blob) {
      cachedVideos.set(index, record);
    }
  }

  if (!record?.blob) {
    if (video) {
      video.pause();
      video.style.display = "none";
    }
    showStill();
    return;
  }

  if (still) still.style.display = "none";

  if (currentVideoURL) {
    URL.revokeObjectURL(currentVideoURL);
  }
  currentVideoURL = URL.createObjectURL(record.blob);

  video.pause();
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.loop = true;

  const loop = record.loop || { start: 0.0, end: 4.0 };
  attachCleanLooper(video, loop);

  video.src = currentVideoURL;

  video.onloadeddata = () => {
    if (video.videoWidth && video.videoHeight) {
      viewer.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    }
    video.currentTime = loop.start || 0.0;
    video.play().catch(() => {});
    video.style.display = "block";
    if (still) still.style.display = "none";
  };

  video.load();
  $("video-status").textContent = `✓ ${ITEMS[index].name} berputar aktif.`;
}

function showStill() {
  const customUrl = photoURLs.get(selectedItem);
  const finalUrl = customUrl || ITEMS[selectedItem].defaultImg;
  if (still) {
    still.src = finalUrl;
    still.style.display = "block";
  }
  if (video) video.style.display = "none";
}

/* =========================================
   PRODUCTS / RECOMMENDATIONS
========================================= */
function renderRecommendations() {
  const list = $("recommendation-list");
  if (!list) return;
  list.innerHTML = "";

  RECOMMENDATION_ORDER.forEach(index => {
    const item = ITEMS[index];
    if (!item) return;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "recommendation";
    card.setAttribute("aria-label", "Select " + item.name);

    const thumb = document.createElement("div");
    thumb.className = "recommendation-image";

    const url = photoURLs.get(index);
    const img = document.createElement("img");
    img.src = url || item.defaultImg;
    img.alt = item.name;
    img.referrerPolicy = "no-referrer";
    thumb.appendChild(img);

    const name = document.createElement("div");
    name.className = "recommendation-name";
    name.textContent = item.name;

    const creator = document.createElement("div");
    creator.className = "recommendation-creator";
    creator.textContent = item.creator;

    const price = document.createElement("div");
    price.className = "recommendation-price";
    price.innerHTML = `
      <svg class="robux-icon" width="14" height="14" fill="currentColor">
        <use href="#icon-robux"/>
      </svg>
      <span>${formatNumber(item.price)}</span>
    `;

    card.append(thumb, name, creator, price);

    card.addEventListener("click", () => {
      selectItem(index);
    });

    list.appendChild(card);
  });
}

function selectItem(index) {
  if (!Number.isInteger(index) || index < 0 || index >= ITEMS.length) return;
  selectedItem = index;
  const item = ITEMS[index];

  $("product-title").textContent = item.name;
  $("product-price").textContent = formatNumber(item.price);
  $("product-description").textContent = item.description;

  const creatorEl = $("product-creator");
  if (creatorEl) creatorEl.textContent = item.creator;

  const createdEl = $("product-created");
  if (createdEl) createdEl.textContent = item.created;

  const tradableEl = $("product-tradable");
  if (tradableEl) tradableEl.textContent = item.tradable;

  const typeEl = $("product-type");
  if (typeEl) typeEl.textContent = item.type;

  const placementEl = $("product-placement");
  if (placementEl) placementEl.textContent = item.placement;

  activateItemVideo(index);
}

async function loadAllPhotos() {
  for (let index = 0; index < ITEMS.length; index++) {
    try {
      const record = await dbGet(PHOTO_STORE, index);
      if (record && record.blob) {
        photoURLs.set(index, URL.createObjectURL(record.blob));
      }
    } catch (error) {
      console.error("Foto tidak dapat dimuat:", error);
    }
  }
  renderRecommendations();
}

function getPhotoIndex() {
  const el = $("photo-item-select");
  return el ? Number(el.value) : 0;
}

function choosePhoto() {
  const input = $("photo-upload");
  if (input) {
    input.value = "";
    input.click();
  }
}

async function updatePhotoStatus() {
  const index = getPhotoIndex();
  const statusEl = $("photo-status");
  if (!statusEl) return;

  statusEl.textContent = "Memeriksa foto...";

  try {
    const record = await dbGet(PHOTO_STORE, index);
    statusEl.textContent = record?.blob
      ? "✓ Foto kustom tersimpan: " + record.name
      : "Belum ada foto kustom untuk " + ITEMS[index].name + ".";
  } catch (error) {
    statusEl.textContent = "Penyimpanan foto tidak tersedia.";
  }
}

async function removePhoto() {
  const index = getPhotoIndex();
  if (!confirm("Hapus foto kustom " + ITEMS[index].name + "?")) return;

  try {
    await dbDelete(PHOTO_STORE, index);
    const oldURL = photoURLs.get(index);
    if (oldURL) URL.revokeObjectURL(oldURL);
    photoURLs.delete(index);
    renderRecommendations();

    if (selectedItem === index && !cachedVideos.has(index)) {
      showStill();
    }
    await updatePhotoStatus();
    toast("Foto dihapus.");
  } catch (error) {
    toast("Gagal menghapus foto.");
  }
}

function changeGiftItem() {
  const nextItem = (selectedItem + 1) % ITEMS.length;
  selectItem(nextItem);
  openGift();
}

/* ========================================================
   ALAT PEMOTONG SAMBUNGAN VIDEO
======================================================== */
function getVideoIndex() {
  const el = $("video-item-select");
  return el ? Number(el.value) : 0;
}

function chooseVideo() {
  const input = $("video-upload");
  if (input) {
    input.value = "";
    input.click();
  }
}

async function updateVideoStatus() {
  const index = getVideoIndex();
  const statusEl = $("video-status");
  const loopWrap = $("loop-controls-wrap");
  if (!statusEl) return;

  statusEl.textContent = "Memeriksa video...";

  try {
    const record = await dbGet(VIDEO_STORE, index);
    if (record?.blob) {
      statusEl.textContent = `✓ Video tersimpan: ${record.name}`;
      
      if (loopWrap) {
        loopWrap.style.display = "block";
        const loop = record.loop || { start: 0.0, end: 4.0 };
        $("loop-start-val").textContent = `${Number(loop.start || 0).toFixed(2)}s`;
        $("loop-end-val").textContent = `${Number(loop.end || 4.0).toFixed(2)}s`;
        activeLoopData.start = loop.start || 0.0;
        activeLoopData.end = loop.end || 4.0;
      }
    } else {
      statusEl.textContent = `Belum ada video kustom untuk ${ITEMS[index].name}.`;
      if (loopWrap) loopWrap.style.display = "none";
    }
  } catch (error) {
    statusEl.textContent = "Penyimpanan video tidak tersedia.";
    if (loopWrap) loopWrap.style.display = "none";
  }
}

function nudgeLoopEnd(delta) {
  let newEnd = Number((activeLoopData.end + delta).toFixed(2));
  const maxDur = (video && video.duration) ? video.duration : 15;

  if (newEnd > maxDur) newEnd = Number(maxDur.toFixed(2));
  if (newEnd <= 1.0) newEnd = 1.0;

  activeLoopData.end = newEnd;
  $("loop-end-val").textContent = `${newEnd.toFixed(2)}s`;
  toast(`Titik potong akhir diubah ke: ${newEnd.toFixed(2)}s`);
}

function applyLoopPreset(sec) {
  const maxDur = (video && video.duration) ? video.duration : 15;

  if (sec === 0 || sec > maxDur) {
    activeLoopData.end = Number(maxDur.toFixed(2));
  } else {
    activeLoopData.end = sec;
  }

  activeLoopData.start = 0.0;
  $("loop-start-val").textContent = `0.00s`;
  $("loop-end-val").textContent = `${activeLoopData.end.toFixed(2)}s`;
  toast(`Preset diterapkan: ${activeLoopData.end.toFixed(2)}s`);
}

async function saveCustomLoopPoints() {
  const index = getVideoIndex();

  try {
    const record = await dbGet(VIDEO_STORE, index);
    if (record) {
      record.loop = {
        start: activeLoopData.start,
        end: activeLoopData.end,
        duration: record.loop?.duration || activeLoopData.end
      };

      await dbPut(VIDEO_STORE, index, record);
      cachedVideos.set(index, record);

      if (selectedItem === index) {
        activateItemVideo(index);
      }

      toast("Titik putaran berhasil disimpan & dikunci!");
    }
  } catch (e) {
    toast("Gagal menyimpan titik putaran.");
  }
}

async function removeVideo() {
  const index = getVideoIndex();
  if (!confirm("Hapus video " + ITEMS[index].name + "?")) return;

  try {
    await dbDelete(VIDEO_STORE, index);
    cachedVideos.delete(index);

    if (selectedItem === index) {
      if (video) {
        video.pause();
        video.style.display = "none";
      }
      showStill();
    }
    await updateVideoStatus();
    toast("Video dihapus.");
  } catch (error) {
    toast("Gagal menghapus video.");
  }
}

/* =========================================
   PENGATURAN UMUM
========================================= */
function saveState() {
  try {
    localStorage.setItem("robux_balance_" + username, balance);
  } catch (e) {}
}

function updateUI() {
  if ($("header-name")) $("header-name").textContent = username;
  if ($("header-balance")) $("header-balance").textContent = formatRobux(balance);
  if ($("modal-balance")) $("modal-balance").textContent = formatRobux(balance);
}

function openSettings() {
  $("setting-username").value = username;
  $("setting-balance").value = balance;
  $("video-item-select").value = String(selectedItem);
  $("photo-item-select").value = String(selectedItem);

  const roleBadge = $("user-role-badge");
  const balInput = $("setting-balance");
  const memberNotice = $("member-balance-notice");

  if (roleBadge) {
    roleBadge.textContent = "Role: " + currentRole.toUpperCase();
  }

  if (currentRole === "member") {
    balInput.disabled = true;
    balInput.style.background = "#f1f3f6";
    balInput.style.color = "#888";
    balInput.style.cursor = "not-allowed";
    if (memberNotice) memberNotice.style.display = "block";
  } else {
    balInput.disabled = false;
    balInput.style.background = "#fff";
    balInput.style.color = "#191b1d";
    balInput.style.cursor = "text";
    if (memberNotice) memberNotice.style.display = "none";
  }

  loadAvatarFromStorage();

  $("settings-modal").classList.add("show");
  updateVideoStatus();
  updatePhotoStatus();
}

function closeSettings() {
  $("settings-modal").classList.remove("show");
}

function saveSettings() {
  const name = $("setting-username").value.trim();

  if (currentRole !== "member") {
    const amount = Number($("setting-balance").value.replace(/[.,\s]/g, ""));
    if (!Number.isSafeInteger(amount) || amount < 0) {
      return toast("Jumlah saldo Robux tidak valid.");
    }
    balance = amount;
  }

  if (name) {
    username = name;
  }

  saveState();
  updateUI();
  closeSettings();
  toast("Pengaturan tersimpan.");
}

/* =========================================
   BUY / GIFT MODAL
========================================= */
function handleBuy() {
  toast(`${ITEMS[selectedItem].name} has been added to your cart`);
}

function openGift() {
  chosenUser = null;
  isSendingGift = false;
  const item = ITEMS[selectedItem];

  $("gift-modal").classList.add("show");
  $("gift-form").style.display = "block";
  $("gift-success").style.display = "none";
  $("gift-item-name").textContent = item.name;
  $("gift-price").textContent = formatNumber(item.price);

  const image = $("gift-image");
  const photoURL = photoURLs.get(selectedItem);

  if (photoURL) {
    image.src = photoURL;
  } else {
    image.src = item.defaultImg;
  }
  image.style.display = "block";

  $("user-search").value = "";
  $("user-search").style.display = "block";
  $("search-results").innerHTML = "";
  $("selected-user").style.display = "none";
  $("send-btn").style.display = "none";
  $("search-status").textContent = "Enter at least 2 characters to search Roblox users.";
  $("search-status").style.display = "block";

  const btn = $("send-btn");
  const btnText = $("send-btn-text");
  const btnSpinner = $("send-btn-spinner");
  if (btn) btn.disabled = false;
  if (btnText) btnText.style.display = "inline";
  if (btnSpinner) btnSpinner.style.display = "none";

  updateUI();
  $("user-search").focus();
}

function closeGift() {
  $("gift-modal").classList.remove("show");
  if (searchAbortController) searchAbortController.abort();
}

function clearUser() {
  chosenUser = null;
  $("selected-user").style.display = "none";
  $("send-btn").style.display = "none";
  $("user-search").style.display = "block";
  $("user-search").value = "";
  $("search-results").innerHTML = "";
  $("search-status").textContent = "Enter at least 2 characters to search Roblox users.";
  $("search-status").style.display = "block";
  $("user-search").focus();
}

/* =========================================
   SEARCH TARGET ROBLOX
========================================= */
async function searchUsers(query, sequence) {
  const controller = new AbortController();
  searchAbortController = controller;

  $("search-status").textContent = "Searching @" + query + "...";
  $("search-status").style.display = "block";

  try {
    const response = await fetch("/api/user?search=" + encodeURIComponent(query), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    const data = await response.json().catch(() => ({}));

    if (sequence !== searchSequence) return;

    if (!response.ok || !data.ok) {
      $("search-status").textContent = data.error || "Gagal menghubungi server Roblox.";
      return;
    }

    if (!data.found || !data.user) {
      $("search-status").textContent = "Target @" + query + " not found.";
      return;
    }

    const user = data.user;
    $("search-status").textContent = "Target found:";

    const row = document.createElement("button");
    row.type = "button";
    row.className = "result-user";

    const avatar = document.createElement("img");
    avatar.alt = "Avatar";

    const primaryAvatar = user.avatarUrl || DEFAULT_AVATAR;
    avatar.src = primaryAvatar;
    avatar.onerror = function() {
      if (this.src !== DEFAULT_AVATAR) {
        this.src = DEFAULT_AVATAR;
      }
    };

    const info = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = user.displayName || user.name;

    const handle = document.createElement("small");
    handle.textContent = "@" + user.name;

    info.append(name, handle);
    row.append(avatar, info);

    row.addEventListener("click", () => selectUser(user));
    $("search-results").innerHTML = "";
    $("search-results").appendChild(row);

  } catch (error) {
    if (error.name === "AbortError" || sequence !== searchSequence) return;
    $("search-status").textContent = "Koneksi terganggu. Silakan coba lagi.";
  }
}

function selectUser(user) {
  chosenUser = {
    id: String(user.id),
    name: String(user.name),
    displayName: String(user.displayName || user.name),
    avatarUrl: user.avatarUrl || DEFAULT_AVATAR
  };

  $("search-results").innerHTML = "";
  $("user-search").style.display = "none";
  
  $("search-status").textContent = "";
  $("search-status").style.display = "none";

  $("selected-display").textContent = chosenUser.displayName;
  $("selected-username").textContent = "@" + chosenUser.name;

  const avatarImg = $("selected-avatar");
  avatarImg.src = chosenUser.avatarUrl;
  avatarImg.onerror = function() {
    this.src = DEFAULT_AVATAR;
  };

  $("selected-user").style.display = "flex";
  $("send-btn").style.display = "flex";
}

/* =========================================
   SEND GIFT
========================================= */
function sendGift() {
  if (!chosenUser || isSendingGift) return;

  const btn = $("send-btn");
  const btnText = $("send-btn-text");
  const btnSpinner = $("send-btn-spinner");
  const backBtn = document.querySelector(".gift-back-link");

  isSendingGift = true;
  btn.disabled = true;

  if (btnText) btnText.style.display = "none";
  if (btnSpinner) btnSpinner.style.display = "block";
  if (backBtn) backBtn.style.pointerEvents = "none";

  setTimeout(() => {
    const item = ITEMS[selectedItem];

    balance = Math.max(0, balance - item.price);
    cartCount++;

    saveState();
    updateUI();
    $("cart-count").textContent = cartCount;

    $("success-item-name").textContent = item.name;
    $("success-target-name").textContent = "@" + chosenUser.name;

    $("gift-form").style.display = "none";
    $("gift-success").style.display = "block";

    isSendingGift = false;
    btn.disabled = false;
    if (btnText) btnText.style.display = "inline";
    if (btnSpinner) btnSpinner.style.display = "none";
    if (backBtn) backBtn.style.pointerEvents = "auto";
  }, 3000);
}

/* =========================================
   WINDOW EXPORTS
========================================= */
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.chooseProfilePhoto = chooseProfilePhoto;
window.resetProfilePhoto = resetProfilePhoto;
window.chooseVideo = chooseVideo;
window.removeVideo = removeVideo;
window.updateVideoStatus = updateVideoStatus;
window.nudgeLoopEnd = nudgeLoopEnd;
window.applyLoopPreset = applyLoopPreset;
window.saveCustomLoopPoints = saveCustomLoopPoints;
window.choosePhoto = choosePhoto;
window.removePhoto = removePhoto;
window.updatePhotoStatus = updatePhotoStatus;
window.handleBuy = handleBuy;
window.openGift = openGift;
window.closeGift = closeGift;
window.clearUser = clearUser;
window.sendGift = sendGift;
window.changeGiftItem = changeGiftItem;
window.handleLoginSubmit = handleLoginSubmit;
window.handleLogout = handleLogout;

/* =========================================
   INITIALIZATION & LISTENERS
========================================= */
document.addEventListener("DOMContentLoaded", async () => {
  video = $("character-video");
  still = $("character-image");
  viewer = $("viewer");

  checkAuthSession();
  loadAvatarFromStorage();

  const passInput = $("login-password");
  if (passInput) {
    passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLoginSubmit();
    });
  }

  const profileUpload = $("profile-upload");
  if (profileUpload) {
    profileUpload.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        return toast("Pilih file gambar yang valid!");
      }

      toast("Menyimpan foto profil...");
      compressAndSaveAvatar(file);
    });
  }

  const videoUpload = $("video-upload");
  if (videoUpload) {
    videoUpload.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
        return toast("Pilih file video yang valid (MP4, WebM, MOV)!");
      }

      const index = getVideoIndex();
      $("video-status").textContent = "Menyimpan video...";
      toast("Memproses video...");

      try {
        const recordData = {
          blob: file,
          name: file.name,
          savedAt: Date.now(),
          loop: { start: 0.0, end: 4.0 }
        };

        await dbPut(VIDEO_STORE, index, recordData);
        cachedVideos.set(index, recordData);

        if (selectedItem === index) {
          activateItemVideo(index);
        }
        await updateVideoStatus();

        toast(`Video ${ITEMS[index].name} berhasil disimpan!`);
      } catch (error) {
        console.error(error);
        $("video-status").textContent = "Gagal menyimpan video.";
        toast("Gagal menyimpan video.");
      }
    });
  }

  const photoUpload = $("photo-upload");
  if (photoUpload) {
    photoUpload.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        return toast("Pilih file gambar yang valid!");
      }

      const index = getPhotoIndex();
      $("photo-status").textContent = "Menyimpan foto...";

      try {
        await dbPut(PHOTO_STORE, index, {
          blob: file,
          name: file.name,
          savedAt: Date.now()
        });

        const oldURL = photoURLs.get(index);
        if (oldURL) URL.revokeObjectURL(oldURL);

        photoURLs.set(index, URL.createObjectURL(file));
        renderRecommendations();

        if (selectedItem === index && !cachedVideos.has(index)) {
          showStill();
        }

        await updatePhotoStatus();
        toast(`Foto ${ITEMS[index].name} berhasil disimpan!`);
      } catch (error) {
        console.error(error);
        toast("Gagal menyimpan foto item.");
      }
    });
  }

  const userSearchInput = $("user-search");
  if (userSearchInput) {
    userSearchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(searchTimer);
        const query = this.value.trim().replace(/^@+/, "");
        if (query.length >= 2) {
          searchUsers(query, ++searchSequence);
        }
      }
    });

    userSearchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      if (searchAbortController) searchAbortController.abort();

      const query = this.value.trim().replace(/^@+/, "");
      const sequence = ++searchSequence;

      chosenUser = null;
      $("selected-user").style.display = "none";
      $("send-btn").style.display = "none";
      $("search-results").innerHTML = "";

      if (query.length < 2) {
        $("search-status").textContent = "Enter at least 2 characters to search Roblox users.";
        $("search-status").style.display = "block";
        return;
      }

      $("search-status").textContent = "Searching @" + query + "...";
      $("search-status").style.display = "block";
      searchTimer = setTimeout(() => {
        searchUsers(query, sequence);
      }, 350);
    });
  }

  document.querySelectorAll(".modal-bg").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.classList.remove("show");
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeGift();
      closeSettings();
    }
  });

  for (let index = 0; index < ITEMS.length; index++) {
    const item = ITEMS[index];
    for (const id of ["video-item-select", "photo-item-select"]) {
      const el = $(id);
      if (el) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${index + 1}. ${item.name}`;
        el.appendChild(option);
      }
    }
  }

  await initMediaCache();
  await loadAllPhotos();
  
  selectItem(0);
});
