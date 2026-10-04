import { useState, useEffect } from "react";

type Role = "citizen" | "posko" | "responder";
type Screen = "home" | "login" | "report" | "portal";

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
  children, variant = "primary", onClick, disabled = false, type = "button",
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "text" | "light"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant}`} onClick={onClick}>{children}</button>;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Progress({ value = 70 }: { value?: number }) {
  return <div className="progress" aria-label={`${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

function MapView({ operational = false }: { operational?: boolean }) {
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
    <div className={`map ${operational ? "map-operational" : ""} zoom-${zoom}`}>
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
      <div className="map-card">
        <div><Pill tone={p.tone}>{p.tone === "critical" ? "Kritis" : p.tone === "done" ? "Selesai" : "Sedang"}</Pill><small>RK-2026-0012{4 + selected}</small></div>
        <h3>{p.need}</h3><p><Icon name="pin" /> {p.place} · {selected === 0 ? "87" : "45"} KK</p>
        <strong>{p.status}</strong>
        {expanded && <p className="map-extra">Kebutuhan 1.000 L · {selected === 0 ? "700 L tersalurkan" : "Sedang ditangani"}</p>}
        <Button variant="text" onClick={() => setExpanded(!expanded)}>{expanded ? "Tutup Detail" : "Lihat Kasus"} <Icon name="arrow" /></Button>
      </div>
    </div>
  );
}

function Navbar({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <header className="navbar">
      <Logo />
      <nav><a href="#cara">Cara Kerja</a><a href="#tentang">Tentang REKSA</a></nav>
      <div className="nav-actions"><Button variant="text" onClick={() => navigate("login")}>Masuk</Button><Button onClick={() => navigate("report")}>Buat Laporan</Button></div>
    </header>
  );
}

function Home({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="public-site">
      <Navbar navigate={navigate} />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <span className="hero-brand">REKSA</span>
            <span className="eyebrow">Ruang Ekosistem Kolaborasi Pascabencana</span>
            <h1>Bantuan tidak berhenti di laporan.</h1>
            <p>REKSA menghubungkan kebutuhan masyarakat pascabencana dengan pihak yang dapat menanganinya, dari laporan hingga bantuan diterima.</p>
            <div className="button-row"><Button onClick={() => navigate("report")}>Buat Laporan <Icon name="arrow" /></Button><Button variant="secondary" onClick={() => navigate("login")}>Masuk</Button><Button variant="text" onClick={() => document.querySelector("#cara")?.scrollIntoView({ behavior: "smooth" })}>Pelajari REKSA</Button></div>
          </div>
          <figure className="hero-image">
            <i className="hero-shape" />
            <img src={PHOTO} alt="Relawan Indonesia berkoordinasi dalam kegiatan pemulihan masyarakat" />
            <figcaption>Foto: ochimax studio / Unsplash</figcaption>
            <div className="case-overlay">
              <span>NEED → ACTION → RESOLUTION</span>
              <h3>Satu alur untuk memastikan bantuan sampai.</h3>
            </div>
          </figure>
        </section>

        <section className="journey" id="cara">
          <div className="shell"><div className="journey-intro"><div className="section-header"><span className="eyebrow">Cara REKSA bekerja</span><h2>Dari kebutuhan menuju penyelesaian.</h2><p className="section-lead">Satu alur layanan yang jelas agar masyarakat selalu mengetahui langkah berikutnya.</p></div>
              <figure className="journey-visual"><img src="https://images.unsplash.com/photo-1766224242779-063be965105c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1200" alt="Warga berkumpul di lingkungan desa untuk saling membantu" /><figcaption><span>Kolaborasi di lapangan</span><strong>Kebutuhan terhubung dengan tindakan.</strong></figcaption></figure>
            </div>
            <div className="steps">
                {[
                  ["01", "Laporkan", "Masyarakat menyampaikan kebutuhan."],
                  ["02", "Verifikasi", "Petugas memeriksa kebutuhan."],
                  ["03", "Tangani", "Sumber daya dialokasikan dan responder ditugaskan."],
                  ["04", "Selesai", "Bantuan diterima dan laporan diselesaikan."],
                ].map(([n, title, desc]) => <div className="step" key={n}><span>{n}</span><i /><h3>{title}</h3><p>{desc}</p></div>)}
              </div>
          </div>
        </section>

        <section className="audiences shell" id="tentang">
          <div className="section-header"><span className="eyebrow">Mengapa REKSA</span><h2>Satu ruang kolaborasi.<br />Tiga peran yang jelas.</h2></div>
          <div className="audience-grid">
            <article><span>01</span><h3>Untuk Masyarakat</h3><p>Laporkan kebutuhan dan ketahui perkembangan bantuan secara jelas.</p><Button variant="text" onClick={() => navigate("report")}>Buat Laporan <Icon name="arrow" /></Button></article>
            <article><span>02</span><h3>Untuk Posko</h3><p>Verifikasi kebutuhan dan kelola bantuan dalam satu alur layanan.</p><Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Petugas <Icon name="arrow" /></Button></article>
            <article><span>03</span><h3>Untuk Responder</h3><p>Terima tugas yang jelas dan perbarui progres langsung dari lapangan.</p><Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Responder <Icon name="arrow" /></Button></article>
          </div>
        </section>
        <section className="why-reksa"><div className="shell why-grid"><div><span className="eyebrow">Laporan bukan akhir perjalanan</span><h2>Kebutuhan harus berlanjut menjadi tindakan.</h2><p>REKSA menjaga agar masyarakat tidak kehilangan arah setelah melapor, sementara petugas dan responder bekerja dalam alur yang sama.</p></div><div className="service-flow">{["Laporan", "Verifikasi", "Alokasi", "Penugasan", "Penyerahan", "Selesai"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}</div></div></section>
        <section className="cta"><img className="cta-background" src="https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=84&w=1800" alt="" aria-hidden="true" /><div className="cta-copy"><span className="eyebrow">Akses publik</span><h2>Belum punya akun?</h2><p>Anda tetap dapat membuat laporan kebutuhan terlebih dahulu. Masuk atau buat akun setelahnya untuk menyimpan dan memantau perjalanan bantuan.</p><div className="button-row"><Button onClick={() => navigate("report")}>Buat Laporan Tanpa Akun <Icon name="arrow" /></Button><Button variant="secondary" onClick={() => navigate("login")}>Masuk</Button></div></div></section>
      </main>
      <footer><div className="footer-main"><div className="footer-brand"><Logo light /><p>Ruang Ekosistem Kolaborasi Pascabencana</p></div><nav><strong>Navigasi</strong><a href="#tentang">Tentang REKSA</a><a href="#cara">Cara Kerja</a><a href="#tentang">Privasi</a></nav><nav><strong>Dukungan</strong><a href="#tentang">Bantuan</a><a href="#tentang">Kontak</a></nav><div className="footer-notice"><Icon name="check" /><p>REKSA membantu koordinasi layanan pascabencana dan tidak menggantikan kanal kedaruratan resmi.</p></div></div><div className="footer-bottom">© 2026 REKSA · Layanan publik kolaboratif Indonesia</div></footer>
    </div>
  );
}

function Report({ navigate }: { navigate: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Air Bersih");
  const [success, setSuccess] = useState(false);
  if (success) return <div className="success-page"><Logo /><div className="success-mark"><Icon name="check" /></div><span className="eyebrow">Laporan terkirim</span><h1>Laporan berhasil dibuat.</h1><p>Petugas Posko akan memverifikasi informasi Anda. Simpan ID berikut untuk memantau perkembangan bantuan.</p><div className="case-id">RK-2026-00132</div><div className="button-row"><Button onClick={() => navigate("login")}>Lihat Status</Button><Button variant="secondary" onClick={() => navigator.clipboard?.writeText("RK-2026-00132")}>Salin ID Laporan</Button></div></div>;
  const titles = ["Apa yang dibutuhkan?", "Di mana kebutuhannya?", "Seberapa besar kebutuhannya?", "Tambahkan bukti", "Periksa laporan Anda"];
  return (
    <div className="form-layout">
      <aside><Logo light /><div><span>Langkah {step} dari 5</span><h2>{titles[step - 1]}</h2><p>Informasi yang lengkap membantu petugas merespons kebutuhan dengan tepat.</p></div><button onClick={() => navigate("home")}>← Kembali ke beranda</button></aside>
      <main className="report-main">
        <div className="form-progress">{[1, 2, 3, 4, 5].map((n) => <i className={n <= step ? "active" : ""} key={n} />)}</div>
        {step === 1 && <div className="form-content"><span className="eyebrow">Jenis kebutuhan</span><h1>Apa yang paling dibutuhkan?</h1><p>Pilih satu jenis kebutuhan utama. Anda dapat membuat laporan lain untuk kebutuhan berbeda.</p><div className="category-grid">{["Air Bersih", "Makanan", "Obat-obatan", "Tempat Tinggal", "Sanitasi", "Listrik", "Pakaian", "Lainnya"].map((x) => <button className={category === x ? "selected" : ""} onClick={() => setCategory(x)} key={x}><i /><span>{x}</span>{category === x && <Icon name="check" />}</button>)}</div></div>}
        {step === 2 && <div className="form-content"><span className="eyebrow">Lokasi umum</span><h1>Di mana kebutuhannya?</h1><div className="fields two"><label>Provinsi<select defaultValue="Jawa Barat"><option>Jawa Barat</option></select></label><label>Kabupaten/Kota<select defaultValue="Kabupaten Sukabumi"><option>Kabupaten Sukabumi</option></select></label><label>Kecamatan<input defaultValue="Cibadak" /></label><label>Desa/Kelurahan<input defaultValue="Desa Sukamaju" /></label><label className="wide">Area/lokasi umum<input placeholder="Contoh: sekitar balai desa" /></label></div><MapView /></div>}
        {step === 3 && <div className="form-content"><span className="eyebrow">Skala kebutuhan</span><h1>Seberapa besar kebutuhannya?</h1><div className="fields two"><label>Jumlah keluarga terdampak<input type="number" defaultValue="87" /></label><label>Jumlah yang dibutuhkan<input type="number" defaultValue="1000" /></label><label>Satuan<select defaultValue="Liter"><option>Liter</option><option>Paket</option><option>Unit</option></select></label><label>Tingkat urgensi<select defaultValue="Sangat mendesak"><option>Sangat mendesak</option><option>Mendesak</option><option>Dapat menunggu</option></select></label><label className="wide">Ceritakan situasinya<textarea defaultValue="Sumber air utama tercemar setelah banjir. Warga membutuhkan air bersih untuk kebutuhan harian." /></label></div></div>}
        {step === 4 && <div className="form-content"><span className="eyebrow">Bukti pendukung</span><h1>Tambahkan foto kondisi.</h1><p>Foto membantu petugas memahami situasi. Pastikan tidak menampilkan identitas pribadi.</p><label className="upload"><input type="file" accept="image/*" /><span><Icon name="plus" /></span><b>Pilih foto dari perangkat</b><small>JPG atau PNG, maksimal 10 MB</small></label></div>}
        {step === 5 && <div className="form-content review"><span className="eyebrow">Tinjau kembali</span><h1>Pastikan semua informasi benar.</h1><section><h3>{category}</h3><Pill tone="critical">Sangat mendesak</Pill><div><span>Lokasi</span><b>Desa Sukamaju, Cibadak, Kabupaten Sukabumi</b></div><div><span>Terdampak</span><b>87 keluarga</b></div><div><span>Kebutuhan</span><b>1.000 Liter</b></div><div><span>Situasi</span><b>Sumber air utama tercemar setelah banjir.</b></div></section></div>}
        <div className="form-actions"><Button variant="secondary" onClick={() => step === 1 ? navigate("home") : setStep(step - 1)}>Kembali</Button><Button onClick={() => step < 5 ? setStep(step + 1) : setSuccess(true)}>{step === 5 ? "Kirim Laporan" : "Lanjutkan"} <Icon name="arrow" /></Button></div>
      </main>
    </div>
  );
}

function Login({ navigate, onLogin }: { navigate: (s: Screen) => void; onLogin: (r: Role, name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(false);
  const [resetInfo, setResetInfo] = useState(false);
  const submit = () => {
    if (mode === "register") {
      if (!fullName || !email || password.length < 6) return setError(true);
      return onLogin("citizen", fullName);
    }
    const a = accounts.find((x) => x.email === email);
    if (!a || password !== "reksa123") return setError(true);
    onLogin(a.type, a.name);
  };
  return <div className="login-layout">
    <aside><div className="auth-brand-row"><Logo light /><button onClick={() => navigate("home")}>← Kembali ke beranda</button></div><div><span className="eyebrow light">Need → Action → Resolution</span><h1>Bantuan tidak berhenti di laporan.</h1><p>Satu ruang kolaborasi untuk memastikan setiap kebutuhan memperoleh tindak lanjut hingga bantuan diterima.</p></div></aside>
    <main><div className="login-form"><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(false); }}>Masuk</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(false); }}>Buat Akun</button></div><span className="eyebrow">{mode === "login" ? "Masuk ke REKSA" : "Daftar sebagai masyarakat"}</span><h2>{mode === "login" ? "Selamat datang kembali" : "Mulai bersama REKSA"}</h2><p>{mode === "login" ? "Sistem akan mengenali peran Anda setelah masuk." : "Buat akun untuk melaporkan kebutuhan dan memantau bantuan."}</p>{error && <div className="form-error">{mode === "login" ? "Email atau kata sandi belum sesuai." : "Lengkapi nama, email, dan kata sandi minimal 6 karakter."}</div>}{resetInfo && <div className="verified"><Icon name="check" /> Instruksi pemulihan akan dikirim setelah Anda memasukkan email.</div>}{mode === "register" && <label>Nama lengkap<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama sesuai identitas" /></label>}<label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@organisasi.id" /></label><label>Kata sandi<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" /></label>{mode === "login" && <div className="login-options"><label><input type="checkbox" /> Ingat saya</label><button onClick={() => setResetInfo(true)}>Lupa kata sandi?</button></div>}<Button onClick={submit}>{mode === "login" ? "Masuk" : "Buat Akun"}</Button></div>
      {mode === "login" && <div className="demo"><div><span>AKUN DEMO</span><p>Klik akun untuk mengisi otomatis.</p></div><div className="demo-list">{accounts.map((a) => <button key={a.email} onClick={() => { setEmail(a.email); setPassword("reksa123"); setError(false); }}><span><b>{a.name}</b><small>{a.role}</small></span><Icon name="arrow" /></button>)}</div></div>}
    </main>
  </div>;
}

type SharedState = { status: string; priority: string; allocated: number; delivered: number; assignment: string; logs: string[] };
type PortalPage = "dashboard" | "cases" | "case" | "report" | "notifications" | "history" | "profile" | "help" | "settings" | "map" | "resources" | "assignments" | "activity" | "tasks" | "active";
type NavItem = { label: string; page: PortalPage | "logout"; icon: string };

const roleNavigation: Record<Role, { main: NavItem[]; bottom: NavItem[] }> = {
  citizen: {
    main: [{ label: "Beranda", page: "dashboard", icon: "grid" }, { label: "Laporan Saya", page: "cases", icon: "file" }, { label: "Laporkan Kebutuhan", page: "report", icon: "plus" }, { label: "Notifikasi", page: "notifications", icon: "bell" }, { label: "Riwayat", page: "history", icon: "clock" }, { label: "Profil", page: "profile", icon: "user" }],
    bottom: [{ label: "Bantuan", page: "help", icon: "help" }, { label: "Pengaturan", page: "settings", icon: "settings" }, { label: "Logout", page: "logout", icon: "logout" }],
  },
  posko: {
    main: [{ label: "Ringkasan", page: "dashboard", icon: "grid" }, { label: "Kebutuhan", page: "cases", icon: "file" }, { label: "Peta", page: "map", icon: "map" }, { label: "Sumber Daya", page: "resources", icon: "box" }, { label: "Penugasan", page: "assignments", icon: "task" }, { label: "Aktivitas", page: "activity", icon: "clock" }],
    bottom: [{ label: "Notifikasi", page: "notifications", icon: "bell" }, { label: "Profil", page: "profile", icon: "user" }, { label: "Pengaturan", page: "settings", icon: "settings" }, { label: "Logout", page: "logout", icon: "logout" }],
  },
  responder: {
    main: [{ label: "Beranda", page: "dashboard", icon: "grid" }, { label: "Tugas Saya", page: "tasks", icon: "task" }, { label: "Tugas Aktif", page: "active", icon: "map" }, { label: "Riwayat", page: "history", icon: "clock" }, { label: "Sumber Daya", page: "resources", icon: "box" }, { label: "Notifikasi", page: "notifications", icon: "bell" }, { label: "Profil", page: "profile", icon: "user" }],
    bottom: [{ label: "Bantuan", page: "help", icon: "help" }, { label: "Pengaturan", page: "settings", icon: "settings" }, { label: "Logout", page: "logout", icon: "logout" }],
  },
};

function Modal({ title, children, close, icon }: { title: string; children: React.ReactNode; close: () => void; icon?: string }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={(e) => e.stopPropagation()}>{icon && <div className="modal-icon"><Icon name={icon} /></div>}<h2>{title}</h2>{children}</div></div>;
}

function Sidebar({ role, page, collapsed, mobile, select, toggle, close }: { role: Role; page: PortalPage; collapsed: boolean; mobile: boolean; select: (p: PortalPage | "logout") => void; toggle: () => void; close: () => void }) {
  const group = roleNavigation[role];
  const roleLabel = role === "citizen" ? "Masyarakat" : role === "posko" ? "Petugas Posko" : "Responder";
  const roleCopy = role === "citizen" ? "Akun pribadi" : role === "posko" ? "Akun institusi" : "Mitra terverifikasi";
  const items = (rows: NavItem[]) => rows.map((item) => <button title={collapsed ? item.label : undefined} className={page === item.page ? "active" : ""} key={item.label} onClick={() => { select(item.page); close(); }}><Icon name={item.icon} /><span>{item.label}</span>{item.label === "Notifikasi" && <i className="nav-dot" />}</button>);
  return <><div className={`sidebar-scrim ${mobile ? "show" : ""}`} onClick={close} /><aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobile ? "mobile-open" : ""}`}><div className="side-logo"><Logo light /><button className="side-toggle" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}><Icon name="menu" /></button></div><div className="side-context"><span>Mode akses</span><div><i><Icon name="user" /></i><p><b>{roleLabel}</b><small>{roleCopy}</small></p><strong>⌄</strong></div></div><nav>{items(group.main)}</nav><nav className="side-bottom">{items(group.bottom)}</nav></aside></>;
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
  const titles = ["Kebutuhan", "Lokasi", "Kondisi", "Bukti", "Review"];
  if (success) return <main className="workspace report-workspace"><div className="inline-success"><div className="success-mark"><Icon name="check" /></div><span className="eyebrow">Laporan terkirim</span><h1>Laporan berhasil dibuat</h1><p>Petugas Posko akan memverifikasi informasi yang Anda kirim.</p><div className="case-id">RK-2026-00124</div><Button onClick={complete}>Lihat Status Laporan <Icon name="arrow" /></Button></div></main>;
  return <main className="workspace report-workspace"><PageHead eyebrow={`Langkah ${step} dari 5`} title="Laporkan Kebutuhan" copy="Sampaikan kondisi secara jelas agar petugas dapat menindaklanjutinya." /><div className="inline-report">
    <aside><span className="eyebrow">Progres laporan</span>{titles.map((x, i) => <button className={step === i + 1 ? "active" : i + 1 < step ? "done" : ""} onClick={() => i + 1 <= step && setStep(i + 1)} key={x}><i>{i + 1 < step ? <Icon name="check" /> : i + 1}</i><span><b>{x}</b><small>{["Jenis dan jumlah bantuan", "Wilayah kebutuhan", "Urgensi dan dampak", "Foto atau dokumen", "Periksa informasi"][i]}</small></span></button>)}</aside>
    <section><div className="form-progress">{[1,2,3,4,5].map((x) => <i className={x <= step ? "active" : ""} key={x} />)}</div>
      {step === 1 && <div className="inline-step"><span className="eyebrow">01 — Kebutuhan</span><h2>Apa yang dibutuhkan?</h2><div className="fields two"><label>Jenis kebutuhan<select value={category} onChange={(e) => setCategory(e.target.value)}>{["Air Bersih","Makanan","Obat-obatan","Tempat Tinggal","Sanitasi","Lainnya"].map((x) => <option key={x}>{x}</option>)}</select></label><label>Jumlah<input defaultValue="1.000 L" /></label><label className="wide">Deskripsi<textarea defaultValue="Sumber air utama tercemar setelah banjir dan tidak dapat digunakan." /></label></div></div>}
      {step === 2 && <div className="inline-step"><span className="eyebrow">02 — Lokasi</span><h2>Di mana kebutuhannya?</h2><div className="fields two"><label>Desa/Kelurahan<input defaultValue="Desa Sukamaju" /></label><label>Kecamatan<input defaultValue="Cibadak" /></label><label className="wide">Kabupaten/Kota<input defaultValue="Kabupaten Sukabumi" /></label></div><MapView /></div>}
      {step === 3 && <div className="inline-step"><span className="eyebrow">03 — Kondisi</span><h2>Bagaimana kondisi lapangan?</h2><div className="fields two"><label>Tingkat kebutuhan<select><option>Sangat mendesak</option><option>Mendesak</option><option>Dapat menunggu</option></select></label><label>Jumlah keluarga terdampak<input type="number" defaultValue="87" /></label><label className="wide">Kondisi lapangan<textarea defaultValue="Warga membutuhkan air bersih untuk minum, memasak, dan kebutuhan harian." /></label></div></div>}
      {step === 4 && <div className="inline-step"><span className="eyebrow">04 — Bukti</span><h2>Tambahkan bukti jika tersedia.</h2><label className="upload"><input type="file" accept="image/*,.pdf" /><span><Icon name="plus" /></span><b>Pilih foto atau dokumen</b><small>JPG, PNG, atau PDF · maksimal 10 MB</small></label></div>}
      {step === 5 && <div className="inline-step review"><span className="eyebrow">05 — Review</span><h2>Pastikan informasinya benar.</h2><section><h3>{category}</h3><Pill tone="critical">Sangat mendesak</Pill><div><span>Lokasi</span><b>Desa Sukamaju, Cibadak, Kabupaten Sukabumi</b></div><div><span>Terdampak</span><b>87 keluarga</b></div><div><span>Kebutuhan</span><b>1.000 Liter</b></div></section></div>}
      <div className="form-actions"><Button variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>Kembali</Button><Button onClick={() => { if (step < 5) setStep(step + 1); else { update({ status: "Dalam Verifikasi" }, "Laporan diperbarui oleh Andi Pratama"); setSuccess(true); } }}>{step === 5 ? "Kirim Laporan" : "Lanjutkan"} <Icon name="arrow" /></Button></div>
    </section>
  </div></main>;
}

type RouterProps = { page: PortalPage; setPage: (p: PortalPage | "logout") => void; state: SharedState; update: (x: Partial<SharedState>, log?: string) => void; notify: (x: string) => void; name?: string };

function CitizenDashboard({ state, update, setPage, name }: { state: SharedState; update: RouterProps["update"]; setPage: RouterProps["setPage"]; name: string }) {
  const complete = state.delivered >= 1000;
  return <main className="workspace citizen-home"><PageHead eyebrow="Layanan masyarakat" title={`Halo, ${name.split(" ")[0]}. Pantau perjalanan bantuanmu.`} copy="Setiap laporan memiliki langkah berikutnya yang jelas hingga bantuan diterima." action={<div className="trust-badge"><Icon name="check" /> Data terlindungi</div>} />
    <section className="citizen-feature"><div className="feature-shape" /><div className="case-summary"><div><span className="active-case-label">Laporan aktif · RK-2026-00124</span><Pill tone="critical">Kritis</Pill></div><h2>Air Bersih</h2><p>Kebutuhan air bersih untuk 87 keluarga di Desa Sukamaju sedang ditangani.</p><div className="case-meta"><Icon name="pin" /> Desa Sukamaju · 87 keluarga</div><Button variant="light" onClick={() => setPage("case")}>Lihat Perjalanan <Icon name="arrow" /></Button><div className="feature-progress"><span><b>{state.delivered} L</b> dari 1.000 L tersalurkan</span><strong>{state.delivered / 10}%</strong><Progress value={state.delivered / 10} /></div></div>
    <div className="case-journey"><span className="eyebrow">Status terkini</span><h3>{complete ? "Bantuan telah lengkap" : state.status}</h3><p>Perjalanan bantuan diperbarui oleh posko dan responder.</p>{["Dilaporkan", "Diverifikasi", "Ditugaskan", "Dalam Pengiriman", "Diterima"].map((x, i) => <div className={i < (complete ? 5 : 3) ? "done" : i === (complete ? 4 : 3) ? "current" : ""} key={x}><i>{i < (complete ? 5 : 3) && <Icon name="check" />}</i><span>{x}</span></div>)}{complete && state.status !== "Selesai" && <Button variant="light" onClick={() => update({ status: "Selesai" }, "Bantuan dikonfirmasi diterima oleh Andi Pratama")}>Konfirmasi Bantuan Diterima</Button>}</div></section>
    <section className="quick-access"><div className="section-title"><h2>Akses cepat</h2><button onClick={() => setPage("cases")}>Lihat semua layanan</button></div><div>{[{ icon: "plus", title: "Buat Laporan", copy: "Sampaikan kebutuhan baru.", page: "report" as PortalPage }, { icon: "file", title: "Laporan Saya", copy: "Pantau seluruh laporan.", page: "cases" as PortalPage }, { icon: "help", title: "Pusat Bantuan", copy: "Temukan panduan layanan.", page: "help" as PortalPage }].map((item) => <button key={item.title} onClick={() => setPage(item.page)}><i><Icon name={item.icon} /></i><span><b>{item.title}</b><small>{item.copy}</small></span><Icon name="arrow" /></button>)}</div></section>
    <section className="notifications"><div className="section-title"><h2>Notifikasi terbaru</h2><button onClick={() => setPage("notifications")}>Lihat semua</button></div>{["Bantuan sedang dalam pengiriman.", "BPBD telah menyerahkan 500 L.", "Laporan telah diverifikasi."].map((x, i) => <button className="notification" onClick={() => setPage("case")} key={x}><i className={i === 0 ? "new" : ""}><Icon name="bell" /></i><span><b>{x}</b><small>{i + 1} jam lalu</small></span><Icon name="arrow" /></button>)}</section>
  </main>;
}

function CaseList({ title, copy, onCase, own = false, completed = false }: { title: string; copy: string; onCase: () => void; own?: boolean; completed?: boolean }) {
  const [filter, setFilter] = useState("Semua");
  const data = cases.filter((c) => (!own || ["RK-2026-00124", "RK-2026-00128"].includes(c[0])) && (!completed || c[6] === "Selesai") && (filter === "Semua" || c[5] === filter));
  return <main className="workspace"><PageHead eyebrow="Kebutuhan" title={title} copy={copy} /><div className="filters">{["Semua", "Kritis", "Tinggi", "Sedang"].map((x) => <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>{x}</button>)}</div><div className="case-list">{data.map((c) => <button onClick={onCase} key={c[0]}><span><small>{c[0]}</small><b>{c[1]}</b></span><span>{c[2]}</span><span>{c[3]}</span><span><Pill tone={c[5] === "Kritis" ? "critical" : c[5] === "Tinggi" ? "high" : "medium"}>{c[5]}</Pill></span><span>{c[6]} <Icon name="arrow" /></span></button>)}</div></main>;
}

function CaseDetail({ state, update, back, posko = false }: { state: SharedState; update: RouterProps["update"]; back: () => void; posko?: boolean }) {
  const allocate = () => update({ allocated: Math.min(1000, state.allocated + (state.allocated < 500 ? 500 : state.allocated < 800 ? 300 : 200)), status: "Ditugaskan" }, "Sumber daya dialokasikan oleh Siti Rahma");
  return <main className="workspace"><button className="back-link" onClick={back}>← Kembali</button><div className="case-detail-head"><div><span>RK-2026-00124</span><h1>Air Bersih</h1><p><Icon name="pin" /> Desa Sukamaju · 87 keluarga</p></div><Pill tone="critical">{state.priority}</Pill></div><div className="detail-progress"><span>Kebutuhan terpenuhi</span><strong>{state.delivered} <small>/ 1.000 L</small></strong><b>{state.delivered / 10}% kebutuhan terpenuhi</b><Progress value={state.delivered / 10} /></div>
    <section className="detail-columns"><div><span className="eyebrow">Kebutuhan</span><h2>Sumber air utama tidak dapat digunakan.</h2><p>Sumber air tercemar setelah banjir. Warga membutuhkan air bersih untuk minum, memasak, dan kebutuhan harian.</p><dl><div><dt>Pelapor</dt><dd>Andi Pratama</dd></div><div><dt>Waktu</dt><dd>10:21 WIB</dd></div><div><dt>Status</dt><dd>{state.status}</dd></div></dl>{posko && state.status === "Dalam Verifikasi" && <Button onClick={() => update({ status: "Terverifikasi" }, "Laporan diverifikasi oleh Siti Rahma")}>Verifikasi Laporan</Button>}</div><div><span className="eyebrow">Alokasi sumber daya</span>{[["BPBD Kabupaten", "500 L", 500], ["PMI Kabupaten", "300 L", 800], ["Mitra Lokal", "200 L", 1000]].map(([x, q, n]) => <div className="allocation-line" key={x as string}><span><b>{x}</b><small>{Number(n) <= state.allocated ? "Dialokasikan" : "Tersedia"}</small></span><strong>{q}</strong>{posko && Number(n) > state.allocated && <Button onClick={allocate}>Alokasikan</Button>}</div>)}{posko && <label>Prioritas<select value={state.priority} onChange={(e) => update({ priority: e.target.value }, `Prioritas diubah menjadi ${e.target.value}`)}><option>Kritis</option><option>Tinggi</option><option>Sedang</option></select></label>}</div></section><figure className="evidence-photo"><img src="https://images.unsplash.com/photo-1738077398088-b56627bd9c3e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=1400" alt="Warga membawa air di jalan pedesaan Indonesia" /><figcaption><span>Bukti kondisi lapangan</span><b>Desa Sukamaju · dikirim 10:21 WIB</b></figcaption></figure><MapView operational /><Activity state={state} />
  </main>;
}

function PoskoRouter({ page, setPage, state, update, notify }: RouterProps) {
  if (page === "dashboard") return <PoskoDashboard state={state} setPage={setPage} />;
  if (page === "case") return <CaseDetail state={state} update={update} back={() => setPage("cases")} posko />;
  if (page === "cases") return <CaseList title="Kebutuhan" copy="Verifikasi dan prioritaskan kebutuhan yang masuk." onCase={() => setPage("case")} />;
  if (page === "map") return <MapPage open={() => setPage("case")} />;
  if (page === "resources") return <Resources state={state} update={update} responder={false} />;
  if (page === "assignments") return <Assignments state={state} open={() => setPage("case")} />;
  if (page === "activity") return <main className="workspace"><PageHead eyebrow="Jejak operasional" title="Aktivitas" copy="Riwayat perubahan yang transparan dan kronologis." /><Activity state={state} /></main>;
  if (page === "notifications") return <Notifications role="posko" open={() => setPage("case")} />;
  if (page === "profile") return <Profile name="Siti Rahma" role="Petugas Posko" notify={notify} />;
  return <Settings notify={notify} />;
}

function PoskoDashboard({ state, setPage }: { state: SharedState; setPage: RouterProps["setPage"] }) {
  return <main className="workspace"><PageHead eyebrow="Posko Kabupaten Sukabumi" title="Ringkasan Operasional" copy="Kebutuhan yang memerlukan koordinasi hari ini." /><div className="workload">{[["12", "perlu verifikasi"], ["8", "perlu ditangani"], ["15", "sedang diproses"], ["23", "selesai hari ini"]].map(([n, x]) => <div key={x}><strong>{n}</strong><span>{x}</span></div>)}</div><section className="ops-grid"><div><div className="section-title"><h2>Perlu perhatian</h2><button onClick={() => setPage("cases")}>Lihat semua</button></div>{cases.slice(0, 4).map((c) => <button className="attention-row" onClick={() => setPage("case")} key={c[0]}><Pill tone={c[5] === "Kritis" ? "critical" : "high"}>{c[5]}</Pill><span><b>{c[1]}</b><small>{c[0]} · {c[2]}</small></span><Icon name="arrow" /></button>)}</div><div><div className="section-title"><h2>Peta Kebutuhan</h2><button onClick={() => setPage("map")}>Perbesar</button></div><MapView operational /></div></section><Activity state={state} /></main>;
}

function MapPage({ open }: { open: () => void }) {
  const [priority, setPriority] = useState("Semua");
  return <main className="workspace"><PageHead eyebrow="Konteks wilayah" title="Peta Kebutuhan" copy="Lokasi digeneralisasi untuk melindungi privasi masyarakat." /><div className="filters">{["Semua", "Kritis", "Tinggi", "Sedang", "Selesai"].map((x) => <button className={priority === x ? "active" : ""} onClick={() => setPriority(x)} key={x}>{x}</button>)}</div><MapView operational /><div className="map-action"><span>Marker terpilih: <b>Desa Sukamaju · Air Bersih</b></span><Button onClick={open}>Buka Kasus</Button></div></main>;
}

function Resources({ state, update, responder }: { state: SharedState; update: RouterProps["update"]; responder: boolean }) {
  const [kind, setKind] = useState("Semua jenis");
  const allocate = () => update({ allocated: Math.min(1000, state.allocated + 500), status: "Ditugaskan" }, "BPBD dialokasikan 500 L");
  return <main className="workspace"><PageHead eyebrow="Kapasitas bantuan" title="Sumber Daya" copy="Lihat bantuan yang tersedia untuk kebutuhan di lapangan." /><div className="resource-filters"><label>Jenis<select value={kind} onChange={(e) => setKind(e.target.value)}><option>Semua jenis</option><option>Air Bersih</option><option>Makanan</option></select></label><label>Lokasi<select><option>Semua lokasi</option><option>Sukamaju</option></select></label><label>Ketersediaan<select><option>Tersedia</option><option>Dialokasikan</option></select></label></div><section className="resources">{[["BPBD Kabupaten", "Air Bersih", "500 L", "2,4 km"], ["PMI Kabupaten", "Air Bersih", "300 L", "4,1 km"], ["Mitra Lokal", "Air Bersih", "200 L", "6,2 km"], ["Dapur Umum", "Makanan", "500 paket", "3,8 km"]].filter((x) => kind === "Semua jenis" || x[1] === kind).map((x, i) => <div className="resource-row" key={x[0]}><span className="org-mark">{x[0].slice(0, 2)}</span><span><b>{x[0]}</b><small>{x[1]}</small></span><strong>{x[2]}</strong><span>{x[3]}</span>{responder ? <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(x[0])}>Salin Info</Button> : <Button disabled={i === 0 && state.allocated >= 500} onClick={allocate}>{i === 0 && state.allocated >= 500 ? "Dialokasikan" : "Alokasikan"}</Button>}</div>)}</section></main>;
}

function Assignments({ state, open }: { state: SharedState; open: () => void }) {
  return <main className="workspace"><PageHead eyebrow="Koordinasi lapangan" title="Penugasan" copy="Pantau tugas aktif dan proses penyerahan bantuan." /><div className="assignment-summary"><span><b>18</b> aktif</span><span><b>7</b> dalam perjalanan</span><span><b>24</b> selesai</span></div><div className="case-list">{[["ASG-001", "BPBD", "500 L", state.assignment], ["ASG-002", "PMI", "300 L", "Dalam Pengiriman"], ["ASG-003", "Mitra Lokal", "200 L", "Ditugaskan"]].map((x) => <button onClick={open} key={x[0]}><span><small>{x[0]}</small><b>{x[1]}</b></span><span>RK-2026-00124</span><span>{x[2]}</span><span><Pill tone="neutral">{x[3]}</Pill></span><span>Lihat <Icon name="arrow" /></span></button>)}</div></main>;
}

function Activity({ state }: { state: SharedState }) {
  return <section className="activity"><div className="section-title"><div><span className="eyebrow">Hari ini</span><h2>Aktivitas Terbaru</h2></div><span>WIB</span></div>{state.logs.map((x, i) => <div key={`${x}-${i}`}><time>{["11:48", "11:20", "10:57", "10:42", "10:21"][i] || "10:21"}</time><i /><p>{x}<small> · RK-2026-00124</small></p></div>)}</section>;
}

function ResponderRouter({ page, setPage, state, update, notify }: RouterProps) {
  if (["dashboard", "tasks", "active"].includes(page)) return <ResponderTask state={state} update={update} compact={page === "dashboard"} />;
  if (page === "history") return <Assignments state={state} open={() => setPage("tasks")} />;
  if (page === "resources") return <Resources state={state} update={update} responder />;
  if (page === "notifications") return <Notifications role="responder" open={() => setPage("tasks")} />;
  if (page === "profile") return <Profile name="Arif Nugroho" role="BPBD Kabupaten" notify={notify} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

function ResponderTask({ state, update, compact }: { state: SharedState; update: RouterProps["update"]; compact: boolean }) {
  const states = ["Baru", "Diterima", "Disiapkan", "Dalam Pengiriman", "Tiba di Lokasi", "Selesai"];
  const idx = Math.max(0, states.indexOf(state.assignment));
  const actions = ["Terima Tugas", "Siapkan Bantuan", "Mulai Pengiriman", "Saya Sudah Tiba", "Konfirmasi Penyerahan"];
  const advance = () => { const next = states[Math.min(idx + 1, 5)]; update({ assignment: next, delivered: next === "Selesai" ? 1000 : state.delivered, status: next === "Selesai" ? "Menunggu Konfirmasi" : next }, `${actions[idx]} oleh Arif Nugroho`); };
  return <main className="workspace responder"><PageHead eyebrow="BPBD Kabupaten Sukabumi" title={compact ? "Tugas yang perlu Anda selesaikan" : "Tugas Saya"} copy="Jalankan penugasan lapangan dan laporkan progres penyerahan." /><section className="task-detail"><div className="task-main"><div className="task-top"><div><span>ASG-001 · RK-2026-00124</span><h2>Air Bersih</h2><p><Icon name="pin" /> Desa Sukamaju · 2,4 km</p></div><Pill tone={state.assignment === "Selesai" ? "done" : "high"}>{state.assignment}</Pill></div><div className="task-quantity"><span>Jumlah yang ditugaskan</span><strong>500 L</strong></div><MapView operational /><div className="route"><div><i className="start" /><span><b>BPBD Kabupaten</b><small>Lokasi Anda</small></span></div><div><i /><span><b>Desa Sukamaju</b><small>Tujuan · 2,4 km · ±18 menit</small></span></div></div></div><aside className="task-side"><span className="eyebrow">Detail penugasan</span><dl><div><dt>Koordinator</dt><dd>Siti Rahma</dd></div><div><dt>Kontak</dt><dd>+62 812••••4412</dd></div></dl><hr /><h3>Progres tugas</h3>{states.slice(0, 5).map((x, i) => <div className={`task-step ${i <= idx ? "done" : ""}`} key={x}><i>{i < idx && <Icon name="check" />}</i><span>{x}</span></div>)}{idx < 5 ? <Button onClick={advance}>{actions[idx]} <Icon name="arrow" /></Button> : <div className="verified"><Icon name="check" /> Penyerahan berhasil dicatat.</div>}</aside></section></main>;
}

function Notifications({ role, open }: { role: Role; open: () => void }) {
  const [filter, setFilter] = useState("Semua");
  const items = role === "responder" ? ["Tugas baru diberikan.", "Posko menunggu bukti penyerahan.", "Penugasan Anda telah diperbarui."] : role === "posko" ? ["Laporan baru membutuhkan verifikasi.", "PMI memperbarui status pengiriman.", "Bantuan belum lengkap."] : ["BPBD telah menyerahkan 500 L.", "Bantuan sedang dalam pengiriman.", "Laporan telah diverifikasi."];
  return <main className="workspace"><PageHead eyebrow="Pembaruan" title="Notifikasi" copy="Informasi penting tentang laporan dan bantuan." /><div className="filters">{["Semua", "Laporan", "Penugasan", "Pengiriman", "Sistem"].map((x) => <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>{x}</button>)}</div><div className="notification-page">{items.map((x, i) => <button onClick={open} key={x}><i className={i === 0 ? "unread" : ""}><Icon name="bell" /></i><span><b>{x}</b><small>RK-2026-00124 · {i + 1} jam lalu</small></span><Icon name="arrow" /></button>)}</div></main>;
}

function Profile({ name, role, notify }: { name: string; role: string; notify: (x: string) => void }) {
  const [editing, setEditing] = useState(false);
  return <main className="workspace narrow-page"><PageHead eyebrow="Akun" title="Profil" copy="Informasi identitas dan kontak akun Anda." /><section className="profile-section"><div className="profile-photo">{name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div><div><h2>{name}</h2><p>{role}</p><Pill tone="done">Akun terverifikasi</Pill></div><Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? "Batal" : "Edit Profil"}</Button></section><div className="profile-fields"><label>Nama lengkap<input disabled={!editing} defaultValue={name} /></label><label>Email<input disabled={!editing} defaultValue={`${name.toLowerCase().replace(" ", ".")}@reksa.id`} /></label><label>Nomor telepon<input disabled={!editing} defaultValue="+62 812 4455 0188" /></label><label>Organisasi<input disabled defaultValue={role} /></label></div>{editing && <Button onClick={() => { setEditing(false); notify("Perubahan profil berhasil disimpan."); }}>Simpan Perubahan</Button>}</main>;
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

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState("Andi Pratama");
  const [state, setState] = useState<SharedState>({ status: "Dalam Verifikasi", priority: "Kritis", allocated: 0, delivered: 700, assignment: "Baru", logs: ["Laporan dibuat oleh Andi Pratama"] });
  const update = (changes: Partial<SharedState>, log?: string) => setState((s) => ({ ...s, ...changes, logs: log ? [log, ...s.logs] : s.logs }));
  const navigate = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };
  if (screen === "login") return <Login navigate={navigate} onLogin={(r, n) => { setRole(r); setName(n); navigate("portal"); }} />;
  if (screen === "report") return <Report navigate={navigate} />;
  if (screen === "portal") return <Portal role={role} name={name} state={state} update={update} logout={() => navigate("login")} />;
  return <Home navigate={navigate} />;
}
