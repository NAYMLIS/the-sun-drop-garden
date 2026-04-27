"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useMutation, useQuery } from "convex/react";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  LogOut,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getLayerColor,
  getLayerLabel,
  LAYER_META,
  LAYER_ORDER,
} from "@/lib/attraction-layers";
import { tourMapStyle } from "@/lib/tour-map-style";
import type {
  Attraction,
  AttractionLayer,
  CuratorMe,
  SavedList,
} from "@/lib/types";

type Tab = "layers" | "lists" | "search";

function buildPinElement(
  a: Attraction,
  onSelect: () => void
): HTMLButtonElement {
  const color = getLayerColor(a.layer);
  const isPublic = a.publicMap;
  const el = document.createElement("button");
  el.type = "button";
  el.className = "curator-pin";
  el.style.cssText = `
    background: ${color};
    width: ${isPublic ? "16px" : "12px"};
    height: ${isPublic ? "16px" : "12px"};
    border-radius: 50%;
    border: ${isPublic ? "2px solid #fff" : "1.5px solid rgba(255,255,255,0.5)"};
    cursor: pointer;
    opacity: ${isPublic ? "1" : "0.7"};
    box-shadow: 0 0 0 2px ${color}33;
    padding: 0;
    display: block;
  `;
  el.title = `${a.name} — ${getLayerLabel(a.layer)}${isPublic ? " (public)" : ""}`;
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onSelect();
  });
  return el;
}

export function CuratorMap({
  me,
  onLogout,
}: {
  me: CuratorMe;
  onLogout: () => void;
}) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // ----- Data -----
  const allAttractions = (useQuery(api.attractions.listAllForCurator) ||
    []) as Attraction[];
  const lists = (useQuery(api.savedLists.listForOwner, {
    ownerEmail: me.email,
  }) || []) as SavedList[];

  const togglePublic = useMutation(api.attractions.togglePublic);
  const updateAttraction = useMutation(api.attractions.update);
  const _addAttraction = useMutation(api.attractions.add);
  const removeAttraction = useMutation(api.attractions.remove);
  const createList = useMutation(api.savedLists.createList);
  const renameList = useMutation(api.savedLists.renameList);
  const deleteList = useMutation(api.savedLists.deleteList);
  const addToList = useMutation(api.savedLists.addToList);
  const removeFromList = useMutation(api.savedLists.removeFromList);

  // ----- UI state -----
  const [activeLayers, setActiveLayers] = useState<Set<AttractionLayer>>(
    () => new Set(LAYER_ORDER)
  );
  const [activeTab, setActiveTab] = useState<Tab>("layers");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Attraction | null>(null);
  const [newListName, setNewListName] = useState("");
  const [activeListId, setActiveListId] = useState<Id<"savedLists"> | null>(
    null
  );
  const [_showAddNewSpotForm, _setShowAddNewSpotForm] = useState(false);

  // ----- Map init -----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: tourMapStyle,
      center: [-74.5, 40],
      zoom: 1.6,
      attributionControl: { compact: true },
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ----- Filtered set (active layers + search) -----
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allAttractions.filter((a) => {
      if (a.layer && !activeLayers.has(a.layer)) {
        return false;
      }
      if (!a.layer && activeLayers.size < LAYER_ORDER.length) {
        return false;
      }
      if (!q) {
        return true;
      }
      const blob =
        `${a.name} ${a.city} ${a.address ?? ""} ${a.tags?.join(" ") ?? ""} ${a.description ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [allAttractions, activeLayers, searchQuery]);

  // ----- Render markers -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    // clear
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    for (const a of filtered) {
      const el = buildPinElement(a, () => setSelected(a));
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([a.lng, a.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [filtered]);

  // ----- Layer toggle helpers -----
  const toggleLayer = (layer: AttractionLayer) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };
  const toggleAllLayers = () => {
    setActiveLayers((prev) =>
      prev.size === LAYER_ORDER.length ? new Set() : new Set(LAYER_ORDER)
    );
  };

  // ----- Stats per layer -----
  const layerStats = useMemo(() => {
    const stats: Record<string, { total: number; public: number }> = {};
    for (const layer of LAYER_ORDER) {
      stats[layer] = { total: 0, public: 0 };
    }
    for (const a of allAttractions) {
      const k = a.layer || "awareness";
      if (!stats[k]) {
        stats[k] = { total: 0, public: 0 };
      }
      stats[k].total++;
      if (a.publicMap) {
        stats[k].public++;
      }
    }
    return stats;
  }, [allAttractions]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="z-30 flex items-center justify-between border-foreground/10 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div>
          <h1 className="font-medium text-sm tracking-wide">Curator</h1>
          <p className="text-foreground/50 text-xs">
            {me.displayName || me.email} · {filtered.length} of{" "}
            {allAttractions.length} pins
          </p>
        </div>
        <button
          aria-label="Sign out"
          className="rounded p-2 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* Map */}
      <div className="relative flex-1">
        <div className="absolute inset-0" ref={containerRef} />

        {/* Selected-pin popup */}
        {selected && (
          <PinDetail
            attraction={selected}
            lists={lists}
            onAddToList={async (listId) => {
              await addToList({
                listId,
                attractionId: selected._id as Id<"attractions">,
              });
            }}
            onClose={() => setSelected(null)}
            onDelete={async () => {
              await removeAttraction({ id: selected._id as Id<"attractions"> });
              setSelected(null);
            }}
            onRemoveFromList={async (listId) => {
              await removeFromList({
                listId,
                attractionId: selected._id as Id<"attractions">,
              });
            }}
            onTogglePublic={async () => {
              await togglePublic({
                id: selected._id as Id<"attractions">,
                publicMap: !selected.publicMap,
              });
              setSelected({ ...selected, publicMap: !selected.publicMap });
            }}
            onUpdate={async (patch) => {
              await updateAttraction({
                id: selected._id as Id<"attractions">,
                ...patch,
              });
              setSelected({ ...selected, ...patch });
            }}
            ownerEmail={me.email}
          />
        )}
      </div>

      {/* Bottom drawer */}
      <div
        className={`z-30 flex flex-col border-foreground/10 border-t bg-background/95 backdrop-blur transition-all ${
          drawerOpen ? "max-h-[60vh]" : "max-h-12"
        }`}
      >
        {/* Drawer handle / tabs */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex gap-1">
            <DrawerTab
              active={activeTab === "layers" && drawerOpen}
              icon={<Layers size={14} />}
              label="Layers"
              onClick={() => {
                setActiveTab("layers");
                setDrawerOpen(true);
              }}
            />
            <DrawerTab
              active={activeTab === "lists" && drawerOpen}
              icon={<Bookmark size={14} />}
              label={`Lists (${lists.length})`}
              onClick={() => {
                setActiveTab("lists");
                setDrawerOpen(true);
              }}
            />
            <DrawerTab
              active={activeTab === "search" && drawerOpen}
              icon={<Search size={14} />}
              label="Search"
              onClick={() => {
                setActiveTab("search");
                setDrawerOpen(true);
              }}
            />
          </div>
          <button
            aria-label={drawerOpen ? "Collapse" : "Expand"}
            className="rounded p-1.5 text-foreground/60 hover:bg-foreground/5"
            onClick={() => setDrawerOpen((v) => !v)}
            type="button"
          >
            {drawerOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {drawerOpen && (
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {activeTab === "layers" && (
              <div className="space-y-1">
                <button
                  className="mb-2 w-full rounded border border-foreground/20 px-3 py-1.5 text-foreground/70 text-xs hover:bg-foreground/5"
                  onClick={toggleAllLayers}
                  type="button"
                >
                  {activeLayers.size === LAYER_ORDER.length
                    ? "Hide all"
                    : "Show all"}
                </button>
                {LAYER_ORDER.map((layer) => {
                  const meta = LAYER_META[layer];
                  const stats = layerStats[layer] || { total: 0, public: 0 };
                  const isOn = activeLayers.has(layer);
                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition-colors ${
                        isOn
                          ? "border-foreground/20 bg-foreground/5"
                          : "border-foreground/10 opacity-50"
                      }`}
                      key={layer}
                      onClick={() => toggleLayer(layer)}
                      type="button"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="text-base">{meta.emoji}</span>
                        <div>
                          <div className="font-medium text-sm">
                            {meta.label}
                          </div>
                          <div className="text-foreground/40 text-xs">
                            {meta.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-foreground/50">
                          {stats.total}
                        </span>
                        <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-foreground/70">
                          {stats.public} public
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "lists" && (
              <div className="space-y-2">
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newListName.trim()) {
                      return;
                    }
                    await createList({
                      ownerEmail: me.email,
                      name: newListName.trim(),
                    });
                    setNewListName("");
                  }}
                >
                  <input
                    className="flex-1 rounded border border-foreground/20 bg-transparent px-3 py-1.5 text-sm focus:border-foreground/50 focus:outline-none"
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name…"
                    value={newListName}
                  />
                  <button
                    className="rounded bg-foreground px-3 py-1.5 text-background text-sm hover:opacity-80"
                    type="submit"
                  >
                    <Plus size={14} />
                  </button>
                </form>
                {lists.length === 0 ? (
                  <p className="py-4 text-center text-foreground/40 text-xs">
                    No lists yet. Create one to start curating.
                  </p>
                ) : (
                  lists.map((list) => (
                    <ListRow
                      activeListId={activeListId}
                      key={list._id}
                      list={list}
                      onActivate={() =>
                        setActiveListId(
                          activeListId === (list._id as Id<"savedLists">)
                            ? null
                            : (list._id as Id<"savedLists">)
                        )
                      }
                      onDelete={async () => {
                        // biome-ignore lint/suspicious/noAlert: simple destructive confirm; replace with custom modal in a future polish pass
                        if (window.confirm(`Delete list "${list.name}"?`)) {
                          await deleteList({
                            id: list._id as Id<"savedLists">,
                          });
                          if (activeListId === list._id) {
                            setActiveListId(null);
                          }
                        }
                      }}
                      onRename={async (name) => {
                        await renameList({
                          id: list._id as Id<"savedLists">,
                          name,
                        });
                      }}
                    />
                  ))
                )}

                {activeListId && (
                  <ActiveListItems
                    listId={activeListId}
                    onSelect={(a) => setSelected(a)}
                  />
                )}
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-foreground/40"
                    size={14}
                  />
                  <input
                    className="w-full rounded border border-foreground/20 bg-transparent py-1.5 pr-8 pl-9 text-sm focus:border-foreground/50 focus:outline-none"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, city, tag…"
                    value={searchQuery}
                  />
                  {searchQuery && (
                    <button
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {filtered.slice(0, 50).map((a) => (
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-foreground/5"
                      key={a._id}
                      onClick={() => {
                        setSelected(a);
                        const map = mapRef.current;
                        if (map) {
                          map.flyTo({
                            center: [a.lng, a.lat],
                            zoom: 13,
                            duration: 1200,
                          });
                        }
                      }}
                      type="button"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: getLayerColor(a.layer) }}
                      />
                      <span className="flex-1 truncate">{a.name}</span>
                      <span className="text-foreground/40 text-xs">
                        {a.city}
                      </span>
                      {a.publicMap && (
                        <Eye className="text-foreground/40" size={12} />
                      )}
                    </button>
                  ))}
                  {filtered.length > 50 && (
                    <p className="py-2 text-center text-foreground/40 text-xs">
                      Showing first 50 of {filtered.length} matches
                    </p>
                  )}
                  {filtered.length === 0 && searchQuery && (
                    <p className="py-4 text-center text-foreground/40 text-xs">
                      No matches.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .curator-pin:hover { transform: scale(1.4); transition: transform 0.15s; }
      `}</style>
    </div>
  );
}

/* ============ Sub-components ============ */

function DrawerTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function ListRow({
  activeListId,
  list,
  onActivate,
  onDelete,
  onRename,
}: {
  activeListId: Id<"savedLists"> | null;
  list: SavedList;
  onActivate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const isActive = activeListId === (list._id as unknown as Id<"savedLists">);

  return (
    <div
      className={`rounded border px-3 py-2 transition-colors ${
        isActive
          ? "border-foreground/30 bg-foreground/5"
          : "border-foreground/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            className="flex-1 rounded border border-foreground/30 bg-transparent px-2 py-1 text-sm focus:outline-none"
            onBlur={() => {
              if (draft.trim() && draft !== list.name) {
                onRename(draft.trim());
              }
              setEditing(false);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (draft.trim() && draft !== list.name) {
                  onRename(draft.trim());
                }
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(list.name);
                setEditing(false);
              }
            }}
            value={draft}
          />
        ) : (
          <button
            className="flex flex-1 items-center gap-2 text-left text-sm"
            onClick={onActivate}
            type="button"
          >
            <Bookmark size={14} />
            <span className="font-medium">{list.name}</span>
            <span className="text-foreground/40 text-xs">
              {list.count ?? 0}
            </span>
          </button>
        )}
        <button
          aria-label="Rename"
          className="rounded p-1 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          onClick={() => setEditing(true)}
          type="button"
        >
          ✏️
        </button>
        <button
          aria-label="Delete list"
          className="rounded p-1 text-foreground/40 hover:bg-red-500/10 hover:text-red-500"
          onClick={onDelete}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ActiveListItems({
  listId,
  onSelect,
}: {
  listId: Id<"savedLists">;
  onSelect: (a: Attraction) => void;
}) {
  const items = (useQuery(api.savedLists.itemsForList, { listId }) ||
    []) as Attraction[];
  if (items.length === 0) {
    return (
      <p className="py-3 pl-4 text-foreground/40 text-xs">
        Empty list — click any pin to add it here.
      </p>
    );
  }
  return (
    <div className="border-foreground/10 border-l pl-2">
      {items.map((a) => (
        <button
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-foreground/5"
          key={a._id}
          onClick={() => onSelect(a)}
          type="button"
        >
          <span
            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: getLayerColor(a.layer) }}
          />
          <span className="flex-1 truncate">{a.name}</span>
          {a.publicMap && <Eye className="text-foreground/40" size={10} />}
        </button>
      ))}
    </div>
  );
}

function PinDetail({
  attraction,
  lists,
  onAddToList,
  onClose,
  onDelete,
  onRemoveFromList,
  onTogglePublic,
  onUpdate,
  ownerEmail,
}: {
  attraction: Attraction;
  lists: SavedList[];
  onAddToList: (listId: Id<"savedLists">) => Promise<void>;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onRemoveFromList: (listId: Id<"savedLists">) => Promise<void>;
  onTogglePublic: () => Promise<void>;
  onUpdate: (patch: {
    layer?: AttractionLayer;
    tags?: string[];
    notes?: string;
    description?: string;
  }) => Promise<void>;
  ownerEmail: string;
}) {
  const containingLists = (useQuery(api.savedLists.listsContainingAttraction, {
    ownerEmail,
    attractionId: attraction._id as Id<"attractions">,
  }) || []) as SavedList[];
  const containingIds = new Set(
    containingLists.map((l) => l._id as unknown as string)
  );
  const [editingTags, setEditingTags] = useState(false);
  const [tagDraft, setTagDraft] = useState((attraction.tags || []).join(", "));
  const [editingLayer, setEditingLayer] = useState(false);
  const layerMeta =
    LAYER_META[(attraction.layer as AttractionLayer) || "awareness"];

  return (
    <div className="absolute inset-x-2 bottom-2 z-40 max-h-[55vh] overflow-y-auto rounded-lg border border-foreground/10 bg-background/95 p-4 shadow-2xl backdrop-blur md:inset-x-auto md:right-4 md:bottom-4 md:w-96">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-medium text-base leading-tight">
            {attraction.name}
          </h3>
          {attraction.address && (
            <p className="mt-0.5 text-foreground/50 text-xs">
              {attraction.address}
            </p>
          )}
          <p className="mt-0.5 text-foreground/40 text-xs">{attraction.city}</p>
        </div>
        <button
          aria-label="Close"
          className="rounded p-1 text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      {/* Public toggle */}
      <button
        className={`mb-3 flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors ${
          attraction.publicMap
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
        }`}
        onClick={onTogglePublic}
        type="button"
      >
        <span className="flex items-center gap-2">
          {attraction.publicMap ? <Eye size={14} /> : <EyeOff size={14} />}
          {attraction.publicMap
            ? "Visible on public tour map"
            : "Hidden from public map"}
        </span>
        <span className="text-xs">{attraction.publicMap ? "ON" : "OFF"}</span>
      </button>

      {/* Layer */}
      <div className="mb-3">
        <p className="mb-1 text-foreground/50 text-xs uppercase tracking-wider">
          Layer
        </p>
        {editingLayer ? (
          <div className="grid grid-cols-2 gap-1">
            {LAYER_ORDER.map((l) => {
              const meta = LAYER_META[l];
              return (
                <button
                  className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs ${
                    attraction.layer === l
                      ? "border-foreground/40 bg-foreground/10"
                      : "border-foreground/10"
                  }`}
                  key={l}
                  onClick={async () => {
                    await onUpdate({ layer: l });
                    setEditingLayer(false);
                  }}
                  type="button"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            className="flex w-full items-center gap-2 rounded border border-foreground/10 px-2 py-1.5 text-left text-sm hover:bg-foreground/5"
            onClick={() => setEditingLayer(true)}
            type="button"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: layerMeta.color }}
            />
            {layerMeta.emoji} {layerMeta.label}
            <span className="ml-auto text-foreground/40 text-xs">change</span>
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="mb-3">
        <p className="mb-1 text-foreground/50 text-xs uppercase tracking-wider">
          Tags
        </p>
        {editingTags ? (
          <div className="space-y-1">
            <input
              autoFocus
              className="w-full rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm focus:border-foreground/50 focus:outline-none"
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="comma, separated, tags"
              value={tagDraft}
            />
            <div className="flex flex-wrap gap-1">
              {layerMeta.suggestedTags.map((t) => (
                <button
                  className="rounded border border-foreground/15 px-1.5 py-0.5 text-foreground/60 text-xs hover:bg-foreground/5"
                  key={t}
                  onClick={() => setTagDraft((v) => (v ? `${v}, ${t}` : t))}
                  type="button"
                >
                  + {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded bg-foreground px-3 py-1 text-background text-xs"
                onClick={async () => {
                  const tags = tagDraft
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean);
                  await onUpdate({ tags });
                  setEditingTags(false);
                }}
                type="button"
              >
                Save
              </button>
              <button
                className="rounded border border-foreground/20 px-3 py-1 text-foreground/60 text-xs"
                onClick={() => {
                  setTagDraft((attraction.tags || []).join(", "));
                  setEditingTags(false);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex w-full flex-wrap gap-1 rounded border border-foreground/10 px-2 py-1.5 text-left hover:bg-foreground/5"
            onClick={() => setEditingTags(true)}
            type="button"
          >
            {(attraction.tags || []).length === 0 ? (
              <span className="text-foreground/40 text-xs">+ add tags</span>
            ) : (
              attraction.tags?.map((t) => (
                <span
                  className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs"
                  key={t}
                >
                  <Tag className="-mt-0.5 mr-1 inline" size={9} />
                  {t}
                </span>
              ))
            )}
          </button>
        )}
      </div>

      {/* Saved lists */}
      <div className="mb-3">
        <p className="mb-1 text-foreground/50 text-xs uppercase tracking-wider">
          In your lists
        </p>
        {lists.length === 0 ? (
          <p className="text-foreground/40 text-xs">
            Create a list in the “Lists” tab to start grouping pins.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {lists.map((list) => {
              const inList = containingIds.has(list._id as unknown as string);
              return (
                <button
                  className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    inList
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                  }`}
                  key={list._id}
                  onClick={async () => {
                    if (inList) {
                      await onRemoveFromList(list._id as Id<"savedLists">);
                    } else {
                      await onAddToList(list._id as Id<"savedLists">);
                    }
                  }}
                  type="button"
                >
                  {inList ? "✓ " : "+ "}
                  {list.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Description / notes */}
      {attraction.description && (
        <p className="mb-3 text-foreground/70 text-xs leading-relaxed">
          {attraction.description}
        </p>
      )}

      <button
        className="mt-2 flex items-center gap-1 text-foreground/40 text-xs hover:text-red-500"
        onClick={async () => {
          // biome-ignore lint/suspicious/noAlert: simple destructive confirm; replace with custom modal in a future polish pass
          const ok = window.confirm(
            `Delete pin "${attraction.name}"? This cannot be undone.`
          );
          if (ok) {
            await onDelete();
          }
        }}
        type="button"
      >
        <Trash2 size={11} />
        Delete pin
      </button>
    </div>
  );
}
