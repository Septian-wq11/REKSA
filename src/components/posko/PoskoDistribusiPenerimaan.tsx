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
            Pantau misi pergerakan armada mitra di lapangan, tangani laporan kendala akses, dan lakukan konfirmasi penerimaan fisik terukur (BAST).
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
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon">🚚</div>
          <h3 className="reksa-empty-title">Tidak Ada Misi Penyaluran</h3>
          <p className="reksa-empty-desc">
            Belum ada armada mitra yang diberangkatkan atau seluruh pengiriman pada kategori ini telah selesai.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredMissions.map((m) => {
            const isCompleted = m.status_tahapan === "Selesai";
            const isArrived = m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Menunggu Konfirmasi Penerimaan";
            const hasObstacle = Boolean(m.status_kendala);

            const matchedCase = cases.find((c) => c.id === m.kebutuhan?.kode_kasus || c.id === `RK-${m.kebutuhan_id}` || c.id === `RK-2026-000${m.kebutuhan_id}`);

            return (
              <div
                key={m.id}
                className={`reksa-card ${hasObstacle ? "obstacle-alert" : isCompleted ? "verified" : isArrived ? "pending" : ""}`}
              >
                {/* Header */}
                <div className="reksa-card-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.08rem", color: "var(--forest)", fontFamily: "monospace" }}>
                        {m.kode_misi}
                      </span>
                      <span className={`reksa-badge ${isCompleted ? "success" : isArrived ? "warning" : "info"}`}>
                        Tahapan: {m.status_tahapan}
                      </span>
                      {hasObstacle && (
                        <span className="reksa-badge critical">
                          ⚠️ Ada Kendala Lapangan
                        </span>
                      )}
                    </div>
                    <h3 className="reksa-card-title">
                      Muatan: {m.muatan} · {m.organisasi}
                    </h3>
                    <div className="reksa-meta-list">
                      <span className="reksa-meta-item">
                        Narahubung Armada: <strong>{m.responder_name}</strong>
                      </span>
                      <span className="reksa-meta-divider">·</span>
                      <span className="reksa-meta-item">
                        Armada: <strong>{m.armada_info}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="reksa-btn-group">
                    {matchedCase && (
                      <button
                        type="button"
                        className="reksa-btn reksa-btn-secondary"
                        onClick={() => onSelectCase(matchedCase)}
                      >
                        Buka Kasus →
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        className="reksa-btn reksa-btn-success"
                        onClick={() => openConfirmModal(m)}
                      >
                        ✓ Konfirmasi Penerimaan
                      </button>
                    )}

                    {isCompleted && (
                      <span className="reksa-badge success" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                        ✓ Diterima Tuntas
                      </span>
                    )}
                  </div>
                </div>

                {/* Obstacle Alert Banner */}
                {hasObstacle && (
                  <div className="reksa-info-box alert-red">
                    <strong>🚨 LAPORAN KENDALA DARI ARMADA MITRA: [{m.status_kendala}]</strong>
                    <p style={{ margin: "4px 0 0" }}>{m.catatan_lapangan}</p>
                  </div>
                )}

                {/* Logistics telemetry strip */}
                <div className="reksa-telemetry-strip">
                  <div className="reksa-telemetry-item">
                    <span className="reksa-telemetry-label">Tujuan Distribusi</span>
                    <span className="reksa-telemetry-val">
                      {m.kebutuhan ? `${m.kebutuhan.desa || ''}, ${m.kebutuhan.kecamatan || ''}` : 'Posko Lapangan'}
                    </span>
                  </div>
                  <div className="reksa-telemetry-item">
                    <span className="reksa-telemetry-label">Muatan Terkirim</span>
                    <span className="reksa-telemetry-val">{m.muatan}</span>
                  </div>
                  <div className="reksa-telemetry-item">
                    <span className="reksa-telemetry-label">Status Serah Terima</span>
                    <span className={`reksa-telemetry-val ${isCompleted ? "success" : "warning"}`}>
                      {m.jumlah_diterima ? `${m.jumlah_diterima} (Sah)` : "Menunggu Serah Terima"}
                    </span>
                  </div>
                  {m.selisih && (
                    <div className="reksa-telemetry-item">
                      <span className="reksa-telemetry-label">Selisih Fisik</span>
                      <span className={`reksa-telemetry-val ${m.selisih !== "0" ? "critical" : "success"}`}>
                        {m.selisih}
                      </span>
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
              Armada: <strong>{confirmModalMisi.organisasi}</strong> · Muatan Dikirim: <strong>{confirmModalMisi.muatan}</strong>
            </p>

            <label className="reksa-form-label">
              Jumlah Aktual yang Dikonfirmasi Diterima:
            </label>
            <input
              type="text"
              value={receivedVolumeInput}
              onChange={(e) => setReceivedVolumeInput(e.target.value)}
              placeholder="Contoh: 500 L atau 380 Paket"
              className="reksa-input-field"
              style={{ marginBottom: "14px" }}
            />

            <label className="reksa-form-label">
              Catatan Berita Acara Penerimaan (Koordinator Posko / Warga):
            </label>
            <textarea
              rows={3}
              value={confirmNotesInput}
              onChange={(e) => setConfirmNotesInput(e.target.value)}
              placeholder="Contoh: Bantuan diterima fisik dalam kondisi baik, disaksikan perwakilan RT."
              className="reksa-textarea-field"
              style={{ marginBottom: "18px" }}
            />

            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button
                type="button"
                className="reksa-btn reksa-btn-secondary"
                disabled={isSubmitting}
                onClick={() => setConfirmModalMisi(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isSubmitting}
                onClick={handleConfirmReceipt}
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
