import { openMultiplayerWebSocket } from "./multiplayerWs";
import { reportMultiplayerDiagnostic } from "../utils/multiplayerDiagnostics";

export type MultiplayerRelayConnState =
  | "connecting"
  | "open"
  | "closed"
  | "error";

type ConnListener = (state: MultiplayerRelayConnState) => void;

let ws: WebSocket | null = null;
let activeToken: string | null = null;
const messageListeners = new Set<(data: unknown) => void>();
const connListeners = new Set<ConnListener>();

function notifyConn(state: MultiplayerRelayConnState) {
  connListeners.forEach((cb) => cb(state));
}

function attachSocket(socket: WebSocket) {
  ws = socket;
  socket.onopen = () => {
    notifyConn("open");
    reportMultiplayerDiagnostic("relay_open");
  };
  socket.onclose = () => {
    notifyConn("closed");
    reportMultiplayerDiagnostic("relay_closed");
    if (ws === socket) {
      ws = null;
      activeToken = null;
    }
  };
  socket.onerror = () => {
    notifyConn("error");
    reportMultiplayerDiagnostic("relay_error");
  };
  socket.onmessage = (ev) => {
    try {
      const raw = typeof ev.data === "string" ? ev.data : String(ev.data);
      const data = JSON.parse(raw) as unknown;
      messageListeners.forEach((fn) => fn(data));
    } catch {
      reportMultiplayerDiagnostic("relay_message_parse_error");
    }
  };
}

/**
 * Single WebSocket for the multiplayer relay (lobby + hero picker + in-game).
 * Call {@link disconnectMultiplayerRelay} when leaving online play (e.g. back to menu).
 */
export function connectMultiplayerRelay(wsToken: string): void {
  if (ws?.readyState === WebSocket.OPEN && activeToken === wsToken) {
    return;
  }

  if (ws) {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    ws = null;
  }

  activeToken = wsToken;
  notifyConn("connecting");
  const socket = openMultiplayerWebSocket(wsToken);
  attachSocket(socket);
  void import("./multiplayerRoundState").then((m) => m.attachRoundStateListener());
  void import("./multiplayerVoteSync").then((m) => m.attachVoteCastListener());
  void import("./multiplayerAnswerSync").then((m) => m.attachAnswerCastListener());
}

export function disconnectMultiplayerRelay(): void {
  if (ws) {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }
  ws = null;
  activeToken = null;
  notifyConn("closed");
}

export function sendMultiplayerRelay(payload: Record<string, unknown>): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    reportMultiplayerDiagnostic("relay_send_skipped_not_open", {
      type:
        typeof payload.type === "string" ? payload.type : "unknown_payload_type",
      hasSocket: Boolean(ws),
      readyState: ws?.readyState ?? null,
    });
    return;
  }
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    reportMultiplayerDiagnostic("relay_send_failed", {
      type:
        typeof payload.type === "string" ? payload.type : "unknown_payload_type",
    });
  }
}

export function getMultiplayerRelaySocket(): WebSocket | null {
  return ws;
}

export function subscribeMultiplayerRelay(
  fn: (data: unknown) => void,
): () => void {
  messageListeners.add(fn);
  return () => {
    messageListeners.delete(fn);
  };
}

export function subscribeMultiplayerConnection(
  fn: ConnListener,
): () => void {
  connListeners.add(fn);
  const s = getMultiplayerRelaySocket();
  if (s) {
    if (s.readyState === WebSocket.OPEN) fn("open");
    else if (s.readyState === WebSocket.CONNECTING) fn("connecting");
    else fn("closed");
  }
  return () => {
    connListeners.delete(fn);
  };
}
