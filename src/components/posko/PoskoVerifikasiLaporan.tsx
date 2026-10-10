import { useState } from "react";
import { CaseRecord } from "../../App";
import { apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

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

  const pendingCount = cases.filter((c) => (c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan" || c.status === "Baru").length;
  const clarifyCount = cases.filter((c) => (c.status || "").toLowerCase().includes("klarifikasi")).length;
  const verifiedCount = cases.filter((c) => (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian") || (c.status || "").toLowerCase().includes("teralokasi") || (c.status || "").toLowerCase().includes("selesai")).length;
  const rejectedCount = cases.filter((c) => (c.status || "").toLowerCase().includes("tolak")).length;

  return (
    <main className="workspace posko-verifikasi-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            MODUL KOORDINATOR POSKO WILAYAH
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Verifikasi &amp; Validasi Laporan Warga
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Periksa keabsahan permohonan warga, tetapkan prioritas kedaruratan, minta klarifikasi foto atau data fisik, dan rilis kuota sah ke Bursa Kemitraan.
          </p>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.12)", padding: "8px 14px", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 700, color: "#013220", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#15803d" }} />
          <span>Antrean Posko ({cases.length} Total Laporan)</span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "12px 18px",
          borderRadius: "14px",
          border: "1px solid rgba(1, 50, 32, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { id: "pending", label: "Menunggu Verifikasi", count: pendingCount },
            { id: "clarify", label: "Perlu Klarifikasi", count: clarifyCount },
            { id: "verified", label: "Terverifikasi / Terbuka", count: verifiedCount },
            { id: "rejected", label: "Ditolak", count: rejectedCount },
            { id: "all", label: "Semua", count: cases.length },
          ].map((tabItem) => {
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setTab(tabItem.id as any)}
                style={{
                  padding: "7px 14px",
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
                {tabItem.label} ({tabItem.count})
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <div style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            <AppIcon name="search" size={15} />
          </div>
          <input
            type="text"
            placeholder="Cari kode kasus, warga, komoditas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.84rem",
              color: "#1e293b",
            }}
          />
        </div>
      </div>

      {/* CASES QUEUE LIST */}
      {filterCases.length === 0 ? (
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
            <AppIcon name="file" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Laporan di Antrean Ini
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Semua laporan telah diproses atau belum ada data yang sesuai dengan filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filterCases.map((c) => {
            const isPending = (c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan" || c.status === "Baru";
            const isClarify = (c.status || "").toLowerCase().includes("klarifikasi");
            const isRejected = (c.status || "").toLowerCase().includes("tolak");
            const isVerified = (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian") || (c.status || "").toLowerCase().includes("teralokasi") || (c.status || "").toLowerCase().includes("selesai");

            return (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isRejected
                    ? "1px solid #fecaca"
                    : isClarify
                    ? "1px solid #fde68a"
                    : isVerified
                    ? "1px solid #bbf7d0"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                  boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
                  padding: "20px 24px",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
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
                        {c.id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background:
                            c.urgency === "Kritis"
                              ? "#fef2f2"
                              : c.urgency === "Tinggi"
                              ? "#fffbeb"
                              : "#f8fafc",
                          color:
                            c.urgency === "Kritis"
                              ? "#991b1b"
                              : c.urgency === "Tinggi"
                              ? "#b45309"
                              : "#475569",
                          border: `1px solid ${
                            c.urgency === "Kritis"
                              ? "#fecaca"
                              : c.urgency === "Tinggi"
                              ? "#fde68a"
                              : "#e2e8f0"
                          }`,
                        }}
                      >
                        Prioritas {c.urgency}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: isVerified
                            ? "#f0fdf4"
                            : isRejected
                            ? "#fef2f2"
                            : isClarify
                            ? "#fffbeb"
                            : "#eff6ff",
                          color: isVerified
                            ? "#15803d"
                            : isRejected
                            ? "#991b1b"
                            : isClarify
                            ? "#b45309"
                            : "#1d4ed8",
                        }}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#013220" }}>
                      Kebutuhan {c.item} · {c.qty}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.82rem", color: "#64748b" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                        <span>{c.location || "Wilayah Posko"}</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="users" size={13} style={{ color: "#80866e" }} />
                        <span>{c.kk}</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="user" size={13} style={{ color: "#80866e" }} />
                        <span>Pelapor: <strong>{c.applicantName || "Warga Terdampak"}</strong> {c.applicantPhone ? `(${c.applicantPhone})` : ""}</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                        <span>{c.date || "Baru saja"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action button cluster */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => onSelectCase(c)}
                      style={{
                        background: "#ffffff",
                        color: "#013220",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AppIcon name="file" size={14} />
                      <span>Buka Kasus</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "verify")}
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
                          <span>Verifikasi &amp; Rilis</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "clarify")}
                          style={{
                            background: "#fffbeb",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <AppIcon name="alert" size={14} />
                          <span>Minta Klarifikasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "reject")}
                          style={{
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <AppIcon name="x" size={14} />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {isClarify && (
                      <button
                        type="button"
                        onClick={() => openActionModal(c, "verify")}
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
                        <span>Selesai Klarifikasi &amp; Rilis</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority recommendation box */}
                {c.priorityRationale && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      marginBottom: "10px",
                      fontSize: "0.84rem",
                      color: "#166534",
                      lineHeight: 1.45,
                    }}
                  >
                    <div style={{ marginTop: "2px" }}><AppIcon name="shield" size={14} /></div>
                    <div>
                      <strong>Rekomendasi Sistem Validasi:</strong> {c.priorityRationale}
                    </div>
                  </div>
                )}

                {/* Description or notes */}
                {c.notes && (
                  <div
                    style={{
                      background: "#fbfbf8",
                      borderRadius: "10px",
                      border: "1px solid rgba(1, 50, 32, 0.08)",
                      padding: "10px 14px",
                      marginBottom: "10px",
                      fontSize: "0.84rem",
                      color: "#334155",
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ color: "#013220" }}>Catatan Pelapor:</strong> {c.notes}
                  </div>
                )}

                {/* Clarification info & Citizen Answer Display */}
                {c.pertanyaanKlarifikasi && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "10px",
                      fontSize: "0.84rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#b45309" }}>
                        Klarifikasi Posko: {c.kategoriKlarifikasi || "Kelengkapan Informasi"}
                      </span>
                      {c.memintaLampiran && (
                        <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "8px", fontWeight: 600 }}>
                          Wajib Lampiran Tambahan
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#78350f", marginBottom: c.jawabanKlarifikasi ? "8px" : 0 }}>
                      <strong>Pertanyaan Posko:</strong> "{c.pertanyaanKlarifikasi}"
                    </div>

                    {c.jawabanKlarifikasi ? (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #fde68a", background: "#ffffff", padding: "10px 12px", borderRadius: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "0.82rem", marginBottom: "4px" }}>
                          <AppIcon name="check" size={13} />
                          <span>Jawaban Warga Diterima (Siap Divalidasi Ulang):</span>
                        </div>
                        <div style={{ color: "#013220", fontWeight: 500 }}>
                          "{c.jawabanKlarifikasi}"
                        </div>
                        {c.fotoKlarifikasi && (
                          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 600 }}>Lampiran Dokumen Baru:</span>
                            <a href={c.fotoKlarifikasi} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#0f766e", textDecoration: "underline", fontWeight: 600 }}>
                              Lihat Foto/Dokumen Klarifikasi
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: "6px", fontSize: "0.82rem", color: "#b45309", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                        <AppIcon name="clock" size={13} />
                        <span>Menunggu tanggapan &amp; kelengkapan data dari pelapor.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {isRejected && c.alasanPenolakan && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "0.84rem",
                      color: "#991b1b",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>Alasan Penolakan: {c.alasanPenolakan}</div>
                    {c.tindakLanjutPenolakan && (
                      <div style={{ fontSize: "0.82rem", color: "#7f1d1d", marginTop: "4px" }}>
                        <strong>Saran Tindak Lanjut:</strong> {c.tindakLanjutPenolakan}
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
          <div className="modal" style={{ width: "min(560px, 95%)", textAlign: "left", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                {modalAction === "verify" && `Verifikasi Laporan ${selectedCase.id}`}
                {modalAction === "clarify" && `Minta Klarifikasi untuk ${selectedCase.id}`}
                {modalAction === "reject" && `Tolak Laporan ${selectedCase.id}`}
                {modalAction === "further" && `Pemeriksaan Lanjutan ${selectedCase.id}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "18px" }}>
              Komoditas: <strong>{selectedCase.item} ({selectedCase.qty})</strong> untuk {selectedCase.kk} di {selectedCase.location}.
            </p>

            {modalAction === "verify" && (
              <>
                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "8px" }}>
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
                        borderRadius: "10px",
                        border: priorityChoice === p ? "2px solid #013220" : "1px solid #cbd5e1",
                        background: priorityChoice === p ? "#f0fdf4" : "#ffffff",
                        fontWeight: priorityChoice === p ? 700 : 500,
                        color: priorityChoice === p ? "#013220" : "#64748b",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Catatan Verifikasi Posko (Disimpan di riwayat &amp; Bursa):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Kebutuhan divalidasi sah oleh Koordinator Posko dan dirilis ke Bursa Bantuan Terbuka."
                  className="reksa-textarea-field"
                  style={{ marginBottom: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </>
            )}

            {modalAction === "clarify" && (
              <>
                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Jenis Informasi yang Perlu Diperbaiki:
                </label>
                <select
                  value={clarificationCategory}
                  onChange={(e) => setClarificationCategory(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "14px" }}
                >
                  <option value="Foto / Bukti Fisik Buram / Kurang Jelas">Foto / Bukti Fisik Buram atau Kurang Jelas</option>
                  <option value="Rincian Jumlah Jiwa Rentan & KK Terdampak">Rincian Jumlah Jiwa Rentan (Balita/Lansia) &amp; KK</option>
                  <option value="Titik Koordinat Lokasi & Akses Distribusi">Titik Koordinat Lokasi &amp; Akses Jalan Tenda</option>
                  <option value="Spesifikasi & Volume Permintaan Logistik">Spesifikasi &amp; Volume Permintaan Kebutuhan</option>
                  <option value="Kelengkapan Informasi Lainnya">Kelengkapan Informasi Lainnya</option>
                </select>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Pertanyaan Jelas untuk Warga:
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan pertanyaan spesifik, misalnya: 'Foto kondisi tandon air buram, mohon unggah ulang foto yang jelas' atau 'Mohon rincikan jumlah balita dan lansia di pos pengungsian ini.'"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "12px" }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "#013220", fontWeight: 600, cursor: "pointer", marginBottom: "16px", background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    checked={requestAttachment}
                    onChange={(e) => setRequestAttachment(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#013220" }}
                  />
                  <span>Meminta warga mengunggah foto atau dokumen bukti tambahan</span>
                </label>
              </>
            )}

            {modalAction === "reject" && (
              <>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.84rem", color: "#991b1b" }}>
                  <strong>Kebijakan Posko:</strong> Jika masalah data masih dapat diperbaiki oleh warga, gunakan opsi <strong>Minta Klarifikasi</strong> alih-alih menolak.
                </div>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Alasan Spesifik Penolakan (Wajib &amp; Transparan):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Lokasi berada di luar wilayah zona bencana / Data permohonan duplikat dengan laporan warga di tenda yang sama."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "14px" }}
                />

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Informasi &amp; Rekomendasi Tindak Lanjut untuk Warga:
                </label>
                <textarea
                  rows={2}
                  value={rejectionFollowUp}
                  onChange={(e) => setRejectionFollowUp(e.target.value)}
                  placeholder="Saran rujukan posko alternatif atau kontak RT/RW setempat..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalAction(null)}
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
                disabled={isSubmitting || (modalAction === "reject" && !notesInput.trim()) || (modalAction === "clarify" && !notesInput.trim())}
                onClick={handleExecuteAction}
                style={{
                  background: modalAction === "reject" ? "#991b1b" : "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
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
