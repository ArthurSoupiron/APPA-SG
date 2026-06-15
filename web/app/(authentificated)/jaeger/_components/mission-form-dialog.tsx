"use client";

import { Check, ChevronsUpDown, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createCommercialClient,
  createCommercialEntreprise,
  createMission,
  fetchCreateIntegrationOptions,
  fetchDriveFolderCommercialInfos,
  fetchMissionFormOptions,
  updateMission,
} from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import type { MissionDriveFolderOption, MissionFormOptions, MissionRow } from "../_lib/missions-types";

type MissionFormDialogProps = {
  options: MissionFormOptions;
  mission?: MissionRow;
  canManageMissions: boolean;
  onSuccess?: () => void;
};

type MissionFormState = {
  missionName: string;
  clientId: string;
  entrepriseId: string;
  cdpId: string;
  description: string;
  startDate: string;
  endDate: string;
};

type SelectOption = { id: string; label: string };

const EMPTY_NEW_CLIENT = {
  nomClient: "",
  prenomClient: "",
  telephoneClient: "",
  mailClient: "",
};

const EMPTY_NEW_ENTREPRISE = {
  nomEntreprise: "",
  sirenEntreprise: "",
  mailEntreprise: "",
  telephoneEntreprise: "",
  adresseEntreprise: "",
  villeEntreprise: "",
  codePostalEntreprise: "",
  paysEntreprise: "",
};

function toDateInput(value: Date | string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between rounded-none bg-slate-50/70 py-2 dark:bg-background/60",
            !selected && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <span className="whitespace-normal wrap-anywhere text-left">
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] rounded-none p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="whitespace-normal wrap-anywhere">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MissionFormDialog({
  options,
  mission,
  canManageMissions,
  onSuccess,
}: MissionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [clientOptions, setClientOptions] = useState(options.clients);
  const [entrepriseOptions, setEntrepriseOptions] = useState(options.entreprises);
  const [cdpOptions, setCdpOptions] = useState(options.cdps);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewEntreprise, setShowNewEntreprise] = useState(false);
  const [reuseIntegrations, setReuseIntegrations] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState("");
  const [driveFolders, setDriveFolders] = useState<MissionDriveFolderOption[]>([]);
  const [driveFoldersLoading, setDriveFoldersLoading] = useState(false);
  const [driveFoldersError, setDriveFoldersError] = useState<string | null>(null);
  const [slackChannelId, setSlackChannelId] = useState("");
  const [slackChannels, setSlackChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [slackChannelsLoading, setSlackChannelsLoading] = useState(false);
  const [slackChannelsError, setSlackChannelsError] = useState<string | null>(null);
  const [driveInfosLoading, setDriveInfosLoading] = useState(false);
  const [driveInfosMessage, setDriveInfosMessage] = useState<string | null>(null);
  const [driveInfosWebLink, setDriveInfosWebLink] = useState<string | null>(null);
  const [driveInfosFileName, setDriveInfosFileName] = useState<string | null>(null);
  const [newClient, setNewClient] = useState(EMPTY_NEW_CLIENT);
  const [newEntreprise, setNewEntreprise] = useState(EMPTY_NEW_ENTREPRISE);

  useEffect(() => {
    if (!open || mission || !reuseIntegrations) return;
    setDriveFoldersLoading(true);
    setSlackChannelsLoading(true);
    setDriveFoldersError(null);
    setSlackChannelsError(null);
    void fetchCreateIntegrationOptions()
      .then((opts) => {
        if (!opts) return;
        setDriveFolders(opts.driveFolders);
        setSlackChannels(opts.slackChannels);
        if (!opts.driveAvailable) {
          setDriveFoldersError(opts.driveError ?? "Scan Drive indisponible.");
        }
        if (!opts.slackAvailable) {
          setSlackChannelsError(opts.slackError ?? "Liste Slack indisponible.");
        }
      })
      .finally(() => {
        setDriveFoldersLoading(false);
        setSlackChannelsLoading(false);
      });
  }, [open, mission, reuseIntegrations]);

  useEffect(() => {
    if (!open || mission || !reuseIntegrations || !driveFolderId) {
      setDriveInfosLoading(false);
      if (!driveFolderId) {
        setDriveInfosMessage(null);
        setDriveInfosWebLink(null);
        setDriveInfosFileName(null);
      }
      return;
    }

    setDriveInfosLoading(true);
    setDriveInfosMessage(null);
    setDriveInfosWebLink(null);
    setDriveInfosFileName(null);
    setNewClient(EMPTY_NEW_CLIENT);
    setNewEntreprise(EMPTY_NEW_ENTREPRISE);
    setShowNewClient(false);
    setShowNewEntreprise(false);

    void fetchDriveFolderCommercialInfos(driveFolderId)
      .then((result) => {
        if (!result) {
          setDriveInfosMessage("Lecture du fichier infos indisponible.");
          return;
        }
        if (result.error) {
          setDriveInfosMessage(result.error);
          if (result.fileName) setDriveInfosFileName(result.fileName);
          if (result.webViewLink) setDriveInfosWebLink(result.webViewLink);
          return;
        }
        if (!result.found) {
          setDriveInfosMessage("Aucun fichier infos_mission.txt dans ce dossier.");
          return;
        }

        setDriveInfosFileName(result.fileName ?? null);
        setDriveInfosWebLink(result.webViewLink ?? null);

        if (result.client) {
          setNewClient({
            nomClient: result.client.nomClient ?? "",
            prenomClient: result.client.prenomClient ?? "",
            telephoneClient: result.client.telephoneClient ?? "",
            mailClient: result.client.mailClient ?? "",
          });
          setShowNewClient(true);
        }
        if (result.entreprise) {
          setNewEntreprise({
            nomEntreprise: result.entreprise.nomEntreprise ?? "",
            sirenEntreprise: result.entreprise.sirenEntreprise ?? "",
            mailEntreprise: result.entreprise.mailEntreprise ?? "",
            telephoneEntreprise: result.entreprise.telephoneEntreprise ?? "",
            adresseEntreprise: result.entreprise.adresseEntreprise ?? "",
            villeEntreprise: result.entreprise.villeEntreprise ?? "",
            codePostalEntreprise: result.entreprise.codePostalEntreprise ?? "",
            paysEntreprise: result.entreprise.paysEntreprise ?? "",
          });
          setShowNewEntreprise(true);
        }

        toast.success(
          `Infos importées depuis ${result.fileName ?? "infos_mission.txt"} — vérifiez puis créez client et entreprise.`,
        );
      })
      .finally(() => setDriveInfosLoading(false));
  }, [open, mission, reuseIntegrations, driveFolderId]);

  useEffect(() => {
    setClientOptions(options.clients);
    setEntrepriseOptions(options.entreprises);
    setCdpOptions(options.cdps);
  }, [options.clients, options.entreprises, options.cdps]);

  useEffect(() => {
    if (!open) return;
    setOptionsLoading(true);
    void fetchMissionFormOptions()
      .then((opts) => {
        if (!opts) return;
        setClientOptions(opts.clients);
        setEntrepriseOptions(opts.entreprises);
        setCdpOptions(opts.cdps);
      })
      .finally(() => setOptionsLoading(false));
  }, [open]);

  const driveFolderSelectOptions = useMemo<SelectOption[]>(
    () =>
      driveFolders.map((folder) => ({
        id: folder.id,
        label: folder.linkedMissionName
          ? `${folder.label} — déjà lié à « ${folder.linkedMissionName} »`
          : folder.label,
      })),
    [driveFolders],
  );

  const initialState = useMemo<MissionFormState>(
    () => ({
      missionName: mission?.missionName ?? "",
      clientId: mission?.clientId ?? "",
      entrepriseId: mission?.entrepriseId ?? "",
      cdpId: mission?.cdpId ?? "",
      description: mission?.description ?? "",
      startDate: toDateInput(mission?.startDate ?? null),
      endDate: toDateInput(mission?.endDate ?? null),
    }),
    [mission],
  );

  const [form, setForm] = useState<MissionFormState>(initialState);

  const createClient = () => {
    if (!newClient.nomClient.trim()) {
      toast.error("Nom client requis.");
      return;
    }
    startTransition(async () => {
      const created = await createCommercialClient(newClient);
      if (!created) return;
      setClientOptions((prev) => [...prev, created]);
      setForm((s) => ({ ...s, clientId: created.id }));
      setShowNewClient(false);
      setNewClient(EMPTY_NEW_CLIENT);
      toast.success("Client créé.");
    });
  };

  const createEntreprise = () => {
    if (!newEntreprise.nomEntreprise.trim()) {
      toast.error("Nom entreprise requis.");
      return;
    }
    startTransition(async () => {
      const created = await createCommercialEntreprise(newEntreprise);
      if (!created) return;
      setEntrepriseOptions((prev) => [...prev, created]);
      setForm((s) => ({ ...s, entrepriseId: created.id }));
      setShowNewEntreprise(false);
      setNewEntreprise(EMPTY_NEW_ENTREPRISE);
      toast.success("Entreprise créée.");
    });
  };

  const onSubmit = () => {
    if (!form.missionName || !form.clientId || !form.entrepriseId) return;
    if (
      !mission &&
      reuseIntegrations &&
      !driveFolderId &&
      !slackChannelId
    ) {
      toast.error("Sélectionnez au moins un dossier Drive ou un canal Slack à reprendre.");
      return;
    }
    startTransition(async () => {
      if (mission) {
        const result = await updateMission({
          id: mission.id,
          ...form,
          cdpId: form.cdpId || null,
          description: form.description || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        });
        if (!result.success) return;
        toast.success("Mission mise à jour.");
      } else {
        const created = await createMission({
          ...form,
          cdpId: form.cdpId || null,
          description: form.description || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          driveFolderIdOrUrl: reuseIntegrations ? driveFolderId || null : null,
          slackChannelId: reuseIntegrations ? slackChannelId || null : null,
        });
        if (!created) return;
        toast.success(
          reuseIntegrations && (driveFolderId || slackChannelId)
            ? "Mission créée — intégrations existantes reliées."
            : "Mission créée.",
        );
      }
      setOpen(false);
      onSuccess?.();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setForm(initialState);
          setShowNewClient(false);
          setShowNewEntreprise(false);
          setReuseIntegrations(false);
          setDriveFolderId("");
          setDriveFolders([]);
          setDriveFoldersError(null);
          setSlackChannelId("");
          setSlackChannels([]);
          setSlackChannelsError(null);
          setDriveInfosLoading(false);
          setDriveInfosMessage(null);
          setDriveInfosWebLink(null);
          setDriveInfosFileName(null);
          setNewClient(EMPTY_NEW_CLIENT);
          setNewEntreprise(EMPTY_NEW_ENTREPRISE);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={mission ? "outline" : "default"}
          size="sm"
          className={gm.actionButton}
          disabled={!canManageMissions}
          title={
            !canManageMissions
              ? "Droits insuffisants (erp.mission.manage requis)."
              : undefined
          }
        >
          {mission ? "Éditer" : "Nouvelle mission"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mission ? "Éditer la mission" : "Créer une mission"}</DialogTitle>
          <DialogDescription>
            Sélectionnez ou créez un client et une entreprise. Les CDP proviennent du groupe
            Google Workspace cdp@jeece.fr.
            {!mission
              ? " Vous pouvez reprendre un dossier Drive et/ou un canal Slack déjà existants."
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="missionName">Nom de mission</Label>
            <Input
              id="missionName"
              value={form.missionName}
              onChange={(e) => setForm((s) => ({ ...s, missionName: e.target.value }))}
              className="rounded-none bg-slate-50/70 dark:bg-background/60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Client</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-none px-2 text-xs"
                  onClick={() => setShowNewClient((v) => !v)}
                >
                  {showNewClient ? "Annuler" : "+ Nouveau client"}
                </Button>
              </div>
              {showNewClient ? (
                <div className="space-y-2 rounded-none border border-border p-2">
                  <Input
                    placeholder="Nom *"
                    value={newClient.nomClient}
                    onChange={(e) =>
                      setNewClient((s) => ({ ...s, nomClient: e.target.value }))
                    }
                    className="rounded-none"
                  />
                  <Input
                    placeholder="Prénom"
                    value={newClient.prenomClient}
                    onChange={(e) =>
                      setNewClient((s) => ({ ...s, prenomClient: e.target.value }))
                    }
                    className="rounded-none"
                  />
                  <Input
                    placeholder="E-mail"
                    value={newClient.mailClient}
                    onChange={(e) =>
                      setNewClient((s) => ({ ...s, mailClient: e.target.value }))
                    }
                    className="rounded-none"
                  />
                  <Input
                    placeholder="Téléphone"
                    value={newClient.telephoneClient}
                    onChange={(e) =>
                      setNewClient((s) => ({ ...s, telephoneClient: e.target.value }))
                    }
                    className="rounded-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className={gm.actionButton}
                    disabled={isPending}
                    onClick={createClient}
                  >
                    Créer le client
                  </Button>
                </div>
              ) : (
                <SearchableSelect
                  value={form.clientId}
                  onChange={(value) => setForm((s) => ({ ...s, clientId: value }))}
                  options={clientOptions}
                  placeholder="Sélectionner un client"
                  searchPlaceholder="Rechercher un client…"
                  emptyText="Aucun client — créez-en un."
                  disabled={isPending}
                />
              )}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Entreprise</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-none px-2 text-xs"
                  onClick={() => setShowNewEntreprise((v) => !v)}
                >
                  {showNewEntreprise ? "Annuler" : "+ Nouvelle entreprise"}
                </Button>
              </div>
              {showNewEntreprise ? (
                <div className="space-y-2 rounded-none border border-border p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Informations entreprise
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="grid gap-1 sm:col-span-2">
                      <Label htmlFor="new-ent-nom">Nom entreprise *</Label>
                      <Input
                        id="new-ent-nom"
                        value={newEntreprise.nomEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({ ...s, nomEntreprise: e.target.value }))
                        }
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="new-ent-siren">SIREN</Label>
                      <Input
                        id="new-ent-siren"
                        value={newEntreprise.sirenEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({ ...s, sirenEntreprise: e.target.value }))
                        }
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="new-ent-mail">Email entreprise</Label>
                      <Input
                        id="new-ent-mail"
                        type="email"
                        value={newEntreprise.mailEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({ ...s, mailEntreprise: e.target.value }))
                        }
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="new-ent-tel">Téléphone entreprise</Label>
                      <Input
                        id="new-ent-tel"
                        value={newEntreprise.telephoneEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({
                            ...s,
                            telephoneEntreprise: e.target.value,
                          }))
                        }
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="new-ent-ville">Ville</Label>
                      <Input
                        id="new-ent-ville"
                        value={newEntreprise.villeEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({ ...s, villeEntreprise: e.target.value }))
                        }
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid gap-1 sm:col-span-2">
                      <Label htmlFor="new-ent-cp">Code postal</Label>
                      <Input
                        id="new-ent-cp"
                        value={newEntreprise.codePostalEntreprise}
                        onChange={(e) =>
                          setNewEntreprise((s) => ({
                            ...s,
                            codePostalEntreprise: e.target.value,
                          }))
                        }
                        className="rounded-none"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={gm.actionButton}
                    disabled={isPending}
                    onClick={createEntreprise}
                  >
                    Créer l&apos;entreprise
                  </Button>
                </div>
              ) : (
                <SearchableSelect
                  value={form.entrepriseId}
                  onChange={(value) => setForm((s) => ({ ...s, entrepriseId: value }))}
                  options={entrepriseOptions}
                  placeholder="Sélectionner une entreprise"
                  searchPlaceholder="Rechercher une entreprise…"
                  emptyText="Aucune entreprise — créez-en une."
                  disabled={isPending}
                />
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>CDP associé (optionnel)</Label>
            <Select
              value={form.cdpId || "none"}
              onValueChange={(v) => setForm((s) => ({ ...s, cdpId: v === "none" ? "" : v }))}
              disabled={isPending || optionsLoading}
            >
              <SelectTrigger className="h-auto min-h-9 rounded-none bg-slate-50/70 py-2 dark:bg-background/60">
                <SelectValue
                  placeholder={
                    optionsLoading
                      ? "Chargement des CDP…"
                      : "Sélectionner un CDP (groupe cdp@jeece.fr)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {cdpOptions.map((cdp) => (
                  <SelectItem key={cdp.id} value={cdp.id}>
                    <span className="flex items-center gap-2">
                      <UserCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className="whitespace-normal wrap-anywhere">
                        {cdp.label}
                        <span className="text-muted-foreground"> — {cdp.email}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!optionsLoading && cdpOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun CDP du groupe cdp@jeece.fr n&apos;a de compte applicatif. Lancez la sync
                Google Workspace ou créez la mission sans CDP.
              </p>
            ) : null}
          </div>

          {!mission ? (
            <div className="space-y-2 rounded-none border border-border p-2.5">
              <label className="flex cursor-pointer items-start gap-2">
                <Checkbox
                  checked={reuseIntegrations}
                  onCheckedChange={(v) => {
                    const enabled = v === true;
                    setReuseIntegrations(enabled);
                    if (!enabled) {
                      setDriveFolderId("");
                      setSlackChannelId("");
                      setDriveInfosMessage(null);
                      setDriveInfosWebLink(null);
                      setDriveInfosFileName(null);
                      setNewClient(EMPTY_NEW_CLIENT);
                      setNewEntreprise(EMPTY_NEW_ENTREPRISE);
                      setShowNewClient(false);
                      setShowNewEntreprise(false);
                    }
                  }}
                  className="mt-0.5 rounded-none"
                />
                <span className="text-xs whitespace-normal wrap-anywhere">
                  <span className="font-medium">Reprendre des intégrations existantes</span>
                  <span className="block text-muted-foreground">
                    Relier un dossier Google Drive (liste depuis la racine missions) et/ou un canal
                    Slack déjà créés. Les autres missions perdront le lien sur ces ressources.
                  </span>
                </span>
              </label>

              {reuseIntegrations ? (
                <div className="grid gap-2 border-t border-border pt-2">
                  <div className="grid gap-1">
                    <Label>Dossier Drive mission</Label>
                    {driveFoldersLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Scan du Drive missions (racine → année → dossier)…
                      </p>
                    ) : (
                      <SearchableSelect
                        value={driveFolderId}
                        onChange={setDriveFolderId}
                        options={driveFolderSelectOptions}
                        placeholder="Sélectionner un dossier mission (optionnel)"
                        searchPlaceholder="Rechercher par année ou nom…"
                        emptyText={
                          driveFoldersError
                            ? "Aucun dossier — vérifiez l'accès Drive."
                            : "Aucun dossier mission trouvé sous la racine Drive."
                        }
                        disabled={isPending}
                      />
                    )}
                    {driveFoldersError ? (
                      <p className="text-xs text-amber-600 dark:text-amber-300 whitespace-normal wrap-anywhere">
                        {driveFoldersError}
                      </p>
                    ) : null}
                    {driveInfosLoading ? (
                      <p className="text-xs text-muted-foreground">
                        Lecture de infos_mission.txt…
                      </p>
                    ) : null}
                    {!driveInfosLoading && driveInfosMessage ? (
                      <p
                        className={cn(
                          "text-xs whitespace-normal wrap-anywhere",
                          driveInfosFileName && !driveInfosMessage.includes("Aucun")
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-muted-foreground",
                        )}
                      >
                        {driveInfosMessage}
                      </p>
                    ) : null}
                    {driveInfosWebLink && driveInfosFileName ? (
                      <a
                        href={driveInfosWebLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline underline-offset-2 whitespace-normal wrap-anywhere"
                      >
                        Ouvrir {driveInfosFileName} sur Drive
                      </a>
                    ) : null}
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer whitespace-normal wrap-anywhere">
                        Format attendu (infos_mission.txt)
                      </summary>
                      <pre className="mt-1 whitespace-pre-wrap wrap-anywhere rounded-none border border-border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed">
                        {`[CLIENT]
nom: …
prenom: …
telephone: …
mail: …

[ENTREPRISE]
nom: …
siren: …
mail: …
telephone: …
adresse: …
ville: …
code_postal: …
pays: France`}
                      </pre>
                    </details>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="existing-slack">Canal Slack</Label>
                    {slackChannelsLoading ? (
                      <p className="text-xs text-muted-foreground">Chargement des canaux…</p>
                    ) : (
                      <Select
                        value={slackChannelId || "none"}
                        onValueChange={(v) => setSlackChannelId(v === "none" ? "" : v)}
                      >
                        <SelectTrigger
                          id="existing-slack"
                          className="h-auto min-h-9 rounded-none bg-slate-50/70 py-2 dark:bg-background/60"
                        >
                          <SelectValue placeholder="Sélectionner un canal (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {slackChannels.map((ch) => (
                            <SelectItem key={ch.id} value={ch.id}>
                              #{ch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {slackChannelsError ? (
                      <p className="text-xs text-amber-600 dark:text-amber-300 whitespace-normal wrap-anywhere">
                        {slackChannelsError}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="rounded-none bg-slate-50/70 dark:bg-background/60"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                className="rounded-none bg-slate-50/70 dark:bg-background/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
                className="rounded-none bg-slate-50/70 dark:bg-background/60"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onSubmit}
            disabled={
              isPending || !form.missionName || !form.clientId || !form.entrepriseId
            }
            className={gm.actionButton}
          >
            {isPending ? "Enregistrement…" : mission ? "Sauvegarder" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
