import { MisiItem } from "../../services/api";

interface MitraRiwayatPenyaluranProps {
  misiList: MisiItem[];
  onNavigateToTasks: () => void;
}

export function MitraRiwayatPenyaluran({
  misiList,
  onNavigateToTasks,
}: MitraRiwayatPenyaluranProps) {
  const completedMissions = misiList.filter((m) => m.status_tahapan === "Selesai");

  return (
    <main className="workspace mitra-riwayat-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Rekonsiliasi Bantuan Selesai (PRD Bab 6.1 Menu 5)</span>
          <h1>Riwayat Penyaluran Bantuan</h1>
          <p>
            Daftar misi kemanusiaan yang telah diselesaikan organisasi Anda dan dikonfirmasi resmi oleh Posko Koordinator dan Warga.
          </p>
        </div>
        <button
          type="button"
          className="reksa-btn reksa-btn-secondary"
          onClick={onNavigateToTasks}
        >
          Lihat Misi Berjalan →
        </button>
      </div>

      {completedMissions.length === 0 ? (
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon">📋</div>
          <h3 className="reksa-empty-title">Belum Ada Riwayat Selesai</h3>
          <p className="reksa-empty-desc">
            Misi yang telah sampai di lokasi dan dikonfirmasi penerimaannya oleh Posko akan otomatis terarsip rapi di sini.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {completedMissions.map((m) => (
            <div
              key={m.id}
              className="reksa-card verified"
            >
              <div className="reksa-card-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.08rem", color: "var(--forest)", fontFamily: "monospace" }}>
                      {m.kode_misi}
                    </span>
                    <span className="reksa-badge success">
                      ✓ Selesai &amp; Diterima Sah
                    </span>
                  </div>
                  <h3 className="reksa-card-title">
                    Muatan: {m.muatan} · {m.armada_info}
                  </h3>
                  <div className="reksa-meta-list">
                    <span className="reksa-meta-item">
                      Narahubung: <strong>{m.responder_name}</strong>
                    </span>
                    <span className="reksa-meta-divider">·</span>
                    <span className="reksa-meta-item">
                      Organisasi: <strong>{m.organisasi}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Berita Acara:</span>
                  <span className="reksa-badge success" style={{ padding: "4px 12px" }}>Terkonfirmasi Sah</span>
                </div>
              </div>

              {/* Delivery & discrepancy details (Bab 7.1 & 7.2) */}
              <div className="reksa-telemetry-strip">
                <div className="reksa-telemetry-item">
                  <span className="reksa-telemetry-label">Muatan Terkirim</span>
                  <span className="reksa-telemetry-val">{m.muatan}</span>
                </div>
                <div className="reksa-telemetry-item">
                  <span className="reksa-telemetry-label">Diterima Fisik</span>
                  <span className="reksa-telemetry-val success">{m.jumlah_diterima || m.muatan}</span>
                </div>
                <div className="reksa-telemetry-item">
                  <span className="reksa-telemetry-label">Selisih Logistik</span>
                  <span className={`reksa-telemetry-val ${m.selisih && m.selisih !== "0" ? "critical" : "success"}`}>
                    {m.selisih || "0 (Sesuai Target)"}
                  </span>
                </div>
              </div>

              {m.catatan_lapangan && (
                <div className="reksa-info-box">
                  <strong style={{ color: "var(--forest)" }}>Catatan Serah Terima:</strong> {m.catatan_lapangan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
