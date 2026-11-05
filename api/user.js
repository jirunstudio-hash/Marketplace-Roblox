// /api/user.js
// Multi-Gateway Failover & Robust Avatar Engine

const ROBLOX_HOSTS = [
  "https://users.roblox.com",
  "https://users.roproxy.com",
  "https://users.ff-roproxy.com"
];

const THUMB_HOSTS = [
  "https://thumbnails.roblox.com",
  "https://thumbnails.roproxy.com",
  "https://thumbnails.ff-roproxy.com"
];

const userCache = new Map();
const avatarCache = new Map();

// Helper fetch dengan multi-gateway
async function fetchWithFallback(hosts, path, options = {}, timeoutMs = 5000) {
  for (const host of hosts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${host}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
          ...(options.headers || {})
        }
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) return { ok: true, data: json };
      }
    } catch (err) {
      clearTimeout(timer);
    }
  }

  return { ok: false, data: null };
}

// Ambil Avatar Headshot dengan Multi-Level Fallback
async function getRobloxAvatar(userId) {
  if (avatarCache.has(userId)) {
    return avatarCache.get(userId);
  }

  // 1. Coba Headshot 150x150 Lingkaran
  const headshotPath = `/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
  const res1 = await fetchWithFallback(THUMB_HOSTS, headshotPath, {}, 4000);

  if (res1.ok && res1.data?.data?.[0]?.imageUrl) {
    const imgUrl = res1.data.data[0].imageUrl;
    avatarCache.set(userId, imgUrl);
    return imgUrl;
  }

  // 2. Fallback: Coba Avatar Full Body / Bust jika Headshot sedang review/tertunda
  const bustPath = `/v1/users/avatar-bust?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
  const res2 = await fetchWithFallback(THUMB_HOSTS, bustPath, {}, 3500);

  if (res2.ok && res2.data?.data?.[0]?.imageUrl) {
    const imgUrl = res2.data.data[0].imageUrl;
    avatarCache.set(userId, imgUrl);
    return imgUrl;
  }

  // 3. Fallback: CDN Avatar Headshot Default Roblox
  const fallbackUrl = "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-117565355-Png/150/150/AvatarHeadshot/Png/noFilter";
  return fallbackUrl;
}

// Deteksi Target Akurat 100%
async function detectExactRobloxTarget(rawInput) {
  const clean = String(rawInput || "").trim().replace(/^@+/, "");
  if (!clean) return null;

  const key = clean.toLowerCase();
  if (userCache.has(key)) {
    return userCache.get(key);
  }

  let match = null;

  // METODE 1: Lookup Exact Username (v1/usernames/users)
  const primaryRes = await fetchWithFallback(
    ROBLOX_HOSTS,
    "/v1/usernames/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [clean],
        excludeBannedUsers: false
      })
    }
  );

  if (primaryRes.ok && Array.isArray(primaryRes.data?.data)) {
    match = primaryRes.data.data.find(
      u => u && typeof u.name === "string" && u.name.toLowerCase() === key
    );

    if (!match && primaryRes.data.data[0]?.requestedUsername?.toLowerCase() === key) {
      match = primaryRes.data.data[0];
    }
  }

  // METODE 2: Cek User ID numerik
  if (!match && /^\d{3,15}$/.test(clean)) {
    const idRes = await fetchWithFallback(ROBLOX_HOSTS, `/v1/users/${clean}`);
    if (idRes.ok && idRes.data && idRes.data.id) {
      match = {
        id: idRes.data.id,
        name: idRes.data.name,
        displayName: idRes.data.displayName || idRes.data.name
      };
    }
  }

  // METODE 3: Fallback Search (Jika username baru ganti / riwayat nama)
  if (!match) {
    const searchRes = await fetchWithFallback(
      ROBLOX_HOSTS,
      `/v1/users/search?keyword=${encodeURIComponent(clean)}&limit=15`
    );

    if (searchRes.ok && Array.isArray(searchRes.data?.data)) {
      match = searchRes.data.data.find(
        u => u && typeof u.name === "string" && u.name.toLowerCase() === key
      );

      if (!match) {
        match = searchRes.data.data.find(
          u => Array.isArray(u.previousUsernames) &&
               u.previousUsernames.some(prev => prev.toLowerCase() === key)
        );
      }
    }
  }

  if (!match) {
    userCache.set(key, null);
    setTimeout(() => userCache.delete(key), 20000);
    return null;
  }

  const userId = String(match.id);
  const avatarUrl = await getRobloxAvatar(userId);

  const finalUser = {
    id: userId,
    name: match.name,
    displayName: match.displayName || match.name,
    avatarUrl: avatarUrl
  };

  userCache.set(key, finalUser);
  return finalUser;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method tidak diizinkan." });
  }

  try {
    const { search, username, avatar, id } = req.query || {};

    if (search !== undefined || username !== undefined) {
      const query = String(search ?? username ?? "").trim().replace(/^@+/, "");

      if (query.length < 2) {
        return res.status(400).json({
          ok: false,
          error: "Username minimal 2 karakter."
        });
      }

      const target = await detectExactRobloxTarget(query);

      if (!target) {
        return res.status(200).json({
          ok: true,
          found: false,
          user: null
        });
      }

      return res.status(200).json({
        ok: true,
        found: true,
        user: target
      });
    }

    if (avatar !== undefined) {
      const img = await getRobloxAvatar(String(avatar).trim());
      return res.status(200).json({ ok: true, imageUrl: img });
    }

    if (id !== undefined) {
      const idRes = await fetchWithFallback(ROBLOX_HOSTS, `/v1/users/${encodeURIComponent(id)}`);
      return res.status(200).json({ ok: idRes.ok, user: idRes.data });
    }

    return res.status(400).json({ ok: false, error: "Parameter tidak lengkap." });

  } catch (error) {
    return res.status(500).json({ ok: false, error: "Terjadi kesalahan server." });
  }
};
