import { useState } from "react";

// ── ICONS ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  file:       "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  search:     "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  upload:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  users:      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  download:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  trash:      "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  plus:       "M12 5v14 M5 12h14",
  chevron:    "M9 18l6-6-6-6",
  home:       "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  tag:        "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  close:      "M18 6L6 18 M6 6l12 12",
  check:      "M20 6L9 17l-5-5",
  alert:      "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  filter:     "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #F7F8FA;
    --surface:   #FFFFFF;
    --surface2:  #F0F2F5;
    --border:    #E2E6EC;
    --navy:      #1A2744;
    --navy-mid:  #2A3D6B;
    --teal:      #0B8FC9;
    --teal-light:#E8F6FD;
    --accent:    #0EA5E9;
    --green:     #059669;
    --green-bg:  #ECFDF5;
    --amber:     #D97706;
    --amber-bg:  #FFFBEB;
    --red:       #DC2626;
    --red-bg:    #FEF2F2;
    --text:      #111827;
    --text-2:    #4B5563;
    --text-3:    #9CA3AF;
    --radius:    10px;
    --shadow:    0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
    --shadow-md: 0 4px 20px rgba(0,0,0,.10);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text);
  }

  body { background: var(--bg); }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 224px; flex-shrink: 0;
    background: var(--navy);
    display: flex; flex-direction: column;
    padding: 0;
  }
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .sidebar-logo-mark {
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--teal);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 13px; letter-spacing: -.5px;
  }
  .logo-name { color: white; font-weight: 600; font-size: 14px; line-height: 1.2; }
  .logo-sub  { color: rgba(255,255,255,.45); font-size: 11px; font-weight: 400; }

  .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .nav-section-label {
    color: rgba(255,255,255,.35); font-size: 10.5px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    padding: 10px 10px 4px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 7px;
    color: rgba(255,255,255,.62); font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all .15s;
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .nav-item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
  .nav-item.active { background: rgba(11,143,201,.25); color: #7DD3F7; }
  .nav-item.active svg { color: #7DD3F7; }

  .sidebar-footer {
    padding: 12px 10px;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .sidebar-user {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 7px;
  }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--teal); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .avatar.sm { width: 28px; height: 28px; font-size: 10px; }
  .avatar.lg { width: 40px; height: 40px; font-size: 14px; }
  .user-info { flex: 1; min-width: 0; }
  .user-name  { color: rgba(255,255,255,.88); font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role  { color: rgba(255,255,255,.4); font-size: 11px; }

  /* ── MAIN ── */
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

  .topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    height: 60px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .page-title { font-size: 18px; font-weight: 600; color: var(--text); }
  .breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--text-3); font-size: 12.5px; }
  .breadcrumb-sep { opacity: .5; }

  .page-content { flex: 1; padding: 28px; }

  /* ── CARDS ── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .card-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-title { font-size: 14px; font-weight: 600; }
  .card-body  { padding: 20px 22px; }

  /* ── STAT CARDS ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px;
    box-shadow: var(--shadow);
  }
  .stat-label { color: var(--text-2); font-size: 12px; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .04em; }
  .stat-value { font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; }
  .stat-sub   { font-size: 11.5px; color: var(--text-3); margin-top: 6px; }
  .stat-icon  { float: right; margin-top: -2px; opacity: .15; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 7px;
    font-size: 13.5px; font-weight: 500; cursor: pointer;
    border: none; transition: all .15s; white-space: nowrap;
    font-family: inherit;
  }
  .btn-primary {
    background: var(--teal); color: white;
  }
  .btn-primary:hover { background: #0980B5; }
  .btn-secondary {
    background: var(--surface2); color: var(--text-2);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { background: var(--border); }
  .btn-danger  { background: var(--red-bg); color: var(--red); border: 1px solid #FECACA; }
  .btn-danger:hover { background: #FEE2E2; }
  .btn-ghost   { background: transparent; color: var(--text-2); border: 1px solid transparent; }
  .btn-ghost:hover { background: var(--surface2); }
  .btn-sm      { padding: 5px 11px; font-size: 12.5px; border-radius: 6px; }
  .btn-icon    { padding: 7px; border-radius: 7px; }

  /* ── BADGES ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 9px; border-radius: 99px;
    font-size: 11.5px; font-weight: 500;
  }
  .badge-teal   { background: var(--teal-light); color: #0369A1; }
  .badge-green  { background: var(--green-bg); color: var(--green); }
  .badge-amber  { background: var(--amber-bg); color: var(--amber); }
  .badge-red    { background: var(--red-bg); color: var(--red); }
  .badge-gray   { background: var(--surface2); color: var(--text-2); }
  .badge-navy   { background: rgba(26,39,68,.08); color: var(--navy-mid); }

  /* ── INPUTS ── */
  .input-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
  .label { font-size: 13px; font-weight: 500; color: var(--text-2); }
  .input {
    padding: 9px 12px; border-radius: 7px;
    border: 1.5px solid var(--border); background: var(--surface);
    font-size: 13.5px; color: var(--text); font-family: inherit;
    outline: none; transition: border-color .15s;
    width: 100%;
  }
  .input:focus { border-color: var(--teal); }
  .input-icon-wrap { position: relative; }
  .input-icon-wrap .input { padding-left: 36px; }
  .input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-3); }
  .select { appearance: none; }

  /* ── TABLE ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; padding: 10px 16px;
    font-size: 11.5px; font-weight: 600; color: var(--text-3);
    text-transform: uppercase; letter-spacing: .06em;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  tbody td {
    padding: 13px 16px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px; vertical-align: middle;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: var(--surface2); }
  .td-actions { display: flex; align-items: center; gap: 6px; }

  /* ── LOGIN PAGE ── */
  .login-page {
    min-height: 100vh; background: var(--navy);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .login-bg-circle {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(11,143,201,.18), transparent 70%);
  }
  .login-card {
    background: var(--surface); border-radius: 16px;
    padding: 40px 36px; width: 380px;
    box-shadow: 0 24px 64px rgba(0,0,0,.28);
    position: relative; z-index: 1;
  }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .login-logo-icon {
    width: 42px; height: 42px; background: var(--teal); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 800; font-size: 15px;
  }
  .login-title { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .login-sub   { font-size: 13px; color: var(--text-3); margin-bottom: 28px; }

  /* ── MODAL OVERLAY ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 20px;
  }
  .modal {
    background: var(--surface); border-radius: 14px;
    width: 520px; max-height: 85vh; overflow-y: auto;
    box-shadow: var(--shadow-md);
  }
  .modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title  { font-size: 16px; font-weight: 600; }
  .modal-body   { padding: 22px 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  /* ── EMPTY STATE ── */
  .empty-state {
    text-align: center; padding: 56px 20px; color: var(--text-3);
  }
  .empty-state svg { opacity: .35; margin-bottom: 14px; }
  .empty-title { font-size: 15px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
  .empty-sub   { font-size: 13px; }

  /* ── FILE DROP ZONE ── */
  .drop-zone {
    border: 2px dashed var(--border); border-radius: 10px;
    padding: 36px 20px; text-align: center;
    cursor: pointer; transition: all .15s; margin-bottom: 20px;
  }
  .drop-zone:hover { border-color: var(--teal); background: var(--teal-light); }
  .drop-zone-icon { color: var(--text-3); margin-bottom: 10px; }
  .drop-zone-text { font-size: 13.5px; color: var(--text-2); }
  .drop-zone-sub  { font-size: 12px; color: var(--text-3); margin-top: 4px; }

  /* ── DOCUMENT DETAIL ── */
  .doc-detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
  .doc-preview {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); aspect-ratio: 3/4;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3);
  }
  .meta-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .meta-row:last-child { border-bottom: none; }
  .meta-key   { font-size: 12px; font-weight: 500; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }
  .meta-val   { font-size: 13.5px; color: var(--text); font-weight: 500; text-align: right; max-width: 60%; }

  /* ── CHIP TAGS ── */
  .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }

  /* ── TOASTR ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--navy); color: white;
    padding: 12px 18px; border-radius: 9px;
    font-size: 13px; display: flex; align-items: center; gap: 10px;
    box-shadow: var(--shadow-md); z-index: 200;
    animation: slideIn .25s ease;
  }
  @keyframes slideIn { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* ── SCREEN INDICATOR ── */
  .screen-pill {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(26,39,68,.92); color: rgba(255,255,255,.7);
    font-size: 11px; padding: 5px 14px; border-radius: 99px;
    backdrop-filter: blur(8px); z-index: 50; pointer-events: none;
    font-family: 'DM Mono', monospace;
  }

  /* ── MISC ── */
  .row    { display: flex; align-items: center; }
  .gap-8  { gap: 8px; }
  .gap-12 { gap: 12px; }
  .flex-1 { flex: 1; }
  .mb-4   { margin-bottom: 16px; }
  .mb-3   { margin-bottom: 12px; }
  .mt-1   { margin-top: 4px; }
  .text-sm   { font-size: 12.5px; }
  .text-muted { color: var(--text-3); }
  .font-mono  { font-family: 'DM Mono', monospace; font-size: 12px; }
  .divider { height: 1px; background: var(--border); margin: 16px 0; }
  .w-full { width: 100%; }
`;

// ── DATA ─────────────────────────────────────────────────────────────────
const DOCS = [
  { id: "d1", name: "Contrato_Personal_RH_2025.pdf", category: "Recursos humanos", tags: ["contrato", "2025"], size: "1.4 MB", date: "2025-05-08", owner: "María López", status: "activo" },
  { id: "d2", name: "Factura_Servicio_Abr2025.pdf",  category: "Facturación",       tags: ["factura", "abril"], size: "340 KB", date: "2025-05-06", owner: "Carlos Ríos", status: "activo" },
  { id: "d3", name: "Soporte_Consulta_Dr_Perez.pdf", category: "Soporte operativo", tags: ["soporte"], size: "820 KB", date: "2025-05-03", owner: "Ana Díaz", status: "activo" },
  { id: "d4", name: "Nómina_Abril_2025.xlsx",         category: "Recursos humanos", tags: ["nómina", "2025"], size: "2.1 MB", date: "2025-04-30", owner: "María López", status: "activo" },
  { id: "d5", name: "Reporte_Cartera_Q1.pdf",         category: "Facturación",       tags: ["cartera", "Q1"], size: "650 KB", date: "2025-04-22", owner: "Carlos Ríos", status: "activo" },
];

const USERS = [
  { id: "u1", name: "Ana Díaz",       email: "ana.diaz@ips.com",    role: "admin",          status: "activo", created: "2025-01-10" },
  { id: "u2", name: "Carlos Ríos",    email: "c.rios@ips.com",      role: "administrativo", status: "activo", created: "2025-02-14" },
  { id: "u3", name: "María López",    email: "m.lopez@ips.com",     role: "administrativo", status: "activo", created: "2025-03-01" },
  { id: "u4", name: "Jorge Herrera",  email: "j.herrera@ips.com",   role: "administrativo", status: "inactivo", created: "2025-01-20" },
];

const CATS = ["Facturación", "Recursos humanos", "Soporte operativo", "General"];
const CAT_COLORS = { "Facturación": "badge-teal", "Recursos humanos": "badge-green", "Soporte operativo": "badge-amber", "General": "badge-gray" };

// ── COMPONENTS ────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, role }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: icons.home },
    { key: "documents", label: "Documentos", icon: icons.file },
    { key: "upload",    label: "Subir documento", icon: icons.upload },
    { key: "search",    label: "Búsqueda", icon: icons.search },
  ];
  const adminItems = [
    { key: "users", label: "Usuarios", icon: icons.users },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">IPS</div>
          <div>
            <div className="logo-name">Salud Integral</div>
            <div className="logo-sub">Gestión Documental</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>
        {navItems.map(n => (
          <button key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
            <Icon d={n.icon} size={16} />
            {n.label}
          </button>
        ))}

        {role === "admin" && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Administración</div>
            {adminItems.map(n => (
              <button key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
                <Icon d={n.icon} size={16} />
                {n.label}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">AD</div>
          <div className="user-info">
            <div className="user-name">Ana Díaz</div>
            <div className="user-role">{role === "admin" ? "Administrador" : "Administrativo"}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", color: "rgba(255,255,255,.4)", marginTop: 4 }}>
          <Icon d={icons.logout} size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, breadcrumb, children }) {
  return (
    <div className="topbar">
      <div>
        <div className="breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="breadcrumb-sep"> / </span>}
              {b}
            </span>
          ))}
        </div>
        <div className="page-title">{title}</div>
      </div>
      <div className="row gap-8">{children}</div>
    </div>
  );
}

// ── SCREENS ───────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err,  setErr]    = useState("");

  const submit = () => {
    if (!email || !pass) { setErr("Por favor completa todos los campos."); return; }
    if (!email.includes("@")) { setErr("Formato de correo inválido."); return; }
    if (pass.length < 6)      { setErr("La contraseña debe tener al menos 6 caracteres."); return; }
    setErr("");
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-bg-circle" style={{ width: 600, height: 600, top: -200, left: -100 }} />
      <div className="login-bg-circle" style={{ width: 400, height: 400, bottom: -100, right: -80 }} />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">IPS</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Salud Integral</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Sistema de Gestión Documental</div>
          </div>
        </div>

        <div className="login-title">Bienvenido</div>
        <div className="login-sub">Inicia sesión con tus credenciales institucionales</div>

        {err && (
          <div style={{ background: "var(--red-bg)", border: "1px solid #FECACA", color: "var(--red)", borderRadius: 7, padding: "10px 14px", fontSize: 13, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <Icon d={icons.alert} size={14} />
            {err}
          </div>
        )}

        <div className="input-group">
          <label className="label">Correo electrónico</label>
          <input className="input" type="email" placeholder="usuario@ips.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label className="label">Contraseña</label>
          <input className="input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        <button className="btn btn-primary w-full" style={{ justifyContent: "center", padding: "11px" }} onClick={submit}>
          Iniciar sesión
        </button>

        <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--surface2)", borderRadius: 8, fontSize: 12.5, color: "var(--text-2)" }}>
          <Icon d={icons.shield} size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
          El acceso requiere cuenta creada por un administrador. No hay registro público.
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ setPage }) {
  const recent = DOCS.slice(0, 3);
  return (
    <div className="page-content">
      <div className="stats-grid">
        {[
          { label: "Total documentos", value: "124", sub: "+12 este mes", icon: icons.file, color: "var(--teal)" },
          { label: "Categorías",       value: "4",   sub: "Facturación, RR.HH., …", icon: icons.tag, color: "var(--green)" },
          { label: "Usuarios activos", value: "3",   sub: "1 administrador",   icon: icons.users, color: "var(--amber)" },
          { label: "Almacenamiento",   value: "2.4 GB", sub: "de 10 GB usados",  icon: icons.shield, color: "var(--navy-mid)" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-label">{s.label}</div>
              <div style={{ color: s.color, opacity: .25 }}><Icon d={s.icon} size={22} /></div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Documentos recientes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("documents")}>Ver todos</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th>Tamaño</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="row gap-8">
                        <Icon d={icons.file} size={14} style={{ color: "var(--teal)", flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${CAT_COLORS[d.category]}`}>{d.category}</span></td>
                    <td><span className="text-muted text-sm">{d.date}</span></td>
                    <td><span className="text-muted text-sm font-mono">{d.size}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Por categoría</span></div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {[
              { cat: "Facturación",       count: 48, pct: 39 },
              { cat: "Recursos humanos",  count: 36, pct: 29 },
              { cat: "Soporte operativo", count: 28, pct: 23 },
              { cat: "General",           count: 12, pct: 9  },
            ].map(c => (
              <div key={c.cat} style={{ marginBottom: 14 }}>
                <div className="row gap-8" style={{ marginBottom: 5 }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.cat}</span>
                  <span className="text-muted text-sm">{c.count}</span>
                </div>
                <div style={{ height: 6, background: "var(--surface2)", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${c.pct}%`, borderRadius: 99, background: "var(--teal)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsScreen({ setPage, setDetailDoc }) {
  const [search, setSearch] = useState("");
  const [cat,    setCat]    = useState("");
  const [docs,   setDocs]   = useState(DOCS);

  const filtered = docs.filter(d =>
    (d.name.toLowerCase().includes(search.toLowerCase()) || !search) &&
    (d.category === cat || !cat)
  );

  const del = (id) => setDocs(prev => prev.filter(d => d.id !== id));

  return (
    <div className="page-content">
      <div className="row gap-8 mb-4">
        <div className="input-icon-wrap flex-1">
          <span className="input-icon"><Icon d={icons.search} size={15} /></span>
          <input className="input" placeholder="Buscar por nombre o título…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 200 }}>
          <select className="input select" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setPage("upload")}>
          <Icon d={icons.plus} size={15} />
          Subir documento
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Documentos
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-3)", marginLeft: 8 }}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
          </span>
          <button className="btn btn-secondary btn-sm">
            <Icon d={icons.filter} size={13} /> Filtros
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Icon d={icons.file} size={44} />
            <div className="empty-title">Sin resultados</div>
            <div className="empty-sub">Ajusta la búsqueda o los filtros</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Etiquetas</th>
                  <th>Tamaño</th>
                  <th>Subido por</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="row gap-8">
                        <Icon d={icons.file} size={14} style={{ color: "var(--teal)", flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${CAT_COLORS[d.category]}`}>{d.category}</span></td>
                    <td>
                      <div className="tags-row">
                        {d.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                      </div>
                    </td>
                    <td><span className="font-mono text-muted">{d.size}</span></td>
                    <td><span className="text-sm text-muted">{d.owner}</span></td>
                    <td><span className="text-sm text-muted">{d.date}</span></td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Ver" onClick={() => { setDetailDoc(d); setPage("detail"); }}>
                          <Icon d={icons.eye} size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Descargar">
                          <Icon d={icons.download} size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={() => del(d.id)}>
                          <Icon d={icons.trash} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadScreen({ setPage, showToast }) {
  const [fileName, setFileName] = useState("");
  const [title,    setTitle]    = useState("");
  const [cat,      setCat]      = useState("");
  const [tags,     setTags]     = useState("");
  const [dropped,  setDropped]  = useState(false);

  const submit = () => {
    if (!dropped && !fileName) { showToast("Selecciona un archivo primero."); return; }
    if (!title) { showToast("El título es requerido."); return; }
    if (!cat)   { showToast("Selecciona una categoría."); return; }
    showToast("✓ Documento subido exitosamente.", "success");
    setTimeout(() => setPage("documents"), 1200);
  };

  return (
    <div className="page-content">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Información del documento</span>
          </div>
          <div className="card-body">
            <div
              className="drop-zone"
              onClick={() => { setDropped(true); setFileName("documento_seleccionado.pdf"); }}
            >
              <div className="drop-zone-icon">
                <Icon d={icons.upload} size={32} />
              </div>
              {dropped
                ? <div style={{ color: "var(--green)", fontWeight: 600 }}>
                    <Icon d={icons.check} size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    {fileName}
                  </div>
                : <>
                    <div className="drop-zone-text">Arrastra el archivo aquí o haz clic para seleccionar</div>
                    <div className="drop-zone-sub">PDF, DOCX, XLSX, PNG · Máx. 20 MB</div>
                  </>
              }
            </div>

            <div className="input-group">
              <label className="label">Título del documento *</label>
              <input className="input" placeholder="Ej. Contrato laboral María López" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="input-group">
                <label className="label">Categoría *</label>
                <select className="input select" value={cat} onChange={e => setCat(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Etiquetas <span className="text-muted">(opcional)</span></label>
                <input className="input" placeholder="contrato, 2025…" value={tags} onChange={e => setTags(e.target.value)} />
              </div>
            </div>

            <div className="divider" />
            <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setPage("documents")}>Cancelar</button>
              <button className="btn btn-primary" onClick={submit}>
                <Icon d={icons.upload} size={14} />
                Subir documento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ doc, setPage }) {
  if (!doc) return (
    <div className="page-content">
      <div className="empty-state"><div className="empty-title">No se seleccionó ningún documento</div></div>
    </div>
  );
  return (
    <div className="page-content">
      <div className="doc-detail-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{doc.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Subido por {doc.owner} · {doc.date}</div>
              </div>
              <div className="row gap-8">
                <button className="btn btn-secondary btn-sm"><Icon d={icons.download} size={13} /> Descargar</button>
                <button className="btn btn-danger btn-sm"><Icon d={icons.trash} size={13} /> Eliminar</button>
              </div>
            </div>
            <div className="doc-preview">
              <div style={{ textAlign: "center" }}>
                <Icon d={icons.file} size={48} style={{ opacity: .3 }} />
                <div style={{ marginTop: 12, fontSize: 13 }}>Vista previa no disponible</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Usa el botón Descargar para obtener el archivo</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Metadatos</span></div>
            <div className="card-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {[
                ["Categoría",   <span className={`badge ${CAT_COLORS[doc.category]}`}>{doc.category}</span>],
                ["Etiquetas",   <div className="tags-row">{doc.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}</div>],
                ["Tamaño",      <span className="font-mono">{doc.size}</span>],
                ["Estado",      <span className="badge badge-green">{doc.status}</span>],
                ["Subido por",  doc.owner],
                ["Fecha",       doc.date],
              ].map(([k, v]) => (
                <div className="meta-row" key={k}>
                  <span className="meta-key">{k}</span>
                  <span className="meta-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Historial</span></div>
            <div className="card-body">
              {[
                { action: "Subida inicial",   user: doc.owner, date: doc.date },
                { action: "Vista previa",      user: "Ana Díaz",   date: doc.date },
              ].map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div className="avatar sm" style={{ background: "var(--navy-mid)", marginTop: 2 }}>AD</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.action}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>{h.user} · {h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersScreen({ showToast }) {
  const [users,   setUsers]   = useState(USERS);
  const [modal,   setModal]   = useState(false);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("administrativo");

  const create = () => {
    if (!name || !email) { showToast("Completa todos los campos."); return; }
    setUsers(prev => [...prev, { id: "u" + Date.now(), name, email, role, status: "activo", created: "2025-05-14" }]);
    setModal(false); setName(""); setEmail(""); setRole("administrativo");
    showToast("✓ Usuario creado correctamente.", "success");
  };

  const toggle = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "activo" ? "inactivo" : "activo" } : u));

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Usuarios del sistema</span>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            <Icon d={icons.plus} size={14} /> Crear usuario
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="row gap-12">
                      <div className="avatar sm" style={{ background: u.role === "admin" ? "var(--navy)" : "var(--teal)" }}>
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name}</div>
                        <div className="text-sm text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-navy" : "badge-teal"}`}>
                      {u.role === "admin" ? "Administrador" : "Administrativo"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === "activo" ? "badge-green" : "badge-gray"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td><span className="text-sm text-muted">{u.created}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className={`btn btn-sm ${u.status === "activo" ? "btn-secondary" : "btn-primary"}`}
                        onClick={() => toggle(u.id)}>
                        {u.status === "activo" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Crear nuevo usuario</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(false)}>
                <Icon d={icons.close} size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--teal-light)", border: "1px solid #BAE6FD", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#0369A1", marginBottom: 18 }}>
                <Icon d={icons.shield} size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Solo el administrador puede crear usuarios y asignar roles.
              </div>
              <div className="input-group">
                <label className="label">Nombre completo *</label>
                <input className="input" placeholder="Ej. Pedro Gómez" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="label">Correo electrónico *</label>
                <input className="input" type="email" placeholder="usuario@ips.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="label">Rol inicial *</label>
                <select className="input select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="administrativo">Usuario administrativo</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={create}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchScreen({ setPage, setDetailDoc }) {
  const [q,   setQ]   = useState("");
  const [cat, setCat] = useState("");
  const results = DOCS.filter(d =>
    (d.name.toLowerCase().includes(q.toLowerCase()) || d.tags.some(t => t.includes(q.toLowerCase())) || !q) &&
    (d.category === cat || !cat)
  );
  return (
    <div className="page-content">
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <div className="input-icon-wrap flex-1">
            <span className="input-icon"><Icon d={icons.search} size={16} /></span>
            <input className="input" placeholder="Buscar documentos por nombre o etiqueta…" value={q} onChange={e => setQ(e.target.value)} style={{ fontSize: 15 }} />
          </div>
          <select className="input select" style={{ width: 190 }} value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {q && <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>{results.length} resultado{results.length !== 1 ? "s" : ""} para "{q}"</div>}

        {results.length === 0 && q ? (
          <div className="empty-state">
            <Icon d={icons.search} size={40} />
            <div className="empty-title">Sin resultados</div>
            <div className="empty-sub">Prueba con otros términos o categorías</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(d => (
              <div key={d.id} className="card" style={{ cursor: "pointer" }} onClick={() => { setDetailDoc(d); setPage("detail"); }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ color: "var(--teal)" }}><Icon d={icons.file} size={22} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{d.name}</div>
                    <div className="row gap-8">
                      <span className={`badge ${CAT_COLORS[d.category]}`}>{d.category}</span>
                      {d.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                      <span className="text-sm text-muted" style={{ marginLeft: "auto" }}>{d.date}</span>
                    </div>
                  </div>
                  <Icon d={icons.chevron} size={16} style={{ color: "var(--text-3)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────────────
export default function App() {
  const [authed,    setAuthed]    = useState(false);
  const [page,      setPage]      = useState("dashboard");
  const [detailDoc, setDetailDoc] = useState(null);
  const [toast,     setToast]     = useState(null);
  const [toastType, setToastType] = useState("info");
  const role = "admin";

  const showToast = (msg, type = "info") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(null), 2800);
  };

  const PAGE_META = {
    dashboard: { title: "Dashboard",          breadcrumb: ["Inicio", "Dashboard"] },
    documents: { title: "Documentos",         breadcrumb: ["Inicio", "Documentos"] },
    upload:    { title: "Subir documento",    breadcrumb: ["Inicio", "Documentos", "Subir"] },
    detail:    { title: detailDoc?.name || "Detalle", breadcrumb: ["Inicio", "Documentos", "Detalle"] },
    users:     { title: "Gestión de usuarios", breadcrumb: ["Inicio", "Administración", "Usuarios"] },
    search:    { title: "Búsqueda",           breadcrumb: ["Inicio", "Búsqueda"] },
  };

  if (!authed) return (
    <>
      <style>{styles}</style>
      <LoginScreen onLogin={() => setAuthed(true)} />
      <div className="screen-pill">pantalla: login</div>
    </>
  );

  const meta = PAGE_META[page] || PAGE_META.dashboard;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} role={role} />
        <div className="main">
          <Topbar title={meta.title} breadcrumb={meta.breadcrumb}>
            {page === "documents" && (
              <button className="btn btn-primary btn-sm" onClick={() => setPage("upload")}>
                <Icon d={icons.plus} size={14} /> Subir
              </button>
            )}
          </Topbar>
          {page === "dashboard" && <DashboardScreen setPage={setPage} />}
          {page === "documents" && <DocumentsScreen setPage={setPage} setDetailDoc={setDetailDoc} />}
          {page === "upload"    && <UploadScreen setPage={setPage} showToast={showToast} />}
          {page === "detail"    && <DetailScreen doc={detailDoc} setPage={setPage} />}
          {page === "users"     && <UsersScreen showToast={showToast} />}
          {page === "search"    && <SearchScreen setPage={setPage} setDetailDoc={setDetailDoc} />}
        </div>
      </div>

      {toast && (
        <div className="toast" style={{ background: toastType === "success" ? "var(--green)" : "var(--navy)" }}>
          <Icon d={toastType === "success" ? icons.check : icons.alert} size={15} />
          {toast}
        </div>
      )}
      <div className="screen-pill">pantalla: {page}</div>
    </>
  );
}
