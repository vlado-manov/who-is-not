import { getApiBaseUrl } from "./client";

/**
 * Builds a WebSocket URL for the multiplayer relay on the same host as the REST API.
 */
export function getMultiplayerWebSocketUrl(wsToken: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const isHttps = base.startsWith("https://");
  const rest = isHttps
    ? base.slice("https://".length)
    : base.startsWith("http://")
      ? base.slice("http://".length)
      : base;
  const wsScheme = isHttps ? "wss://" : "ws://";
  const token = encodeURIComponent(wsToken);
  return `${wsScheme}${rest}/ws/multiplayer?token=${token}`;
}

/**
 * Opens a WebSocket to the multiplayer relay. Caller should attach `onopen`, `onmessage`, `onerror`, `onclose`.
 */
export function openMultiplayerWebSocket(wsToken: string): WebSocket {
  const url = getMultiplayerWebSocketUrl(wsToken);
  return new WebSocket(url);
}
