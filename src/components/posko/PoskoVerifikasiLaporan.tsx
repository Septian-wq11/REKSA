import { useState } from "react";
import { CaseRecord } from "../../App";
import { apiService } from "../../services/api";

interface PoskoVerifikasiLaporanProps {
  cases: CaseRecord[];
  onSelectCase: (c: CaseRecord) => void;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
}

export function PoskoVerifikasiLaporan({
  cases,
  onSelectCase,
  onRefresh,
  notify,
}: PoskoVerifikasiLaporanProps) {
  const [tab, setTab] = useState<"all" | "pending" | "clarify" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // Modals
  const [modalAction, setModalAction] = useState<"verify" | "clarify" | "reject" | "further" | null>(null);
  const [priorityChoice, setPriorityChoice] = useState("Kritis");
  const [notesInput, setNotesInput] = useState("");
  const [clarificationCategory, setClarificationCategory] = useState("Foto / Bukti Fisik Buram / Kurang Jelas");
  const [requestAttachment, setRequestAttachment] = useState(true);
  const [rejectionFollowUp, setRejectionFollowUp] = useState("Silakan berkoordinasi dengan pengurus RT/RW setempat atau laporkan langsung ke Posko BPBD terdekat di kantor kelurahan/kecamatan.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterCases = cases.filter((c) => {
    const s = (c.status || "").toLowerCase();
    let matchesTab = true;
    if (tab === "pending") {
      matchesTab = s.includes("verifikasi") || s === "diajukan" || s === "baru";
    } else if (tab === "clarify") {
      matchesTab = s.includes("klarifikasi");
    } else if (tab === "verified") {
      matchesTab = s.includes("terbuka") || s.includes("sebagian") || s.includes("teralokasi") || s.includes("pengiriman") || s.includes("selesai");
    } else if (tab === "rejected") {
      matchesTab = s.includes("tolak");
    }

    if (!matchesTab) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const code = (c.id || "").toLowerCase();
      const item = (c.item || "").toLowerCase();
      const loc = (c.location || "").toLowerCase();
      const name = (c.applicantName || "").toLowerCase();
      return code.includes(q) || item.includes(q) || loc.includes(q) || name.includes(q);
    }
    return true;
  });

  const openActionModal = (c: CaseRecord, action: "verify" | "clarify" | "reject" | "further") => {
    setSelectedCase(c);
    setModalAction(action);
    setPriorityChoice(c.urgency === "Kritis" || c.urgency === "Tinggi" ? c.urgency : "Tinggi");
    setNotesInput("");
    if (action === "clarify") {
      setClarificationCategory("Foto / Bukti Fisik Buram / Kurang Jelas");
      setRequestAttachment(true);
    } else if (action === "reject") {
      setRejectionFollowUp("Silakan berkoordinasi dengan pengurus RT/RW setempat atau laporkan langsung ke Posko BPBD terdekat di kantor kelurahan/kecamatan.");
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      if (modalAction === "verify") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "verify_and_publish",
          priority: priorityChoice,
          catatan: notesInput || "Data terverifikasi sah oleh Koordinator Posko dan dirilis ke Bursa Bantuan.",
        });
        notify?.(`Laporan ${selectedCase.id} diverifikasi & diterbitkan ke Bursa Bantuan Terbuka!`);
      } else if (modalAction === "clarify") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "clarify",
          kategori_klarifikasi: clarificationCategory,
          pertanyaan: notesInput || `Mohon lengkapi perbaikan ${clarificationCategory.toLowerCase()} untuk laporan kebutuhan ini.`,
          meminta_lampiran: requestAttachment,
          catatan: notesInput,
        });
        notify?.(`Permintaan klarifikasi untuk laporan ${selectedCase.id} berhasil dikirim ke masyarakat!`);
      } else if (modalAction === "reject") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "reject",
          alasan: notesInput || "Laporan tidak sesuai fakta lapangan posko.",
          tindak_lanjut: rejectionFollowUp,
        });
        notify?.(`Laporan ${selectedCase.id} ditolak dengan alasan & saran tindak lanjut tersimpan.`);
      } else if (modalAction === "further") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "review_further",
          catatan: notesInput || "Menunggu verifikasi lapangan tim assessment.",
        });
        notify?.(`Laporan ${selectedCase.id} ditandai untuk pemeriksaan lanjutan.`);
      }
      setModalAction(null);
      setSelectedCase(null);
      await onRefresh?.();
    } catch (err: any) {
      notify?.(err?.message || "Gagal memproses tindakan verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace posko-verifikasi-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Modul Koordinator Posko Wilayah</span>
          <h1>Verifikasi &amp; Validasi Laporan Warga</h1>
          <p>
            Periksa keabsahan laporan warga terdampak, tetapkan prioritas akhir, minta klarifikasi, atau rilis kebutuhan ke Bursa Bantuan.
          </p>
        </div>
        <div className="posko-status-live-badge">
          <span className="live-indicator-dot" /> Antrean Posko ({cases.length} Total Laporan)
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", margin: "0 0 24px" }}>
        <div className="cases-pill-filters" style={{ margin: 0 }}>
          <button
            type="button"
            className={`case-filter-btn ${tab === "pending" ? "active" : ""}`}
            onClick={() => setTab("pending")}
          >
            Menunggu Verifikasi ({cases.filter((c) => (c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan").length})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "clarify" ? "active" : ""}`}
            onClick={() => setTab("clarify")}
          >
            Perlu Klarifikasi ({cases.filter((c) => (c.status || "").toLowerCase().includes("klarifikasi")).length})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "verified" ? "active" : ""}`}
            onClick={() => setTab("verified")}
          >
            Terverifikasi / Terbuka ({cases.filter((c) => (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian")).length})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "rejected" ? "active" : ""}`}
            onClick={() => setTab("rejected")}
          >
            Ditolak ({cases.filter((c) => (c.status || "").toLowerCase().includes("tolak")).length})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            Semua ({cases.length})
          </button>
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Cari kode kasus, warga, komoditas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid var(--line)",
              background: "#fff",
              fontSize: "0.9rem",
            }}
          />
        </div>
      </div>

      {/* LIST OF CASES */}
      {filterCases.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center", margin: "20px 0" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "20px" }}>
            ✓
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--forest)" }}>Tidak Ada Laporan di Antrean Ini</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
            Semua laporan telah diproses atau belum ada data yang sesuai filter pilihan Anda.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filterCases.map((c) => {
            const isPending = (c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan";
            const isClarify = (c.status || "").toLowerCase().includes("klarifikasi");
            const isRejected = (c.status || "").toLowerCase().includes("tolak");
            const isVerified = (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian");

            return (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  border: isPending ? "1.5px solid rgba(217, 119, 6, 0.4)" : "1px solid var(--line)",
                  borderRadius: "18px",
                  padding: "20px 24px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--forest)", fontFamily: "monospace" }}>
                        {c.id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: c.urgency === "Kritis" ? "rgba(239, 68, 68, 0.15)" : c.urgency === "Tinggi" ? "rgba(245, 158, 11, 0.15)" : "rgba(100, 116, 139, 0.15)",
                          color: c.urgency === "Kritis" ? "#b91c1c" : c.urgency === "Tinggi" ? "#d97706" : "#475569",
                        }}
                      >
                        Prioritas: {c.urgency}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: isVerified ? "rgba(16, 185, 129, 0.15)" : isRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isVerified ? "#047857" : isRejected ? "#b91c1c" : "#b45309",
                        }}
                      >
                        Status: {c.status}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 6px", fontSize: "1.15rem", color: "var(--ink)", fontWeight: 700 }}>
                      Kebutuhan {c.item} · {c.qty}
                    </h3>
                    <div style={{ fontSize: "0.86rem", color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                      <span>📍 {c.location || "Wilayah Posko"}</span>
                      <span>👨‍👩‍👧‍👦 {c.kk}</span>
                      <span>👤 Pelapor: <b>{c.applicantName || "Warga Terdampak"}</b> {c.applicantPhone ? `(${c.applicantPhone})` : ""}</span>
                      <span>📅 {c.date || "Baru saja"}</span>
                    </div>
                  </div>

                  {/* Actions for this item */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem" }}
                      onClick={() => onSelectCase(c)}
                    >
                      Lihat Rincian
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: "8px 16px", minHeight: "38px", fontSize: "0.85rem", background: "#047857" }}
                          onClick={() => openActionModal(c, "verify")}
                        >
                          ✓ Verifikasi &amp; Rilis
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem", borderColor: "#d97706", color: "#b45309" }}
                          onClick={() => openActionModal(c, "clarify")}
                        >
                          Minta Klarifikasi
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "8px 14px", minHeight: "38px", fontSize: "0.85rem", borderColor: "#ef4444", color: "#dc2626" }}
                          onClick={() => openActionModal(c, "reject")}
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {isClarify && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "8px 16px", minHeight: "38px", fontSize: "0.85rem", background: "#047857" }}
                        onClick={() => openActionModal(c, "verify")}
                      >
                        ✓ Selesai Klarifikasi &amp; Rilis
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority recommendation box per Bab 5.2 Tahap 3 */}
                {c.priorityRationale && (
                  <div
                    style={{
                      background: "rgba(1, 50, 32, 0.04)",
                      borderLeft: "4px solid var(--forest)",
                      borderRadius: "0 10px 10px 0",
                      padding: "10px 14px",
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    <strong>💡 Rekomendasi Sistem Bantuan Keputusan:</strong> {c.priorityRationale}
                  </div>
                )}

                {/* Description or notes */}
                {c.notes && (
                  <div style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.5, background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                    <b>Catatan Pelapor:</b> {c.notes}
                  </div>
                )}

                {/* Clarification info & Citizen Answer Display */}
                {c.pertanyaanKlarifikasi && (
                  <div style={{ fontSize: "0.86rem", color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", padding: "12px 14px", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#b45309" }}>
                        📌 Klarifikasi Posko: {c.kategoriKlarifikasi || "Kelengkapan Informasi"}
                      </span>
                      {c.memintaLampiran && (
                        <span style={{ fontSize: "0.75rem", background: "#d97706", color: "#fff", padding: "2px 8px", borderRadius: "8px", fontWeight: 600 }}>
                          Wajib Lampiran Baru
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: c.jawabanKlarifikasi ? "8px" : 0 }}>
                      <b>Pertanyaan Posko:</b> "{c.pertanyaanKlarifikasi}"
                    </div>

                    {c.jawabanKlarifikasi ? (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #f59e0b", background: "#fffbeb", padding: "8px 10px", borderRadius: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "0.82rem", marginBottom: "3px" }}>
                          ✓ Jawaban Pelapor Diterima (Perlu Peninjauan Ulang):
                        </div>
                        <div style={{ color: "#1e293b", fontWeight: 500 }}>
                          "{c.jawabanKlarifikasi}"
                        </div>
                        {c.fotoKlarifikasi && (
                          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.78rem", color: "#047857", fontWeight: 600 }}>📷 Lampiran Baru:</span>
                            <a href={c.fotoKlarifikasi} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#0284c7", textDecoration: "underline", fontWeight: 600 }}>
                              Lihat Foto/Dokumen Klarifikasi
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "#b45309", fontStyle: "italic" }}>
                        ⏳ Menunggu tanggapan &amp; kelengkapan data dari pelapor.
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {isRejected && c.alasanPenolakan && (
                  <div style={{ fontSize: "0.86rem", color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", padding: "12px 14px", borderRadius: "10px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>❌ Alasan Penolakan: {c.alasanPenolakan}</div>
                    {c.tindakLanjutPenolakan && (
                      <div style={{ fontSize: "0.82rem", color: "#7f1d1d", marginTop: "4px" }}>
                        <b>Saran Tindak Lanjut:</b> {c.tindakLanjutPenolakan}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ACTION MODAL */}
      {modalAction && selectedCase && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(560px, 95%)", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.3rem", color: "var(--forest)", marginBottom: "8px" }}>
              {modalAction === "verify" && `Verifikasi Laporan ${selectedCase.id}`}
              {modalAction === "clarify" && `Minta Klarifikasi untuk ${selectedCase.id}`}
              {modalAction === "reject" && `Tolak Laporan ${selectedCase.id}`}
              {modalAction === "further" && `Pemeriksaan Lanjutan ${selectedCase.id}`}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "18px" }}>
              Komoditas: <b>{selectedCase.item} ({selectedCase.qty})</b> untuk {selectedCase.kk} di {selectedCase.location}.
            </p>

            {modalAction === "verify" && (
              <>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Konfirmasi Prioritas Penanganan:
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  {["Kritis", "Tinggi", "Sedang"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityChoice(p)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: priorityChoice === p ? "2px solid var(--forest)" : "1px solid var(--line)",
                        background: priorityChoice === p ? "rgba(1, 50, 32, 0.08)" : "#fff",
                        fontWeight: priorityChoice === p ? 700 : 500,
                        color: priorityChoice === p ? "var(--forest)" : "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Catatan Verifikasi Posko (Akan disimpan di database &amp; Bursa):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Kebutuhan air bersih mendesak, divalidasi RT/RW setempat, dirilis ke Bursa Bantuan Terbuka."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "20px" }}
                />
              </>
            )}

            {modalAction === "clarify" && (
              <>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Jenis Informasi yang Perlu Diperbaiki:
                </label>
                <select
                  value={clarificationCategory}
                  onChange={(e) => setClarificationCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "14px", background: "#fff" }}
                >
                  <option value="Foto / Bukti Fisik Buram / Kurang Jelas">Foto / Bukti Fisik Buram atau Kurang Jelas</option>
                  <option value="Rincian Jumlah Jiwa Rentan & KK Terdampak">Rincian Jumlah Jiwa Rentan (Balita/Lansia) &amp; KK</option>
                  <option value="Titik Koordinat Lokasi & Akses Distribusi">Titik Koordinat Lokasi &amp; Akses Jalan Tenda</option>
                  <option value="Spesifikasi & Volume Permintaan Logistik">Spesifikasi &amp; Volume Permintaan Kebutuhan</option>
                  <option value="Kelengkapan Informasi Lainnya">Kelengkapan Informasi Lainnya</option>
                </select>

                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Alasan &amp; Pertanyaan Jelas untuk Masyarakat:
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan pertanyaan spesifik, misalnya: 'Foto kondisi tandon air buram, mohon unggah ulang foto yang jelas' atau 'Mohon rincikan jumlah balita dan lansia di pos pengungsian ini.'"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "12px" }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "#1e293b", fontWeight: 600, cursor: "pointer", marginBottom: "16px", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    checked={requestAttachment}
                    onChange={(e) => setRequestAttachment(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--forest)" }}
                  />
                  <span>Meminta masyarakat mengunggah foto atau dokumen bukti tambahan</span>
                </label>

                <div style={{ fontSize: "0.8rem", color: "#64748b", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px", marginBottom: "16px" }}>
                  ℹ️ Permintaan klarifikasi ini akan terkirim langsung ke masyarakat pemilik laporan. Berkas lama tetap tersimpan.
                </div>
              </>
            )}

            {modalAction === "reject" && (
              <>
                <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: "0.84rem", color: "#991b1b", marginBottom: "14px" }}>
                  ⚠️ <b>Kebijakan Posko:</b> Jika masalah data masih dapat diperbaiki atau dilengkapi oleh masyarakat, gunakan opsi <b>Minta Klarifikasi</b> alih-alih menolak.
                </div>

                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Alasan Spesifik Penolakan (Wajib &amp; Transparan):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Lokasi berada di luar wilayah zona terdampak bencana / Data permohonan duplikat dengan laporan warga di tenda yang sama."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "14px" }}
                />

                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
                  Informasi &amp; Rekomendasi Tindak Lanjut untuk Masyarakat:
                </label>
                <textarea
                  rows={2}
                  value={rejectionFollowUp}
                  onChange={(e) => setRejectionFollowUp(e.target.value)}
                  placeholder="Saran rujukan posko alternatif atau kontak RT/RW setempat..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "18px" }}
                />
              </>
            )}

            <div className="modal-actions" style={{ marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={() => setModalAction(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting || (modalAction === "reject" && !notesInput.trim()) || (modalAction === "clarify" && !notesInput.trim())}
                onClick={handleExecuteAction}
                style={{
                  background: modalAction === "reject" ? "#dc2626" : "var(--forest)",
                }}
              >
                {isSubmitting ? "Menyimpan..." : modalAction === "verify" ? "Konfirmasi & Rilis ke Bursa" : modalAction === "clarify" ? "Kirim Permintaan Klarifikasi" : "Simpan Penolakan Resmi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
