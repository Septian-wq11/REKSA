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
          className="btn btn-secondary"
          onClick={onNavigateToTasks}
        >
          Lihat Misi Berjalan →
        </button>
      </div>

      {completedMissions.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "24px" }}>
            📋
          </div>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Belum Ada Riwayat Selesai</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
            Misi yang telah sampai dan dikonfirmasi penerimaannya oleh Posko akan otomatis tersimpan di sini.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {completedMissions.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "18px",
                padding: "22px 26px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--forest)", fontFamily: "monospace" }}>
                      {m.kode_misi}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#047857" }}>
                      ✓ Selesai &amp; Diterima
                    </span>
                  </div>
                  <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>
                    Muatan: {m.muatan} · {m.armada_info}
                  </h3>
                  <div style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                    Narahubung: <b>{m.responder_name}</b> · {m.organisasi}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)", display: "block" }}>Status Serah Terima:</span>
                  <strong style={{ fontSize: "1rem", color: "#047857" }}>Terkonfirmasi Sah</strong>
                </div>
              </div>

              {/* Delivery & discrepancy details (Bab 7.1 & 7.2) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "0.86rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--muted)", display: "block" }}>Muatan Dikirim:</span>
                  <strong>{m.muatan}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block" }}>Dikonfirmasi Diterima:</span>
                  <strong style={{ color: "#047857" }}>{m.jumlah_diterima || m.muatan}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block" }}>Selisih Fisik:</span>
                  <strong style={{ color: m.selisih && m.selisih !== "0" ? "#dc2626" : "#047857" }}>
                    {m.selisih || "0 (Sesuai Target)"}
                  </strong>
                </div>
              </div>

              {m.catatan_lapangan && (
                <div style={{ fontSize: "0.85rem", color: "#334155", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px" }}>
                  <b>Catatan Lapangan &amp; Serah Terima:</b> {m.catatan_lapangan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
