import type { MissionsKpi } from "../_lib/missions-types";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

type KpiViewProps = { kpi: MissionsKpi };

const KPI_CONFIG: Array<{ key: keyof MissionsKpi; label: string }> = [
  { key: "missions", label: "Missions (CCA)" },
  { key: "bonCommandes", label: "Bon de commande" },
  { key: "rmi", label: "RMI / ARMI" },
  { key: "pvrf", label: "PVRF" },
  { key: "qs", label: "QS" },
  { key: "faReglees", label: "FA reglees" },
  { key: "fsReglees", label: "FS reglees" },
  { key: "bvVerses", label: "BV verses" },
];

export function KpiView({ kpi }: KpiViewProps) {
  return (
    <div className="space-y-3">
      <div className={`${gm.cardSoft} px-4 py-3`}>
        <h3 className="text-sm font-semibold">Section KPI</h3>
        <p className="text-xs text-muted-foreground">
          Indicateurs consolides du gestionnaire de missions.
        </p>
      </div>
      <div className={gm.kpiGrid}>
        {KPI_CONFIG.map((item) => (
          <div key={item.key} className={`${gm.cardSoft} p-4`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1.5 text-2xl font-semibold">{kpi[item.key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
