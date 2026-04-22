/** Opaque id for multiplayer API (min 8 chars). */
export function createOpaquePlayerId(prefix: "host" | "guest" = "guest"): string {
  const tail = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  return `${prefix}_${tail}`;
}
