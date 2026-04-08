import { useState, useEffect } from "react";
import axios from "axios";
const AUTH_API = process.env.REACT_APP_AUTH_API;
const TICKET_API = process.env.REACT_APP_TICKET_API;
const COMMENT_API = process.env.REACT_APP_COMMENT_API;
// const API = "http://localhost:8000";

const COLORS = {
  Open: "#ef4444",
  "In Progress": "#f59e0b",
  Resolved: "#22c55e",
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};
const departments = [
  "IT",
  "HR",
  "Finance",
  "Sales",
  "Support",
  "Operations"
];

const rolesByDept = {
  IT: ["Developer", "Tester", "DevOps Engineer", "System Admin"],
  HR: ["HR Manager", "Recruiter"],
  Finance: ["Accountant", "Financial Analyst"],
  Sales: ["Sales Executive", "Sales Manager"],
  Support: ["Support Agent", "Technical Support"],
  Operations: ["Operations Executive", "Manager"]
};


// ─────────────────────────────────────────────────────────────
// COMPONENT 1 — TicketComments
// Shows a collapsible comment thread under each ticket row.
// Both users and admins can post comments.
// ─────────────────────────────────────────────────────────────
function TicketComments({ ticketId, user }) {
  // open      → whether the comment panel is expanded
  // comments  → array of comment objects fetched from backend
  // msg       → current value of the comment input box
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [msg, setMsg] = useState("");

  // Fetch comments for this ticket from the backend
  const loadComments = async () => {
    const res = await axios.get(`${COMMENT_API}/tickets/${ticketId}/comments`);
    setComments(res.data);
  };

  // Post a new comment, then reload the list
  const submitComment = async () => {
    if (!msg.trim()) return;
    await axios.post(`${COMMENT_API}/tickets/${ticketId}/comments`, {
      ticket_id: ticketId,
      username: user.username,
      role: user.role,
      message: msg,
      created_at: "",           // backend fills this with utcnow()
    });
    setMsg("");                  // clear input after sending
    loadComments();              // refresh the thread
  };

  // Load comments whenever the panel is opened
  useEffect(() => {
    if (open) loadComments();
  }, [open]);

  return (
    <div style={{ marginTop: 8 }}>

      {/* Toggle button — clicking expands / collapses the panel */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none", border: "none",
          color: "#38bdf8", cursor: "pointer",
          fontSize: 12, padding: 0,
        }}
      >
        {open ? "▲ Hide Comments" : "▼ Comments"}
      </button>

      {/* Panel — only rendered when open === true */}
      {open && (
        <div style={{
          marginTop: 10,
          paddingLeft: 12,
          borderLeft: "2px solid #334155",
        }}>

          {/* Empty state */}
          {comments.length === 0 && (
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0" }}>
              No comments yet.
            </p>
          )}

          {/* Comment list */}
          {comments.map(c => (
            <div key={c._id} style={{ marginBottom: 10 }}>

              {/* Author name — blue for admin, grey for user */}
              <span style={{
                color: c.role === "admin" ? "#38bdf8" : "#94a3b8",
                fontWeight: 600, fontSize: 12,
              }}>
                {c.role === "admin" ? "🛡 " : "👤 "}{c.username}
              </span>

              {/* Timestamp — sliced to "YYYY-MM-DD HH:MM" */}
              <span style={{ color: "#475569", fontSize: 11, marginLeft: 8 }}>
                {c.created_at.slice(0, 16).replace("T", " ")}
              </span>

              {/* Message body */}
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#e2e8f0" }}>
                {c.message}
              </p>
            </div>
          ))}

          {/* Input row — text box + Send button */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}
              placeholder="Write a comment…"
              style={{
                flex: 1, padding: "6px 10px",
                borderRadius: 6, border: "1px solid #475569",
                background: "#0f172a", color: "#e2e8f0", fontSize: 13,
              }}
            />
            <button
              onClick={submitComment}
              style={{
                padding: "6px 14px", borderRadius: 6,
                background: "#38bdf8", color: "#0f172a",
                border: "none", fontWeight: 600,
                cursor: "pointer", fontSize: 13,
              }}
            >
              Send
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 2 — StatsBar  (admin only)
// Fetches /stats once on mount and renders 5 stat cards.
// ─────────────────────────────────────────────────────────────
function StatsBar() {
  const [stats, setStats] = useState(null);

  // Fetch stats once when the component mounts
  useEffect(() => {
    axios.get(`${TICKET_API}/stats`).then(r => setStats(r.data));
  }, []);

  // Don't render anything until data arrives
  if (!stats) return null;

  const items = [
    { label: "Total Tickets",  value: stats.total,        color: "#38bdf8" },
    { label: "Open",           value: stats.open,         color: "#ef4444" },
    { label: "In Progress",    value: stats.in_progress,  color: "#f59e0b" },
    { label: "Resolved",       value: stats.resolved,     color: "#22c55e" },
    { label: "High Priority",  value: stats.high_priority,color: "#ef4444" },
  ];

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      {items.map(item => (
        <div
          key={item.label}
          style={{
            flex: 1, minWidth: 140,
            background: "#1e293b",
            border: `1px solid ${item.color}44`,
            borderRadius: 12, padding: "16px 20px", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>
            {item.value}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [tickets, setTickets] = useState([]);
  // const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [form, setForm] = useState({
  username: "",
  password: "",
  email: "",
  user_type: "user",   // ✅ NEW
  department: "",
  role: "",
  employee_id: ""
});
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", priority: "Medium" });
  const [msg, setMsg] = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  // ── AUTH ───────────────────────────────────────────────────

  const register = async () => {
    try {
      const res = await axios.post(`${AUTH_API}/register`, form);
      flash("✅ " + res.data.message);
      setPage("login");
    } catch (e) { flash("❌ " + (e.response?.data?.detail || "Something went wrong")); }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${AUTH_API}/login`, {
        username: form.username,
        password: form.password,
      });
      localStorage.setItem("token", res.data.access_token);
      setUser(res.data);
      setPage("dashboard");
      loadTickets(res.data);
    } catch (e) { flash("❌ " + (e.response?.data?.detail || "Login failed")); }
  };

  const logout = () => { setUser(null); setPage("login"); setTickets([]); };

  // ── TICKETS ────────────────────────────────────────────────

  const loadTickets = async (u = user) => {
    const url = u.user_type === "admin"
      ? `${TICKET_API}/tickets`
      : `${TICKET_API}/tickets/${u.username}`;
    const token = localStorage.getItem("token");

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
});
    setTickets(res.data);
  };

  const createTicket = async () => {
    if (!ticketForm.title) return flash("❌ Title is required");
    // await axios.post(`${API}/tickets`, { ...ticketForm, created_by: user.username });
    await axios.post(`${TICKET_API}/tickets`, {
      ...ticketForm,
      created_by: user.username,
      department: user.department,
      role: user.role,
      employee_id: user.employee_id
    });
    setTicketForm({ title: "", description: "", priority: "Medium" });
    flash("✅ Ticket created!");
    loadTickets();
  };

  const updateTicket = async (id, field, value) => {
  console.log("Updating:", field, value);   // ✅ ADD THIS

  await axios.put(`${TICKET_API}/tickets/${id}`, { [field]: value });

  loadTickets();
};

  const deleteTicket = async (id) => {
    await axios.delete(`${TICKET_API}/tickets/${id}`);
    flash("🗑 Ticket deleted");
    loadTickets();
  };

  useEffect(() => { if (user) loadTickets(); }, [user]);

  // ── STYLES ─────────────────────────────────────────────────

  const s = {
    app:        { fontFamily: "'Segoe UI', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", padding: 0, margin: 0 },
    nav:        { background: "#1e293b", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155" },
    logo:       { fontSize: 20, fontWeight: 700, color: "#38bdf8", letterSpacing: 1 },
    card:       { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, marginBottom: 20 },
    input:      { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", fontSize: 14, marginBottom: 12, boxSizing: "border-box" },
    btn:        { padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 },
    btnPrimary: { background: "#38bdf8", color: "#0f172a" },
    btnDanger:  { background: "#ef4444", color: "#fff", padding: "6px 14px", fontSize: 12 },
    btnGhost:   { background: "transparent", color: "#94a3b8", border: "1px solid #475569" },
    select:     { padding: "6px 10px", borderRadius: 6, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", fontSize: 13 },
    badge: (v) => ({ background: COLORS[v] + "22", color: COLORS[v], border: `1px solid ${COLORS[v]}44`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }),
    table:      { width: "100%", borderCollapse: "collapse" },
    th:         { textAlign: "left", padding: "10px 12px", background: "#0f172a", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    td:         { padding: "12px", borderBottom: "1px solid #1e293b", fontSize: 14 },
    flash:      { background: "#1e3a2e", border: "1px solid #22c55e44", color: "#22c55e", padding: "10px 18px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
    center:     { maxWidth: 420, margin: "80px auto", padding: "0 20px" },
    main:       { maxWidth: 960, margin: "0 auto", padding: 24 },
  };

 // ── LOGIN / REGISTER PAGE ──────────────────────────────────

if (page === "login" || page === "register") return (
  <div style={s.app}>
    <div style={s.nav}><span style={s.logo}>🎫 HelpDesk</span></div>
    <div style={s.center}>
      <div style={s.card}>
        <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>
          {page === "login" ? "Login" : "Register"}
        </h2>

        {msg && <div style={s.flash}>{msg}</div>}

        {/* Username */}
        <input
          style={s.input}
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />

        {/* ✅ EMAIL FIELD (ONLY FOR REGISTER) */}
        {page === "register" && (
          <input
            style={s.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        )}

        {/* Password */}
        <input
          style={s.input}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        {/* Role selection (Register only) */}
        {/* ✅ ADD THIS (User Type dropdown) */}
        {page === "register" && (
          <select
            style={s.input}
            value={form.user_type}
            onChange={(e) =>
              setForm({ ...form, user_type: e.target.value })
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}

        {/* Department */}
    {page === "register" && (
      <select
        style={s.input}
        value={form.department}
        onChange={(e) =>
          setForm({ ...form, department: e.target.value, role: "" })
        }
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
    )}

    {/* Role */}
    {page === "register" && (
      <select
        style={s.input}
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        disabled={!form.department}
      >
        <option value="">Select Role</option>
        {form.department &&
          rolesByDept[form.department].map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
      </select>
    )}

    {/* Employee ID */}
    {page === "register" && (
      <input
        style={s.input}
        placeholder="Employee ID"
        value={form.employee_id}
        onChange={(e) =>
          setForm({ ...form, employee_id: e.target.value })
        }
      />
    )}
            {/* Button */}
        <button
          style={{ ...s.btn, ...s.btnPrimary, width: "100%" }}
          onClick={page === "login" ? login : register}
        >
          {page === "login" ? "Login" : "Register"}
        </button>

        {/* Switch */}
        <p style={{ marginTop: 16, color: "#64748b", fontSize: 14, textAlign: "center" }}>
          {page === "login" ? "No account? " : "Have an account? "}
          <span
            style={{ color: "#38bdf8", cursor: "pointer" }}
            onClick={() => setPage(page === "login" ? "register" : "login")}
          >
            {page === "login" ? "Register" : "Login"}
          </span>
        </p>

      </div>
    </div>
  </div>
);

  // ── DASHBOARD PAGE ─────────────────────────────────────────

  return (
    <div style={s.app}>

      {/* NAV */}
      <div style={s.nav}>
        <span style={s.logo}>🎫 HelpDesk</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>
            👤 <b style={{ color: "#e2e8f0" }}>{user.username}</b>
            <span style={{ ...s.badge(user.user_type === "admin" ? "Resolved" : "Medium"), marginLeft: 8 }}>
              {user.role}
            </span>
          </span>
          <button style={{ ...s.btn, ...s.btnGhost, padding: "7px 16px" }} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={s.main}>
        {msg && <div style={s.flash}>{msg}</div>}

        {/* ── STATS BAR (admin only) ──────────────────────── */}
        {user.user_type === "admin" && <StatsBar />}

        {/* ── CREATE TICKET (users only) ──────────────────── */}
        {user.user_type === "user" && (
          <div style={s.card}>
            <h3 style={{ margin: "0 0 16px", color: "#38bdf8" }}>+ New Ticket</h3>
            <input
              style={s.input} placeholder="Title" value={ticketForm.title}
              onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
            />
            <textarea
              style={{ ...s.input, height: 80, resize: "vertical" }}
              placeholder="Describe your issue..." value={ticketForm.description}
              onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                style={s.select} value={ticketForm.priority}
                onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
              >
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={createTicket}>
                Submit Ticket
              </button>
            </div>
          </div>
        )}

        {/* ── TICKETS TABLE ───────────────────────────────── */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#38bdf8" }}>
              {user.user_type === "admin" ? "All Tickets" : "My Tickets"}
            </h3>
            <button
              style={{ ...s.btn, ...s.btnGhost, padding: "7px 16px" }}
              onClick={() => loadTickets()}
            >
              ↻ Refresh
            </button>
          </div>

          {tickets.length === 0
            ? <p style={{ color: "#475569", textAlign: "center", padding: 40 }}>No tickets found.</p>
            : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Title</th>
                    <th style={s.th}>Created By</th>
                    <th style={s.th}>Priority</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Department</th>
                    <th style={s.th}>Role</th>
                    <th style={s.th}>Emp ID</th>
                    {user.user_type === "admin" && <th style={s.th}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t._id}>

                      {/* Title + description + comment thread */}
                      <td style={s.td}>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                          {t.description}
                        </div>
                        {/* TicketComments sits here, under every ticket row */}
                        <TicketComments ticketId={t._id} user={user} />
                      </td>

                      <td style={s.td}>{t.created_by}</td>
                      <td style={s.td}><span style={s.badge(t.priority)}>{t.priority}</span></td>
                      <td style={s.td}><span style={s.badge(t.status)}>{t.status}</span></td>
                      <td style={s.td}>{t.department}</td>
                      <td style={s.td}>{t.role}</td>
                      <td style={s.td}>{t.employee_id}</td>

                      {/* Admin action controls */}
                      {user.user_type === "admin" && (
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <select
                              style={s.select} value={t.status}
                              onChange={e => updateTicket(t._id, "status", e.target.value.trim())}
                            >
                              <option>Open</option>
                              <option>In Progress</option>
                              <option>Resolved</option>
                            </select>
                            <select
                              style={s.select} value={t.priority}
                              onChange={e => updateTicket(t._id, "priority", e.target.value.trim())}
                            >
                              <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                            <button
                              style={{ ...s.btn, ...s.btnDanger }}
                              onClick={() => deleteTicket(t._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

      </div>
    </div>
  );
}
