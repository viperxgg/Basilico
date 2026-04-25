import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getRuntimeEnv } from "@/lib/config/runtime-env";

const SCRYPT_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

function getPepperedPassword(password: string) {
  const pepper = getRuntimeEnv().auth.passwordPepper;
  return pepper ? `${password}:${pepper}` : password;
}

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const digest = scryptSync(
    getPepperedPassword(password),
    salt,
    KEY_LENGTH
  ).toString("hex");

  return `${SCRYPT_PREFIX}:${salt}:${digest}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, expectedDigest] = passwordHash.split(":");

  if (
    algorithm !== SCRYPT_PREFIX ||
    !salt ||
    !expectedDigest ||
    expectedDigest.length % 2 !== 0
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedDigest, "hex");
    const actual = scryptSync(
      getPepperedPassword(password),
      salt,
      expected.length
    );

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
