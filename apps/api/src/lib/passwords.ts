import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

/** Hashes a plaintext password into a `salt:hash` string, both hex-encoded. */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(plainTextPassword, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/** Verifies a plaintext password against a hash produced by hashPassword(). */
export async function verifyPassword(plainTextPassword: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;

  const expectedKey = Buffer.from(hashHex, "hex");
  const derivedKey = (await scryptAsync(plainTextPassword, salt, KEY_LENGTH)) as Buffer;

  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}
