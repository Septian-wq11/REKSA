import { useState } from "react";
import { CaseRecord } from "../../App";
import { BursaItem, PenawaranItem } from "../../services/api";
import { AppIcon } from "../common/Icons";

interface PoskoKebutuhanBursaProps {
  cases: CaseRecord[];
  bursaList: BursaItem[];
  penawaranList: PenawaranItem[];
  onNavigateToOffers: () => void;
  onSelectCase: (c: CaseRecord) => void;
}

export function PoskoKebutuhanBursa({
  cases,
  bursaList,
  penawaranList,
  onNavigateToOffers,
  onSelectCase,
}: PoskoKebutuhanBursaProps) {
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Filter verified cases (either in bursaList or status is Kebutuhan Terbuka / Sebagian / Teralokasi / Selesai)
  const verifiedCases = cases.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return (
      s.includes("terbuka") ||
      s.includes("sebagian") ||
      s.includes("teralokasi") ||
      s.includes("pengiriman") ||
      s.includes("selesai")
    );
  });

  const categories = ["Semua", ...Array.from(new Set(verifiedCases.map((c) => c.item)))];

  const displayedItems = verifiedCases.filter((c) => {
    if (filterCategory !== "Semua" && c.item !== filterCategory) return false;
    if (filterStatus !== "Semua") {
      const s = (c.status || "").toLowerCase();
      if (filterStatus === "Terbuka" && !s.includes("terbuka")) return false;
      if (filterStatus === "Sebagian Terpenuhi" && !s.includes("sebagian")) return false;
      if (filterStatus === "Teralokasi Penuh" && !s.includes("teralokasi")) return false;
      if (filterStatus === "Selesai" && !s.includes("selesai")) return false;
    }
    return true;
  });

  const pendingOffersCount = penawaranList.filter((p) => p.status === "Diajukan").length;

  return (
    <main className="workspace posko-bursa-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            MANAJEMEN LOGISTIK & PEMENUHAN POSKO
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Kebutuhan &amp; Bursa Bantuan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Pantau kebutuhan warga yang telah diverifikasi, pantau neraca kekurangan alokasi secara transparan, dan kelola penugasan armada mitra.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToOffers}
          style={{
            background: "#013220",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "background 0.2s ease",
          }}
        >
          <AppIcon name="handshake" size={16} />
          <span>Lihat Penawaran Mitra ({pendingOffersCount} Menunggu)</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* REFINED STAT METRIC CARDS (Clean, Enterprise, No generic AI emoji boxes) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Kebutuhan Sah
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(128, 134, 110, 0.12)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {verifiedCases.length} Kasus
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Terverifikasi Posko Wilayah
          </small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Alokasi Sah Aktif
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="truck" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {penawaranList.filter((p) => p.status === "Disetujui").length} Komitmen
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Surat Misi Penyaluran Terbit
          </small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#b45309", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Kekurangan Terbuka
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center" }}>
              <AppIcon name="alert" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#9a3412", lineHeight: 1.1 }}>
            {verifiedCases.filter((c) => c.status === "Kebutuhan Terbuka" || c.status === "Sebagian Terpenuhi").length} Item
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Terbuka di Bursa bagi Mitra
          </small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#166534", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Penerimaan Tuntas
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#166534", lineHeight: 1.1 }}>
            {verifiedCases.filter((c) => c.status === "Selesai").length} Kasus
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            100% Selesai &amp; Berita Acara Sah
          </small>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          background: "#ffffff",
          padding: "12px 18px",
          borderRadius: "12px",
          border: "1px solid rgba(1, 50, 32, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "#80866e", fontWeight: 700, marginRight: "6px", textTransform: "uppercase" }}>Status:</span>
          {["Semua", "Terbuka", "Sebagian Terpenuhi", "Teralokasi Penuh", "Selesai"].map((s) => {
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "6px 14px",
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
                {s}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "#80866e", fontWeight: 700, textTransform: "uppercase" }}>Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.84rem",
              color: "#1e293b",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CARDS LIST (Clean layout without crammed stacked text) */}
      {displayedItems.length === 0 ? (
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
            <AppIcon name="box" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Kebutuhan Terbuka
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Semua kebutuhan telah selesai atau belum ada laporan yang sesuai dengan filter ini.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {displayedItems.map((c) => {
            const targetNum = parseInt(c.qty.replace(/[^0-9]/g, "")) || 1000;
            const unit = c.qty.replace(/[0-9.,]/g, "").trim() || "Unit";

            // Find matching offers
            const approvedOffers = penawaranList.filter(
              (p) => p.kebutuhan_id === parseInt(c.id.replace(/[^0-9]/g, "")) && p.status === "Disetujui"
            );
            const allocatedFromOffers = approvedOffers.reduce((sum, p) => sum + (p.volume_disetujui_angka || 0), 0);
            const allocatedNum =
              allocatedFromOffers > 0
                ? allocatedFromOffers
                : c.status === "Teralokasi Penuh" || c.status === "Selesai"
                ? targetNum
                : 0;

            const shortageAlloc = Math.max(0, targetNum - allocatedNum);
            const isFinished = c.status === "Selesai";
            const pctAlloc = Math.min(100, Math.round((allocatedNum / targetNum) * 100));

            // Recommendation advice text
            let adviceNote = "";
            let adviceTone: "teal" | "amber" | "green" = "teal";

            if (allocatedNum === 0) {
              adviceNote = "Kebutuhan sah belum memiliki komitmen mitra: Siap diklaim oleh mitra bantuan di Bursa Kemitraan.";
              adviceTone = "amber";
            } else if (allocatedNum < targetNum) {
              adviceNote = `Alokasi tahap 1 berjalan (${allocatedNum} ${unit}). Sisa kekurangan ${shortageAlloc} ${unit} tetap terbuka di Bursa.`;
              adviceTone = "amber";
            } else if (!isFinished) {
              adviceNote = "Alokasi penuh: Armada mitra sedang menjalankan penyaluran. Pantau serah terima fisik di menu Distribusi.";
              adviceTone = "teal";
            } else {
              adviceNote = "Seluruh kebutuhan terkonfirmasi tuntas diterima fisik oleh warga dan posko (BAST Sah).";
              adviceTone = "green";
            }

            return (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isFinished
                    ? "1px solid #bbf7d0"
                    : shortageAlloc > 0
                    ? "1px solid #fde68a"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                  boxShadow: "0 2px 10px rgba(1, 50, 32, 0.03)",
                  padding: "20px 24px",
                  transition: "box-shadow 0.2s ease",
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
                          background: isFinished ? "#f0fdf4" : shortageAlloc > 0 ? "#eff6ff" : "#f0fdf4",
                          color: isFinished ? "#15803d" : shortageAlloc > 0 ? "#1d4ed8" : "#15803d",
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
                        <span>{c.location}</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="users" size={13} style={{ color: "#80866e" }} />
                        <span>{c.kk} Terdampak</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                        <span>{c.date || "10 Okt 2026"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                      <span>Detail Kasus</span>
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateToOffers}
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
                      <AppIcon name="handshake" size={14} />
                      <span>Kelola Alokasi Mitra</span>
                      <AppIcon name="arrow-right" size={13} />
                    </button>
                  </div>
                </div>

                {/* UNIFIED BALANCE STRIP (Clean & spacious, not crowded) */}
                <div
                  style={{
                    background: "#fbfbf8",
                    borderRadius: "12px",
                    border: "1px solid rgba(1, 50, 32, 0.08)",
                    padding: "14px 18px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                        Target Kebutuhan
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#013220" }}>{c.qty}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                        Alokasi Sah Aktif
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: allocatedNum > 0 ? "#15803d" : "#64748b" }}>
                        {allocatedNum} {unit}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                        Sisa Defisit Terbuka
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: shortageAlloc > 0 ? "#b45309" : "#15803d" }}>
                        {shortageAlloc > 0 ? `${shortageAlloc} ${unit}` : "0 (Tuntas)"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                        Status Pemenuhan
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: pctAlloc >= 100 ? "#15803d" : "#013220",
                        }}
                      >
                        {pctAlloc}% Terpenuhi
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", height: "7px", background: "rgba(1, 50, 32, 0.08)", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pctAlloc}%`,
                        height: "100%",
                        background: pctAlloc >= 100 ? "#15803d" : "#013220",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Subtitle Advisory Callout */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.82rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: adviceTone === "green" ? "#f0fdf4" : adviceTone === "amber" ? "#fffbeb" : "#f1f5f2",
                    border: `1px solid ${adviceTone === "green" ? "#bbf7d0" : adviceTone === "amber" ? "#fde68a" : "#cbd5e1"}`,
                    color: adviceTone === "green" ? "#166534" : adviceTone === "amber" ? "#92400e" : "#013220",
                  }}
                >
                  <AppIcon name={adviceTone === "green" ? "check" : adviceTone === "amber" ? "alert" : "info"} size={14} />
                  <span>
                    <strong>Rekomendasi Tindakan:</strong> {adviceNote}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
