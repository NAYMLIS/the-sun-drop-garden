import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Auth notes
 * ----------
 * Convex's runtime is V8 isolate (not Node), so we can't use `crypto.scrypt`.
 * Instead we use the Web Crypto API (PBKDF2) which is available in Convex.
 *
 * Password storage format: `pbkdf2$<iterations>$<saltB64>$<hashB64>`
 *
 * Sessions: opaque random tokens stored in `curatorSessions`, 30-day expiry.
 * The token is set as an HttpOnly cookie by the Next.js login route.
 */

const PBKDF2_ITERATIONS = 100_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) {
    s += String.fromCharCode(b);
  }
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    out[i] = s.charCodeAt(i);
  }
  return out;
}

async function hashPassword(
  password: string,
  saltBytes?: Uint8Array
): Promise<string> {
  const salt = saltBytes ?? crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256
  );
  const hashBytes = new Uint8Array(derivedBits);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hashBytes)}`;
}

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }
  const saltBytes = b64ToBytes(parts[2]);
  const expectedHashB64 = parts[3];
  const recomputed = await hashPassword(password, saltBytes);
  const recomputedHashB64 = recomputed.split("$")[3];
  // constant-time-ish compare
  if (expectedHashB64.length !== recomputedHashB64.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expectedHashB64.length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: constant-time XOR compare
    diff |= expectedHashB64.charCodeAt(i) ^ recomputedHashB64.charCodeAt(i);
  }
  return diff === 0;
}

const TOKEN_PLUS_RE = /\+/g;
const TOKEN_SLASH_RE = /\//g;
const TOKEN_PADDING_RE = /=+$/;

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToB64(bytes)
    .replace(TOKEN_PLUS_RE, "-")
    .replace(TOKEN_SLASH_RE, "_")
    .replace(TOKEN_PADDING_RE, "");
}

/* ---------------- ACCOUNT MGMT ---------------- */

// Provision a new curator. Used by admin once to create ((( O )))'s account.
export const createCurator = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("curators")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (existing) {
      throw new Error("Account already exists for that email.");
    }
    const passwordHash = await hashPassword(args.password);
    return await ctx.db.insert("curators", {
      email: normalized,
      passwordHash,
      displayName: args.displayName,
      createdAt: Date.now(),
    });
  },
});

export const setPassword = mutation({
  args: { email: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("curators")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (!user) {
      throw new Error("No such curator.");
    }
    const passwordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, { passwordHash });
  },
});

/* ---------------- LOGIN / SESSION ---------------- */

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("curators")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    if (!user) {
      // generic error to avoid email enumeration
      throw new Error("Invalid email or password.");
    }
    const ok = await verifyPassword(args.password, user.passwordHash);
    if (!ok) {
      throw new Error("Invalid email or password.");
    }

    const token = randomToken();
    const now = Date.now();
    await ctx.db.insert("curatorSessions", {
      token,
      email: normalized,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    await ctx.db.patch(user._id, { lastLoginAt: now });

    return {
      token,
      email: normalized,
      displayName: user.displayName,
      expiresAt: now + SESSION_TTL_MS,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("curatorSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const token = args.token;
    if (!token) {
      return null;
    }
    const session = await ctx.db
      .query("curatorSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      return null;
    }
    const user = await ctx.db
      .query("curators")
      .withIndex("by_email", (q) => q.eq("email", session.email))
      .first();
    if (!user) {
      return null;
    }
    return {
      email: user.email,
      displayName: user.displayName,
    };
  },
});

// House-keeping: delete sessions older than expiry.
export const purgeExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("curatorSessions").collect();
    let purged = 0;
    const now = Date.now();
    for (const s of all) {
      if (s.expiresAt < now) {
        await ctx.db.delete(s._id);
        purged++;
      }
    }
    return { purged };
  },
});
