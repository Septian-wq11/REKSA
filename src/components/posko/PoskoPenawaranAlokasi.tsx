import { useState } from "react";
import { CaseRecord } from "../../App";
import { BursaItem, PenawaranItem, apiService } from "../../services/api";

interface PoskoPenawaranAlokasiProps {
  penawaranList: PenawaranItem[];
  bursaList: BursaItem[];
  cases: CaseRecord[];
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToMissions: () => void;
}

export function PoskoPenawaranAlokasi({
  penawaranList,
  bursaList,
  cases,
  onRefresh,
  notify,
  onNavigateToMissions,
}: PoskoPenawaranAlokasiProps) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  // Approval / Rejection modal
  const [activeOffer, setActiveOffer] = useState<PenawaranItem | null>(null);
  const [activeBursa, setActiveBursa] = useState<BursaItem | null>(null);
  const [modalType, setModalType] = useState<"approvePartial" | "reject" | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine PenawaranMitra list with pending claims from bursaList (if not already represented)
  const syntheticOffers: PenawaranItem[] = [...penawaranList];

  // Include pending legacy claims from bursaList if they don't have a penawaran yet
  bursaList.forEach((b) => {
    if (b.status === "Klaim Diajukan" && b.claimed_org) {
      const alreadyExists = penawaranList.some((p) => p.bursa_id === b.id && p.status === "Diajukan");
      if (!alreadyExists) {
        syntheticOffers.push({
          id: b.id, // mapped to bursa id
          kode_penawaran: `PROP-${b.id}`,
          bursa_id: b.id,
          kebutuhan_id: b.kebutuhan_id,
          posko_id: b.posko_id,
          mitra_name: b.claimedBy?.name || "Mitra Kemanusiaan",
          organisasi: b.claimed_org || "Satgas BPBD / Mitra",
          jenis_bantuan: b.item_bantuan,
          jumlah_tawaran: b.claimed_volume || b.target_volume,
          volume_angka: parseInt((b.claimed_volume || b.target_volume).replace(/[^0-9]/g, "")) || 500,
          satuan: (b.claimed_volume || b.target_volume).replace(/[0-9.,]/g, "").trim() || "Unit",
          armada_info: b.claimed_armada || "Armada Mitra Siaga",
          catatan: b.claim_notes || "Mitra siap menyalurkan bantuan sesuai kapasitas armada.",
          status: "Diajukan",
          created_at: b.published_at || new Date().toISOString(),
          bursa: b,
        });
      }
    }
  });

  const filteredOffers = syntheticOffers.filter((o) => {
    if (tab === "pending") return o.status === "Diajukan";
    if (tab === "approved") return o.status === "Disetujui";
    if (tab === "rejected") return o.status === "Ditolak";
    return true;
  });

  const handleApproveFull = async (offer: PenawaranItem) => {
    try {
      setIsSubmitting(true);
      if (offer.kode_penawaran.startsWith("PROP-")) {
        // Legacy bursa claim
        await apiService.approveClaimBursa(offer.bursa_id, {
          approved_volume: offer.jumlah_tawaran,
          catatan: "Disetujui penuh oleh Koordinator Posko. Alokasi resmi diterbitkan.",
        });
      } else {
        await apiService.approvePenawaran(offer.id, {
          approved_volume: offer.jumlah_tawaran,
          volume_angka: offer.volume_angka,
          catatan: "Disetujui penuh oleh Koordinator Posko. Alokasi resmi dan Misi Penyaluran diterbitkan.",
        });
      }
      notify?.(`Penawaran ${offer.kode_penawaran} (${offer.organisasi}) berhasil disetujui penuh! Misi penyaluran diterbitkan.`);
      await onRefresh?.();
    } catch (err: any) {
      notify?.(err?.message || "Gagal menyetujui penawaran mitra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPartialModal = (offer: PenawaranItem) => {
    setActiveOffer(offer);
    setModalType("approvePartial");
    setPartialAmountInput(String(offer.volume_angka || 350));
    setNotesInput("");
  };

  const openRejectModal = (offer: PenawaranItem) => {
    setActiveOffer(offer);
    setModalType("reject");
    setNotesInput("");
  };

  const handleExecuteModal = async () => {
    if (!activeOffer) return;
    try {
      setIsSubmitting(true);
      if (modalType === "approvePartial") {
        const approvedNum = parseInt(partialAmountInput) || activeOffer.volume_angka;
        const approvedStr = `${approvedNum} ${activeOffer.satuan || "Unit"}`;

        if (activeOffer.kode_penawaran.startsWith("PROP-")) {
          await apiService.approveClaimBursa(activeOffer.bursa_id, {
            approved_volume: approvedStr,
            catatan: notesInput || `Disetujui sebagian (${approvedStr}).`,
          });
        } else {
          await apiService.approvePenawaran(activeOffer.id, {
            approved_volume: approvedStr,
            volume_angka: approvedNum,
            catatan: notesInput || `Disetujui sebagian (${approvedStr}) oleh Koordinator Posko.`,
          });
        }
        notify?.(`Penawaran ${activeOffer.kode_penawaran} disetujui sebagian (${approvedStr}). Sisa kekurangan tetap terbuka di Bursa.`);
      } else if (modalType === "reject") {
        const alasan = notesInput || "Spesifikasi armada atau waktu kesiapan belum sesuai prioritas operasional saat ini.";
        if (activeOffer.kode_penawaran.startsWith("PROP-")) {
          await apiService.rejectClaimBursa(activeOffer.bursa_id, { alasan });
        } else {
          await apiService.rejectPenawaran(activeOffer.id, { alasan_penolakan: alasan });
        }
        notify?.(`Penawaran ${activeOffer.kode_penawaran} ditolak. Alasan penolakan tersimpan di log.`);
      }

      setModalType(null);
      setActiveOffer(null);
      await onRefresh?.();
    } catch (err: any) {
      notify?.(err?.message || "Gagal memproses penawaran mitra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace posko-penawaran-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Keputusan Alokasi Resmi (PRD Bab 5.1 &amp; 5.2 Tahap 7)</span>
          <h1>Penawaran &amp; Alokasi Bantuan Mitra</h1>
          <p>
            Tinjau tawaran logistik dan armada dari Organisasi Kemanusiaan, setujui alokasi resmi (penuh atau sebagian), atau tolak secara transparan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNavigateToMissions}
        >
          Pantau Misi Armada Aktif →
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="cases-pill-filters" style={{ marginBottom: "24px" }}>
        <button
          type="button"
          className={`case-filter-btn ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Menunggu Keputusan ({syntheticOffers.filter((o) => o.status === "Diajukan").length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "approved" ? "active" : ""}`}
          onClick={() => setTab("approved")}
        >
          Disetujui ({syntheticOffers.filter((o) => o.status === "Disetujui").length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "rejected" ? "active" : ""}`}
          onClick={() => setTab("rejected")}
        >
          Ditolak ({syntheticOffers.filter((o) => o.status === "Ditolak").length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Semua ({syntheticOffers.length})
        </button>
      </div>

      {/* OFFERS LIST */}
      {filteredOffers.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "20px" }}>
            🤝
          </div>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Tidak Ada Penawaran di Kategori Ini</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
            Belum ada proposal bantuan yang diajukan oleh mitra atau telah diproses posko.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOffers.map((o) => {
            const isPending = o.status === "Diajukan";
            const isApproved = o.status === "Disetujui";
            const isRejected = o.status === "Ditolak";

            return (
              <div
                key={o.id}
                style={{
                  background: "#ffffff",
                  border: isPending ? "1.5px solid rgba(217, 119, 6, 0.4)" : "1px solid var(--line)",
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
                        {o.kode_penawaran}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: isApproved ? "rgba(16, 185, 129, 0.15)" : isRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isApproved ? "#047857" : isRejected ? "#b91c1c" : "#b45309",
                        }}
                      >
                        Status: {o.status}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>
                      {o.organisasi} · Penawaran: {o.jumlah_tawaran}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      Item: <b>{o.jenis_bantuan}</b> · PIC: {o.mitra_name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: "8px 16px", minHeight: "38px", fontSize: "0.85rem", background: "#047857" }}
                          disabled={isSubmitting}
                          onClick={() => handleApproveFull(o)}
                        >
                          ✓ Setujui Penuh
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem", borderColor: "#1d4ed8", color: "#1d4ed8" }}
                          disabled={isSubmitting}
                          onClick={() => openPartialModal(o)}
                        >
                          Setujui Sebagian
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem", borderColor: "#ef4444", color: "#dc2626" }}
                          disabled={isSubmitting}
                          onClick={() => openRejectModal(o)}
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#047857", padding: "6px 12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                        ✓ Alokasi Sah ({o.jumlah_disetujui || o.jumlah_tawaran})
                      </span>
                    )}

                    {isRejected && (
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#dc2626", padding: "6px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
                        ✕ Ditolak
                      </span>
                    )}
                  </div>
                </div>

                {/* Logistics details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "10px",
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontSize: "0.86rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>Metode Penyaluran:</span>
                    <strong style={{ color: "var(--forest)" }}>
                      {o.metode_penyaluran || (o.armada_info ? "Pengiriman Mandiri (Armada Sendiri)" : "Diserahkan ke Gudang / Posko BPBD (Tanpa Armada Mandiri)")}
                    </strong>
                  </div>
                  {o.armada_info && (
                    <div>
                      <span style={{ color: "var(--muted)", display: "block" }}>Dukungan Armada:</span>
                      <strong>{o.armada_info}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>Waktu Kesiapan:</span>
                    <strong>{o.waktu_kesiapan || "Siap Disalurkan"}</strong>
                  </div>
                </div>

                {/* Notes */}
                {o.catatan && (
                  <div style={{ fontSize: "0.86rem", color: "#334155", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px" }}>
                    <b>Catatan Mitra:</b> {o.catatan}
                  </div>
                )}

                {/* If rejected, show reason */}
                {isRejected && o.alasan_penolakan && (
                  <div style={{ fontSize: "0.86rem", color: "#b91c1c", background: "rgba(239, 68, 68, 0.1)", padding: "10px 14px", borderRadius: "8px" }}>
                    <b>Alasan Penolakan Posko:</b> {o.alasan_penolakan}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL APPROVE PARTIAL / REJECT */}
      {modalType && activeOffer && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(480px, 95%)", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--forest)", marginBottom: "8px" }}>
              {modalType === "approvePartial"
                ? `Setujui Sebagian: ${activeOffer.kode_penawaran}`
                : `Tolak Penawaran: ${activeOffer.kode_penawaran}`}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
              Organisasi: <b>{activeOffer.organisasi}</b> · Tawaran Awal: <b>{activeOffer.jumlah_tawaran}</b>
            </p>

            {modalType === "approvePartial" && (
              <>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Jumlah yang Disetujui ({activeOffer.satuan || "Unit"}):
                </label>
                <input
                  type="number"
                  value={partialAmountInput}
                  onChange={(e) => setPartialAmountInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.95rem", marginBottom: "14px" }}
                />

                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Catatan Alokasi Posko:
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Disetujui sebagian sesuai batas alokasi tahap pertama."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            {modalType === "reject" && (
              <>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Alasan Penolakan (Wajib &amp; Terlihat oleh Mitra):
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Armada yang diajukan tidak memenuhi persyaratan medan pegunungan yang terisolir."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={() => setModalType(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting || (modalType === "reject" && !notesInput.trim())}
                onClick={handleExecuteModal}
                style={{ background: modalType === "reject" ? "#dc2626" : "var(--forest)" }}
              >
                {isSubmitting ? "Memproses..." : modalType === "approvePartial" ? "Setujui Alokasi" : "Simpan Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
