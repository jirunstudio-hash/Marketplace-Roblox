// Vercel Serverless Function: /api/login
//
// Atur MEMBERS_JSON dan JWT_SECRET di:
// Vercel Project Settings > Environment Variables

const crypto = require("crypto");

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;

  if (
    !/^[a-f0-9]+$/i.test(a) ||
    !/^[a-f0-9]+$/i.test(b) ||
    a.length !== b.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a, "hex"),
    Buffer.from(b, "hex")
  );
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      error: "Method tidak diizinkan."
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return res.status(500).json({
      ok: false,
      error: "JWT_SECRET belum diatur di Vercel."
    });
  }

  let members;

  try {
    members = JSON.parse(process.env.MEMBERS_JSON || "[]");
  } catch {
    return res.status(500).json({
      ok: false,
      error: "MEMBERS_JSON bukan JSON yang valid."
    });
  }

  if (!Array.isArray(members)) {
    return res.status(500).json({
      ok: false,
      error: "Konfigurasi anggota tidak valid."
    });
  }

  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 80 ||
    password.length > 200
  ) {
    return res.status(400).json({
      ok: false,
      error: "Username dan password wajib diisi."
    });
  }

  const member = members.find(m =>
    m &&
    typeof m.username === "string" &&
    m.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (
    !member ||
    typeof member.salt !== "string" ||
    typeof member.passwordHash !== "string"
  ) {
    return res.status(401).json({
      ok: false,
      error: "Username atau password salah."
    });
  }

  const candidate = crypto
    .scryptSync(password, member.salt, 64)
    .toString("hex");

  if (!safeEqualHex(candidate, member.passwordHash)) {
    return res.status(401).json({
      ok: false,
      error: "Username atau password salah."
    });
  }

  const payload = Buffer.from(JSON.stringify({
    sub: member.username,
    role: typeof member.role === "string" ? member.role : "member",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return res.status(200).json({
    ok: true,
    token: `${payload}.${signature}`,
    user: {
      username: member.username,
      role: member.role || "member"
    },
    expiresIn: 28800
  });
};
