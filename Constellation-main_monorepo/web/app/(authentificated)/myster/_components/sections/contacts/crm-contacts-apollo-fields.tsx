import {
  CRM_APOLLO_PROSPECT_FIELD_GROUPS,
  CRM_APOLLO_PROSPECT_FIELD_LABELS,
  type CrmApolloProspectFieldKey,
} from "@myster/_lib/crm-apollo-prospect-fields";

import type { Prospect } from "./crm-contacts-types";

function fieldValue(prospect: Prospect, key: CrmApolloProspectFieldKey): string | null {
  const v = prospect[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function CrmContactsApolloFields({ prospect }: { prospect: Prospect }) {
  const groups = CRM_APOLLO_PROSPECT_FIELD_GROUPS.map((group) => ({
    ...group,
    entries: group.keys
      .map((key) => ({
        key,
        label: CRM_APOLLO_PROSPECT_FIELD_LABELS[key],
        value: fieldValue(prospect, key),
      }))
      .filter((e) => e.value !== null),
  })).filter((g) => g.entries.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-border pt-3">
      <p className="text-sm font-medium text-foreground">Données Apollo</p>
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-2 text-sm">
            {group.entries.map((entry) => (
              <div key={entry.key} role="paragraph" className="whitespace-normal break-words">
                <span className="text-muted-foreground">{entry.label} : </span>
                {entry.key === "siteWeb" ||
                entry.key === "linkedinEntreprise" ||
                entry.key === "twitter" ||
                entry.key === "facebook" ||
                entry.key === "github" ? (
                  <a
                    href={entry.value!.startsWith("http") ? entry.value! : `https://${entry.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {entry.value}
                  </a>
                ) : (
                  entry.value
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
