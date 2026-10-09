import { useState } from "react";
import { BursaItem, apiService } from "../../services/api";

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
  const [readinessTime, setReadinessTime] = useState("Hari ini, Siap Diserahkan / Dikirim");
  const [fleetInfo, setFleetInfo] = useState("");
  const [notesInput, setNotesInput] = useState("Mitra siap membantu penyediaan logistik kebutuhan pokok sesuai permohonan.");
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
        notify?.(`Penawaran bantuan ${modalBursa.item_bantuan} (${amountStr}) berhasil diajukan ke Posko! Status: Diajukan.`);
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
          <span className="eyebrow">Katalog Terbuka Posko (PRD Bab 6.1 &amp; 6.3 Tahap 1)</span>
          <h1>Bursa Bantuan Kemanusiaan</h1>
          <p>
            Temukan kebutuhan logistik warga yang telah diverifikasi resmi oleh Posko. Ajukan penawaran pemenuhan sesuai kapasitas armada organisasi Anda.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNavigateToMyOffers}
        >
          Lihat Penawaran Saya →
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="cases-pill-filters" style={{ margin: 0 }}>
          {["Semua", "Kritis", "Tinggi", "Sedang"].map((u) => (
            <button
              key={u}
              type="button"
              className={`case-filter-btn ${filterUrgency === u ? "active" : ""}`}
              onClick={() => setFilterUrgency(u)}
            >
              {u === "Semua" ? "Semua Urgensi" : `Prioritas ${u}`}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Cari komoditas atau wilayah..."
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

      {/* BURSA ITEMS LIST */}
      {filteredItems.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "18px", padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ color: "var(--forest)", margin: "0 0 8px" }}>Tidak Ada Kebutuhan Terbuka di Kategori Ini</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
            Semua kebutuhan di wilayah ini telah terpenuhi atau sedang menunggu verifikasi posko.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredItems.map((item) => {
            const locName = item.posko
              ? `${item.posko.desa || ''}, ${item.posko.kecamatan || ''}, ${item.posko.kabupaten || ''}`
              : item.kebutuhan?.kabupaten || "Posko Wilayah Terdampak";

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "18px",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: item.urgensi === "Kritis" ? "rgba(239, 68, 68, 0.15)" : item.urgensi === "Tinggi" ? "rgba(245, 158, 11, 0.15)" : "rgba(100, 116, 139, 0.15)",
                        color: item.urgensi === "Kritis" ? "#b91c1c" : item.urgensi === "Tinggi" ? "#d97706" : "#475569",
                      }}
                    >
                      Prioritas: {item.urgensi}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                      {item.posko?.nama_posko || "Posko Wilayah"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", color: "var(--ink)", margin: "0 0 6px", fontWeight: 700 }}>
                    {item.item_bantuan}
                  </h3>

                  <div style={{ fontSize: "0.86rem", color: "var(--muted)", marginBottom: "12px" }}>
                    📍 Wilayah: <b>{locName}</b>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginBottom: "16px", fontSize: "0.86rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>Target Kebutuhan:</span>
                      <strong style={{ color: "var(--ink)" }}>{item.target_volume}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Alokasi Saat Ini:</span>
                      <strong style={{ color: "#1d4ed8" }}>{item.volume_terpenuhi || "0"}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", background: "var(--forest)" }}
                  onClick={() => openOfferModal(item)}
                >
                  Ajukan Penawaran Bantuan →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFER SUBMISSION MODAL (Bab 6.3 Tahap 2) */}
      {modalBursa && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(500px, 95%)", textAlign: "left" }}>
            <h2 style={{ fontSize: "1.3rem", color: "var(--forest)", marginBottom: "6px" }}>
              Ajukan Penawaran: {modalBursa.item_bantuan}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
              Target Kebutuhan Posko: <b>{modalBursa.target_volume}</b>. Anda dapat menawarkan pemenuhan sesuai kapasitas logistik organisasi Anda. Mitra tidak wajib memiliki kendaraan pengangkut.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                  Volume Bantuan Ditawarkan:
                </label>
                <input
                  type="number"
                  value={offeredAmount}
                  onChange={(e) => setOfferedAmount(e.target.value)}
                  placeholder="Contoh: 300"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.95rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                  Satuan:
                </label>
                <input
                  type="text"
                  value={offeredUnit}
                  onChange={(e) => setOfferedUnit(e.target.value)}
                  placeholder="L / Paket"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.95rem" }}
                />
              </div>
            </div>

            {/* PILIHAN METODE PENYALURAN */}
            <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>
              Metode Penyaluran / Distribusi Bantuan:
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {[
                { id: "serah_posko", label: "🏢 Diserahkan ke Gudang / Posko BPBD (Tanpa Armada Mandiri)", desc: "Mitra menyediakan pasokan barang; pengangkutan ke warga dikoordinasikan oleh posko." },
                { id: "mandiri", label: "🚚 Distribusi Mandiri (Memiliki Armada Sendiri)", desc: "Mitra menyalurkan barang langsung menggunakan kendaraan operasional milik mitra." },
                { id: "koordinasi", label: "🤝 Koordinasi Penyaluran Bersama Tim Posko", desc: "Penyaluran digabungkan bersama konvoi logistik dan personel relawan Posko BPBD." },
              ].map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: deliveryMethod === m.id ? "1.5px solid var(--forest)" : "1px solid var(--line)",
                    background: deliveryMethod === m.id ? "rgba(1, 50, 32, 0.04)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={m.id}
                    checked={deliveryMethod === m.id}
                    onChange={() => setDeliveryMethod(m.id as any)}
                    style={{ marginTop: "3px", accentColor: "var(--forest)" }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.88rem", color: "var(--ink)", display: "block" }}>{m.label}</strong>
                    <small style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{m.desc}</small>
                  </div>
                </label>
              ))}
            </div>

            {/* INPUT ARMADA HANYA JIKA MANDIRI (OPSIONAL) */}
            {deliveryMethod === "mandiri" && (
              <div style={{ marginBottom: "12px", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                  Informasi Armada &amp; Kapasitas (Opsional):
                </label>
                <input
                  type="text"
                  value={fleetInfo}
                  onChange={(e) => setFleetInfo(e.target.value)}
                  placeholder="Contoh: Mobil Box Logistik No. 01 · Kapasitas 200 Paket / Truk Tangki 500L"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.88rem" }}
                />
              </div>
            )}

            <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
              Perkiraan Waktu Kesiapan Penyerahan / Distribusi:
            </label>
            <input
              type="text"
              value={readinessTime}
              onChange={(e) => setReadinessTime(e.target.value)}
              placeholder="Contoh: Hari ini, Siap Diserahkan ke Posko dalam 2 Jam"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "12px" }}
            />

            <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
              Catatan Dukungan Mitra:
            </label>
            <textarea
              rows={2}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Catatan tambahan mengenai spesifikasi barang atau kesepakatan koordinasi posko..."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "0.88rem", marginBottom: "18px" }}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={() => setModalBursa(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting || !offeredAmount}
                onClick={handleSubmitOffer}
                style={{ background: "var(--forest)" }}
              >
                {isSubmitting ? "Mengirimkan..." : "Kirim Penawaran ke Posko"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
