import { useState } from "react";
import { CaseRecord } from "../../App";
import { MisiItem, apiService } from "../../services/api";

interface PoskoDistribusiPenerimaanProps {
  misiList: MisiItem[];
  cases: CaseRecord[];
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onSelectCase: (c: CaseRecord) => void;
}

export function PoskoDistribusiPenerimaan({
  misiList,
  cases,
  onRefresh,
  notify,
  onSelectCase,
}: PoskoDistribusiPenerimaanProps) {
  const [tab, setTab] = useState<"active" | "arrived" | "completed" | "all">("active");

  // Receipt confirmation modal
  const [confirmModalMisi, setConfirmModalMisi] = useState<MisiItem | null>(null);
  const [receivedVolumeInput, setReceivedVolumeInput] = useState("");
  const [confirmNotesInput, setConfirmNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMissions = misiList.filter((m) => m.status_tahapan !== "Selesai");
  const arrivedMissions = misiList.filter(
    (m) => m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Menunggu Konfirmasi Penerimaan"
  );
  const completedMissions = misiList.filter((m) => m.status_tahapan === "Selesai");

  const filteredMissions = misiList.filter((m) => {
    if (tab === "active") return m.status_tahapan !== "Selesai";
    if (tab === "arrived") {
      return m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Menunggu Konfirmasi Penerimaan";
    }
    if (tab === "completed") return m.status_tahapan === "Selesai";
    return true;
  });

  const openConfirmModal = (misi: MisiItem) => {
    setConfirmModalMisi(misi);
    setReceivedVolumeInput(misi.muatan);
    setConfirmNotesInput("Diterima tuntas oleh Koordinator Posko dan disaksikan perwakilan warga.");
  };

  const handleConfirmReceipt = async () => {
    if (!confirmModalMisi) return;
    try {
      setIsSubmitting(true);
      const res = await apiService.confirmReceiptKebutuhan(confirmModalMisi.kebutuhan_id, {
        diterima_volume: receivedVolumeInput || confirmModalMisi.muatan,
        catatan: confirmNotesInput,
      });

      if (res.success) {
        if (res.is_fully_fulfilled) {
          notify?.(`Penerimaan tuntas dikonfirmasi! Kasus resmi diselesaikan (RESOLVED).`);
        } else {
          notify?.(`Penerimaan parsial tercatat (${receivedVolumeInput}). Sisa kekurangan ${res.kekurangan_penerimaan || 0} tetap terbuka.`);
        }
        setConfirmModalMisi(null);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi penerimaan bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace posko-distribusi-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Pengawasan Logistik &amp; Serah Terima (PRD Bab 5.1 &amp; 5.2 Tahap 8-9)</span>
          <h1>Distribusi &amp; Penerimaan Lapangan</h1>
          <p>
            Pantau misi pergerakan armada mitra di lapangan, tangani laporan kendala akses, dan lakukan konfirmasi penerimaan fisik terukur.
          </p>
        </div>
        <div className="posko-status-live-badge">
          <span className="live-indicator-dot" /> {activeMissions.length} Misi Penyaluran Aktif
        </div>
      </div>

      {/* SUMMARY STATS ROW */}
      <div className="assignments-summary-row" style={{ marginBottom: "26px" }}>
        <div className="asg-sum-box">
          <strong>{misiList.length}</strong>
          <span>Total Seluruh Misi</span>
        </div>
        <div className="asg-sum-box info">
          <strong>{activeMissions.length}</strong>
          <span>Sedang Bergerak</span>
        </div>
        <div className="asg-sum-box warning">
          <strong>{arrivedMissions.length}</strong>
          <span>Perlu Konfirmasi Fisik</span>
        </div>
        <div className="asg-sum-box success">
          <strong>{completedMissions.length}</strong>
          <span>Selesai &amp; Rekonsiliasi</span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="cases-pill-filters" style={{ marginBottom: "22px" }}>
        <button
          type="button"
          className={`case-filter-btn ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Misi Aktif ({activeMissions.length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "arrived" ? "active" : ""}`}
          onClick={() => setTab("arrived")}
        >
          Tiba di Lokasi / Perlu Konfirmasi ({arrivedMissions.length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "completed" ? "active" : ""}`}
          onClick={() => setTab("completed")}
        >
          Selesai Diterima ({completedMissions.length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Semua Misi ({misiList.length})
        </button>
      </div>

      {/* LIST OF MISSIONS */}
      {filteredMissions.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Tidak Ada Misi Penyaluran</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
            Belum ada armada mitra yang diberangkatkan atau seluruh pengiriman telah tuntas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredMissions.map((m) => {
            const isCompleted = m.status_tahapan === "Selesai";
            const isArrived = m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Menunggu Konfirmasi Penerimaan";
            const hasObstacle = Boolean(m.status_kendala);

            const matchedCase = cases.find((c) => c.id === m.kebutuhan?.kode_kasus || c.id === `RK-${m.kebutuhan_id}`);

            return (
              <div
                key={m.id}
                style={{
                  background: "#ffffff",
                  border: hasObstacle ? "1.5px solid #ef4444" : isArrived ? "1.5px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--line)",
                  borderRadius: "18px",
                  padding: "22px 26px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--forest)", fontFamily: "monospace" }}>
                        {m.kode_misi}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: isCompleted ? "rgba(16, 185, 129, 0.15)" : isArrived ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: isCompleted ? "#047857" : isArrived ? "#b45309" : "#1d4ed8",
                        }}
                      >
                        Tahapan: {m.status_tahapan}
                      </span>
                      {hasObstacle && (
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", color: "#b91c1c" }}>
                          ⚠️ Ada Kendala Lapangan
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>
                      Muatan: {m.muatan} · {m.organisasi}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      Narahubung Armada: <b>{m.responder_name}</b> · {m.armada_info}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {matchedCase && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem" }}
                        onClick={() => onSelectCase(matchedCase)}
                      >
                        Lihat Kasus
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "8px 16px", minHeight: "38px", fontSize: "0.85rem", background: isArrived ? "#047857" : "var(--forest)" }}
                        onClick={() => openConfirmModal(m)}
                      >
                        ✓ Konfirmasi Penerimaan
                      </button>
                    )}

                    {isCompleted && (
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#047857", padding: "6px 12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                        ✓ Diterima Tuntas
                      </span>
                    )}
                  </div>
                </div>

                {/* Obstacle Alert Banner (Bab 6.3 Tahap 5 & Bab 7.4) */}
                {hasObstacle && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      borderLeft: "4px solid #ef4444",
                      padding: "12px 16px",
                      borderRadius: "0 10px 10px 0",
                      fontSize: "0.88rem",
                      color: "#991b1b",
                    }}
                  >
                    <strong>🚨 LAPORAN KENDALA DARI ARMADA MITRA: [{m.status_kendala}]</strong>
                    <p style={{ margin: "4px 0 0", color: "#7f1d1d" }}>{m.catatan_lapangan}</p>
                  </div>
                )}

                {/* Logistics details */}
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
                    <span style={{ color: "var(--muted)", display: "block" }}>Tujuan Distribusi:</span>
                    <strong>{m.kebutuhan ? `${m.kebutuhan.desa || ''}, ${m.kebutuhan.kecamatan || ''}` : 'Posko Lapangan'}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>Jumlah Diterima:</span>
                    <strong style={{ color: m.jumlah_diterima ? "#047857" : "var(--ink)" }}>
                      {m.jumlah_diterima || "Menunggu Serah Terima"}
                    </strong>
                  </div>
                  {m.selisih && (
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>Selisih Fisik:</span>
                      <strong style={{ color: m.selisih !== "0" ? "#dc2626" : "#047857" }}>
                        {m.selisih}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM RECEIPT MODAL */}
      {confirmModalMisi && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(480px, 95%)", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--forest)", marginBottom: "8px" }}>
              Konfirmasi Penerimaan Resmi: {confirmModalMisi.kode_misi}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
              Armada: <b>{confirmModalMisi.organisasi}</b> · Muatan Dikirim: <b>{confirmModalMisi.muatan}</b>
            </p>

            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
              Jumlah Aktual yang Dikonfirmasi Diterima:
            </label>
            <input
              type="text"
              value={receivedVolumeInput}
              onChange={(e) => setReceivedVolumeInput(e.target.value)}
              placeholder="Contoh: 500 L atau 380 Paket"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.95rem", marginBottom: "14px" }}
            />

            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
              Catatan Berita Acara Penerimaan (Koordinator Posko / Warga):
            </label>
            <textarea
              rows={3}
              value={confirmNotesInput}
              onChange={(e) => setConfirmNotesInput(e.target.value)}
              placeholder="Contoh: Bantuan diterima fisik dalam kondisi baik, disaksikan perwakilan RT."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.88rem", marginBottom: "18px" }}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={() => setConfirmModalMisi(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting}
                onClick={handleConfirmReceipt}
                style={{ background: "var(--forest)" }}
              >
                {isSubmitting ? "Menyimpan..." : "Konfirmasi & Rekonsiliasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
