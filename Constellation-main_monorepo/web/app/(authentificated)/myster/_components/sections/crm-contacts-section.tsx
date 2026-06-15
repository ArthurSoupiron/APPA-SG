"use client";

import { PRETEXT, PretextBlock } from "@/components/typography";

import { CrmContactsDetailSheet } from "./contacts/crm-contacts-detail-sheet";
import { CrmContactsListCard } from "./contacts/crm-contacts-list-card";
import { CrmContactsProspectDialog } from "./contacts/crm-contacts-prospect-dialog";
import { useCrmContacts } from "./contacts/use-crm-contacts";

export function CrmContactsSection() {
  const d = useCrmContacts();

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="border-b border-brand/25 pb-2">
        <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Base prospects" />
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text="Import Excel / Google Sheets, export CSV ou .xlsx."
          className="mt-1 text-muted-foreground"
        />
      </div>

      <CrmContactsListCard
        hasPermission={d.hasPermission}
        loading={d.loading}
        prospects={d.prospects}
        total={d.total}
        page={d.page}
        setPage={d.setPage}
        q={d.q}
        setQ={d.setQ}
        statutFilter={d.statutFilter}
        setStatutFilter={d.setStatutFilter}
        importBusy={d.importBusy}
        onImportFile={d.onImportFile}
        onOpenCreate={d.openCreate}
        onOpenSheet={d.openSheetFromRow}
        onOpenEdit={(p) => {
          d.setSheetOpen(false);
          d.openEdit(p);
        }}
        onRemove={d.removeProspect}
        onReload={d.load}
        exportUrl={d.exportUrl}
      />

      <CrmContactsDetailSheet
        open={d.sheetOpen}
        onOpenChange={(open) => {
          d.setSheetOpen(open);
          if (!open) {
            d.setSheetProspect(null);
            d.setSheetTimeline([]);
            d.setQuickNote("");
          }
        }}
        sheetLoading={d.sheetLoading}
        sheetProspect={d.sheetProspect}
        sheetTimeline={d.sheetTimeline}
        hasPermission={d.hasPermission}
        quickNote={d.quickNote}
        setQuickNote={d.setQuickNote}
        quickNoteBusy={d.quickNoteBusy}
        onSubmitQuickNote={d.submitQuickNote}
        quickEventKind={d.quickEventKind}
        setQuickEventKind={d.setQuickEventKind}
        quickEventBusy={d.quickEventBusy}
        onSubmitQuickContactEvent={d.submitQuickContactEvent}
        onEditInForm={() => {
          if (d.sheetProspect) {
            d.setSheetOpen(false);
            d.openEdit(d.sheetProspect);
          }
        }}
      />

      <CrmContactsProspectDialog
        open={d.dialogOpen}
        onOpenChange={d.setDialogOpen}
        editing={d.editing}
        form={d.form}
        setForm={d.setForm}
        saving={d.saving}
        onSave={d.saveProspect}
      />
    </div>
  );
}
