import { useState } from "react";
import { BursaItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

interface MitraBursaBantuanProps {
  bursaList: BursaItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToMyOffers: () => void;
}

export function MitraBursaBantuan({
  bursaList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToMyOffers,
}: MitraBursaBantuanProps) {
  const [search, setSearch] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("Semua");

  // Offer modal state
  const [modalBursa, setModalBursa] = useState<BursaItem | null>(null);
  const [offeredAmount, setOfferedAmount] = useState("");
  const [offeredUnit, setOfferedUnit] = useState("Unit");
  const [deliveryMethod, setDeliveryMethod] = useState<'serah_posko' | 'mandiri' | 'koordinasi'>('serah_posko');
  const [readinessTime, setReadinessTime] = useState("Hari ini, Siap Diserahkan ke Posko");
  const [fleetInfo, setFleetInfo] = useState("");
  const [notesInput, setNotesInput] = useState("Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open items on bursa
  const openItems = bursaList.filter(
    (b) => b.status === "Terbuka" || b.status === "Klaim Diajukan" || b.status === "Sebagian Terpenuhi"
  );

  const filteredItems = openItems.filter((b) => {
    if (filterUrgency !== "Semua" && b.urgensi !== filterUrgency) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const item = (b.item_bantuan || "").toLowerCase();
      const loc = (b.posko?.kabupaten || b.kebutuhan?.kabupaten || "").toLowerCase();
      return item.includes(q) || loc.includes(q);
    }
    return true;
  });

  const openOfferModal = (item: BursaItem) => {
    setModalBursa(item);
    const num = parseInt(item.target_volume.replace(/[^0-9]/g, "")) || 500;
    const unit = item.target_volume.replace(/[0-9.,]/g, "").trim() || "Unit";
    setOfferedAmount(String(num));
    setOfferedUnit(unit);
    setDeliveryMethod('serah_posko');
    setFleetInfo("");
    setReadinessTime("Hari ini, Siap Diserahkan ke Posko");
    setNotesInput("Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.");
  };

  const handleSubmitOffer = async () => {
    if (!modalBursa) return;
    try {
      setIsSubmitting(true);
      const num = parseInt(offeredAmount) || 100;
      const amountStr = `${num} ${offeredUnit}`;

      const res = await apiService.createPenawaran({
        bursa_id: modalBursa.id,
        jumlah_tawaran: amountStr,
        volume_angka: num,
        satuan: offeredUnit,
        metode_penyaluran: deliveryMethod,
        kategori_komoditas: modalBursa.item_bantuan,
        waktu_kesiapan: readinessTime,
        armada_info: deliveryMethod === 'mandiri' ? (fleetInfo || 'Armada Mandiri Mitra') : undefined,
        organisasi: userOrg,
        catatan: notesInput,
      });

      if (res.success) {
        notify?.(`Penawaran bantuan ${modalBursa.item_bantuan} (${amountStr}) berhasil diajukan ke Posko!`);
        setModalBursa(null);
        await onRefresh?.();
        onNavigateToMyOffers();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengajukan penawaran bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace mitra-bursa-workspace">
      <div className="workspace-title">
        <div>
          <span className="eyebrow">KATALOG TERBUKA POSKO BPBD</span>
          <h1>Bursa Bantuan Kemanusiaan</h1>
          <p>
            Daftar kebutuhan logistik warga terdampak yang telah divalidasi resmi oleh Posko. Silakan ajukan komitmen pemenuhan logistik atau kesiapan armada penyalur.
          </p>
        </div>
        <button
          type="button"
          className="reksa-btn reksa-btn-secondary"
          onClick={onNavigateToMyOffers}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span>Penawaran Saya</span>
          <AppIcon name="arrow-right" size={15} />
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="cases-pill-filters" style={{ margin: 0 }}>
          {["Semua", "Kritis", "Tinggi", "Sedang"].map((u) => (
            <button
              key={u}
              type="button"
              className={`case-filter-btn ${filterUrgency === u ? "active" : ""}`}
              onClick={() => setFilterUrgency(u)}
            >
              {u === "Semua" ? "Semua Kebutuhan" : `Prioritas ${u}`}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "300px" }}>
          <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
            <AppIcon name="search" size={16} />
          </div>
          <input
            type="text"
            placeholder="Cari komoditas atau wilayah terdampak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="reksa-input-field"
            style={{ padding: "10px 16px 10px 40px", width: "100%", borderRadius: "10px" }}
          />
        </div>
      </div>

      {/* BURSA ITEMS LIST */}
      {filteredItems.length === 0 ? (
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon" style={{ background: "#f0f4f1", color: "var(--forest)" }}>
            <AppIcon name="box" size={32} />
          </div>
          <h3 className="reksa-empty-title">Tidak Ada Kebutuhan Terbuka</h3>
          <p className="reksa-empty-desc">
            Seluruh kebutuhan logistik di wilayah posko saat ini telah terpenuhi atau masih dalam proses verifikasi tim lapangan.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {filteredItems.map((item) => {
            const locName = item.posko
              ? `${item.posko.desa || ''}, ${item.posko.kecamatan || ''}, ${item.posko.kabupaten || ''}`
              : item.kebutuhan?.kabupaten || "Posko Wilayah Terdampak";

            const targetNum = parseInt(item.target_volume.replace(/[^0-9]/g, "")) || 0;
            const filledNum = parseInt((item.volume_terpenuhi || "0").replace(/[^0-9]/g, "")) || 0;
            const percent = targetNum > 0 ? Math.min(100, Math.round((filledNum / targetNum) * 100)) : 0;

            return (
              <div
                key={item.id}
                className="reksa-card"
                style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", borderRadius: "16px", border: "1px solid rgba(1, 50, 32, 0.12)", padding: "20px" }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
                    <span className={`reksa-badge ${item.urgensi === "Kritis" ? "critical" : item.urgensi === "Tinggi" ? "warning" : "neutral"}`}>
                      Prioritas {item.urgensi}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <AppIcon name="pin" size={13} />
                      <span>{item.posko?.nama_posko || "Posko Wilayah"}</span>
                    </span>
                  </div>

                  {/* Commodity Title */}
                  <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 700, color: "var(--forest)", lineHeight: 1.35 }}>
                    {item.item_bantuan}
                  </h3>

                  {/* Location Meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
                    <AppIcon name="map" size={14} />
                    <span>Lokasi Distribusi: <strong style={{ color: "var(--ink)" }}>{locName}</strong></span>
                  </div>

                  {/* Progress & Target Meter */}
                  <div style={{ background: "#fbfbf8", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(1, 50, 32, 0.08)", marginBottom: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Kebutuhan Posko
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--forest)", fontWeight: 800 }}>
                        {item.target_volume}
                      </strong>
                    </div>

                    <div style={{ height: "7px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percent}%`,
                          background: percent >= 100 ? "#15803d" : percent > 0 ? "#0284c7" : "#80866e",
                          borderRadius: "999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--muted)" }}>
                      <span>Teralokasi: <strong>{item.volume_terpenuhi || "0"}</strong></span>
                      <span>{percent}% Terpenuhi</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="reksa-btn reksa-btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "11px 16px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  onClick={() => openOfferModal(item)}
                >
                  <AppIcon name="handshake" size={16} />
                  <span>Ajukan Komitmen Bantuan</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFER SUBMISSION MODAL */}
      {modalBursa && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(520px, 95%)", textAlign: "left", borderRadius: "18px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--forest)" }}>FORMULIR KOMITMEN MITRA</span>
                <h2 style={{ fontSize: "1.3rem", color: "var(--forest)", margin: "4px 0 0", fontWeight: 800 }}>
                  {modalBursa.item_bantuan}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalBursa(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <div style={{ background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(1, 50, 32, 0.08)", marginBottom: "18px", fontSize: "0.86rem", color: "var(--ink)" }}>
              Target Kebutuhan Posko: <strong style={{ color: "var(--forest)" }}>{modalBursa.target_volume}</strong>. Silakan masukkan kapasitas logistik yang dapat dipenuhi organisasi Anda.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label className="reksa-form-label">
                  Volume yang Ditawarkan:
                </label>
                <input
                  type="number"
                  value={offeredAmount}
                  onChange={(e) => setOfferedAmount(e.target.value)}
                  placeholder="Contoh: 300"
                  className="reksa-input-field"
                  style={{ borderRadius: "8px" }}
                />
              </div>

              <div>
                <label className="reksa-form-label">
                  Satuan:
                </label>
                <input
                  type="text"
                  value={offeredUnit}
                  onChange={(e) => setOfferedUnit(e.target.value)}
                  className="reksa-input-field"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label className="reksa-form-label">
                Metode Penyaluran Bantuan:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('serah_posko')}
                  style={{
                    padding: "11px 12px",
                    borderRadius: "10px",
                    border: deliveryMethod === 'serah_posko' ? "2px solid var(--forest)" : "1px solid rgba(1, 50, 32, 0.15)",
                    background: deliveryMethod === 'serah_posko' ? "#eef6f0" : "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: deliveryMethod === 'serah_posko' ? 700 : 500,
                    color: deliveryMethod === 'serah_posko' ? "var(--forest)" : "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                  }}
                >
                  <AppIcon name="box" size={15} />
                  <span>Serah ke Gudang Posko</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('mandiri')}
                  style={{
                    padding: "11px 12px",
                    borderRadius: "10px",
                    border: deliveryMethod === 'mandiri' ? "2px solid var(--forest)" : "1px solid rgba(1, 50, 32, 0.15)",
                    background: deliveryMethod === 'mandiri' ? "#eef6f0" : "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: deliveryMethod === 'mandiri' ? 700 : 500,
                    color: deliveryMethod === 'mandiri' ? "var(--forest)" : "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                  }}
                >
                  <AppIcon name="truck" size={15} />
                  <span>Penyaluran Mandiri</span>
                </button>
              </div>
            </div>

            {deliveryMethod === 'mandiri' && (
              <div style={{ marginBottom: "14px" }}>
                <label className="reksa-form-label">
                  Informasi Armada &amp; Pengemudi Mitra:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Truk Box B 1234 CD · Kapasitas 2 Ton"
                  value={fleetInfo}
                  onChange={(e) => setFleetInfo(e.target.value)}
                  className="reksa-input-field"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label className="reksa-form-label">
                Waktu Kesiapan Logistik:
              </label>
              <input
                type="text"
                value={readinessTime}
                onChange={(e) => setReadinessTime(e.target.value)}
                className="reksa-input-field"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="reksa-form-label">
                Catatan Operasional Mitra:
              </label>
              <textarea
                rows={3}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="reksa-textarea-field"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="reksa-btn reksa-btn-secondary"
                disabled={isSubmitting}
                onClick={() => setModalBursa(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isSubmitting || !offeredAmount}
                onClick={handleSubmitOffer}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
              >
                <AppIcon name="check" size={15} />
                <span>{isSubmitting ? "Mengirim..." : "Kirim Penawaran ke Posko"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
