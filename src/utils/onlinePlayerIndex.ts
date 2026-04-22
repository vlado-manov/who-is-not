/** Index of the current device’s player in `players` (online multiplayer). */
export function getOnlinePlayerIndex(
  players: { id: string }[],
  onlinePlayerId: string | undefined,
): number {
  if (!onlinePlayerId) return 0;
  const i = players.findIndex((p) => p.id === onlinePlayerId);
  return i >= 0 ? i : 0;
}
