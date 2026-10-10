import { useState } from "react";
import { MisiItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

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

  const handleConfirmFinalReceipt = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.confirmReceiptKebutuhan(misi.kebutuhan_id, {
        diterima_volume: misi.muatan,
        catatan: "Dikonfirmasi serah terima tuntas oleh pelaksana armada di lokasi bencana.",
      });
      if (res.success) {
        notify?.(`Misi penyaluran ${misi.kode_misi} berhasil diselesaikan tuntas! Kasus resmi selesai.`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi serah terima tuntas.");
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
            <span className="eyebrow">OPERASIONAL LOGISTIK LAPANGAN</span>
            <h1>Misi Penyaluran Aktif</h1>
            <p>
              Tidak ada surat tugas misi penyaluran aktif yang sedang berjalan saat ini.
            </p>
          </div>
        </div>

        <div className="reksa-empty-state">
          <div className="reksa-empty-icon" style={{ background: "#f0f4f1", color: "var(--forest)" }}>
            <AppIcon name="truck" size={32} />
          </div>
          <h3 className="reksa-empty-title">Semua Misi Telah Selesai Tuntas</h3>
          <p className="reksa-empty-desc">
            Organisasi Anda belum memiliki misi distribusi yang sedang berjalan. Ajukan komitmen bantuan pada Bursa Bantuan Terbuka untuk mendapatkan penugasan resmi dari Posko BPBD.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
            <button
              type="button"
              className="reksa-btn reksa-btn-primary"
              onClick={onNavigateToBursa}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <span>Buka Bursa Bantuan Terbuka</span>
              <AppIcon name="arrow-right" size={15} />
            </button>
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
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
          <span className="eyebrow">PELAKSANAAN OPERASIONAL LOGISTIK</span>
          <h1>Konsol Misi Penyaluran Lapangan</h1>
          <p>
            Perbarui tahapan pergerakan armada secara real-time, laporkan hambatan rute bila ada kendala, dan tuntaskan serah terima logistik di titik tujuan.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="reksa-btn reksa-btn-secondary"
            onClick={onNavigateToHistory}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Riwayat Selesai</span>
            <AppIcon name="arrow-right" size={14} />
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
        className="reksa-card"
        style={{
          padding: "26px",
          background: "#ffffff",
          borderRadius: "18px",
          border: currentMission.status_kendala
            ? "1px solid #fca5a5"
            : "1px solid rgba(1, 50, 32, 0.12)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--forest)", fontFamily: "monospace" }}>
                {currentMission.kode_misi}
              </span>
              <span className="reksa-badge info">
                Tahap: {currentMission.status_tahapan}
              </span>
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: "1.35rem", color: "var(--forest)", fontWeight: 700 }}>
              Muatan Distribusi: <span style={{ color: "#166534" }}>{currentMission.muatan}</span>
            </h2>

            {/* Meta Row */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px", color: "var(--muted)", fontSize: "0.85rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <AppIcon name="truck" size={14} />
                <span>Armada: <strong style={{ color: "var(--ink)" }}>{currentMission.armada_info}</strong></span>
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <AppIcon name="user" size={14} />
                <span>Petugas PIC: <strong style={{ color: "var(--ink)" }}>{currentMission.responder_name}</strong></span>
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <AppIcon name="users" size={14} />
                <span>{currentMission.organisasi}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="reksa-btn reksa-btn-danger"
            onClick={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", borderRadius: "10px" }}
          >
            <AppIcon name="alert" size={15} />
            <span>Laporkan Kendala Lapangan</span>
          </button>
        </div>

        {/* Obstacle Alert Banner if active */}
        {currentMission.status_kendala && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "12px", color: "#991b1b", fontSize: "0.88rem" }}>
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              <AppIcon name="alert" size={18} />
            </div>
            <div>
              <strong>KENDALA TERLAPOR: [{currentMission.status_kendala}]</strong>
              <p style={{ margin: "4px 0 0", color: "#7f1d1d" }}>{currentMission.catatan_lapangan}</p>
            </div>
          </div>
        )}

        {/* 5-STAGE PROGRESSION TRACKER */}
        <div style={{ marginBottom: "24px" }}>
          <label className="reksa-form-label" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", fontSize: "0.78rem" }}>
            Tahapan Status Operasional Armada (5 Tahap):
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {states.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div
                  key={s}
                  style={{
                    background: isCurrent ? "#eef6f0" : isDone ? "#f7faf7" : "#ffffff",
                    border: isCurrent ? "2px solid var(--forest)" : isDone ? "1px solid #b2d7bb" : "1px solid rgba(1, 50, 32, 0.12)",
                    borderRadius: "12px",
                    padding: "12px 10px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: isDone ? "var(--forest)" : "#d4d5ca",
                      color: "#ffffff",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 6px",
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? <AppIcon name="check" size={13} /> : i + 1}
                  </div>
                  <strong style={{ display: "block", fontSize: "0.8rem", color: isCurrent ? "var(--forest)" : "var(--ink)", lineHeight: 1.3 }}>
                    {s}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", paddingTop: "16px", borderTop: "1px solid rgba(1, 50, 32, 0.08)" }}>
          <div style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
            {currentIdx < 3 ? (
              <span>Klik tombol aksi begitu armada siap bergerak atau telah menyelesaikan tahapan saat ini.</span>
            ) : currentIdx === 3 ? (
              <span style={{ color: "#b45309", fontWeight: 600 }}>
                Logistik telah diserahkan di lokasi. Siap beralih ke konfirmasi penerimaan fisik terukur.
              </span>
            ) : (
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                Logistik telah tiba dan siap dituntaskan dengan penandatanganan serah terima.
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {currentIdx < 4 && (
              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isUpdating}
                onClick={() => handleAdvanceStep(currentMission)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <span>
                  {isUpdating
                    ? "Menyimpan..."
                    : currentIdx === 0
                    ? "Armada Siap Berangkat"
                    : currentIdx === 1
                    ? "Mulai Perjalanan Menuju Lokasi"
                    : currentIdx === 2
                    ? "Tiba di Lokasi & Serahkan Bantuan"
                    : "Ajukan Menunggu Konfirmasi"}
                </span>
                <AppIcon name="arrow-right" size={14} />
              </button>
            )}

            {(currentIdx === 3 || currentIdx === 4) && (
              <button
                type="button"
                className="reksa-btn reksa-btn-success"
                disabled={isUpdating}
                onClick={() => handleConfirmFinalReceipt(currentMission)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <AppIcon name="check" size={15} />
                <span>{isUpdating ? "Memproses..." : "Konfirmasi Serah Terima Selesai Tuntas"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OBSTACLE MODAL */}
      {obstacleModalMisi && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(520px, 95%)", textAlign: "left", borderRadius: "18px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#b91c1c" }}>LAPORAN SITUASI DARURAT</span>
                <h2 style={{ fontSize: "1.25rem", color: "#b91c1c", margin: "4px 0 0", fontWeight: 800 }}>
                  Kendala Lapangan: {obstacleModalMisi.kode_misi}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setObstacleModalMisi(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "var(--muted)", fontSize: "0.86rem", marginBottom: "16px" }}>
              Posko Koordinator BPBD akan segera menerima laporan ini untuk melakukan koordinasi penyesuaian rute atau bantuan darurat.
            </p>

            <label className="reksa-form-label">
              Kategori Kendala:
            </label>
            <select
              value={obstacleType}
              onChange={(e) => setObstacleType(e.target.value)}
              className="reksa-input-field"
              style={{ marginBottom: "14px", borderRadius: "8px" }}
            >
              <option value="Akses Jalan Terputus (Longsor)">Akses Jalan Terputus (Longsor / Jembatan Rusak)</option>
              <option value="Kerusakan Armada / Kendaraan Mogok">Kerusakan Armada / Kendaraan Mogok / Pecah Ban</option>
              <option value="Keterlambatan Akibat Cuaca Ekstrem">Keterlambatan Akibat Cuaca Ekstrem / Hujan Badai</option>
              <option value="Perubahan Volume di Titik Kumpul">Perubahan Volume / Kondisi Logistik di Titik Kumpul</option>
              <option value="Kendala Keamanan atau Jalur Evakuasi">Kendala Keamanan atau Jalur Evakuasi</option>
              <option value="Lainnya">Kendala Operasional Lainnya</option>
            </select>

            <label className="reksa-form-label">
              Rincian &amp; Tindakan Mitigasi Lapangan:
            </label>
            <textarea
              rows={4}
              value={obstacleNotes}
              onChange={(e) => setObstacleNotes(e.target.value)}
              placeholder="Contoh: Jalur utama tertutup longsor, armada memutar via rute alternatif. Estimasi waktu kedatangan tertunda 40 menit."
              className="reksa-textarea-field"
              style={{ marginBottom: "20px", borderRadius: "8px" }}
            />

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="reksa-btn reksa-btn-secondary"
                disabled={isUpdating}
                onClick={() => setObstacleModalMisi(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="reksa-btn reksa-btn-danger"
                disabled={isUpdating || !obstacleNotes.trim()}
                onClick={handleReportObstacle}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
              >
                <AppIcon name="alert" size={15} />
                <span>{isUpdating ? "Mengirimkan..." : "Kirim Laporan Kendala"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
