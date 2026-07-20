// Widget Übersicht — ChiNext 50 (prix + variations jour/semaine en CNY & EUR)
// COPIE DE RÉFÉRENCE. Le fichier réellement utilisé est dans :
//   ~/Library/Application Support/Übersicht/widgets/chinext.jsx
// Si tu modifies celui-ci, recopie-le dans le dossier Übersicht.

export const refreshFrequency = 5 * 60 * 1000; // rafraîchit toutes les 5 minutes

export const command =
  `/opt/homebrew/bin/node "/Users/mrmatch/Documents/microentreprise/suivi-chinext50/widget/chinext-data.mjs"`;

// Apparence + position de la carte sur le bureau (coin haut-droit)
export const className = `
  top: 40px;
  right: 40px;
  width: 236px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f5f5f7;
  background: rgba(20, 22, 28, 0.72);
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.38);
`;

export const render = ({ output, error }) => {
  if (error) return <div>⚠️ {String(error)}</div>;

  let d;
  try { d = JSON.parse(output); }
  catch (e) { return <div style={{ opacity: 0.6 }}>Chargement…</div>; }
  if (!d || !d.ok) return <div>⚠️ {d && d.error ? d.error : "Données indisponibles"}</div>;

  const nf = (n, dec) =>
    Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const fleche = (v) => (v == null ? "" : v > 0 ? "▲" : v < 0 ? "▼" : "▬");
  const txt = (v) => (v == null ? "—" : `${fleche(v)} ${v > 0 ? "+" : ""}${nf(v, 2)} %`);
  const col = (v) => (v == null ? "#9ca3af" : v > 0 ? "#34d399" : v < 0 ? "#f87171" : "#9ca3af");
  const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const row = { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0", fontSize: "13px" };
  const lbl = { opacity: 0.7 };
  const val = (v) => ({ color: col(v), fontWeight: 600 });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "0.3px" }}>ChiNext 50</span>
        <span style={{ fontSize: "10px", color: "#34d399" }}>● live</span>
      </div>

      <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.1 }}>
        {nf(d.priceCny, 2)} <span style={{ fontSize: "13px", opacity: 0.6 }}>CNY</span>
      </div>
      <div style={{ fontSize: "15px", opacity: 0.85, marginTop: "2px" }}>
        {nf(d.priceEur, 2)} <span style={{ fontSize: "11px", opacity: 0.6 }}>EUR</span>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.12)", margin: "12px 0 8px" }} />

      <div style={row}><span style={lbl}>Jour · CNY</span><span style={val(d.dayCny)}>{txt(d.dayCny)}</span></div>
      <div style={row}><span style={lbl}>Jour · EUR</span><span style={val(d.dayEur)}>{txt(d.dayEur)}</span></div>
      <div style={row}><span style={lbl}>Semaine · CNY</span><span style={val(d.weekCny)}>{txt(d.weekCny)}</span></div>
      <div style={row}><span style={lbl}>Semaine · EUR</span><span style={val(d.weekEur)}>{txt(d.weekEur)}</span></div>

      <div style={{ marginTop: "10px", fontSize: "10px", opacity: 0.45, textAlign: "right" }}>maj {now}</div>
    </div>
  );
};
