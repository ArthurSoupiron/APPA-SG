"use client";

import { Panel, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";

import {
  clearSearchHighlight,
  type DriveFlowStore,
  type DriveRevealViewport,
  revealDriveSearchResult,
} from "./drive-graph-expand";
import { type DriveSearchHit, fetchDriveSearch, type SharedDrive } from "./mon-google-drive-api";

export function DriveTreeSearch({ drives }: { drives: SharedDrive[] }) {
  const { getNode, getNodes, getEdges, setNodes, setEdges, getNodesBounds, fitBounds, setCenter } =
    useReactFlow();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DriveSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyReveal, setBusyReveal] = useState(false);
  const revealLock = useRef(false);

  const store: DriveFlowStore = useMemo(
    () => ({ getNode, getNodes, getEdges, setNodes, setEdges }),
    [getNode, getNodes, getEdges, setNodes, setEdges],
  );

  const viewport: DriveRevealViewport = useMemo(
    () => ({ getNode, getNodesBounds, fitBounds, setCenter }),
    [getNode, getNodesBounds, fitBounds, setCenter],
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim() === "") {
        setResults([]);
        clearSearchHighlight(store);
      }
    },
    [store],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = window.setTimeout(() => {
      void (async () => {
        const hits = await fetchDriveSearch(q);
        setResults(hits);
        setLoading(false);
      })();
    }, 320);
    return () => window.clearTimeout(id);
  }, [query]);

  const onSelectHit = useCallback(
    async (hit: DriveSearchHit) => {
      if (revealLock.current) return;
      const driveKnown = drives.some((d) => d.id === hit.driveId);
      if (!driveKnown) return;
      revealLock.current = true;
      setBusyReveal(true);
      try {
        await revealDriveSearchResult(store, hit, viewport);
        setQuery("");
        setResults([]);
      } finally {
        revealLock.current = false;
        setBusyReveal(false);
      }
    },
    [drives, store, viewport],
  );

  return (
    <Panel
      position="top-right"
      className="m-2 mr-3 w-[min(100%,26rem)] max-w-[min(26rem,calc(100vw-5rem))] rounded-lg border border-border bg-card/98 p-1 shadow-md backdrop-blur-sm"
    >
      <Command shouldFilter={false} className="rounded-md border-0 bg-transparent">
        <CommandInput
          placeholder="Rechercher un fichier ou dossier (Drive)…"
          value={query}
          onValueChange={onQueryChange}
          disabled={busyReveal}
        />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Recherche…
            </div>
          ) : null}
          {!loading && query.trim().length >= 2 && results.length === 0 ? (
            <CommandEmpty>Aucun résultat pour « {query.trim()} ».</CommandEmpty>
          ) : null}
          {!loading && results.length > 0 ? (
            <CommandGroup heading="Résultats">
              {results.map((hit) => (
                <CommandItem
                  key={`${hit.driveId}-${hit.id}`}
                  value={`${hit.driveId}-${hit.id}`}
                  disabled={busyReveal}
                  onSelect={() => void onSelectHit(hit)}
                  className="flex cursor-pointer flex-col items-stretch gap-1 py-2.5"
                >
                  <span className="font-medium whitespace-normal [overflow-wrap:anywhere]">
                    {hit.name}
                  </span>
                  <span className="text-muted-foreground text-xs leading-snug whitespace-normal [overflow-wrap:anywhere]">
                    {hit.pathHint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
      {query.trim().length > 0 ? (
        <button
          type="button"
          className="mt-1 w-full rounded-md px-2 py-1 text-center text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
          onClick={() => {
            setQuery("");
            setResults([]);
            clearSearchHighlight(store);
          }}
        >
          Effacer la recherche et le surlignage
        </button>
      ) : null}
    </Panel>
  );
}
