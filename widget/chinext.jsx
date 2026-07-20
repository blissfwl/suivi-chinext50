// Widget Übersicht — ChiNext 50 (prix + variations jour/semaine + mini-graphe 1 mois)
// COPIE DE RÉFÉRENCE. Le fichier réellement utilisé est dans :
//   ~/Library/Application Support/Übersicht/widgets/chinext.jsx
// Si tu modifies celui-ci, recopie-le dans le dossier Übersicht.

export const refreshFrequency = 5 * 60 * 1000; // rafraîchit toutes les 5 minutes

export const command =
  `/opt/homebrew/bin/node "/Users/mrmatch/Documents/microentreprise/suivi-chinext50/widget/chinext-data.mjs"`;

// Apparence + position de la carte sur le bureau (coin haut-GAUCHE)
export const className = `
  top: 40px;
  left: 40px;
  width: 240px;
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

  // Mini-graphique (sparkline) de la série 1 mois en EUR — dégradé + point final
  const spark = (data) => {
    const w = 210, h = 54, pad = 4;
    const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
    const X = (i) => pad + (i / (data.length - 1)) * (w - 2 * pad);
    const Y = (v) => pad + (1 - (v - min) / rng) * (h - 2 * pad);
    const line = data.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const area = `${line} L${X(data.length - 1).toFixed(1)},${h - pad} L${X(0).toFixed(1)},${h - pad} Z`;
    const up = data[data.length - 1] >= data[0];
    const c = up ? "#34d399" : "#f87171";
    const ex = X(data.length - 1), ey = Y(data[data.length - 1]);
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", height: h + "px", overflow: "visible" }}>
        <defs>
          <linearGradient id="cnxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.30" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cnxGrad)" />
        <path d={line} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={ex.toFixed(1)} cy={ey.toFixed(1)} r="2.6" fill={c} />
      </svg>
    );
  };

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

      {d.series && d.series.length > 1 ? (
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>1 mois (EUR)</span>
            <span style={{ fontSize: "11px", color: col(d.monthEur), fontWeight: 600 }}>{txt(d.monthEur)}</span>
          </div>
          {spark(d.series)}
        </div>
      ) : null}

      <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.45, textAlign: "right" }}>maj {now}</div>
    </div>
  );
};
