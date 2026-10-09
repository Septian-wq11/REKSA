import { useState } from "react";
import { MisiItem, apiService } from "../../services/api";

interface MitraMisiPenyaluranProps {
  misiList: MisiItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToBursa: () => void;
}

export function MitraMisiPenyaluran({
  misiList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToHistory,
  onNavigateToBursa,
}: MitraMisiPenyaluranProps) {
  const activeMissions = misiList.filter((m) => m.status_tahapan !== "Selesai");

  const [selectedMisiId, setSelectedMisiId] = useState<number | null>(
    activeMissions[0]?.id || null
  );

  // Obstacle reporting modal
  const [obstacleModalMisi, setObstacleModalMisi] = useState<MisiItem | null>(null);
  const [obstacleType, setObstacleType] = useState("Akses Jalan Terputus (Longsor)");
  const [obstacleNotes, setObstacleNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const currentMission = activeMissions.find((m) => m.id === selectedMisiId) || activeMissions[0];

  const states = [
    "Menunggu Persiapan",
    "Siap Berangkat",
    "Dalam Perjalanan",
    "Tiba di Lokasi & Diserahkan",
    "Menunggu Konfirmasi Penerimaan",
  ];

  const getStepIndex = (status: string) => {
    if (status === "Diterima" || status === "Baru") return 0;
    if (status === "Disiapkan") return 1;
    if (status === "Dalam Pengiriman") return 2;
    if (status === "Tiba di Lokasi" || status === "Tiba di Lokasi & Diserahkan") return 3;
    if (status === "Menunggu Konfirmasi Penerimaan") return 4;
    const idx = states.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceStep = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.advanceMisiStep(misi.id);
      if (res.success) {
        notify?.(`Tahapan misi ${misi.kode_misi} diperbarui ke '${res.data.status_tahapan}'!`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal memperbarui tahapan misi.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReportObstacle = async () => {
    if (!obstacleModalMisi) return;
    try {
      setIsUpdating(true);
      const res = await apiService.reportObstacleMisi(obstacleModalMisi.id, {
        status_kendala: obstacleType,
        catatan_lapangan: obstacleNotes,
      });
      if (res.success) {
        notify?.(`Kendala lapangan [${obstacleType}] berhasil dilaporkan ke Posko!`);
        setObstacleModalMisi(null);
        setObstacleNotes("");
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengirimkan laporan kendala.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (activeMissions.length === 0) {
    return (
      <main className="workspace mitra-tasks-workspace">
        <div className="workspace-title">
          <div>
            <span className="eyebrow">Pelaksanaan Operasional Lapangan (PRD Bab 6.1 &amp; 6.3 Tahap 4)</span>
            <h1>Misi Penyaluran Aktif</h1>
            <p>
              Tidak ada misi penyaluran aktif yang sedang berjalan saat ini.
            </p>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "20px auto" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "24px" }}>
            🚚
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--forest)" }}>Semua Misi Telah Selesai</h3>
          <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "0.92rem", lineHeight: 1.5 }}>
            Anda belum memiliki misi penyaluran aktif. Ajukan komitmen bantuan pada Bursa Bantuan Terbuka untuk mendapatkan penugasan resmi dari Posko.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: "var(--forest)" }}
              onClick={onNavigateToBursa}
            >
              Buka Bursa Bantuan Terbuka
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToHistory}
            >
              Lihat Riwayat Selesai
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentIdx = getStepIndex(currentMission?.status_tahapan || "");

  return (
    <main className="workspace mitra-tasks-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Pelaksanaan Operasional Lapangan (PRD Bab 6.1 &amp; 6.3 Tahap 4-5)</span>
          <h1>Konsol Misi Penyaluran Lapangan</h1>
          <p>
            Perbarui tahapan status pergerakan armada secara real-time, laporkan kendala medan atau perubahan kuantitas kepada Posko.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateToHistory}
          >
            Riwayat Penyaluran →
          </button>
        </div>
      </div>

      {/* MISSION SELECTOR TABS (if multiple active missions) */}
      {activeMissions.length > 1 && (
        <div className="cases-pill-filters" style={{ marginBottom: "20px" }}>
          {activeMissions.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`case-filter-btn ${m.id === currentMission.id ? "active" : ""}`}
              onClick={() => setSelectedMisiId(m.id)}
            >
              {m.kode_misi} ({m.muatan})
            </button>
          ))}
        </div>
      )}

      {/* ACTIVE MISSION CONSOLE CARD */}
      <div
        style={{
          background: "#ffffff",
          border: currentMission.status_kendala ? "1.5px solid #ef4444" : "1px solid var(--line)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--forest)", fontFamily: "monospace" }}>
                {currentMission.kode_misi}
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, padding: "4px 12px", borderRadius: "14px", background: "rgba(59, 130, 246, 0.15)", color: "#1d4ed8" }}>
                {currentMission.status_tahapan}
              </span>
            </div>
            <h2 style={{ fontSize: "1.4rem", margin: "0 0 6px", color: "var(--ink)", fontWeight: 700 }}>
              Penyaluran: {currentMission.muatan}
            </h2>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <span>🚛 {currentMission.armada_info}</span>
              <span>👤 Petugas / Narahubung: <b>{currentMission.responder_name}</b></span>
              <span>🏢 {currentMission.organisasi}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ borderColor: "#ef4444", color: "#dc2626" }}
            onClick={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
          >
            ⚠️ Laporkan Kendala Lapangan
          </button>
        </div>

        {/* Obstacle Alert Banner if active */}
        {currentMission.status_kendala && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              borderLeft: "4px solid #ef4444",
              padding: "14px 18px",
              borderRadius: "0 10px 10px 0",
              fontSize: "0.9rem",
              color: "#991b1b",
            }}
          >
            <strong>🚨 KENDALA TERLAPOR: [{currentMission.status_kendala}]</strong>
            <p style={{ margin: "4px 0 0", color: "#7f1d1d" }}>{currentMission.catatan_lapangan}</p>
          </div>
        )}

        {/* 5-STAGE PROGRESSION TRACKER (PRD Bab 8.3 & Bab 11 AC-11) */}
        <div>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "var(--forest)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tahapan Status Operasional Armada (5 Tahap):
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            {states.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div
                  key={s}
                  style={{
                    background: isCurrent ? "rgba(1, 50, 32, 0.08)" : isDone ? "#f0fdf4" : "#f8fafc",
                    border: isCurrent ? "2px solid var(--forest)" : isDone ? "1px solid #86efac" : "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "12px 10px",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isDone ? "var(--forest)" : "#cbd5e1",
                      color: "#fff",
                      fontSize: "12px",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 6px",
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <strong style={{ display: "block", fontSize: "0.78rem", color: isCurrent ? "var(--forest)" : "var(--ink)", lineHeight: 1.3 }}>
                    {s}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
            {currentIdx < 3 ? (
              <span>Klik tombol di kanan setelah armada menyelesaikan tahapan saat ini.</span>
            ) : currentIdx === 3 ? (
              <span style={{ color: "#d97706", fontWeight: 600 }}>
                Logistik diserahkan! Beralih ke tahap menunggu konfirmasi dari Koordinator/Warga.
              </span>
            ) : (
              <span style={{ color: "#047857", fontWeight: 600 }}>
                ✓ Menunggu konfirmasi penerimaan fisik dari Koordinator Posko / Masyarakat.
              </span>
            )}
          </div>

          {currentIdx < 4 && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: "var(--forest)", minHeight: "44px", padding: "0 24px" }}
              disabled={isUpdating}
              onClick={() => handleAdvanceStep(currentMission)}
            >
              {isUpdating
                ? "Menyimpan..."
                : currentIdx === 0
                ? "Armada Siap Berangkat →"
                : currentIdx === 1
                ? "Mulai Perjalanan Menuju Lokasi →"
                : currentIdx === 2
                ? "Tiba di Lokasi &amp; Serahkan Bantuan →"
                : "Ajukan Menunggu Konfirmasi →"}
            </button>
          )}
        </div>
      </div>

      {/* OBSTACLE MODAL */}
      {obstacleModalMisi && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(500px, 95%)", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.3rem", color: "#dc2626", marginBottom: "6px" }}>
              ⚠️ Laporkan Kendala Lapangan: {obstacleModalMisi.kode_misi}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
              Posko Koordinator akan segera menerima notifikasi darurat untuk mengambil langkah mitigasi.
            </p>

            <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
              Kategori Kendala:
            </label>
            <select
              value={obstacleType}
              onChange={(e) => setObstacleType(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "14px" }}
            >
              <option value="Akses Jalan Terputus (Longsor)">Akses Jalan Terputus (Longsor / Jembatan Rusak)</option>
              <option value="Kerusakan Armada / Kendaraan Mogok">Kerusakan Armada / Kendaraan Mogok / Pecah Ban</option>
              <option value="Keterlambatan Akibat Cuaca Ekstrem">Keterlambatan Akibat Cuaca Ekstrem / Hujan Badai</option>
              <option value="Perubahan Volume di Titik Kumpul">Perubahan Volume / Kondisi Logistik di Titik Kumpul</option>
              <option value="Kendala Keamanan atau Jalur Evakuasi">Kendala Keamanan atau Jalur Evakuasi</option>
              <option value="Lainnya">Kendala Operasional Lainnya</option>
            </select>

            <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
              Rincian &amp; Tindakan Mitigasi yang Diambil:
            </label>
            <textarea
              rows={4}
              value={obstacleNotes}
              onChange={(e) => setObstacleNotes(e.target.value)}
              placeholder="Contoh: Jalur utama tertutup longsor, armada memutar via jalur alternatif. Estimasi waktu kedatangan tertunda 45 menit."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.88rem", marginBottom: "18px" }}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isUpdating}
                onClick={() => setObstacleModalMisi(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isUpdating || !obstacleNotes.trim()}
                onClick={handleReportObstacle}
                style={{ background: "#dc2626" }}
              >
                {isUpdating ? "Mengirimkan..." : "Kirim Laporan Kendala"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
