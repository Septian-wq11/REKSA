import { useState } from "react";
import { CaseRecord } from "../../App";
import { BursaItem, PenawaranItem } from "../../services/api";

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
    return s.includes("terbuka") || s.includes("sebagian") || s.includes("teralokasi") || s.includes("pengiriman") || s.includes("selesai");
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

  // Calculate totals across verified items for dashboard banner
  let totalKebutuhanSum = 0;
  let totalAlokasiSum = 0;
  let totalKekuranganAlokasiSum = 0;

  verifiedCases.forEach((c) => {
    const targetNum = parseInt(c.qty.replace(/[^0-9]/g, "")) || 1000;
    // Cek penawaran yang sudah disetujui untuk case ini
    const approvedOffers = penawaranList.filter((p) => p.kebutuhan_id === parseInt(c.id.replace(/[^0-9]/g, "")) && p.status === "Disetujui");
    const allocatedFromOffers = approvedOffers.reduce((sum, p) => sum + (p.volume_disetujui_angka || 0), 0);
    const allocatedNum = allocatedFromOffers > 0 ? allocatedFromOffers : (c.status === "Teralokasi Penuh" || c.status === "Selesai" ? targetNum : 0);

    const shortage = Math.max(0, targetNum - allocatedNum);

    totalKebutuhanSum += targetNum;
    totalAlokasiSum += allocatedNum;
    totalKekuranganAlokasiSum += shortage;
  });

  return (
    <main className="workspace posko-bursa-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Mesin Kekurangan &amp; Pemenuhan (Bab 7 PRD)</span>
          <h1>Kebutuhan &amp; Bursa Bantuan</h1>
          <p>
            Pantau kebutuhan terverifikasi, hitung kekurangan alokasi secara riil, dan koordinasikan alokasi bantuan dengan Mitra Bantuan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNavigateToOffers}
          style={{ background: "var(--forest)" }}
        >
          Lihat Penawaran Mitra ({penawaranList.filter((p) => p.status === "Diajukan").length} Menunggu) →
        </button>
      </div>

      {/* SHORTAGE ENGINE OVERVIEW CARDS (Bab 7.1) */}
      <div className="posko-workload-grid" style={{ marginBottom: "28px" }}>
        <div className="posko-workload-card warning">
          <div className="workload-card-top">
            <span className="workload-tag">Kebutuhan Terverifikasi</span>
            <div className="workload-icon">📦</div>
          </div>
          <strong className="workload-number">{verifiedCases.length} Kasus</strong>
          <small className="workload-sub">Daftar Kebutuhan Sah Posko</small>
        </div>

        <div className="posko-workload-card info">
          <div className="workload-card-top">
            <span className="workload-tag">Alokasi Aktif yang Sah</span>
            <div className="workload-icon">🚚</div>
          </div>
          <strong className="workload-number">
            {penawaranList.filter((p) => p.status === "Disetujui").length} Penawaran
          </strong>
          <small className="workload-sub">Misi Penyaluran Resmi Aktif</small>
        </div>

        <div className="posko-workload-card danger">
          <div className="workload-card-top">
            <span className="workload-tag">Kekurangan Alokasi</span>
            <div className="workload-icon">⚠️</div>
          </div>
          <strong className="workload-number">
            {verifiedCases.filter((c) => c.status === "Kebutuhan Terbuka" || c.status === "Sebagian Terpenuhi").length} Item
          </strong>
          <small className="workload-sub">Terbuka untuk Mitra Bantuan</small>
        </div>

        <div className="posko-workload-card success">
          <div className="workload-card-top">
            <span className="workload-tag">Penerimaan Tuntas</span>
            <div className="workload-icon">✅</div>
          </div>
          <strong className="workload-number">
            {verifiedCases.filter((c) => c.status === "Selesai").length} Kasus
          </strong>
          <small className="workload-sub">100% Terkonfirmasi Diterima</small>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="cases-pill-filters" style={{ margin: 0 }}>
          {["Semua", "Terbuka", "Sebagian Terpenuhi", "Teralokasi Penuh", "Selesai"].map((s) => (
            <button
              key={s}
              type="button"
              className={`case-filter-btn ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "#fff", fontSize: "0.88rem" }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LIST OF VERIFIED NEEDS & SHORTAGES */}
      {displayedItems.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Tidak Ada Kebutuhan Terbuka</h3>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Semua kebutuhan telah selesai atau belum ada laporan yang diverifikasi posko.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {displayedItems.map((c) => {
            const targetNum = parseInt(c.qty.replace(/[^0-9]/g, "")) || 1000;
            const unit = c.qty.replace(/[0-9.,]/g, "").trim() || "Unit";

            // Find matching offers
            const approvedOffers = penawaranList.filter((p) => p.kebutuhan_id === parseInt(c.id.replace(/[^0-9]/g, "")) && p.status === "Disetujui");
            const allocatedFromOffers = approvedOffers.reduce((sum, p) => sum + (p.volume_disetujui_angka || 0), 0);
            const allocatedNum = allocatedFromOffers > 0 ? allocatedFromOffers : (c.status === "Teralokasi Penuh" || c.status === "Selesai" ? targetNum : 0);

            const shortageAlloc = Math.max(0, targetNum - allocatedNum);
            const receivedNum = c.status === "Selesai" ? targetNum : 0;
            const shortageReceipt = Math.max(0, targetNum - receivedNum);

            const pctAlloc = Math.min(100, Math.round((allocatedNum / targetNum) * 100));

            // Rekomendasi tindakan berikutnya per Bab 7.4
            let recommendationText = "";
            let recommendationBadge = "info";

            if (allocatedNum === 0) {
              recommendationText = "Kebutuhan valid tetapi belum dialokasikan: Tinjau stok internal atau buka penawaran mitra di Bursa.";
              recommendationBadge = "danger";
            } else if (allocatedNum < targetNum) {
              recommendationText = `Alokasikan sisa kekurangan ${shortageAlloc} ${unit} kepada penawaran mitra lainnya.`;
              recommendationBadge = "warning";
            } else if (receivedNum < targetNum) {
              recommendationText = "Alokasi penuh: Pantau armada mitra di menu Distribusi sampai serah terima selesai.";
              recommendationBadge = "info";
            } else {
              recommendationText = "Seluruh kebutuhan terkonfirmasi terpenuhi: Kasus resmi selesai tuntas.";
              recommendationBadge = "success";
            }

            return (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "18px",
                  padding: "22px 26px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
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
                          background: c.status === "Selesai" ? "rgba(16, 185, 129, 0.15)" : c.status === "Teralokasi Penuh" ? "rgba(59, 130, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: c.status === "Selesai" ? "#047857" : c.status === "Teralokasi Penuh" ? "#1d4ed8" : "#b45309",
                        }}
                      >
                        Status: {c.status}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", color: "var(--ink)", fontWeight: 700 }}>
                      Kebutuhan {c.item} · {c.qty}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      📍 {c.location} · 👨‍👩‍👧‍👦 {c.kk} · Prioritas: <b>{c.urgency}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "8px 14px", minHeight: "36px", fontSize: "0.85rem" }}
                      onClick={() => onSelectCase(c)}
                    >
                      Detail Laporan
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "8px 14px", minHeight: "36px", fontSize: "0.85rem", background: "var(--forest)" }}
                      onClick={onNavigateToOffers}
                    >
                      Kelola Alokasi Mitra →
                    </button>
                  </div>
                </div>

                {/* Shortage Engine Data Matrix (Bab 7.1) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "12px",
                    background: "#f8fafc",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", display: "block" }}>
                      Target Terverifikasi
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--ink)" }}>{c.qty}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", display: "block" }}>
                      Alokasi Aktif yang Sah
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: "#1d4ed8" }}>
                      {allocatedNum} {unit}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", display: "block" }}>
                      Kekurangan Alokasi
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: shortageAlloc > 0 ? "#dc2626" : "#047857" }}>
                      {shortageAlloc} {unit}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", display: "block" }}>
                      Kekurangan Penerimaan
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: shortageReceipt > 0 ? "#d97706" : "#047857" }}>
                      {shortageReceipt} {unit}
                    </strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--muted)", marginBottom: "4px" }}>
                    <span>Pemenuhan Alokasi: {pctAlloc}%</span>
                    <span>{allocatedNum} / {targetNum} {unit}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${pctAlloc}%`, height: "100%", background: pctAlloc >= 100 ? "#047857" : "#3b82f6", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                {/* Next Action Box (Bab 7.4) */}
                <div
                  style={{
                    background: recommendationBadge === "danger" ? "rgba(239, 68, 68, 0.08)" : recommendationBadge === "warning" ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
                    borderLeft: `4px solid ${recommendationBadge === "danger" ? "#ef4444" : recommendationBadge === "warning" ? "#f59e0b" : "#10b981"}`,
                    padding: "10px 14px",
                    borderRadius: "0 8px 8px 0",
                    fontSize: "0.86rem",
                    color: "var(--ink)",
                  }}
                >
                  <strong>🧭 Rekomendasi Tindakan Berikutnya:</strong> {recommendationText}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
