import { useState } from "react";
import { PenawaranItem, BursaItem } from "../../services/api";

interface MitraPenawaranSayaProps {
  penawaranList: PenawaranItem[];
  bursaList: BursaItem[];
  userOrg?: string;
  onNavigateToTasks: () => void;
  onNavigateToBursa: () => void;
}

export function MitraPenawaranSaya({
  penawaranList,
  bursaList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  onNavigateToTasks,
  onNavigateToBursa,
}: MitraPenawaranSayaProps) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("all");

  // Filter offers for this organization (or all if simulated single partner)
  const myOffers: PenawaranItem[] = [...penawaranList];

  // Also include any legacy claim if relevant
  bursaList.forEach((b) => {
    if (b.status === "Klaim Diajukan" && b.claimed_org) {
      const exists = penawaranList.some((p) => p.bursa_id === b.id);
      if (!exists) {
        myOffers.push({
          id: b.id,
          kode_penawaran: `PROP-${b.id}`,
          bursa_id: b.id,
          kebutuhan_id: b.kebutuhan_id,
          posko_id: b.posko_id,
          mitra_name: b.claimedBy?.name || "Mitra Bantuan",
          organisasi: b.claimed_org || userOrg,
          jenis_bantuan: b.item_bantuan,
          jumlah_tawaran: b.claimed_volume || b.target_volume,
          volume_angka: parseInt((b.claimed_volume || b.target_volume).replace(/[^0-9]/g, "")) || 500,
          satuan: (b.claimed_volume || b.target_volume).replace(/[0-9.,]/g, "").trim() || "Unit",
          armada_info: b.claimed_armada || "",
          catatan: b.claim_notes || "Tawaran diajukan.",
          status: "Diajukan",
          created_at: b.published_at || new Date().toISOString(),
        });
      }
    }
  });

  const filtered = myOffers.filter((o) => {
    if (tab === "pending") return o.status === "Diajukan";
    if (tab === "approved") return o.status === "Disetujui";
    if (tab === "rejected") return o.status === "Ditolak";
    return true;
  });

  return (
    <main className="workspace mitra-penawaran-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">Pengelolaan Komitmen Mitra Bantuan</span>
          <h1>Penawaran Saya</h1>
          <p>
            Pantau status proposal bantuan logistik yang diajukan organisasi Anda, tanggapan persetujuan Posko, dan alasan penolakan secara transparan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNavigateToBursa}
          style={{ background: "var(--forest)" }}
        >
          + Tambah Penawaran Baru
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="cases-pill-filters" style={{ marginBottom: "24px" }}>
        <button
          type="button"
          className={`case-filter-btn ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Semua ({myOffers.length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Menunggu Keputusan ({myOffers.filter((o) => o.status === "Diajukan").length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "approved" ? "active" : ""}`}
          onClick={() => setTab("approved")}
        >
          Disetujui ({myOffers.filter((o) => o.status === "Disetujui").length})
        </button>
        <button
          type="button"
          className={`case-filter-btn ${tab === "rejected" ? "active" : ""}`}
          onClick={() => setTab("rejected")}
        >
          Ditolak ({myOffers.filter((o) => o.status === "Ditolak").length})
        </button>
      </div>

      {/* LIST OF OFFERS */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Belum Ada Penawaran di Status Ini</h3>
          <p style={{ color: "var(--muted)", margin: "0 0 16px", fontSize: "0.9rem" }}>
            Anda belum mengajukan penawaran pada Bursa Bantuan atau semua penawaran telah selesai.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateToBursa}
          >
            Buka Bursa Bantuan Terbuka
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((o) => {
            const isPending = o.status === "Diajukan";
            const isApproved = o.status === "Disetujui";
            const isRejected = o.status === "Ditolak";
            const deliveryMethod = o.metode_penyaluran || (o.armada_info ? "Pengiriman Mandiri (Armada Sendiri)" : "Diserahkan ke Gudang / Posko BPBD (Tanpa Armada Mandiri)");

            return (
              <div
                key={o.id}
                style={{
                  background: "#ffffff",
                  border: isApproved ? "1.5px solid rgba(16, 185, 129, 0.4)" : isRejected ? "1.5px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--line)",
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
                      {o.jenis_bantuan} · {o.jumlah_tawaran}
                    </h3>
                    <div style={{ fontSize: "0.86rem", color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px" }}>
                      <span>Organisasi: <b>{o.organisasi}</b></span>
                      <span>•</span>
                      <span>Metode: <b style={{ color: "var(--forest)" }}>{deliveryMethod}</b></span>
                      {o.armada_info && (
                        <>
                          <span>•</span>
                          <span>Armada: <b>{o.armada_info}</b></span>
                        </>
                      )}
                    </div>
                  </div>

                  {isApproved && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: "#047857", padding: "8px 16px", fontSize: "0.85rem" }}
                      onClick={onNavigateToTasks}
                    >
                      Jalankan Penyaluran →
                    </button>
                  )}
                </div>

                {/* Status Banners per Bab 6.3 Tahap 3 */}
                {isPending && (
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", borderLeft: "4px solid #f59e0b", padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: "0.86rem", color: "#b45309" }}>
                    ⏳ <b>Menunggu Keputusan Posko:</b> Penawaran Anda sedang ditinjau oleh Koordinator Posko Wilayah. Penawaran belum mengurangi kekurangan alokasi sampai disetujui.
                  </div>
                )}

                {isApproved && (
                  <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "4px solid #10b981", padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: "0.86rem", color: "#047857" }}>
                    🎉 <b>Alokasi Resmi Disetujui:</b> Koordinator Posko menyetujui pemenuhan sebesar <b>{o.jumlah_disetujui || o.jumlah_tawaran}</b>. Misi Penyaluran telah diterbitkan.
                  </div>
                )}

                {isRejected && (
                  <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "4px solid #ef4444", padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: "0.86rem", color: "#b91c1c" }}>
                    ✕ <b>Alasan Penolakan dari Posko:</b> {o.alasan_penolakan || "Spesifikasi tidak sesuai prioritas saat ini."}
                  </div>
                )}

                {o.catatan && (
                  <div style={{ fontSize: "0.85rem", color: "#334155", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                    <b>Catatan Operasional:</b> {o.catatan}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
