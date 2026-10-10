import { useState } from "react";
import { PenawaranItem, BursaItem } from "../../services/api";
import { AppIcon } from "../common/Icons";

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

  const myOffers: PenawaranItem[] = [...penawaranList];

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
          <span className="eyebrow">PENGELOLAAN KOMITMEN MITRA</span>
          <h1>Daftar Penawaran Saya</h1>
          <p>
            Pantau status verifikasi penawaran logistik yang diajukan organisasi Anda, persetujuan Koordinator Posko, dan surat penugasan misi lapangan.
          </p>
        </div>
        <button
          type="button"
          className="reksa-btn reksa-btn-primary"
          onClick={onNavigateToBursa}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <AppIcon name="box" size={15} />
          <span>Tambah Penawaran Baru</span>
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
          Disetujui Posko ({myOffers.filter((o) => o.status === "Disetujui").length})
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
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon" style={{ background: "#f0f4f1", color: "var(--forest)" }}>
            <AppIcon name="handshake" size={32} />
          </div>
          <h3 className="reksa-empty-title">Belum Ada Penawaran pada Status Ini</h3>
          <p className="reksa-empty-desc">
            Organisasi Anda belum memiliki pengajuan penawaran logistik pada status filter ini.
          </p>
          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
              onClick={onNavigateToBursa}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <span>Buka Bursa Bantuan Terbuka</span>
              <AppIcon name="arrow-right" size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((o) => {
            const isPending = o.status === "Diajukan";
            const isApproved = o.status === "Disetujui";
            const isRejected = o.status === "Ditolak";
            const deliveryMethod = o.metode_penyaluran === "mandiri" ? "Penyaluran Mandiri (Armada Sendiri)" : "Diserahkan ke Gudang / Posko BPBD";

            return (
              <div
                key={o.id}
                className="reksa-card"
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isApproved
                    ? "1px solid #86efac"
                    : isRejected
                    ? "1px solid #fca5a5"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                  padding: "22px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--forest)", fontFamily: "monospace" }}>
                        {o.kode_penawaran}
                      </span>
                      <span className={`reksa-badge ${isApproved ? "success" : isRejected ? "critical" : "warning"}`} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        {isApproved ? <AppIcon name="check" size={12} /> : isRejected ? <AppIcon name="x" size={12} /> : <AppIcon name="clock" size={12} />}
                        <span>{o.status}</span>
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", color: "var(--forest)", fontWeight: 700 }}>
                      {o.jenis_bantuan} · <span style={{ color: "#166534" }}>{o.jumlah_tawaran}</span>
                    </h3>

                    {/* Metadata Row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px", color: "var(--muted)", fontSize: "0.85rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="users" size={14} />
                        <span>Organisasi: <strong style={{ color: "var(--ink)" }}>{o.organisasi}</strong></span>
                      </span>
                      <span>•</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <AppIcon name="truck" size={14} />
                        <span>Metode: <strong style={{ color: "var(--ink)" }}>{deliveryMethod}</strong></span>
                      </span>
                      {o.armada_info && (
                        <>
                          <span>•</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <AppIcon name="file" size={14} />
                            <span>Armada: <strong style={{ color: "var(--ink)" }}>{o.armada_info}</strong></span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isApproved && (
                    <button
                      type="button"
                      className="reksa-btn reksa-btn-success"
                      onClick={onNavigateToTasks}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <span>Buka Konsol Misi Lapangan</span>
                      <AppIcon name="arrow-right" size={15} />
                    </button>
                  )}
                </div>

                {/* Status Notice Boxes */}
                {isPending && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", color: "#92400e", marginBottom: o.catatan ? "10px" : "0" }}>
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="clock" size={16} />
                    </div>
                    <div>
                      <strong>Menunggu Keputusan Posko:</strong> Proposal bantuan logistik Anda sedang ditinjau oleh Koordinator Posko Wilayah. Surat penugasan resmi akan diterbitkan setelah alokasi disetujui.
                    </div>
                  </div>
                )}

                {isApproved && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", color: "#166534", marginBottom: o.catatan ? "10px" : "0" }}>
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="check" size={16} />
                    </div>
                    <div>
                      <strong>Alokasi Resmi Disetujui:</strong> Koordinator Posko telah menetapkan pemenuhan sebesar <strong>{o.jumlah_disetujui || o.jumlah_tawaran}</strong>. Misi penyaluran lapangan resmi telah aktif.
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", color: "#991b1b", marginBottom: o.catatan ? "10px" : "0" }}>
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="x" size={16} />
                    </div>
                    <div>
                      <strong>Alasan Penolakan dari Posko:</strong> {o.alasan_penolakan || "Spesifikasi bantuan atau waktu kesiapan belum sesuai dengan prioritas darurat posko saat ini."}
                    </div>
                  </div>
                )}

                {o.catatan && (
                  <div style={{ background: "#fbfbf8", border: "1px solid rgba(1, 50, 32, 0.08)", borderRadius: "10px", padding: "10px 14px", fontSize: "0.84rem", color: "var(--muted)" }}>
                    <strong style={{ color: "var(--forest)" }}>Catatan Operasional:</strong> {o.catatan}
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
