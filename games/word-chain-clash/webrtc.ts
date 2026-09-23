import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import type { P2PMessage } from "./types";

export type PeerStatus =
  | "idle"
  | "connecting"
  | "waiting_for_peer"
  | "connected"
  | "disconnected"
  | "error";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable without confusing 0/O, 1/I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class P2PManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private isHost: boolean = false;
  private roomCode: string = "";
  private onMessageCallback?: (msg: P2PMessage) => void;
  private onStatusChangeCallback?: (status: PeerStatus, error?: string) => void;
  private isDestroyed: boolean = false;

  constructor(
    onMessage: (msg: P2PMessage) => void,
    onStatusChange: (status: PeerStatus, error?: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
  }

  private setStatus(status: PeerStatus, error?: string) {
    if (this.isDestroyed) return;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status, error);
    }
  }

  /**
   * Host creates a room with code, with automatic retry if ID was held by recent refresh.
   */
  public async createRoom(code: string, retryCount = 0): Promise<string> {
    this.isHost = true;
    this.isDestroyed = false;
    this.roomCode = code.toUpperCase();
    this.setStatus("connecting");

    const { default: PeerClass } = await import("peerjs");

    if (this.isDestroyed) return this.roomCode;

    // Clean up any previous instance
    if (this.peer) {
      try {
        this.peer.disconnect();
        this.peer.destroy();
      } catch {
        // silent
      }
      this.peer = null;
    }

    const hostPeerId = `wc-clash-${this.roomCode}-host`;
    const peerInstance = new PeerClass(hostPeerId, {
      debug: 1,
    });
    this.peer = peerInstance;

    return new Promise((resolve, reject) => {
      let isResolved = false;

      peerInstance.on("open", () => {
        if (this.isDestroyed) {
          try {
            peerInstance.destroy();
          } catch {}
          return;
        }
        isResolved = true;
        this.setStatus("waiting_for_peer");
        resolve(this.roomCode);
      });

      peerInstance.on("connection", (conn: DataConnection) => {
        if (this.isDestroyed) {
          try {
            conn.close();
          } catch {}
          return;
        }
        this.setupConnection(conn);
      });

      peerInstance.on("error", async (err: Error & { type?: string }) => {
        console.warn("PeerJS host error:", err?.type || err?.message || err);

        // Handle unavailable-id error (recent refresh / React StrictMode)
        if (err?.type === "unavailable-id" && retryCount < 4 && !this.isDestroyed) {
          this.setStatus("connecting", "Reconnecting room session...");
          try {
            peerInstance.destroy();
          } catch {}
          await new Promise((r) => setTimeout(r, 1200));
          if (this.isDestroyed) return;
          return this.createRoom(code, retryCount + 1).then(resolve).catch(reject);
        }

        if (!isResolved && !this.isDestroyed) {
          this.setStatus("error", err?.message || "Failed to create room.");
          reject(err);
        }
      });
    });
  }

  /**
   * Guest joins an existing room by code, with retry if host is still opening socket.
   */
  public async joinRoom(code: string, retryCount = 0): Promise<void> {
    this.isHost = false;
    this.isDestroyed = false;
    this.roomCode = code.toUpperCase();
    this.setStatus("connecting");

    const { default: PeerClass } = await import("peerjs");

    if (this.isDestroyed) return;

    if (this.peer) {
      try {
        this.peer.disconnect();
        this.peer.destroy();
      } catch {
        // silent
      }
      this.peer = null;
    }

    const guestPeerId = `wc-clash-${this.roomCode}-guest-${Math.random().toString(36).substring(2, 8)}`;
    const peerInstance = new PeerClass(guestPeerId, {
      debug: 1,
    });
    this.peer = peerInstance;

    return new Promise((resolve, reject) => {
      let isResolved = false;

      peerInstance.on("open", () => {
        if (this.isDestroyed) {
          try {
            peerInstance.destroy();
          } catch {}
          return;
        }
        isResolved = true;
        const hostPeerId = `wc-clash-${this.roomCode}-host`;
        const conn = peerInstance.connect(hostPeerId, {
          reliable: true,
        });

        this.setupConnection(conn);
        resolve();
      });

      peerInstance.on("error", async (err: Error & { type?: string }) => {
        console.warn("PeerJS guest error:", err?.type || err?.message || err);

        // If host isn't ready yet, retry up to 3 times
        if (err?.type === "peer-unavailable" && retryCount < 3 && !this.isDestroyed) {
          this.setStatus("connecting", "Waiting for host to be ready...");
          try {
            peerInstance.destroy();
          } catch {}
          await new Promise((r) => setTimeout(r, 1500));
          if (this.isDestroyed) return;
          return this.joinRoom(code, retryCount + 1).then(resolve).catch(reject);
        }

        if (!isResolved && !this.isDestroyed) {
          this.setStatus("error", "Could not find room or connect to host.");
          reject(err);
        }
      });
    });
  }

  private setupConnection(conn: DataConnection) {
    this.conn = conn;

    this.conn.on("open", () => {
      if (this.isDestroyed) {
        try {
          conn.close();
        } catch {}
        return;
      }
      this.setStatus("connected");
    });

    this.conn.on("data", (data: unknown) => {
      if (this.isDestroyed) return;
      if (this.onMessageCallback && data) {
        this.onMessageCallback(data as P2PMessage);
      }
    });

    this.conn.on("close", () => {
      if (!this.isDestroyed) {
        this.setStatus("disconnected", "Opponent disconnected.");
      }
    });

    this.conn.on("error", (err: Error) => {
      console.error("Connection error:", err);
      if (!this.isDestroyed) {
        this.setStatus("error", err?.message || "Connection error.");
      }
    });
  }

  public send(msg: P2PMessage): boolean {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
      return true;
    }
    return false;
  }

  public destroy() {
    this.isDestroyed = true;
    try {
      if (this.conn) {
        this.conn.close();
        this.conn = null;
      }
      if (this.peer) {
        this.peer.disconnect();
        this.peer.destroy();
        this.peer = null;
      }
    } catch (e) {
      console.warn("Error destroying peer connection:", e);
    }
    this.setStatus("idle");
  }
}
