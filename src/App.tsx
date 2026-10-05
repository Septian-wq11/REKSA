import { useState, useEffect } from "react";

type Role = "citizen" | "posko" | "responder";
type Screen = "home" | "login" | "portal";

const PHOTO =
  "https://images.unsplash.com/photo-1643216665710-9e254ce24f82?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400";

const cases = [
  ["RK-2026-00124", "Air Bersih", "Desa Sukamaju", "87 KK", "1.000 L", "Kritis", "Dalam Pengiriman"],
  ["RK-2026-00125", "Makanan", "Desa Sukamaju", "120 KK", "360 paket", "Tinggi", "Mencari Bantuan"],
  ["RK-2026-00126", "Obat-obatan", "Desa Mekarjaya", "64 KK", "180 paket", "Kritis", "Ditugaskan"],
  ["RK-2026-00127", "Sanitasi", "Desa Harapan", "45 KK", "8 unit", "Sedang", "Terverifikasi"],
  ["RK-2026-00128", "Tempat Tinggal", "Desa Makmur", "31 KK", "12 unit", "Tinggi", "Selesai"],
  ["RK-2026-00129", "Listrik", "Desa Sukamaju", "73 KK", "6 titik", "Tinggi", "Perlu Verifikasi"],
  ["RK-2026-00130", "Selimut", "Desa Mekarjaya", "92 KK", "184 pcs", "Sedang", "Selesai"],
  ["RK-2026-00131", "Air Bersih", "Desa Harapan", "56 KK", "700 L", "Tinggi", "Ditugaskan"],
];

const accounts = [
  { role: "Masyarakat", name: "Andi Pratama", email: "andi.masyarakat@reksa.id", type: "citizen" as Role },
  { role: "Masyarakat", name: "Sari Wulandari", email: "sari.masyarakat@reksa.id", type: "citizen" as Role },
  { role: "Petugas Posko", name: "Siti Rahma", email: "siti.posko@reksa.id", type: "posko" as Role },
  { role: "Petugas Posko", name: "Budi Santoso", email: "budi.posko@reksa.id", type: "posko" as Role },
  { role: "Responder · BPBD", name: "Arif Nugroho", email: "arif.bpbd@reksa.id", type: "responder" as Role },
  { role: "Responder · PMI", name: "Maya Lestari", email: "maya.pmi@reksa.id", type: "responder" as Role },
  { role: "Responder · Mitra Lokal", name: "Joko Setiawan", email: "joko.mitra@reksa.id", type: "responder" as Role },
];

const icons: Record<string, React.ReactNode> = {
  arrow: <svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5" /></svg>,
  next: <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  chevron: <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bell: <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>,
  pin: <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  grid: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>,
  file: <svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>,
  map: <svg viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></svg>,
  box: <svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></svg>,
  task: <svg viewBox="0 0 24 24"><path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01" /></svg>,
  clock: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  user: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></svg>,
  mail: <svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  lock: <svg viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  eye: <svg viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>,
  settings: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19 14.5 21 16l-2 3-2.3-1a8 8 0 0 1-2.2 1.3L14 22h-4l-.5-2.7A8 8 0 0 1 7.3 18L5 19l-2-3 2-1.5a8 8 0 0 1 0-5L3 8l2-3 2.3 1a8 8 0 0 1 2.2-1.3L10 2h4l.5 2.7A8 8 0 0 1 16.7 6L19 5l2 3-2 1.5a8 8 0 0 1 0 5Z" /></svg>,
  help: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4 2.2c-1 .7-1.5 1.2-1.5 2.3M12 17h.01" /></svg>,
  logout: <svg viewBox="0 0 24 24"><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" /></svg>,
  menu: <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
};

function Icon({ name }: { name: string }) {
  return <span className="icon">{icons[name]}</span>;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button className={`logo ${light ? "logo-light" : ""}`} onClick={() => location.reload()} aria-label="REKSA, kembali ke beranda">
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <path d="M7 7h16c7 0 12 4 12 10s-5 10-12 10H7V7Z" />
        <path d="M18 27 35 38M7 20h17" />
        <circle cx="8" cy="7" r="3" />
        <circle cx="35" cy="38" r="3" />
      </svg>
      <span>REKSA<small>Kolaborasi Pascabencana</small></span>
    </button>
  );
}

function Button({
  children, variant = "primary", onClick, disabled = false, type = "button", className = "",
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "text" | "light"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant} ${className}`.trim()} onClick={onClick}>{children}</button>;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Progress({ value = 70 }: { value?: number }) {
  return <div className="progress" aria-label={`${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

function MapView({ operational = false, hideCard = false }: { operational?: boolean; hideCard?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const points = [
    { x: 61, y: 43, place: "Desa Sukamaju", need: "Air Bersih", tone: "critical", status: "Dalam Pengiriman" },
    { x: 30, y: 30, place: "Desa Mekarjaya", need: "Obat-obatan", tone: "critical", status: "Ditugaskan" },
    { x: 44, y: 68, place: "Desa Harapan", need: "Sanitasi", tone: "medium", status: "Terverifikasi" },
    { x: 78, y: 70, place: "Desa Makmur", need: "Tempat Tinggal", tone: "done", status: "Selesai" },
  ];
  const p = points[selected];
  return (
    <div className={`map ${operational ? "map-operational" : ""} ${hideCard ? "map-compact-preview" : ""} zoom-${zoom}`}>
      <svg className="map-art" viewBox="0 0 900 500" preserveAspectRatio="none" aria-hidden="true" style={{ transform: `scale(${zoom === 2 ? 1.14 : zoom === 0 ? .92 : 1})` }}>
        <path className="river" d="M-20 390C120 340 150 430 290 364s190-38 290-110 205-49 350-143" />
        <path className="road-major" d="M-30 110C140 180 224 82 360 150s260 210 580 178" />
        <path className="road-major" d="M210-20c20 160 160 180 194 300s-28 166 20 240" />
        <path className="road" d="M20 274c160-8 224-93 380-60s242 8 460-102" />
        <path className="road" d="M70 480c70-150 151-140 230-230S470 91 600 30" />
        <path className="boundary" d="M20 40 270 22l80 145-62 170L40 320Z" />
        <path className="boundary" d="m350 20 255 6 80 166-95 170-280-20" />
        <path className="boundary" d="m600 26 270 40-16 245-255 50" />
        <path className="boundary" d="m42 324 248 20 110 140-350 4Z" />
        <path className="boundary" d="m300 344 292 20 235 124-425-4Z" />
        <text x="105" y="110">MEKARJAYA</text><text x="485" y="105">SUKAMAJU</text>
        <text x="190" y="420">HARAPAN</text><text x="670" y="415">MAKMUR</text>
        <text className="road-label" x="565" y="275">Jl. Raya Kabupaten</text>
      </svg>
      {points.map((point, i) => (
        <button key={point.place} className={`marker marker-${point.tone} ${i === selected ? "selected" : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => { setSelected(i); setExpanded(false); }} aria-label={point.place}>
          <span />
        </button>
      ))}
      <div className="zoom"><button aria-label="Perbesar" disabled={zoom === 2} onClick={() => setZoom(Math.min(2, zoom + 1))}>+</button><button aria-label="Perkecil" disabled={zoom === 0} onClick={() => setZoom(Math.max(0, zoom - 1))}>−</button></div>
      <div className="legend"><span><i className="critical" /> Kritis</span><span><i className="high" /> Tinggi</span><span><i className="medium" /> Sedang</span><span><i className="done" /> Selesai</span></div>
      {!hideCard ? (
        <div className="map-card">
          <div><Pill tone={p.tone}>{p.tone === "critical" ? "Kritis" : p.tone === "done" ? "Selesai" : "Sedang"}</Pill><small>RK-2026-0012{4 + selected}</small></div>
          <h3>{p.need}</h3><p><Icon name="pin" /> {p.place} · {selected === 0 ? "87" : "45"} KK</p>
          <strong>{p.status}</strong>
          {expanded && <p className="map-extra">Kebutuhan 1.000 L · {selected === 0 ? "700 L tersalurkan" : "Sedang ditangani"}</p>}
          <Button variant="text" onClick={() => setExpanded(!expanded)}>{expanded ? "Tutup Detail" : "Lihat Kasus"} <Icon name="next" /></Button>
        </div>
      ) : (
        <div className="map-mini-pin-tag">
          <Icon name="pin" />
          <span>Titik Terpilih: <b>{p.place}</b> ({p.need})</span>
        </div>
      )}
    </div>
  );
}

function Navbar({ navigate }: { navigate: (s: Screen) => void }) {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 84;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: "smooth",
      });
      // Update hash without abrupt jump
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <header className="public-navbar">
      <div className="shell public-navbar-inner">
        <Logo light />
        <nav>
          <a href="#tentang" onClick={scrollTo("tentang")}>Tentang REKSA</a>
          <a href="#cara" onClick={scrollTo("cara")}>Cara Kerja</a>
        </nav>
        <div className="nav-actions">
          <button className="btn-nav-cta" onClick={() => navigate("login")}>
            Masuk Akun <span className="icon-circle"><Icon name="arrow" /></span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="public-site">
      <Navbar navigate={navigate} />
      <main>
        {/* HERO BANNER — Thematic post-disaster hero image & aligned forest green palette */}
        <section className="hero-banner">
          <img 
            className="hero-bg" 
            src="/hero-disaster.jpg" 
            alt="Masyarakat dan relawan bergotong royong di lokasi pascabencana" 
            aria-hidden="true" 
          />
          <div className="hero-overlay" />
          <div className="hero shell">
            <div className="hero-copy">
              <span className="hero-badge">
                <Icon name="check" /> Ruang Ekosistem Kolaborasi Pascabencana
              </span>
              <h1>Bantuan tidak berhenti di laporan.</h1>
              <p>
                REKSA menghubungkan kebutuhan masyarakat terdampak pascabencana dengan posko koordinasi dan responder relawan di lapangan, dari pelaporan hingga bantuan diterima tuntas.
              </p>
              <div className="hero-actions">
                <button className="hero-btn-secondary" onClick={() => {
                  const el = document.getElementById("cara");
                  if (el) {
                    window.scrollTo({
                      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84),
                      behavior: "smooth"
                    });
                  }
                }}>
                  Pelajari REKSA <span className="icon-circle"><Icon name="arrow" /></span>
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat-pill"><strong>100+</strong><span>Laporan Ditangani</span></div>
                <div className="stat-pill"><strong>4.9 ★</strong><span>Rating Respon</span></div>
                <div className="stat-pill"><strong>&lt; 24 Jam</strong><span>Waktu Respon</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-cards-bar shell" id="tentang">
          <div className="section-header" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 28px" }}>
            <span className="eyebrow">Mengapa REKSA</span>
            <h2>Satu ruang kolaborasi.<br />Tiga peran yang jelas.</h2>
          </div>
          <div className="feature-card-grid">
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-masyarakat.jpg" alt="Masyarakat" /><div className="feat-card-tint" /><span className="feat-card-label">Masyarakat</span></div>
              <h3>Untuk Masyarakat</h3>
              <p>Laporkan kebutuhan dan ketahui perkembangan bantuan secara jelas.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk ke Akun <Icon name="arrow" /></Button>
            </article>
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-posko.jpg" alt="Posko" /><div className="feat-card-tint" /><span className="feat-card-label">Posko</span></div>
              <h3>Untuk Posko</h3>
              <p>Verifikasi kebutuhan dan kelola bantuan dalam satu alur layanan.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Posko <Icon name="arrow" /></Button>
            </article>
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-responder.jpg" alt="Responder" /><div className="feat-card-tint" /><span className="feat-card-label">Responder</span></div>
              <h3>Untuk Responder</h3>
              <p>Terima tugas yang jelas dan perbarui progres langsung dari lapangan.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Responder <Icon name="arrow" /></Button>
            </article>
          </div>
        </section>

        <section className="journey-banner" id="cara">
          <img 
            className="journey-bg" 
            src="https://images.unsplash.com/photo-1766224242779-063be965105c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800" 
            alt="Kolaborasi masyarakat dan relawan dalam pemulihan pascabencana" 
            aria-hidden="true" 
          />
          <div className="journey-overlay" />
          <div className="shell journey-shell">
            <div className="journey-empty-spacer" aria-hidden="true" />
            <div className="journey-content-right">
              <div className="section-header">
                <span className="eyebrow light"><Icon name="check" /> Cara REKSA bekerja</span>
                <h2>Dari kebutuhan menuju penyelesaian.</h2>
                <p className="section-lead light">
                  Satu alur layanan yang jelas dan terpadu agar masyarakat selalu mengetahui langkah penanganan berikutnya.
                </p>
              </div>
              <div className="steps-illustrated">
                {[
                  { n: "01", title: "Laporkan", desc: "Masyarakat menyampaikan kebutuhan pascabencana.", icon: "file" },
                  { n: "02", title: "Verifikasi", desc: "Petugas Posko memeriksa dan memvalidasi kebutuhan.", icon: "check" },
                  { n: "03", title: "Tangani", desc: "Sumber daya dialokasikan dan responder ditugaskan.", icon: "box" },
                  { n: "04", title: "Selesai", desc: "Bantuan diterima dan laporan diselesaikan.", icon: "check" },
                ].map(({ n, title, desc, icon }) => (
                  <div className="step-ill" key={n}>
                    <div className="step-ill-icon"><Icon name={icon} /></div>
                    <div>
                      <span className="step-ill-num">{n}</span>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cta-final-wrapper" id="akses">
          <div className="shell">
            <div className="cta-final-card">
              <div className="cta-final-content">
                <span className="eyebrow light"><Icon name="check" /> Akses publik &amp; Institusi</span>
                <h2>Sudah siap memulai bersama REKSA?</h2>
                <p>
                  Masuk atau buat akun untuk mulai melaporkan kebutuhan, mengelola posko koordinasi, atau menjalankan penugasan responder di lapangan.
                </p>
                <div className="cta-final-actions">
                  <Button variant="light" className="btn-cta-main" onClick={() => navigate("login")}>
                    Masuk / Daftar Akun <Icon name="arrow" />
                  </Button>
                </div>
                <div className="cta-perks">
                  <span><Icon name="check" /> Terbuka untuk Umum</span>
                  <span><Icon name="check" /> Respon Tanggap</span>
                  <span><Icon name="check" /> Terintegrasi Posko</span>
                </div>
              </div>
              <div className="cta-final-hero">
                <img src="/cta-person.png" alt="Relawan REKSA" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="footer-brand"><Logo light /><p>Ruang Ekosistem Kolaborasi Pascabencana</p></div>
          <nav>
            <strong>Navigasi</strong>
            <a href="#tentang" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("tentang");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Tentang REKSA</a>
            <a href="#cara" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("cara");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Cara Kerja</a>
            <a href="#akses" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("akses");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Akses Akun</a>
          </nav>
          <nav>
            <strong>Dukungan</strong>
            <a href="#tentang">Bantuan</a>
            <a href="#tentang">Kontak</a>
          </nav>
          <div className="footer-notice"><Icon name="check" /><p>REKSA membantu koordinasi layanan pascabencana dan tidak menggantikan kanal kedaruratan resmi.</p></div>
        </div>
        <div className="footer-bottom">© 2026 REKSA · Layanan publik kolaboratif Indonesia</div>
      </footer>
    </div>
  );
}

function Login({ navigate, onLogin }: { navigate: (s: Screen) => void; onLogin: (r: Role, name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(false);
  const [resetInfo, setResetInfo] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<Role>("citizen");

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mode === "register") {
      if (!fullName || !email || password.length < 6) return setError(true);
      return onLogin("citizen", fullName);
    }
    const a = accounts.find((x) => x.email === email);
    if (!a || password !== "reksa123") return setError(true);
    onLogin(a.type, a.name);
  };

  const fillAccount = (acc: typeof accounts[0]) => {
    setEmail(acc.email);
    setPassword("reksa123");
    setError(false);
  };

  return (
    <div className="login-layout">
      {/* Left Showcase Panel */}
      <aside className="auth-showcase">
        <div className="auth-showcase-bg" />
        <div className="auth-showcase-overlay" />
        
        <div className="auth-showcase-inner">
          <div className="auth-brand-row">
            <Logo light />
            <button className="auth-back-btn" onClick={() => navigate("home")}>
              ← Kembali ke beranda
            </button>
          </div>

          <div className="auth-showcase-content">
            <span className="hero-badge">
              <Icon name="check" /> Akses Portal Terpadu REKSA
            </span>
            <h1>Bantuan terhubung, tuntas di lapangan.</h1>
            <p>
              Satu ruang kolaborasi untuk memastikan setiap laporan kebutuhan masyarakat divalidasi posko dan ditangani responder secara transparan.
            </p>

            <div className="auth-feature-pills">
              <div className="auth-feat-pill">
                <span className="feat-pill-icon"><Icon name="file" /></span>
                <div>
                  <strong>Pelaporan Cepat</strong>
                  <small>Langsung terdata ke Posko</small>
                </div>
              </div>
              <div className="auth-feat-pill">
                <span className="feat-pill-icon"><Icon name="box" /></span>
                <div>
                  <strong>Alokasi Terarah</strong>
                  <small>Integrasi BPBD &amp; PMI</small>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-showcase-footer">
            <span>© 2026 REKSA · Ruang Ekosistem Kolaborasi Pascabencana</span>
          </div>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-segmented-tabs">
            <button 
              type="button"
              className={mode === "login" ? "active" : ""} 
              onClick={() => { setMode("login"); setError(false); }}
            >
              Masuk Akun
            </button>
            <button 
              type="button"
              className={mode === "register" ? "active" : ""} 
              onClick={() => { setMode("register"); setError(false); }}
            >
              Buat Akun Baru
            </button>
          </div>

          <div className="auth-card-header">
            <span className="eyebrow">{mode === "login" ? "Autentikasi Pengguna" : "Pendaftaran Masyarakat"}</span>
            <h2>{mode === "login" ? "Selamat Datang Kembali" : "Mulai Bersama REKSA"}</h2>
            <p>{mode === "login" ? "Sistem akan otomatis mengenali hak akses peran Anda setelah masuk." : "Daftarkan diri Anda untuk mengajukan laporan kebutuhan darurat pascabencana."}</p>
          </div>

          {error && (
            <div className="form-error">
              <Icon name="help" />
              <span>{mode === "login" ? "Email atau kata sandi belum sesuai. (Gunakan kata sandi: reksa123)" : "Lengkapi nama, email, dan kata sandi minimal 6 karakter."}</span>
            </div>
          )}

          {resetInfo && (
            <div className="verified">
              <Icon name="check" />
              <span>Instruksi pemulihan kata sandi telah dikirim ke alamat email Anda.</span>
            </div>
          )}

          <form onSubmit={submit} className="auth-form-fields">
            {mode === "register" && (
              <div className="input-group">
                <label>Nama Lengkap</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Icon name="user" /></span>
                  <input 
                    type="text"
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Nama lengkap sesuai KTP" 
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Alamat Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><Icon name="mail" /></span>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="nama@organisasi.id / andi.masyarakat@reksa.id" 
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Kata Sandi</label>
              <div className="input-wrapper">
                <span className="input-icon"><Icon name="lock" /></span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Masukkan kata sandi (reksa123)" 
                  required
                />
                <button 
                  type="button" 
                  className="input-eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="login-options">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  /> 
                  <span>Ingat saya di perangkat ini</span>
                </label>
                <button type="button" className="btn-forgot" onClick={() => setResetInfo(true)}>
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <Button type="submit" className="btn-auth-submit">
              {mode === "login" ? "Masuk ke Sistem" : "Daftar Akun Sekarang"} <Icon name="arrow" />
            </Button>
          </form>

          {/* DEMO ACCOUNTS QUICK-LOGIN SECTION */}
          {mode === "login" && (
            <div className="demo-section">
              <div className="demo-header">
                <div className="demo-title">
                  <Icon name="check" />
                  <span>Akun Demo Uji Coba</span>
                </div>
                <div className="demo-role-tabs">
                  <button 
                    type="button"
                    className={activeDemoRole === "citizen" ? "active" : ""} 
                    onClick={() => setActiveDemoRole("citizen")}
                  >
                    Masyarakat
                  </button>
                  <button 
                    type="button"
                    className={activeDemoRole === "posko" ? "active" : ""} 
                    onClick={() => setActiveDemoRole("posko")}
                  >
                    Posko
                  </button>
                  <button 
                    type="button"
                    className={activeDemoRole === "responder" ? "active" : ""} 
                    onClick={() => setActiveDemoRole("responder")}
                  >
                    Responder
                  </button>
                </div>
              </div>

              <div className="demo-chips-grid">
                {accounts
                  .filter((a) => a.type === activeDemoRole)
                  .map((a) => (
                    <button 
                      key={a.email} 
                      type="button" 
                      className={`demo-chip ${email === a.email ? "selected" : ""}`}
                      onClick={() => fillAccount(a)}
                    >
                      <div className="demo-avatar">
                        {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="demo-info">
                        <strong>{a.name}</strong>
                        <small>{a.role}</small>
                      </div>
                      <span className="demo-chip-action">Pilih</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

type SharedState = { status: string; priority: string; allocated: number; delivered: number; assignment: string; logs: string[] };
type PortalPage = "dashboard" | "cases" | "case" | "report" | "notifications" | "history" | "profile" | "help" | "settings" | "map" | "resources" | "assignments" | "activity" | "tasks" | "active";
type NavItem = { label: string; page: PortalPage | "logout"; icon: string };

const roleNavigation: Record<Role, { main: NavItem[]; bottom: NavItem[] }> = {
  citizen: {
    main: [
      { label: "Beranda", page: "dashboard", icon: "grid" },
      { label: "Laporan Saya", page: "cases", icon: "file" },
      { label: "Laporkan Kebutuhan", page: "report", icon: "plus" },
      { label: "Riwayat", page: "history", icon: "clock" },
    ],
    bottom: [
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Bantuan", page: "help", icon: "help" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
  posko: {
    main: [
      { label: "Beranda", page: "dashboard", icon: "grid" },
      { label: "Kebutuhan Warga", page: "cases", icon: "file" },
      { label: "Peta Wilayah", page: "map", icon: "map" },
      { label: "Mitra & Logistik", page: "resources", icon: "box" },
      { label: "Armada Distribusi", page: "assignments", icon: "task" },
    ],
    bottom: [
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
  responder: {
    main: [
      { label: "Beranda", page: "dashboard", icon: "grid" },
      { label: "Misi Penyaluran", page: "tasks", icon: "task" },
      { label: "Peta Wilayah", page: "map", icon: "map" },
      { label: "Riwayat Penyaluran", page: "history", icon: "clock" },
    ],
    bottom: [
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
};

function Modal({ title, children, close, icon }: { title: string; children: React.ReactNode; close: () => void; icon?: string }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        {icon && <div className="modal-icon"><Icon name={icon} /></div>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Sidebar({ role, page, collapsed, mobile, select, toggle, close }: { role: Role; page: PortalPage; collapsed: boolean; mobile: boolean; select: (p: PortalPage | "logout") => void; toggle: () => void; close: () => void }) {
  const group = roleNavigation[role];
  const roleLabel = role === "citizen" ? "Masyarakat" : role === "posko" ? "Petugas Posko" : "Responder";
  const roleCopy = role === "citizen" ? "Akun pribadi" : role === "posko" ? "Akun institusi" : "Mitra terverifikasi";
  const items = (rows: NavItem[]) => rows.map((item) => <button title={collapsed ? item.label : undefined} className={page === item.page ? "active" : ""} key={item.label} onClick={() => { select(item.page); close(); }}><Icon name={item.icon} /><span>{item.label}</span>{item.label === "Notifikasi" && <i className="nav-dot" />}</button>);
  return (
    <>
      <div className={`sidebar-scrim ${mobile ? "show" : ""}`} onClick={close} />
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobile ? "mobile-open" : ""}`}>
        <div className="side-logo">
          <Logo light />
          <button className="side-toggle" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}>
            <Icon name="menu" />
          </button>
        </div>
        <div className="side-context">
          <span>Mode akses</span>
          <div>
            <i><Icon name="user" /></i>
            <p><b>{roleLabel}</b><small>{roleCopy}</small></p>
          </div>
        </div>
        <nav>{items(group.main)}</nav>
        <nav className="side-bottom">{items(group.bottom)}</nav>
      </aside>
    </>
  );
}

function Portal({ role, name, state, update, logout }: { role: Role; name: string; state: SharedState; update: (x: Partial<SharedState>, log?: string) => void; logout: () => void }) {
  const [page, setPage] = useState<PortalPage>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 900);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const check = () => {
      const isNowMobile = window.innerWidth <= 900;
      setIsMobileView(isNowMobile);
      if (!isNowMobile) setMobile(false);
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const go = (p: PortalPage | "logout") => {
    if (p === "logout") return setLogoutOpen(true);
    setPage(p); window.scrollTo(0, 0);
  };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  return <div className={`portal-shell ${collapsed && !isMobileView ? "side-collapsed" : ""}`}>
    <Sidebar role={role} page={page} collapsed={collapsed} mobile={mobile} select={go} toggle={() => setCollapsed(!collapsed)} close={() => setMobile(false)} />
    <header className="mobile-header"><button onClick={() => setMobile(true)} aria-label="Buka menu"><Icon name="menu" /></button><Logo /><button onClick={() => go("notifications")} aria-label="Notifikasi"><Icon name="bell" /></button></header>
    <div className="portal-content">{role === "citizen" && <CitizenRouter page={page} setPage={go} state={state} update={update} notify={notify} name={name} />}{role === "posko" && <PoskoRouter page={page} setPage={go} state={state} update={update} notify={notify} />}{role === "responder" && <ResponderRouter page={page} setPage={go} state={state} update={update} notify={notify} />}<MobileNav role={role} page={page} go={go} /></div>
    {logoutOpen && <Modal icon="logout" title="Keluar dari akun?" close={() => setLogoutOpen(false)}><p>Sesi Anda akan diakhiri. Anda dapat masuk kembali kapan saja.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setLogoutOpen(false)}>Batal</Button><Button onClick={logout}>Keluar</Button></div></Modal>}
    {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
  </div>;
}

function MobileNav({ role, page, go }: { role: Role; page: PortalPage; go: (p: PortalPage) => void }) {
  const items = roleNavigation[role].main.slice(0, 4);
  return <nav className="mobile-bottom">{items.map((x) => <button className={page === x.page ? "active" : ""} onClick={() => go(x.page as PortalPage)} key={x.label}><Icon name={x.icon} /><span>{x.label}</span></button>)}</nav>;
}

function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="workspace-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function CitizenRouter({ page, setPage, state, update, notify, name = "Andi Pratama" }: RouterProps) {
  if (page === "dashboard") return <CitizenDashboard state={state} update={update} setPage={setPage} name={name} />;
  if (page === "report") return <CitizenReport complete={() => setPage("case")} update={update} />;
  if (page === "case") return <CaseDetail state={state} update={update} back={() => setPage("cases")} />;
  if (page === "cases") return <CaseList title="Laporan Saya" copy="Semua kebutuhan yang pernah Anda laporkan." onCase={() => setPage("case")} own />;
  if (page === "history") return <CaseList title="Riwayat" copy="Kebutuhan yang telah selesai dan dikonfirmasi." onCase={() => setPage("case")} completed />;
  if (page === "notifications") return <Notifications role="citizen" open={() => setPage("case")} />;
  if (page === "profile") return <Profile name={name} role="Masyarakat" notify={notify} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

function CitizenReport({ complete, update }: { complete: () => void; update: RouterProps["update"] }) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [category, setCategory] = useState("Air Bersih");
  const [amount, setAmount] = useState("1.000 L");
  const [poskoTarget, setPoskoTarget] = useState("Posko Induk 01 - Balai Desa Sukamaju");
  const [shelterStatus, setShelterStatus] = useState("Rumah Warga Terdampak");
  const [village, setVillage] = useState("Desa Sukamaju");
  const [district, setDistrict] = useState("Cibadak");
  const [regency, setRegency] = useState("Kabupaten Sukabumi");
  const [urgency, setUrgency] = useState("Sangat mendesak");
  const [familyCount, setFamilyCount] = useState(87);
  const [notes, setNotes] = useState("Sumber air utama tercemar setelah banjir dan tidak dapat digunakan. Warga membutuhkan air bersih segera untuk minum dan memasak.");
  const [fileName, setFileName] = useState("foto_lokasi_banjir_sukamaju.jpg");

  const titles = ["Kebutuhan", "Lokasi & Posko", "Kondisi", "Bukti", "Review"];
  const stepHeadlines = [
    "Apa jenis bantuan yang dibutuhkan?",
    "Tentukan Posko Wilayah & Titik Lokasi",
    "Bagaimana tingkat kedaruratan & dampak?",
    "Unggah dokumen atau foto pendukung",
    "Periksa dan konfirmasi laporan Anda"
  ];
  const stepDescriptions = [
    "Pilih kategori kebutuhan dan tentukan estimasi volume yang dibutuhkan warga terdampak.",
    "Pilih posko penampung terdekat dan titik administratif untuk koordinasi logistik terpadu.",
    "Beri tahu posko skala urgensi dan jumlah keluarga yang terdampak bencana.",
    "Lampirkan bukti foto lapangan agar petugas posko dapat memvalidasi data dengan cepat.",
    "Pastikan seluruh rincian informasi di bawah sudah benar sebelum diverifikasi posko wilayah."
  ];

  const stepShades = [
    { bg: "#d8eada", text: "#013220", numBg: "#c2ddc6", sub: "Jenis & Jumlah" },
    { bg: "#b2d7bb", text: "#013220", numBg: "#96c6a1", sub: "Posko & Wilayah" },
    { bg: "#6fa880", text: "#ffffff", numBg: "#548e66", sub: "Urgensi Lapangan" },
    { bg: "#2e774f", text: "#ffffff", numBg: "#1c5a39", sub: "Foto / Dokumen" },
    { bg: "#013220", text: "#ffffff", numBg: "#0a4530", sub: "Konfirmasi Data" },
  ];

  if (success) {
    return (
      <main className="workspace report-workspace">
        <div className="report-success-card">
          <div className="report-success-icon-wrap">
            <div className="report-success-icon"><Icon name="check" /></div>
          </div>
          <span className="eyebrow">Laporan Berhasil Diterbitkan</span>
          <h1>Laporan Diterima {poskoTarget.split(" - ")[0]}</h1>
          <p>
            Data kebutuhan Anda telah tercatat di <strong>{poskoTarget}</strong>. Petugas Posko akan merekapitulasi data KK dan mempublikasikan kebutuhan terbuka ke seluruh Mitra &amp; Instansi penyalur.
          </p>
          <div className="report-success-code-box">
            <span className="code-box-label">KODE PELACAKAN KASUS</span>
            <div className="code-box-val">RK-2026-00124</div>
            <small className="code-box-sub">Tercatat di {poskoTarget}</small>
          </div>
          <div className="report-success-actions">
            <Button onClick={complete} className="btn-success-primary">
              Pantau Status Laporan <Icon name="next" />
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => { setSuccess(false); setStep(1); }} 
              className="btn-success-close"
            >
              Tutup &amp; Buat Laporan Baru
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="workspace report-workspace">
      <PageHead 
        eyebrow={`Langkah ${step} dari 5`} 
        title="Laporkan Kebutuhan Darurat" 
        copy="Sampaikan kondisi dan kebutuhan lapangan secara akurat untuk integrasi posko wilayah dan mitra responder." 
        action={<div className="trust-badge"><Icon name="check" /> Terhubung ke {poskoTarget.split(" - ")[0]}</div>}
      />

      {/* TOP TRAPEZOID / CHEVRON STEPPER BAR WITH GRADIENT SHADES */}
      <div className="report-stepper-container">
        <div className="report-stepper-bar">
          {titles.map((x, i) => {
            const isDone = step > i + 1;
            const isActive = step === i + 1;
            const shade = stepShades[i];
            return (
              <button
                key={x}
                type="button"
                className={`step-trapezoid ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                style={{
                  background: isDone || isActive ? shade.bg : "#e8ede7",
                  color: isDone || isActive ? shade.text : "#758378",
                }}
                onClick={() => i + 1 <= step && setStep(i + 1)}
              >
                <span 
                  className="step-trapezoid-num"
                  style={{ 
                    background: isDone || isActive ? shade.numBg : "#d4ded3", 
                    color: isDone || isActive ? shade.text : "#758378" 
                  }}
                >
                  {isDone ? <Icon name="check" /> : i + 1}
                </span>
                <div className="step-trapezoid-text">
                  <b>{x}</b>
                  <small>{shade.sub}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN FORM + GUIDANCE LAYOUT */}
      <div className="report-content-grid">
        {/* LEFT MAIN FORM PANEL */}
        <div className="report-form-card">
          <div className="report-form-header">
            <span className="eyebrow">0{step} — {titles[step - 1]}</span>
            <h2>{stepHeadlines[step - 1]}</h2>
            <p>{stepDescriptions[step - 1]}</p>
          </div>

          <div className="report-form-body">
            {step === 1 && (
              <div className="form-fields-group">
                <div className="form-group">
                  <label className="form-label">Pilih Kategori Bantuan</label>
                  <div className="category-pills-row">
                    {["Air Bersih", "Makanan", "Obat-obatan", "Tempat Tinggal", "Sanitasi", "Listrik"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-pill-btn ${category === cat ? "active" : ""}`}
                        onClick={() => setCategory(cat)}
                      >
                        <Icon name={cat === "Air Bersih" ? "pin" : cat === "Makanan" ? "box" : "file"} />
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Estimasi Jumlah Kebutuhan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="Contoh: 1.000 L, 200 Paket"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Satuan Pengukuran</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      defaultValue="Liter / Paket / KK" 
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi &amp; Detail Tambahan</label>
                  <textarea 
                    className="form-control textarea" 
                    rows={4}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Jelaskan secara spesifik alasan dan kondisi kebutuhan mendesak..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-fields-group">
                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Posko Wilayah / Evakuasi Penampung</label>
                    <select 
                      className="form-control select" 
                      value={poskoTarget} 
                      onChange={(e) => setPoskoTarget(e.target.value)}
                    >
                      <option>Posko Induk 01 - Balai Desa Sukamaju</option>
                      <option>Posko Darurat 02 - Lapangan Cibadak</option>
                      <option>Posko 03 - Kantor Kecamatan Cibadak</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Domisili / Lokasi Warga</label>
                    <select 
                      className="form-control select" 
                      value={shelterStatus} 
                      onChange={(e) => setShelterStatus(e.target.value)}
                    >
                      <option>Rumah Warga Terdampak</option>
                      <option>Tenda Pengungsian Posko</option>
                      <option>Fasilitas Umum / Madrasah</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-three">
                  <div className="form-group">
                    <label className="form-label">Desa / Kelurahan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={village} 
                      onChange={(e) => setVillage(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kecamatan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={district} 
                      onChange={(e) => setDistrict(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kabupaten / Kota</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regency} 
                      onChange={(e) => setRegency(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pratinjau Peta Wilayah Bencana</label>
                  <div className="report-map-wrapper">
                    <MapView hideCard />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-fields-group">
                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Tingkat Urgensi / Prioritas</label>
                    <select 
                      className="form-control select" 
                      value={urgency} 
                      onChange={(e) => setUrgency(e.target.value)}
                    >
                      <option>Sangat mendesak</option>
                      <option>Mendesak</option>
                      <option>Dapat menunggu (Siaga)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jumlah Kepala Keluarga (KK) Terdampak</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={familyCount} 
                      onChange={(e) => setFamilyCount(Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Aksesibilitas Lapangan</label>
                  <textarea 
                    className="form-control textarea" 
                    rows={3} 
                    defaultValue="Jalur utama jembatan dapat dilalui truk tangki air sedang (kapasitas 5.000 L). Posko darurat terdekat berada di balai desa."
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="form-fields-group">
                <div className="form-group">
                  <label className="form-label">Lampirkan Foto Kondisi atau Surat RT/RW</label>
                  <label className="report-upload-box">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileName(e.target.files[0].name);
                        }
                      }} 
                    />
                    <div className="upload-box-icon"><Icon name="plus" /></div>
                    <strong>Pilih foto atau dokumen bukti</strong>
                    <p>Mendukung format JPG, PNG, atau PDF · Maksimal 10 MB</p>
                    {fileName && (
                      <div className="uploaded-file-chip">
                        <Icon name="check" /> {fileName}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="form-fields-group">
                <div className="report-review-box">
                  <div className="review-top-banner">
                    <div>
                      <span className="review-code-badge">RK-2026-00124</span>
                      <h3>{category}</h3>
                    </div>
                    <Pill tone="critical">{urgency}</Pill>
                  </div>

                  <div className="review-details-grid">
                    <div className="review-item">
                      <span className="review-label">Posko Penampung Data</span>
                      <strong>{poskoTarget}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Status Hunian</span>
                      <strong>{shelterStatus}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Jumlah Kebutuhan</span>
                      <strong>{amount}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Keluarga Terdampak</span>
                      <strong>{familyCount} Kepala Keluarga</strong>
                    </div>
                    <div className="review-item wide">
                      <span className="review-label">Lokasi Penanganan</span>
                      <strong>{village}, {district}, {regency}</strong>
                    </div>
                    <div className="review-item wide">
                      <span className="review-label">Uraian Kebutuhan</span>
                      <p>{notes}</p>
                    </div>
                    <div className="review-item wide">
                      <span className="review-label">Berkas Lampiran</span>
                      <span className="review-file-tag"><Icon name="file" /> {fileName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="report-form-actions">
            <Button 
              variant="secondary" 
              disabled={step === 1} 
              onClick={() => setStep(step - 1)}
            >
              Kembali
            </Button>
            <Button 
              onClick={() => { 
                if (step < 5) setStep(step + 1); 
                else { 
                  update({ status: "Dalam Verifikasi" }, "Laporan kebutuhan darurat dikirim oleh Andi Pratama"); 
                  setSuccess(true); 
                } 
              }}
            >
              {step === 5 ? "Kirim Laporan Sekarang" : "Lanjutkan"} <Icon name="next" />
            </Button>
          </div>
        </div>

        {/* RIGHT GUIDANCE SIDEBAR */}
        <aside className="report-side-guidance">
          <div className="guidance-card">
            <div className="guidance-icon-circle">
              <Icon name="check" />
            </div>
            <h3>Panduan Pengisian Laporan</h3>
            <p>
              Data yang Anda laporkan akan diteruskan ke sistem koordinasi terpadu untuk validasi posko dan penugasan responder lapangan.
            </p>

            <ul className="guidance-checklist">
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Validasi Cepat</strong>
                  <small>Petugas Posko memvalidasi kebutuhan dalam waktu &lt; 24 jam.</small>
                </div>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Kerahasiaan Terlindungi</strong>
                  <small>Titik lokasi digeneralisasi untuk menjaga privasi masyarakat terdampak.</small>
                </div>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Alokasi Terarah</strong>
                  <small>Logistik disalurkan langsung oleh mitra terverifikasi BPBD &amp; PMI.</small>
                </div>
              </li>
            </ul>

            <div className="guidance-footer-note">
              <Icon name="help" />
              <span>Butuh bantuan kedaruratan segera? Hubungi Call Center 112 atau Posko Sukabumi.</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

type RouterProps = { page: PortalPage; setPage: (p: PortalPage | "logout") => void; state: SharedState; update: (x: Partial<SharedState>, log?: string) => void; notify: (x: string) => void; name?: string };

function CitizenDashboard({ state, update, setPage, name }: { state: SharedState; update: RouterProps["update"]; setPage: RouterProps["setPage"]; name: string }) {
  const [selectedQuick, setSelectedQuick] = useState(0);
  const complete = state.delivered >= 1000;

  const quickItems = [
    { 
      icon: "plus", 
      title: "Buat Laporan", 
      copy: "Sampaikan kebutuhan darurat pascabencana.", 
      page: "report" as PortalPage,
      badge: "Utama"
    },
    { 
      icon: "file", 
      title: "Laporan Saya", 
      copy: "Pantau alur verifikasi & penanganan posko.", 
      page: "cases" as PortalPage,
      badge: "Aktif"
    },
    { 
      icon: "help", 
      title: "Pusat Bantuan", 
      copy: "Temukan SOP layanan dan kontak bantuan.", 
      page: "help" as PortalPage,
      badge: "Panduan"
    }
  ];

  return (
    <main className="workspace citizen-home">
      <PageHead 
        eyebrow="Layanan masyarakat" 
        title={`Halo, ${name.split(" ")[0]}. Pantau perjalanan bantuanmu.`} 
        copy="Setiap laporan memiliki langkah berikutnya yang jelas hingga bantuan diterima." 
        action={<div className="trust-badge"><Icon name="check" /> Data terlindungi</div>} 
      />
      
      <section className="citizen-feature">
        <div className="feature-shape" />
        <div className="case-summary">
          <div>
            <span className="active-case-label">Laporan aktif · RK-2026-00124</span>
            <Pill tone="critical">Kritis</Pill>
          </div>
          <h2>Air Bersih</h2>
          <p>Kebutuhan air bersih untuk 87 keluarga di Desa Sukamaju sedang ditangani.</p>
          <div className="case-meta"><Icon name="pin" /> Desa Sukamaju · 87 keluarga</div>
          <Button variant="light" onClick={() => setPage("case")}>Lihat Perjalanan <Icon name="next" /></Button>
          <div className="feature-progress">
            <span><b>{state.delivered} L</b> dari 1.000 L tersalurkan</span>
            <strong>{state.delivered / 10}%</strong>
            <Progress value={state.delivered / 10} />
          </div>
        </div>
        
        <div className="case-journey">
          <span className="eyebrow">Status terkini</span>
          <h3>{complete ? "Bantuan telah lengkap" : state.status}</h3>
          <p>Perjalanan bantuan diperbarui oleh posko dan responder.</p>
          {["Dilaporkan", "Diverifikasi", "Ditugaskan", "Dalam Pengiriman", "Diterima"].map((x, i) => (
            <div className={i < (complete ? 5 : 3) ? "done" : i === (complete ? 4 : 3) ? "current" : ""} key={x}>
              <i>{i < (complete ? 5 : 3) && <Icon name="check" />}</i>
              <span>{x}</span>
            </div>
          ))}
          {complete && state.status !== "Selesai" && (
            <Button variant="light" onClick={() => update({ status: "Selesai" }, "Bantuan dikonfirmasi diterima oleh Andi Pratama")}>
              Konfirmasi Bantuan Diterima
            </Button>
          )}
        </div>
      </section>

      {/* REDESIGNED QUICK ACCESS SECTION WITH DYNAMIC HIGHLIGHT BAR */}
      <section className="quick-access">
        <div className="section-title">
          <div>
            <span className="eyebrow">Aksi Mandiri</span>
            <h2>Akses Cepat Layanan</h2>
          </div>
          <button onClick={() => setPage("cases")}>Lihat semua layanan <Icon name="next" /></button>
        </div>
        <div className="quick-access-grid">
          {quickItems.map((item, idx) => (
            <button 
              key={item.title} 
              className={`quick-card ${selectedQuick === idx ? "featured" : ""}`} 
              onMouseEnter={() => setSelectedQuick(idx)}
              onClick={() => { setSelectedQuick(idx); setPage(item.page); }}
            >
              <div className="quick-card-top">
                <div className="quick-icon-box">
                  <Icon name={item.icon} />
                </div>
                <span className="quick-badge">{item.badge}</span>
              </div>
              <div className="quick-card-body">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <div className="quick-card-action">
                <span>Buka Layanan</span>
                <span className="quick-arrow"><Icon name="next" /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* REDESIGNED NOTIFICATIONS SECTION */}
      <section className="notifications-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Pembaruan Langsung</span>
            <h2>Notifikasi Terbaru</h2>
          </div>
          <button onClick={() => setPage("notifications")}>Lihat semua <Icon name="next" /></button>
        </div>
        
        <div className="notif-card-container">
          {[
            { text: "Bantuan sedang dalam pengiriman.", time: "1 jam lalu", tag: "Pengiriman", unread: true, code: "RK-2026-00124" },
            { text: "BPBD telah menyerahkan 500 L air bersih.", time: "2 jam lalu", tag: "Penyerahan", unread: false, code: "RK-2026-00124" },
            { text: "Laporan telah diverifikasi oleh Petugas Posko.", time: "3 jam lalu", tag: "Verifikasi", unread: false, code: "RK-2026-00124" },
          ].map((x) => (
            <button className={`notif-item ${x.unread ? "unread" : ""}`} onClick={() => setPage("case")} key={x.text}>
              <div className="notif-item-left">
                <div className={`notif-icon-circle ${x.unread ? "new" : ""}`}>
                  <Icon name="bell" />
                  {x.unread && <span className="notif-dot-pulse" />}
                </div>
                <div className="notif-item-content">
                  <div className="notif-header-line">
                    <span className="notif-tag">{x.tag}</span>
                    <small>{x.time} · {x.code}</small>
                  </div>
                  <strong>{x.text}</strong>
                </div>
              </div>
              <div className="notif-item-arrow">
                <Icon name="next" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function CaseList({ title, copy, onCase, own = false, completed = false }: { title: string; copy: string; onCase: () => void; own?: boolean; completed?: boolean }) {
  const [filter, setFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const data = cases.filter((c) => {
    const matchesOwn = !own || ["RK-2026-00124", "RK-2026-00128"].includes(c[0]);
    const matchesCompleted = !completed || c[6] === "Selesai";
    const matchesFilter = filter === "Semua" || c[5] === filter;
    const matchesSearch = !searchQuery || c[0].toLowerCase().includes(searchQuery.toLowerCase()) || c[1].toLowerCase().includes(searchQuery.toLowerCase()) || c[2].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOwn && matchesCompleted && matchesFilter && matchesSearch;
  });

  return (
    <main className="workspace cases-workspace">
      <PageHead 
        eyebrow="Portal Kebutuhan" 
        title={title} 
        copy={copy} 
        action={<div className="trust-badge"><Icon name="check" /> {data.length} Kasus Terdata</div>}
      />

      {/* FILTER & SEARCH BAR */}
      <div className="cases-filter-bar">
        <div className="cases-search-box">
          <Icon name="file" />
          <input 
            type="text" 
            placeholder="Cari kode kasus, jenis kebutuhan, atau desa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="cases-pill-filters">
          {["Semua", "Kritis", "Tinggi", "Sedang"].map((x) => (
            <button 
              key={x} 
              type="button" 
              className={`case-filter-btn ${filter === x ? "active" : ""}`} 
              onClick={() => setFilter(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {/* REDESIGNED CASE CARDS GRID */}
      <div className="case-cards-grid">
        {data.map((c) => {
          const isCritical = c[5] === "Kritis";
          const isHigh = c[5] === "Tinggi";
          const isDone = c[6] === "Selesai";
          return (
            <div className={`case-aesthetic-card ${isCritical ? "priority-critical" : ""}`} key={c[0]}>
              <div className="case-card-header">
                <div className="case-code-badge">{c[0]}</div>
                <Pill tone={isCritical ? "critical" : isHigh ? "high" : "medium"}>{c[5]}</Pill>
              </div>

              <div className="case-card-body">
                <h3>{c[1]}</h3>
                <div className="case-card-location">
                  <Icon name="pin" />
                  <span>{c[2]} · {c[3]}</span>
                </div>
                <div className="case-card-quantity">
                  <small>Target Volume Bantuan:</small>
                  <strong>{c[4]}</strong>
                </div>
              </div>

              <div className="case-card-footer">
                <div className="case-status-indicator">
                  <i className={`status-dot ${isDone ? "done" : "active"}`} />
                  <span>{c[6]}</span>
                </div>
                <button type="button" className="btn-case-action" onClick={onCase}>
                  Pantau Kasus <Icon name="next" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function CaseDetail({ state, update, back, posko = false }: { state: SharedState; update: RouterProps["update"]; back: () => void; posko?: boolean }) {
  const allocate = () =>
    update(
      {
        allocated: Math.min(1000, state.allocated + (state.allocated < 500 ? 500 : state.allocated < 800 ? 300 : 200)),
        status: "Ditugaskan",
      },
      "Sumber daya dialokasikan oleh Siti Rahma (Koordinator Posko)"
    );

  const percent = Math.min(100, Math.round((state.delivered / 1000) * 100));
  const isPublished = state.status.includes("Terbuka") || state.status === "Terverifikasi" || state.status === "Ditugaskan" || state.status === "Dalam Pengiriman" || state.status === "Selesai";

  return (
    <main className="workspace case-detail-workspace">
      <button className="btn-back-nav" onClick={back}>
        <Icon name="arrow" /> Kembali ke Daftar Kasus
      </button>

      {/* TOP CASE HERO HEADER */}
      <div className="case-hero-banner">
        <div className="case-hero-main">
          <div className="case-hero-badge-row">
            <span className="case-hero-code">KODE KASUS: RK-2026-00124</span>
            <span className="case-hero-posko-badge">
              <Icon name="pin" /> Posko Induk 01 Sukamaju
            </span>
            <Pill tone={state.priority === "Kritis" ? "critical" : state.priority === "Tinggi" ? "high" : "medium"}>
              Prioritas {state.priority}
            </Pill>
            <span className="case-hero-status-tag">
              <i className="status-dot-pulse" /> {state.status}
            </span>
          </div>
          <h1>Kebutuhan Air Bersih Mendesak (87 KK)</h1>
          <div className="case-hero-meta-row">
            <span><Icon name="pin" /> Ditampung di: <strong>Posko Induk 01 Balai Desa Sukamaju</strong></span>
            <span><Icon name="user" /> Agregasi: 87 Kepala Keluarga Terdampak</span>
            <span><Icon name="clock" /> Dilaporkan 10:21 WIB</span>
          </div>
        </div>
        <div className="case-hero-quick-action">
          {posko && (state.status === "Dalam Verifikasi" || state.status === "Menunggu Publikasi Posko") && (
            <Button onClick={() => update({ status: "Kebutuhan Terbuka (Mencari Mitra)" }, "Laporan diverifikasi & dipublish ke papan kebutuhan terbuka oleh Siti Rahma (Koordinator Posko)")}>
              <Icon name="check" /> Verifikasi &amp; Rilis ke Kebutuhan Terbuka
            </Button>
          )}
          {isPublished && (
            <div className="verified-pill">
              <Icon name="check" /> Dipublish ke Seluruh Mitra &amp; Instansi
            </div>
          )}
        </div>
      </div>

      {/* FULFILLMENT PROGRESS CARD */}
      <div className="case-progress-card">
        <div className="progress-card-top">
          <div>
            <span className="progress-card-eyebrow">Progres Penyaluran Bantuan Posko</span>
            <div className="progress-card-numbers">
              <strong>{state.delivered.toLocaleString("id-ID")} <small>/ 1.000 L</small></strong>
              <span className="progress-card-percent">{percent}% Terpenuhi</span>
            </div>
          </div>
          <div className="progress-card-stats">
            <div className="progress-mini-stat">
              <small>Dialokasikan Mitra</small>
              <b>{state.allocated.toLocaleString("id-ID")} L</b>
            </div>
            <div className="progress-mini-stat">
              <small>Sisa Kebutuhan</small>
              <b>{Math.max(0, 1000 - state.delivered).toLocaleString("id-ID")} L</b>
            </div>
          </div>
        </div>

        <div className="case-progress-bar-wrap">
          <div className="case-progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="case-detail-content-grid">
        {/* LEFT COLUMN: SITUATION & EVIDENCE */}
        <div className="case-detail-left-col">
          {/* Situation Card */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="file" /></div>
              <div>
                <h3>Uraian Kebutuhan &amp; Kondisi Posko Wilayah</h3>
                <small>Rekapitulasi warga terdaftar di Posko Induk 01 Sukamaju</small>
              </div>
            </div>

            <div className="situation-body">
              <h4>Sumber air utama pipa dan sumur warga tercemar luapan banjir lumpur.</h4>
              <p>
                Akses air minum dan memasak terputus untuk 87 KK di RT 04/RW 02. Posko telah merekapitulasi total kebutuhan sebesar 1.000 Liter dan membuka peluang bagi Instansi, NGO, maupun Komunitas Relawan untuk menyalurkan bantuan.
              </p>
            </div>

            <div className="reporter-profile-box">
              <div className="reporter-avatar">AP</div>
              <div className="reporter-info">
                <strong>Andi Pratama (Perwakilan Warga RT 04)</strong>
                <small>Terdaftar di Posko Induk Sukamaju · Kontak: +62 812 4455 0188</small>
              </div>
              <span className="reporter-tag">Warga Terverifikasi</span>
            </div>
          </div>

          {/* Evidence Photo Card */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="pin" /></div>
              <div>
                <h3>Foto Bukti Kondisi Lapangan</h3>
                <small>Dokumentasi geotagged lokasi penanganan</small>
              </div>
            </div>

            <figure className="case-evidence-frame">
              <img 
                src="https://images.unsplash.com/photo-1738077398088-b56627bd9c3e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=1400" 
                alt="Kondisi jalan dan warga di lokasi bencana Sukamaju" 
              />
              <figcaption className="case-evidence-caption">
                <div className="evidence-caption-main">
                  <span><Icon name="pin" /> Titik Kumpul RT 04 Desa Sukamaju</span>
                  <small>Diambil 10:21 WIB · Validasi AI Geotag Aktif</small>
                </div>
                <span className="evidence-badge"><Icon name="check" /> Terverifikasi Asli</span>
              </figcaption>
            </figure>
          </div>

          {/* Operational Map Card */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="map" /></div>
              <div>
                <h3>Peta Titik Lokasi &amp; Navigasi</h3>
                <small>Koordinat wilayah Posko Induk Desa Sukamaju</small>
              </div>
            </div>
            <div className="case-map-container">
              <MapView operational />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE ALLOCATION & LOGS */}
        <div className="case-detail-right-col">
          {/* Resource Allocation Card */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="box" /></div>
              <div>
                <h3>Alokasi Penyaluran Mitra &amp; Instansi</h3>
                <small>Daftar organisasi yang telah mengklaim misi untuk posko ini</small>
              </div>
            </div>

            <div className="allocation-list-cards">
              {[
                { name: "BPBD Kabupaten Sukabumi", type: "Instansi Pemerintah", qty: "500 L", cap: 500, est: "Truk Tangki No. 02" },
                { name: "PMI Kabupaten Sukabumi", type: "Organisasi Kemanusiaan", qty: "300 L", cap: 800, est: "Mobil Tangki PMI" },
                { name: "Komunitas Relawan Dapur Umum", type: "Komunitas Peduli / Relawan", qty: "200 L", cap: 1000, est: "Tandon Air Bergerak" },
              ].map((item) => {
                const isAllocated = Number(item.cap) <= state.allocated;
                return (
                  <div className={`alloc-item-card ${isAllocated ? "allocated" : ""}`} key={item.name}>
                    <div className="alloc-item-top">
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.type} · {item.est}</small>
                      </div>
                      <span className={`alloc-pill ${isAllocated ? "done" : "ready"}`}>
                        {isAllocated ? "Telah Disalurkan" : "Tersedia"}
                      </span>
                    </div>

                    <div className="alloc-item-bottom">
                      <span className="alloc-qty-tag">{item.qty}</span>
                      {posko && !isAllocated && (
                        <button type="button" className="btn-alloc-action" onClick={allocate}>
                          Setujui Penyaluran <Icon name="next" />
                        </button>
                      )}
                      {isAllocated && (
                        <span className="alloc-checked"><Icon name="check" /> Terhubung ke Misi Responder</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {posko && (
              <div className="priority-control-box">
                <label className="form-label">Sesuaikan Skala Prioritas Penanganan Posko</label>
                <select 
                  className="form-control select" 
                  value={state.priority} 
                  onChange={(e) => update({ priority: e.target.value }, `Prioritas diubah menjadi ${e.target.value} oleh Siti Rahma`)}
                >
                  <option>Kritis</option>
                  <option>Tinggi</option>
                  <option>Sedang</option>
                </select>
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="case-section-card">
            <Activity state={state} />
          </div>
        </div>
      </div>
    </main>
  );
}

function PoskoRouter({ page, setPage, state, update, notify }: RouterProps) {
  if (page === "dashboard") return <PoskoDashboard state={state} setPage={setPage} />;
  if (page === "case") return <CaseDetail state={state} update={update} back={() => setPage("cases")} posko />;
  if (page === "cases") return <CaseList title="Kebutuhan Warga Posko" copy="Verifikasi data KK dan rilis kebutuhan terbuka ke publik/mitra." onCase={() => setPage("case")} />;
  if (page === "map") return <MapPage open={() => setPage("case")} />;
  if (page === "resources") return <Resources state={state} update={update} responder={false} />;
  if (page === "assignments") return <Assignments state={state} open={() => setPage("case")} />;
  if (page === "notifications") return <Notifications role="posko" open={() => setPage("case")} />;
  if (page === "profile") return <Profile name="Siti Rahma" role="Petugas Posko" notify={notify} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

function PoskoDashboard({ state, setPage }: { state: SharedState; setPage: RouterProps["setPage"] }) {
  return (
    <main className="workspace posko-dashboard-workspace">
      <PageHead 
        eyebrow="Posko Induk 01 · Balai Desa Sukamaju" 
        title="Ringkasan Operasional Posko" 
        copy="Pusat penampungan data warga, verifikasi kebutuhan KK, dan rilis publikasi bantuan terbuka bagi Instansi &amp; Mitra Organisasi." 
        action={
          <div className="posko-status-live-badge">
            <span className="live-indicator-dot" /> Posko Wilayah Aktif (87 KK)
          </div>
        }
      />

      {/* WORKLOAD SUMMARY METRICS CARDS */}
      <div className="posko-workload-grid">
        <div className="posko-workload-card warning">
          <div className="workload-card-top">
            <span className="workload-tag">Laporan Masuk KK</span>
            <div className="workload-icon"><Icon name="file" /></div>
          </div>
          <strong className="workload-number">12</strong>
          <small className="workload-sub">Perlu verifikasi data</small>
        </div>

        <div className="posko-workload-card danger">
          <div className="workload-card-top">
            <span className="workload-tag">Kebutuhan Terbuka</span>
            <div className="workload-icon"><Icon name="pin" /></div>
          </div>
          <strong className="workload-number">8</strong>
          <small className="workload-sub">Dipublish ke mitra</small>
        </div>

        <div className="posko-workload-card info">
          <div className="workload-card-top">
            <span className="workload-tag">Disalurkan Mitra</span>
            <div className="workload-icon"><Icon name="task" /></div>
          </div>
          <strong className="workload-number">15</strong>
          <small className="workload-sub">Armada dalam pengiriman</small>
        </div>

        <div className="posko-workload-card success">
          <div className="workload-card-top">
            <span className="workload-tag">Selesai Diserahkan</span>
            <div className="workload-icon"><Icon name="check" /></div>
          </div>
          <strong className="workload-number">23</strong>
          <small className="workload-sub">Telah diterima warga</small>
        </div>
      </div>

      {/* SPLIT COMMAND GRID: ATTENTION LIST & LIVE MAP */}
      <section className="posko-ops-grid">
        {/* Left: Cases needing attention */}
        <div className="ops-card-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Daftar Kebutuhan Terbuka Posko Ini</h3>
              <p>Kebutuhan KK yang telah diverifikasi dan siap disalurkan mitra</p>
            </div>
            <button type="button" className="btn-ops-all" onClick={() => setPage("cases")}>
              Lihat Semua <Icon name="next" />
            </button>
          </div>

          <div className="ops-attention-list">
            {cases.slice(0, 4).map((c) => (
              <button 
                type="button" 
                className="ops-attention-item" 
                onClick={() => setPage("case")} 
                key={c[0]}
              >
                <div className="ops-item-badge">
                  <Pill tone={c[5] === "Kritis" ? "critical" : "high"}>{c[5]}</Pill>
                </div>
                <div className="ops-item-info">
                  <strong>{c[1]}</strong>
                  <small>{c[0]} · {c[2]} · Target {c[4]}</small>
                </div>
                <span className="ops-item-action">
                  Buka Kasus <Icon name="next" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Operational Map Preview */}
        <div className="ops-card-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Peta Sebaran Kebutuhan Wilayah</h3>
              <p>Visualisasi sebaran posko dan titik darurat</p>
            </div>
            <button type="button" className="btn-ops-all" onClick={() => setPage("map")}>
              Perbesar Peta <Icon name="next" />
            </button>
          </div>

          <div className="ops-map-wrapper">
            <MapView operational />
          </div>
        </div>
      </section>

      {/* ACTIVITY LOG SECTION */}
      <div className="posko-activity-panel">
        <Activity state={state} />
      </div>
    </main>
  );
}

function MapPage({ open }: { open: () => void }) {
  const [priority, setPriority] = useState("Semua");
  return (
    <main className="workspace map-page-workspace">
      <PageHead 
        eyebrow="Pusat Pemetaan GIS" 
        title="Peta Kebutuhan Bencana" 
        copy="Pantau sebaran titik kebutuhan, rute distribusi bantuan, dan posko penanganan di seluruh wilayah." 
      />

      <div className="map-page-top-bar">
        <div className="cases-pill-filters">
          {["Semua", "Kritis", "Tinggi", "Sedang", "Selesai"].map((x) => (
            <button 
              type="button" 
              className={`case-filter-btn ${priority === x ? "active" : ""}`} 
              onClick={() => setPriority(x)} 
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="map-page-wrapper">
        <MapView operational />
        <div className="map-page-floating-action">
          <div className="map-floating-info">
            <div className="floating-pin-icon"><Icon name="pin" /></div>
            <div>
              <small>Posko Terpilih</small>
              <strong>Posko Induk 01 Sukamaju · Air Bersih (RK-2026-00124)</strong>
            </div>
          </div>
          <Button onClick={open} className="btn-map-inspect">
            Buka Kasus Ini <Icon name="next" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function Resources({ state, update, responder }: { state: SharedState; update: RouterProps["update"]; responder: boolean }) {
  const [kind, setKind] = useState("Semua jenis");
  const allocate = () =>
    update({ allocated: Math.min(1000, state.allocated + 500), status: "Ditugaskan" }, "BPBD dialokasikan 500 L air bersih");

  const resourceData = [
    { name: "BPBD Kabupaten Sukabumi", type: "Air Bersih", orgType: "Instansi Pemerintah", qty: "500 L", dist: "2,4 km", badge: "Siaga", isAllocated: state.allocated >= 500 },
    { name: "PMI Kabupaten Sukabumi", type: "Air Bersih", orgType: "Organisasi Sosial", qty: "300 L", dist: "4,1 km", badge: "Tersedia", isAllocated: false },
    { name: "Komunitas Relawan Dapur Umum", type: "Makanan", orgType: "Komunitas Peduli", qty: "500 Paket", dist: "3,8 km", badge: "Siap Salurkan", isAllocated: false },
    { name: "Mitra Relawan Lokal", type: "Air Bersih", orgType: "Relawan Mandiri", qty: "200 L", dist: "6,2 km", badge: "Tersedia", isAllocated: false },
  ];

  const filtered = resourceData.filter((x) => kind === "Semua jenis" || x.type === kind);

  return (
    <main className="workspace resources-workspace">
      <PageHead 
        eyebrow="Kapasitas &amp; Logistik Terpadu" 
        title="Sumber Daya Mitra &amp; Instansi" 
        copy="Pantau ketersediaan armada, volume bantuan dari Instansi, NGO, dan Komunitas Peduli yang siap dialokasikan ke posko wilayah." 
        action={<div className="trust-badge"><Icon name="box" /> Gudang Mitra Siaga</div>}
      />

      <div className="resource-filter-bar">
        <div className="cases-pill-filters">
          {["Semua jenis", "Air Bersih", "Makanan"].map((t) => (
            <button
              key={t}
              type="button"
              className={`case-filter-btn ${kind === t ? "active" : ""}`}
              onClick={() => setKind(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="resources-grid">
        {filtered.map((item, i) => (
          <div className="resource-card" key={item.name}>
            <div className="resource-card-header">
              <span className="resource-org-mark">{item.name.slice(0, 2).toUpperCase()}</span>
              <span className={`resource-status-badge ${item.isAllocated ? "allocated" : "ready"}`}>
                {item.isAllocated ? "Telah Disalurkan" : item.badge}
              </span>
            </div>

            <div className="resource-card-body">
              <span className="resource-category-chip">{item.orgType}</span>
              <h3>{item.name}</h3>
              <div className="resource-meta-row">
                <span><Icon name="box" /> {item.type}</span>
                <span><Icon name="pin" /> {item.dist} dari Posko Induk</span>
              </div>
              <div className="resource-qty-banner">
                <small>Kapasitas Bantuan:</small>
                <strong>{item.qty}</strong>
              </div>
            </div>

            <div className="resource-card-footer">
              {responder ? (
                <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(item.name)}>
                  Salin Kontak &amp; Info
                </Button>
              ) : (
                <Button 
                  disabled={i === 0 && item.isAllocated} 
                  onClick={allocate}
                  className={item.isAllocated ? "allocated-btn" : ""}
                >
                  {i === 0 && item.isAllocated ? "Telah Disalurkan ke Posko" : "Alokasikan ke Posko"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Assignments({ state, open }: { state: SharedState; open: () => void }) {
  const assignments = [
    { id: "ASG-001", org: "BPBD Kabupaten", type: "Instansi", qty: "500 L", status: state.assignment, code: "RK-2026-00124", dest: "Posko Induk 01 Sukamaju" },
    { id: "ASG-002", org: "PMI Kabupaten", type: "Organisasi", qty: "300 L", status: "Dalam Pengiriman", code: "RK-2026-00124", dest: "Posko Induk 01 Sukamaju" },
    { id: "ASG-003", org: "Komunitas Relawan Dapur Umum", type: "Komunitas", qty: "200 L", status: "Ditugaskan", code: "RK-2026-00124", dest: "Posko Induk 01 Sukamaju" },
  ];

  return (
    <main className="workspace assignments-workspace">
      <PageHead 
        eyebrow="Koordinasi Lapangan" 
        title="Penugasan &amp; Distribusi" 
        copy="Pantau tugas armada aktif, status pengiriman langsung, dan serah terima bantuan warga." 
      />

      {/* SUMMARY STATS */}
      <div className="assignments-summary-row">
        <div className="asg-sum-box">
          <strong>18</strong>
          <span>Tugas Aktif</span>
        </div>
        <div className="asg-sum-box info">
          <strong>7</strong>
          <span>Dalam Perjalanan</span>
        </div>
        <div className="asg-sum-box success">
          <strong>24</strong>
          <span>Selesai Hari Ini</span>
        </div>
      </div>

      <div className="assignments-list-grid">
        {assignments.map((x) => (
          <div className="assignment-card" key={x.id}>
            <div className="asg-card-header">
              <span className="asg-id-badge">{x.id}</span>
              <Pill tone={x.status === "Selesai" ? "done" : x.status === "Dalam Pengiriman" ? "high" : "neutral"}>
                {x.status}
              </Pill>
            </div>

            <div className="asg-card-body">
              <span className="resource-category-chip">{x.type}</span>
              <h3>{x.org}</h3>
              <div className="asg-meta-row">
                <span><Icon name="file" /> {x.code}</span>
                <span><Icon name="pin" /> {x.dest}</span>
              </div>
              <div className="asg-payload-badge">
                <small>Muatan Bantuan:</small>
                <strong>{x.qty} Air Bersih</strong>
              </div>
            </div>

            <div className="asg-card-footer">
              <button type="button" className="btn-asg-view" onClick={open}>
                Detail Penugasan <Icon name="next" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Activity({ state }: { state: SharedState }) {
  const times = ["11:48 WIB", "11:20 WIB", "10:57 WIB", "10:42 WIB", "10:21 WIB"];
  return (
    <div className="activity-aesthetic-panel">
      <div className="activity-panel-header">
        <div className="activity-header-title">
          <span className="eyebrow">Jejak Operasional Posko</span>
          <h3>Aktivitas &amp; Log Pembaruan</h3>
        </div>
        <span className="activity-live-tag"><i className="dot-green" /> Waktu Nyata</span>
      </div>

      <div className="activity-timeline-list">
        {state.logs.map((x, i) => (
          <div className="activity-timeline-item" key={`${x}-${i}`}>
            <div className="timeline-node">
              <span className="timeline-dot" />
              {i < state.logs.length - 1 && <span className="timeline-line" />}
            </div>
            <div className="timeline-content-card">
              <div className="timeline-card-top">
                <time className="timeline-time">{times[i] || "10:21 WIB"}</time>
                <span className="timeline-case-code">Posko 01 · RK-2026-00124</span>
              </div>
              <p className="timeline-text">{x}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponderRouter({ page, setPage, state, update, notify }: RouterProps) {
  if (page === "dashboard") return <ResponderDashboard state={state} update={update} setPage={setPage} />;
  if (page === "tasks") return <ResponderTask state={state} update={update} />;
  if (page === "map") return <MapPage open={() => setPage("tasks")} />;
  if (page === "history") return <Assignments state={state} open={() => setPage("tasks")} />;
  if (page === "notifications") return <Notifications role="responder" open={() => setPage("tasks")} />;
  if (page === "profile") return <Profile name="Arif Nugroho" role="BPBD Kabupaten" notify={notify} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

function ResponderDashboard({ state, update, setPage }: { state: SharedState; update: RouterProps["update"]; setPage: RouterProps["setPage"] }) {
  const openNeeds = [
    { posko: "Posko Induk 01 Sukamaju", item: "Air Bersih (1.000 L)", kk: "87 KK", urgency: "Kritis", claimed: state.assignment !== "Baru" },
    { posko: "Posko Darurat 02 Lapangan Cibadak", item: "Makanan Siap Saji (360 Paket)", kk: "120 KK", urgency: "Tinggi", claimed: false },
    { posko: "Posko 03 Kantor Kecamatan Cibadak", item: "Obat-obatan & Selimut (180 Paket)", kk: "64 KK", urgency: "Kritis", claimed: false },
  ];

  return (
    <main className="workspace responder-workspace">
      <PageHead 
        eyebrow="Portal Mitra &amp; Instansi Responder" 
        title="Bursa Kebutuhan Terbuka &amp; Ringkasan" 
        copy="Pilih kebutuhan terbuka yang dipublish oleh Posko Wilayah untuk disalurkan oleh Instansi, Organisasi Kemanusiaan, atau Komunitas Anda." 
        action={
          <div className="posko-status-live-badge">
            <span className="live-indicator-dot" /> Mitra Siaga Aktif (BPBD / NGO)
          </div>
        }
      />

      {/* METRIC OVERVIEW CARDS */}
      <div className="posko-workload-grid">
        <div className="posko-workload-card danger">
          <div className="workload-card-top">
            <span className="workload-tag">Kebutuhan Terbuka</span>
            <div className="workload-icon"><Icon name="pin" /></div>
          </div>
          <strong className="workload-number">3</strong>
          <small className="workload-sub">Siap diklaim mitra</small>
        </div>

        <div className="posko-workload-card info">
          <div className="workload-card-top">
            <span className="workload-tag">Misi Lapangan</span>
            <div className="workload-icon"><Icon name="task" /></div>
          </div>
          <strong className="workload-number">{state.assignment === "Selesai" ? "0" : "1"}</strong>
          <small className="workload-sub">Status: {state.assignment}</small>
        </div>

        <div className="posko-workload-card success">
          <div className="workload-card-top">
            <span className="workload-tag">Total KK Terbantu</span>
            <div className="workload-icon"><Icon name="check" /></div>
          </div>
          <strong className="workload-number">87</strong>
          <small className="workload-sub">Penyaluran tervalidasi</small>
        </div>

        <div className="posko-workload-card warning">
          <div className="workload-card-top">
            <span className="workload-tag">Armada Siaga</span>
            <div className="workload-icon"><Icon name="box" /></div>
          </div>
          <strong className="workload-number">4</strong>
          <small className="workload-sub">Truk &amp; Tandon Air</small>
        </div>
      </div>

      {/* ACTIVE MISSION HIGHLIGHT BANNER (IF ACTIVE) */}
      {state.assignment !== "Baru" && (
        <div className="active-mission-banner-card">
          <div className="active-mission-banner-info">
            <span className="mission-banner-pill"><Icon name="task" /> Misi Penyaluran Sedang Berjalan</span>
            <h3>Misi ASG-001: 500 L Air Bersih · Posko Induk 01 Sukamaju</h3>
            <p>Tahapan Operasional: <strong>{state.assignment}</strong> · Armada Truk Tangki No. 02</p>
          </div>
          <Button onClick={() => setPage("tasks")} className="btn-banner-jump">
            Buka Konsol Misi Lapangan <Icon name="next" />
          </Button>
        </div>
      )}

      {/* OPEN NEEDS MARKETPLACE / BOARD FOR MITRA & ORGANISASI */}
      <section className="open-needs-board-section">
        <div className="open-needs-header">
          <div>
            <span className="eyebrow">Bursa Bantuan Terbuka</span>
            <h3>Kebutuhan Terbuka yang Dipublish Posko Wilayah</h3>
            <p>Silakan ambil komitmen bantuan logistik sesuai kapasitas organisasi atau komunitas Anda</p>
          </div>
        </div>

        <div className="open-needs-cards-grid">
          {openNeeds.map((need) => (
            <div className={`open-need-card ${need.claimed ? "claimed" : ""}`} key={need.posko}>
              <div className="open-need-top">
                <span className="open-need-posko-badge"><Icon name="pin" /> {need.posko}</span>
                <Pill tone={need.urgency === "Kritis" ? "critical" : "high"}>{need.urgency}</Pill>
              </div>

              <div className="open-need-body">
                <h4>{need.item}</h4>
                <div className="open-need-meta">
                  <span><Icon name="user" /> {need.kk} Terdampak</span>
                  <span><Icon name="check" /> Terverifikasi Posko</span>
                </div>
              </div>

              <div className="open-need-footer">
                {need.claimed ? (
                  <Button variant="secondary" onClick={() => setPage("tasks")} className="btn-claimed-view">
                    <Icon name="check" /> Buka Misi Aktif <Icon name="next" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      update({ assignment: "Diterima", status: "Ditugaskan" }, "Misi penyaluran diambil oleh Mitra Responder");
                      setPage("tasks");
                    }}
                    className="btn-claim-need"
                  >
                    Klaim &amp; Salurkan Bantuan Ini <Icon name="next" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ResponderTask({ state, update }: { state: SharedState; update: RouterProps["update"] }) {
  const states = ["Baru", "Diterima", "Disiapkan", "Dalam Pengiriman", "Tiba di Lokasi", "Selesai"];
  const idx = Math.max(0, states.indexOf(state.assignment));
  const actions = ["Terima Tugas", "Siapkan Bantuan", "Mulai Pengiriman", "Saya Sudah Tiba", "Konfirmasi Penyerahan"];
  
  const advance = () => {
    const next = states[Math.min(idx + 1, 5)];
    update(
      {
        assignment: next,
        delivered: next === "Selesai" ? 1000 : state.delivered,
        status: next === "Selesai" ? "Menunggu Konfirmasi" : next,
      },
      `${actions[idx]} oleh Arif Nugroho (Satgas BPBD / Mitra Responder)`
    );
  };

  return (
    <main className="workspace responder-workspace">
      <PageHead 
        eyebrow="Konsol Lapangan Responder" 
        title="Misi Penyaluran Bencana" 
        copy="Navigasi rute pengiriman bantuan, koordinasi langsung dengan posko penampung, dan perbarui tahapan serah terima secara real-time." 
        action={<div className="trust-badge"><Icon name="task" /> Status: {state.assignment}</div>}
      />

      {/* ACTIVE MISSION CONSOLE */}
      <section className="responder-mission-grid">
        {/* LEFT COLUMN: MISSION DETAILS & MAP */}
        <div className="responder-mission-main">
          {/* Mission Header Card */}
          <div className="mission-hero-card">
            <div className="mission-hero-top">
              <div>
                <span className="mission-id-tag">MISI ASG-001 · POSKO INDUK 01 SUKAMAJU</span>
                <h2>Distribusi 500 L Air Bersih</h2>
                <div className="mission-meta-items">
                  <span><Icon name="pin" /> Titik: Balai RT 04 Sukamaju</span>
                  <span><Icon name="clock" /> Jarak: 2,4 km dari Posko (±18 Menit)</span>
                </div>
              </div>
              <Pill tone={state.assignment === "Selesai" ? "done" : "high"}>
                {state.assignment}
              </Pill>
            </div>

            <div className="mission-payload-box">
              <div className="payload-info">
                <small>Muatan &amp; Armada Mitra:</small>
                <strong>Truk Tangki No. 02 · Kapasitas 500 L Air Minum</strong>
              </div>
              <span className="payload-badge">Siap Salurkan</span>
            </div>
          </div>

          {/* Route Map Card */}
          <div className="mission-map-card">
            <div className="mission-card-header">
              <Icon name="map" />
              <div>
                <h3>Rute Distribusi Navigasi Posko</h3>
                <small>Panduan jalur aman terverifikasi Posko Induk 01 Sukamaju</small>
              </div>
            </div>

            <div className="mission-map-wrapper">
              <MapView operational />
            </div>

            <div className="mission-route-steps">
              <div className="route-checkpoint">
                <span className="checkpoint-dot start" />
                <div>
                  <strong>Markas Logistik Mitra</strong>
                  <small>Titik Keberangkatan Armada</small>
                </div>
              </div>
              <div className="route-arrow">➔</div>
              <div className="route-checkpoint">
                <span className="checkpoint-dot finish" />
                <div>
                  <strong>Posko Induk 01 Desa Sukamaju</strong>
                  <small>Titik Penyerahan Bantuan (2,4 km)</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKFLOW STEPPER & ACTIONS */}
        <aside className="responder-mission-side">
          {/* Coordinator Card */}
          <div className="mission-coordinator-card">
            <span className="eyebrow">Koordinator Posko Wilayah</span>
            <div className="coordinator-profile">
              <div className="coord-avatar">SR</div>
              <div>
                <strong>Siti Rahma</strong>
                <small>Koordinator Posko Induk 01 Sukamaju</small>
              </div>
            </div>
            <a href="tel:+6281288991102" className="btn-call-coord">
              <Icon name="user" /> Hubungi Posko (+62 812••••1102)
            </a>
          </div>

          {/* 5-Step Workflow Pipeline Card */}
          <div className="mission-workflow-card">
            <h3>Tahapan Operasional Lapangan</h3>
            <p className="workflow-sub">Perbarui status setiap kali Anda menyelesaikan tahapan penyaluran di posko/titik warga</p>

            <div className="mission-pipeline">
              {states.slice(0, 5).map((x, i) => {
                const isStepDone = i < idx;
                const isStepActive = i === idx;
                return (
                  <div className={`pipeline-step ${isStepDone ? "done" : ""} ${isStepActive ? "active" : ""}`} key={x}>
                    <div className="step-indicator-circle">
                      {isStepDone ? <Icon name="check" /> : i + 1}
                    </div>
                    <div className="step-label-group">
                      <strong>{x}</strong>
                      <small>{isStepDone ? "Selesai" : isStepActive ? "Sedang Berlangsung" : "Menunggu"}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="workflow-action-area">
              {idx < 5 ? (
                <Button onClick={advance} className="btn-advance-mission">
                  {actions[idx]} <Icon name="next" />
                </Button>
              ) : (
                <div className="mission-completed-banner">
                  <Icon name="check" /> Penyerahan Berhasil Dikonfirmasi
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Notifications({ role, open }: { role: Role; open: () => void }) {
  const [filter, setFilter] = useState("Semua");
  const rawItems = [
    { title: "Bantuan sedang dalam pengiriman.", desc: "Truk tangki 500 L BPBD telah diberangkatkan menuju Desa Sukamaju.", time: "1 jam lalu", code: "RK-2026-00124", cat: "Pengiriman", unread: true },
    { title: "BPBD telah menyerahkan 500 L air bersih.", desc: "Penyerahan tahap pertama telah diverifikasi oleh perwakilan RT 04.", time: "2 jam lalu", code: "RK-2026-00124", cat: "Pengiriman", unread: false },
    { title: "Laporan diverifikasi oleh Petugas Posko.", desc: "Posko Sukabumi memvalidasi kebutuhan 1.000 L air bersih.", time: "3 jam lalu", code: "RK-2026-00124", cat: "Verifikasi", unread: false },
    { title: "Penugasan responder diperbarui.", desc: "Tim PMI disiapkan untuk penyaluran logistik sanitasi pendukung.", time: "5 jam lalu", code: "RK-2026-00127", cat: "Penugasan", unread: false },
  ];

  const items = rawItems.filter((x) => filter === "Semua" || x.cat === filter);

  return (
    <main className="workspace notifications-workspace">
      <PageHead 
        eyebrow="Pusat Informasi" 
        title="Notifikasi &amp; Pembaruan" 
        copy="Pantau setiap aksi, verifikasi posko, dan pergerakan bantuan secara kronologis." 
        action={<div className="trust-badge"><Icon name="bell" /> Pembaruan Real-Time</div>}
      />

      <div className="notif-top-bar">
        <div className="cases-pill-filters">
          {["Semua", "Pengiriman", "Verifikasi", "Penugasan"].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`case-filter-btn ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="notif-inbox-list">
        {items.map((x) => (
          <div className={`notif-inbox-card ${x.unread ? "unread" : ""}`} key={x.title}>
            <div className={`notif-inbox-avatar ${x.unread ? "new" : ""}`}>
              <Icon name="bell" />
              {x.unread && <span className="notif-dot-pulse" />}
            </div>
            <div className="notif-inbox-content">
              <div className="notif-meta-row">
                <span className="notif-tag">{x.cat}</span>
                <small>{x.time} · {x.code}</small>
              </div>
              <h3>{x.title}</h3>
              <p>{x.desc}</p>
            </div>
            <button type="button" className="btn-notif-action" onClick={open}>
              Lihat Kasus <Icon name="next" />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

function Profile({ name, role, notify }: { name: string; role: string; notify: (x: string) => void }) {
  const isPosko = role.toLowerCase().includes("posko");
  const isResponder = role.toLowerCase().includes("bpbd") || role.toLowerCase().includes("responder");
  
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(name);
  const [email, setEmail] = useState(
    isPosko 
      ? "siti.rahma@posko.reksa.id" 
      : isResponder 
        ? "arif.nugroho@bpbd.reksa.id" 
        : `${name.toLowerCase().replace(/\s+/g, ".")}@reksa.id`
  );
  const [phone, setPhone] = useState(
    isPosko ? "+62 812 8899 1102" : isResponder ? "+62 813 7722 9901" : "+62 812 4455 0188"
  );
  const [nik, setNik] = useState(
    isPosko ? "PSK-SKB-2026-01" : isResponder ? "RSP-BPBD-9941" : "3202110482910002"
  );
  const [org, setOrg] = useState(
    isPosko 
      ? "Posko Induk Penanggulangan Bencana Kab. Sukabumi" 
      : isResponder 
        ? "Satgas Reaksi Cepat BPBD Kab. Sukabumi" 
        : "Warga Wilayah Sukamaju"
  );
  const [address, setAddress] = useState(
    isPosko 
      ? "Gedung Serbaguna Posko Utama, Jl. Raya Sukabumi No. 42" 
      : isResponder 
        ? "Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15" 
        : "RT 04 / RW 02, Desa Sukamaju, Kec. Cibadak, Kab. Sukabumi"
  );

  const stats = isPosko
    ? [
        { label: "Laporan Diverifikasi", val: "12", sub: "Bulan ini" },
        { label: "Alokasi Sumber Daya", val: "8", sub: "Aktif bertugas" },
        { label: "Akurasi Penanganan", val: "98.4%", sub: "SLA < 30 Menit" },
      ]
    : isResponder
      ? [
          { label: "Misi Diselesaikan", val: "24", sub: "Total selesai" },
          { label: "Tugas Pengiriman", val: "7", sub: "Dalam perjalanan" },
          { label: "Waktu Respon", val: "15 Menit", sub: "Rata-rata tiba" },
        ]
      : [
          { label: "Laporan Diajukan", val: "3", sub: "1 Dalam verifikasi" },
          { label: "Bantuan Diterima", val: "2", sub: "Terkonfirmasi RT/RW" },
          { label: "Status Verifikasi", val: "100%", sub: "Identitas valid" },
        ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(false);
    notify("Perubahan profil berhasil disimpan.");
  };

  const handleCancel = () => {
    setFullName(name);
    setEditing(false);
  };

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="workspace profile-workspace">
      <PageHead 
        eyebrow="Identitas &amp; Pengaturan Akun" 
        title="Profil Pengguna" 
        copy="Kelola informasi identitas pribadi, kontak darurat, dan preferensi akun Anda di REKSA." 
        action={
          <button 
            type="button" 
            className={`btn-profile-toggle ${editing ? "cancel" : "edit"}`} 
            onClick={() => (editing ? handleCancel() : setEditing(true))}
          >
            {editing ? (
              <>Batal Edit</>
            ) : (
              <><Icon name="user" /> Edit Profil</>
            )}
          </button>
        }
      />

      {/* HERO PROFILE CARD */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar-wrap">
          <div className="profile-hero-avatar">{initials}</div>
          <span className="profile-avatar-badge" title="Akun Terverifikasi">
            <Icon name="check" />
          </span>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-hero-name-row">
            <h2>{fullName}</h2>
            <Pill tone={isPosko ? "high" : isResponder ? "done" : "neutral"}>
              {role}
            </Pill>
            <span className="profile-verified-badge">
              <Icon name="check" /> Terverifikasi Resmi
            </span>
          </div>
          <p className="profile-hero-org">{org}</p>
          <div className="profile-hero-tags">
            <span className="profile-hero-tag">
              <Icon name="pin" /> {address.split(",")[0]}
            </span>
            <span className="profile-hero-tag">
              <Icon name="file" /> ID: {nik}
            </span>
            <span className="profile-hero-tag">
              <Icon name="clock" /> Bergabung Jan 2026
            </span>
          </div>
        </div>
      </div>

      {/* ROLE PERFORMANCE / SUMMARY STATS */}
      <div className="profile-stats-grid">
        {stats.map((s) => (
          <div className="profile-stat-box" key={s.label}>
            <span className="profile-stat-label">{s.label}</span>
            <strong className="profile-stat-val">{s.val}</strong>
            <small className="profile-stat-sub">{s.sub}</small>
          </div>
        ))}
      </div>

      {/* PROFILE DETAILS / EDIT FORM */}
      <form onSubmit={handleSave} className="profile-form-layout">
        <div className="profile-sections-grid">
          {/* SECTION 1: INFORMASI PRIBADI & KONTAK */}
          <div className="profile-panel-card">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="user" />
              </div>
              <div>
                <h3>Informasi Pribadi &amp; Kontak</h3>
                <p>Data identitas resmi untuk keperluan verifikasi dan koordinasi</p>
              </div>
            </div>

            <div className="profile-inputs-grid">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fullName} 
                  disabled={!editing} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isPosko ? "Nomor Registrasi Posko (NIP/ID)" : isResponder ? "ID Relawan / Satgas" : "Nomor Induk Kependudukan (NIK)"}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nik} 
                  disabled={!editing} 
                  onChange={(e) => setNik(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  disabled={!editing} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor WhatsApp / Telepon Aktif</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone} 
                  disabled={!editing} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: WILAYAH & LEMBAGA */}
          <div className="profile-panel-card">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="pin" />
              </div>
              <div>
                <h3>Wilayah &amp; Instansi</h3>
                <p>Lokasi posko, wilayah penugasan, atau domisili kependudukan</p>
              </div>
            </div>

            <div className="profile-inputs-grid">
              <div className="form-group full-width">
                <label className="form-label">Nama Instansi / Kelompok / Komunitas</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={org} 
                  disabled={!editing} 
                  onChange={(e) => setOrg(e.target.value)} 
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Alamat Lengkap Domisili / Posko Operasional</label>
                <textarea 
                  className="form-control textarea" 
                  rows={2} 
                  value={address} 
                  disabled={!editing} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: KEAMANAN & INTEGRASI */}
          <div className="profile-panel-card full-width">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="check" />
              </div>
              <div>
                <h3>Status Keamanan &amp; Verifikasi Sistem</h3>
                <p>Jaminan privasi data dan perlindungan enkripsi REKSA</p>
              </div>
            </div>

            <div className="security-badges-row">
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Identitas KTP &amp; SK Terverifikasi</strong>
                  <small>Tervalidasi posko kabupaten pada 12 Jan 2026</small>
                </div>
              </div>
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Autentikasi Dua Faktor (2FA)</strong>
                  <small>Terlindungi melalui kode OTP nomor terdaftar</small>
                </div>
              </div>
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Sesi Web Aktif</strong>
                  <small>Aplikasi Desktop · Terakhir aktif sekarang</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE CHANGES ACTIONS FOOTER */}
        {editing && (
          <div className="profile-save-bar">
            <div className="profile-save-info">
              <Icon name="check" />
              <span>Pastikan data nomor telepon dan email aktif untuk notifikasi bantuan.</span>
            </div>
            <div className="profile-save-buttons">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Batal
              </Button>
              <Button type="submit" className="btn-profile-submit">
                Simpan Perubahan <Icon name="check" />
              </Button>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}

function Settings({ notify }: { notify: (x: string) => void }) {
  const [prefs, setPrefs] = useState([true, true, true, false]);
  const labels = ["Notifikasi email", "Notifikasi dalam aplikasi", "Pembaruan pengiriman", "Pembaruan sistem"];
  return <main className="workspace narrow-page"><PageHead eyebrow="Preferensi akun" title="Pengaturan" copy="Atur notifikasi dan kenyamanan tampilan." /><section className="settings-group"><h2>Notifikasi</h2>{labels.map((x, i) => <label className="switch-row" key={x}><span><b>{x}</b><small>{i === 2 ? "Perubahan status bantuan dan penyerahan." : "Informasi penting dari REKSA."}</small></span><input type="checkbox" checked={prefs[i]} onChange={() => setPrefs(prefs.map((v, n) => n === i ? !v : v))} /></label>)}</section><section className="settings-group"><h2>Kerapatan tampilan</h2><div className="filters"><button className="active" onClick={() => notify("Tampilan nyaman diterapkan.")}>Nyaman</button><button onClick={() => notify("Tampilan ringkas diterapkan.")}>Ringkas</button></div></section><Button onClick={() => notify("Pengaturan berhasil disimpan.")}>Simpan Pengaturan</Button></main>;
}

function Help() {
  const [open, setOpen] = useState(0);
  const faqs = [["Bagaimana cara melaporkan kebutuhan?", "Pilih Laporkan Kebutuhan, isi lokasi umum, skala kebutuhan, dan bukti pendukung."], ["Bagaimana cara melihat status laporan?", "Buka Laporan Saya lalu pilih kasus untuk melihat progres dan aktivitas."], ["Siapa yang memverifikasi laporan?", "Petugas Posko setempat memeriksa informasi sebelum kebutuhan diprioritaskan."], ["Bagaimana bantuan dialokasikan?", "Posko menggabungkan sumber daya dari organisasi terverifikasi sesuai kebutuhan."], ["Apa yang terjadi setelah bantuan diserahkan?", "Masyarakat diminta mengonfirmasi penerimaan sebelum kasus ditutup."]];
  return <main className="workspace narrow-page"><PageHead eyebrow="Pusat bantuan" title="Bagaimana kami dapat membantu?" copy="Jawaban singkat tentang alur layanan REKSA." /><div className="faq">{faqs.map(([q, a], i) => <button onClick={() => setOpen(open === i ? -1 : i)} key={q}><span><b>{q}</b><i>{open === i ? "−" : "+"}</i></span>{open === i && <p>{a}</p>}</button>)}</div></main>;
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pTimer);
          return 100;
        }
        return prev + 3;
      });
    }, 60);

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2400);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2900);

    return () => {
      clearInterval(pTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <aside className={`splash-screen ${fading ? "splash-fading" : ""}`} aria-label="Layar Pembuka REKSA">
      <div className="splash-ambient-glow" />
      <div className="splash-grid-pattern" />
      
      <div className="splash-center">
        {/* Unified R-Logo + EKSA Lockup */}
        <div className="splash-brand-lockup">
          <div className="splash-logo-wrap">
            <div className="splash-pulse-ring" />
            <svg className="splash-logo-svg" viewBox="0 0 42 42" aria-hidden="true">
              <path className="splash-path path-1" d="M7 7h16c7 0 12 4 12 10s-5 10-12 10H7V7Z" />
              <path className="splash-path path-2" d="M18 27 35 38M7 20h17" />
              <circle className="splash-circle circle-1" cx="8" cy="7" r="3.2" />
              <circle className="splash-circle circle-2" cx="35" cy="38" r="3.2" />
            </svg>
          </div>

          <div className="splash-word-item" aria-label="EKSA">
            <span className="splash-letter" style={{ animationDelay: "0.95s" }}>E</span>
            <span className="splash-letter" style={{ animationDelay: "1.05s" }}>K</span>
            <span className="splash-letter" style={{ animationDelay: "1.15s" }}>S</span>
            <span className="splash-letter" style={{ animationDelay: "1.25s" }}>A</span>
          </div>
        </div>

        <p className="splash-subtitle">Ruang Ekosistem Kolaborasi Pascabencana</p>

        <div className="splash-progress-container">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="splash-status-note">
          {progress < 40 ? "Menghubungkan Ekosistem..." : progress < 85 ? "Menyiapkan Ruang Kolaborasi..." : "Selamat Datang di REKSA"}
        </span>
      </div>

      <button className="splash-skip-btn" onClick={onFinish} aria-label="Lewati splash screen">
        Lewati <Icon name="arrow" />
      </button>
    </aside>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState("Andi Pratama");
  const [state, setState] = useState<SharedState>({ status: "Dalam Verifikasi", priority: "Kritis", allocated: 0, delivered: 700, assignment: "Baru", logs: ["Laporan dibuat oleh Andi Pratama"] });
  const update = (changes: Partial<SharedState>, log?: string) => setState((s) => ({ ...s, ...changes, logs: log ? [log, ...s.logs] : s.logs }));
  const navigate = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {screen === "login" && <Login navigate={navigate} onLogin={(r, n) => { setRole(r); setName(n); navigate("portal"); }} />}
      {screen === "portal" && <Portal role={role} name={name} state={state} update={update} logout={() => navigate("login")} />}
      {screen === "home" && <Home navigate={navigate} />}
    </>
  );
}
