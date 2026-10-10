import { useState } from "react";
import { CaseRecord } from "../../App";
import { BursaItem, PenawaranItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

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
  const [modalType, setModalType] = useState<"approvePartial" | "reject" | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine PenawaranMitra list with pending claims from bursaList (if not already represented)
  const syntheticOffers: PenawaranItem[] = [...penawaranList];

  bursaList.forEach((b) => {
    if (b.status === "Klaim Diajukan" && b.claimed_org) {
      const alreadyExists = penawaranList.some((p) => p.bursa_id === b.id && p.status === "Diajukan");
      if (!alreadyExists) {
        syntheticOffers.push({
          id: b.id,
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

  const handleModalSubmit = async () => {
    if (!activeOffer) return;
    try {
      setIsSubmitting(true);
      if (modalType === "approvePartial") {
        const approvedNum = parseInt(partialAmountInput) || 100;
        const approvedStr = `${approvedNum} ${activeOffer.satuan || "Unit"}`;

        if (activeOffer.kode_penawaran.startsWith("PROP-")) {
          await apiService.approveClaimBursa(activeOffer.bursa_id, {
            approved_volume: approvedStr,
            catatan: notesInput || `Disetujui sebagian (${approvedStr}) oleh Koordinator Posko.`,
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

  const pendingOffersCount = syntheticOffers.filter((o) => o.status === "Diajukan").length;
  const approvedOffersCount = syntheticOffers.filter((o) => o.status === "Disetujui").length;
  const rejectedOffersCount = syntheticOffers.filter((o) => o.status === "Ditolak").length;

  return (
    <main className="workspace posko-penawaran-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            KEPUTUSAN ALOKASI RESMI POSKO
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Penawaran &amp; Alokasi Bantuan Mitra
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Tinjau proposal komitmen logistik dan kapasitas armada dari organisasi mitra, tetapkan persetujuan resmi, dan terbitkan Surat Misi Penyaluran.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToMissions}
          style={{
            background: "#ffffff",
            color: "#013220",
            border: "1px solid rgba(1, 50, 32, 0.2)",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AppIcon name="truck" size={16} />
          <span>Pantau Misi Armada Aktif</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* FILTER TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "10px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(1, 50, 32, 0.08)",
        }}
      >
        {[
          { id: "pending", label: "Menunggu Keputusan", count: pendingOffersCount },
          { id: "approved", label: "Disetujui", count: approvedOffersCount },
          { id: "rejected", label: "Ditolak", count: rejectedOffersCount },
          { id: "all", label: "Semua", count: syntheticOffers.length },
        ].map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                border: isActive ? "1px solid #013220" : "1px solid #e2e8f0",
                background: isActive ? "#013220" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {/* OFFERS LIST */}
      {filteredOffers.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(1,50,32,0.06)", color: "#013220", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
            <AppIcon name="handshake" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Penawaran di Kategori Ini
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Belum ada proposal bantuan yang diajukan oleh mitra pada status ini.
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
                  borderRadius: "16px",
                  border: isApproved
                    ? "1px solid #bbf7d0"
                    : isRejected
                    ? "1px solid #fecaca"
                    : "1px solid #fde68a",
                  boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
                  padding: "20px 24px",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          color: "#013220",
                          background: "#f1f5f2",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {o.kode_penawaran}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb",
                          color: isApproved ? "#15803d" : isRejected ? "#991b1b" : "#b45309",
                          border: `1px solid ${isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a"}`,
                        }}
                      >
                        {o.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#013220" }}>
                      {o.organisasi} · Penawaran: {o.jumlah_tawaran}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.82rem", color: "#64748b" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="box" size={13} style={{ color: "#80866e" }} />
                        <span>Komoditas: <strong>{o.jenis_bantuan}</strong></span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="user" size={13} style={{ color: "#80866e" }} />
                        <span>Narahubung: <strong>{o.mitra_name}</strong></span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                        <span>Diajukan: {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleApproveFull(o)}
                          style={{
                            background: "#013220",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <AppIcon name="check" size={14} />
                          <span>Setujui Penuh</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => openPartialModal(o)}
                          style={{
                            background: "#fffbeb",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Setujui Sebagian
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => openRejectModal(o)}
                          style={{
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: "0.84rem", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <AppIcon name="check" size={14} />
                        <span>Alokasi Sah ({o.jumlah_disetujui || o.jumlah_tawaran})</span>
                      </span>
                    )}

                    {isRejected && (
                      <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#fef2f2", color: "#991b1b", fontWeight: 700, fontSize: "0.84rem", border: "1px solid #fecaca" }}>
                        Ditolak Posko
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid (clean 4-column layout) */}
                <div
                  style={{
                    background: "#fbfbf8",
                    borderRadius: "12px",
                    border: "1px solid rgba(1, 50, 32, 0.08)",
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Metode Penyaluran
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.metode_penyaluran === "mandiri"
                        ? "Penyaluran Mandiri (Armada Mitra)"
                        : o.metode_penyaluran === "koordinasi"
                        ? "Penyaluran Terkoordinasi Bersama Posko"
                        : "Serah Terima ke Gudang Posko BPBD"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Dukungan Armada
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.armada_info || "Armada Mitra Siaga"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Waktu Kesiapan
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.waktu_kesiapan || "Siap Berangkat Hari Ini"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Volume Komitmen
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "#15803d" }}>
                      {o.jumlah_tawaran}
                    </strong>
                  </div>
                </div>

                {/* Operational Notes */}
                {o.catatan && (
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      padding: "10px 14px",
                      fontSize: "0.83rem",
                      color: "#334155",
                    }}
                  >
                    <strong style={{ color: "#013220" }}>Rencana Kerja Mitra:</strong> "{o.catatan}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PARTIAL APPROVE / REJECT MODAL */}
      {modalType && activeOffer && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(540px, 95%)", textAlign: "left", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                {modalType === "approvePartial" ? "Setujui Sebagian Komitmen Mitra" : "Tolak Penawaran Mitra"}
              </h2>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "16px" }}>
              Proposal: <strong>{activeOffer.kode_penawaran}</strong> ({activeOffer.organisasi}) · Tawaran: <strong>{activeOffer.jumlah_tawaran}</strong>.
            </p>

            {modalType === "approvePartial" ? (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Volume yang Disetujui ({activeOffer.satuan || "Unit"}):
                </label>
                <input
                  type="number"
                  value={partialAmountInput}
                  onChange={(e) => setPartialAmountInput(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", marginBottom: "14px" }}
                />

                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Catatan Alokasi Posko:
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Disetujui sebagian sesuai batas tampung gudang posko hari ini. Sisa kuota tetap terbuka di bursa."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            ) : (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Alasan Penolakan Resmi (Wajib &amp; Transparan):
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas agar mitra memahami keputusan posko..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalType(null)}
                style={{
                  background: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || (modalType === "reject" && !notesInput.trim())}
                onClick={handleModalSubmit}
                style={{
                  background: modalType === "reject" ? "#991b1b" : "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Memproses..." : modalType === "approvePartial" ? "Konfirmasi Persetujuan Sebagian" : "Simpan Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
