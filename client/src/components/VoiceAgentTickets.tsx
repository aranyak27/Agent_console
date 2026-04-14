import { useState, useEffect, useCallback } from "react";

const VOICE_AGENT_API = "https://voice-agent-aranyaktripathi.replit.app";
const POLL_INTERVAL_MS = 30_000;

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high";

interface VoiceTicket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  conversationId: number | null;
  createdAt: string;
  updatedAt: string;
  source: "voice-agent";
  callbackUrl: string;
}

export function useVoiceAgentTickets() {
  const [tickets, setTickets] = useState<VoiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`${VOICE_AGENT_API}/support/webhook/tickets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VoiceTicket[] = await res.json();
      setTickets(data);
      setError(null);
    } catch {
      setError("Could not reach Voice Agent API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const updateStatus = useCallback(
    async (ticket: VoiceTicket, status: TicketStatus, note?: string) => {
      setUpdating(ticket.id);
      try {
        const res = await fetch(ticket.callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, status } : t))
        );
      } catch {
        alert("Failed to update ticket status. Please try again.");
      } finally {
        setUpdating(null);
      }
    },
    []
  );

  return { tickets, loading, error, updating, refresh: fetchTickets, updateStatus };
}

const PRIORITY_STYLE: Record<Priority, React.CSSProperties> = {
  high: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
  medium: { background: "#fef9c3", color: "#ca8a04", border: "1px solid #fde68a" },
  low: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
};

const STATUS_STYLE: Record<TicketStatus, React.CSSProperties> = {
  open: { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
  in_progress: { background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" },
  resolved: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  closed: { background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" },
};

export function VoiceAgentTickets() {
  const { tickets, loading, error, updating, refresh, updateStatus } = useVoiceAgentTickets();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", padding: "24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 600 }}>📞 Voice Agent Tickets</span>
            {openCount > 0 && (
              <span style={{ background: "#dc2626", color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 700, padding: "2px 8px" }}>
                {openCount} new
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Tickets raised by the AI voice support agent · auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={refresh}
          data-testid="button-refresh-voice-tickets"
          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => {
          const count = s === "all" ? tickets.length : tickets.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              data-testid={`filter-${s}`}
              style={{
                padding: "4px 12px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                border: "1px solid " + (filter === s ? "#2563eb" : "#e5e7eb"),
                background: filter === s ? "#eff6ff" : "#fff",
                color: filter === s ? "#2563eb" : "#374151",
                fontWeight: filter === s ? 600 : 400,
              }}
            >
              {s === "all" ? "All" : s.replace("_", " ")} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Loading voice agent tickets…</p>}
      {error && (
        <div style={{ padding: 16, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", marginBottom: 16 }}>
          ⚠ {error} — check that the Voice Agent API is reachable.
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>
          No tickets{filter !== "all" ? ` with status "${filter}"` : ""} yet.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((ticket) => {
          const expanded = expandedId === ticket.id;
          return (
            <div
              key={ticket.id}
              data-testid={`card-voice-ticket-${ticket.id}`}
              style={{
                border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
                boxShadow: expanded ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                transition: "box-shadow 0.2s",
              }}
            >
              <div
                style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "#fff" }}
                onClick={() => setExpandedId(expanded ? null : ticket.id)}
                data-testid={`toggle-ticket-${ticket.id}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>#{ticket.id}</span>
                    <span style={{ fontSize: 14, color: "#111" }}>{ticket.title}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, ...PRIORITY_STYLE[ticket.priority] }}>
                      {ticket.priority}
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, ...STATUS_STYLE[ticket.status] }}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                    {ticket.conversationId ? ` · Call #${ticket.conversationId}` : ""}
                  </p>
                </div>
                <span style={{ color: "#9ca3af", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
              </div>

              {expanded && (
                <div style={{ borderTop: "1px solid #f3f4f6", padding: "16px 18px", background: "#fafafa" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {ticket.description || "No description provided."}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ticket.status !== "in_progress" && ticket.status !== "resolved" && ticket.status !== "closed" && (
                      <button
                        onClick={() => updateStatus(ticket, "in_progress", "Picked up by agent")}
                        disabled={updating === ticket.id}
                        data-testid={`button-pickup-${ticket.id}`}
                        style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                      >
                        {updating === ticket.id ? "…" : "▶ Pick Up"}
                      </button>
                    )}
                    {ticket.status !== "resolved" && ticket.status !== "closed" && (
                      <button
                        onClick={() => updateStatus(ticket, "resolved", "Resolved by agent console")}
                        disabled={updating === ticket.id}
                        data-testid={`button-resolve-${ticket.id}`}
                        style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                      >
                        {updating === ticket.id ? "…" : "✓ Resolve"}
                      </button>
                    )}
                    {ticket.status !== "closed" && (
                      <button
                        onClick={() => updateStatus(ticket, "closed")}
                        disabled={updating === ticket.id}
                        data-testid={`button-close-${ticket.id}`}
                        style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13 }}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        Connected to Voice Agent API · {tickets.length} total tickets
      </p>
    </div>
  );
}

export default VoiceAgentTickets;
