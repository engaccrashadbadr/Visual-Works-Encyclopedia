import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Info, Minus, Network, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const relationLabels: Record<string, { ar: string; en: string }> = {
  appearance: { ar: "ظهور في العمل", en: "Appears in work" },
  universe_work: { ar: "ينتمي إلى العالم", en: "Belongs to universe" },
  family: { ar: "عائلة", en: "Family" },
  ally: { ar: "حليف", en: "Ally" },
  rival: { ar: "منافس", en: "Rival" },
  mentor: { ar: "مرشد", en: "Mentor" },
  team: { ar: "فريق", en: "Team" },
  co_appearance: { ar: "ظهور مشترك", en: "Co-appearance" },
};

export default function UniverseMapPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [universeId, setUniverseId] = useState<number | undefined>();
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<any>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const { data, isLoading, isError } = trpc.catalog.graph.useQuery(universeId ? { universeId } : undefined);
  const universes = data?.universes ?? [];
  const nodes = (data?.nodes ?? []) as any[];
  const edges = (data?.edges ?? []) as any[];
  const visibleNodes = useMemo(() => nodes.filter(node => !query || `${node.label} ${node.labelAr || ""}`.toLowerCase().includes(query.toLowerCase())), [nodes, query]);
  const visibleIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const universesNodes = visibleNodes.filter(node => node.kind === "universe");
  const works = visibleNodes.filter(node => node.kind === "work");
  const relations = visibleNodes.filter(node => node.kind === "relation");
  const entities = visibleNodes.filter(node => node.kind !== "work" && node.kind !== "universe" && node.kind !== "relation");
  const width = 980;
  const height = 620;
  const positions = new Map<string, { x: number; y: number }>();
  universesNodes.forEach((node, i) => positions.set(node.id, { x: width / 2 + i * 100, y: 70 }));
  works.forEach((node, i) => positions.set(node.id, { x: 170 + (i % 4) * 210, y: 180 + Math.floor(i / 4) * 150 }));
  entities.forEach((node, i) => positions.set(node.id, { x: 95 + (i % 8) * 120, y: 520 - (i % 3) * 58 }));
  relations.forEach((node, i) => positions.set(node.id, { x: 115 + (i % 8) * 120, y: 385 + (i % 2) * 30 }));
  const nodeTitle = (node: any) => ar ? (node.labelAr || node.label) : node.label;
  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => { if (event.button !== 0) return; dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; event.currentTarget.setPointerCapture(event.pointerId); };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => { const start = dragRef.current; if (!start) return; setPan({ x: start.panX + event.clientX - start.x, y: start.panY + event.clientY - start.y }); };
  const endDrag = () => { dragRef.current = null; };
  const kindLabel = (kind: string) => kind === "work" ? (ar ? "عمل" : "Work") : kind === "universe" ? (ar ? "عالم" : "Universe") : kind === "relation" ? (ar ? "علاقة" : "Relationship") : (ar ? "شخصية" : "Character");

  return <main className="min-h-screen bg-background text-foreground pb-16">
    <header className="container pt-8 pb-6">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div><Link href="/"><Button variant="ghost" className="mb-3 gap-2"><ArrowRight className="h-4 w-4" />{ar ? "العودة للموسوعة" : "Back to encyclopedia"}</Button></Link>
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/15 p-3 text-primary"><Network /></div><div><p className="text-xs uppercase tracking-[0.25em] text-primary">{ar ? "مختبر الاستكشاف" : "Exploration lab"}</p><h1 className="text-3xl md:text-5xl font-black tracking-tight">{ar ? "خريطة العوالم" : "Universe map"}</h1></div></div></div>
        <Badge variant="outline" className="hidden md:flex gap-2 px-4 py-2"><Sparkles className="h-4 w-4 text-primary" />{ar ? "استكشف بالترابط" : "Explore by connection"}</Badge>
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-3">
        <div className="relative"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} className="ps-10 h-11" placeholder={ar ? "ابحث داخل الخريطة باسم عمل أو شخصية..." : "Search this map by work or character..."} /></div>
        <div className="relative"><select aria-label={ar ? "اختر العالم" : "Choose universe"} value={data?.selectedUniverseId ?? ""} onChange={e => { setUniverseId(Number(e.target.value)); setPan({ x: 0, y: 0 }); setSelected(null); }} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{ar ? "اختر عالماً" : "Choose a universe"}</option>{universes.map((u: any) => <option key={u.id} value={u.id}>{ar ? (u.nameAr || u.name) : u.name}</option>)}</select><ChevronDown className="pointer-events-none absolute end-3 top-3 h-4 w-4 text-muted-foreground" /></div>
      </div>
    </header>
    <section className="container grid xl:grid-cols-[1fr_320px] gap-5">
      <Card className="relative overflow-hidden border-primary/20 bg-card/70 min-h-[620px]">
        <div className="absolute z-10 top-4 start-4 flex gap-2"><Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.min(1.5, z + .1))} aria-label={ar ? "تكبير" : "Zoom in"}><Plus className="h-4 w-4" /></Button><Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.max(.65, z - .1))} aria-label={ar ? "تصغير" : "Zoom out"}><Minus className="h-4 w-4" /></Button><Button size="sm" variant="secondary" onClick={() => setPan({ x: 0, y: 0 })}>{ar ? "إعادة التمركز" : "Recenter"}</Button><Badge variant="secondary" className="px-3 py-2">{Math.round(zoom * 100)}%</Badge></div>
        <div className="absolute z-10 top-4 end-4 rounded-xl border bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur flex flex-wrap gap-x-3 gap-y-1"><span><i className="inline-block h-2 w-2 rounded-full bg-cyan-400 me-1" />{ar ? "عالم" : "Universe"}</span><span><i className="inline-block h-2 w-2 rounded-full bg-primary me-1" />{ar ? "عمل" : "Work"}</span><span><i className="inline-block h-2 w-2 rounded-full bg-amber-400 me-1" />{ar ? "شخصية" : "Character"}</span><span><i className="inline-block h-2 w-2 rounded-full bg-violet-400 me-1" />{ar ? "علاقة" : "Relation"}</span></div>
        {isLoading ? <div className="grid place-items-center min-h-[620px] text-muted-foreground">{ar ? "جاري بناء الخريطة..." : "Building the map..."}</div> : isError ? <div className="grid place-items-center min-h-[620px] text-destructive">{ar ? "تعذر تحميل بيانات الخريطة." : "Could not load map data."}</div> : !nodes.length ? <div className="grid place-items-center min-h-[620px] text-muted-foreground">{ar ? "لا توجد بيانات مترابطة لهذا العالم بعد." : "No connected data for this universe yet."}</div> : <div className="overflow-auto min-h-[620px] cursor-grab active:cursor-grabbing" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={endDrag} style={{ touchAction: "none" }}><svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] h-[620px]" role="img" aria-label={ar ? "رسم بياني للعالم والعلاقات" : "Universe relationship graph"}><g transform={`translate(${pan.x + (width * (1 - zoom)) / 2} ${pan.y + (height * (1 - zoom)) / 2}) scale(${zoom})`}>
          {visibleEdges.map(edge => { const s = positions.get(edge.source); const t = positions.get(edge.target); if (!s || !t) return null; const relation = relationLabels[edge.type] || { ar: edge.label, en: edge.label }; return <g key={edge.id}><line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={edge.type === "appearance" ? "hsl(var(--border))" : edge.type === "universe_work" ? "#22d3ee" : "#a78bfa"} strokeOpacity={edge.type === "appearance" ? .38 : .72} strokeWidth={edge.type === "appearance" ? 1.5 : 2.5} /><title>{ar ? relation.ar : relation.en}</title></g>; })}
          {visibleNodes.map(node => { const p = positions.get(node.id); if (!p) return null; const isWork = node.kind === "work"; const isUniverse = node.kind === "universe"; const isRelation = node.kind === "relation"; const fill = isUniverse ? "#22d3ee" : isWork ? "hsl(var(--primary))" : isRelation ? "#a78bfa" : "#f59e0b"; return <g key={node.id} transform={`translate(${p.x} ${p.y})`} onClick={() => setSelected(node)} className="cursor-pointer"><circle r={isUniverse ? 39 : isWork ? 33 : isRelation ? 17 : 22} fill={fill} fillOpacity={selected?.id === node.id ? 1 : .88} stroke="hsl(var(--background))" strokeWidth="4" /><text y={isUniverse || isWork ? 52 : 38} textAnchor="middle" className="fill-foreground text-[12px] font-medium">{nodeTitle(node).slice(0, 20)}{nodeTitle(node).length > 20 ? "…" : ""}</text>{isWork && <text y="5" textAnchor="middle" className="fill-primary-foreground text-[11px] font-bold">{node.type?.toUpperCase()}</text>}{isRelation && <text y="4" textAnchor="middle" className="fill-white text-[9px] font-bold">↔</text>}</g>; })}
        </g></svg></div>}
      </Card>
      <Card className="p-5 h-fit xl:sticky xl:top-5"><div className="flex items-center gap-2 mb-5"><Info className="h-4 w-4 text-primary" /><h2 className="font-bold">{ar ? "تفاصيل العقدة" : "Node details"}</h2></div>{selected ? <div className="space-y-4"><div className="rounded-xl bg-muted/50 p-4"><Badge>{kindLabel(selected.kind)}</Badge><h3 className="mt-3 text-xl font-bold">{nodeTitle(selected)}</h3>{selected.role && <p className="mt-1 text-sm text-muted-foreground">{ar ? "الدور" : "Role"}: {selected.role}</p>}{selected.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.description}</p>}</div><div className="text-sm text-muted-foreground">{ar ? "عدد الروابط" : "Connections"}: {edges.filter(edge => edge.source === selected.id || edge.target === selected.id).length}</div>{selected.kind === "work" && <Link href={`/work/${selected.refId}`}><Button className="w-full">{ar ? "فتح صفحة العمل" : "Open work"}</Button></Link>}{selected.kind !== "work" && selected.kind !== "universe" && selected.kind !== "relation" && <Link href={`/entity/${selected.refId}`}><Button className="w-full">{ar ? "فتح ملف الشخصية" : "Open character"}</Button></Link>}</div> : <p className="text-sm leading-7 text-muted-foreground">{ar ? "اضغط على أي عقدة لرؤية تفاصيلها وروابطها. اسحب مساحة الخريطة للتحريك، واستخدم البحث لتقليل العناصر الظاهرة." : "Select any node to see its details and connections. Drag the map to pan, and use search to focus the view."}</p>}<div className="mt-8 border-t pt-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{ar ? "أنواع العقد والروابط" : "Node and relationship types"}</p><div className="space-y-2 text-xs text-muted-foreground"><p><span className="inline-block w-3 h-3 rounded-full bg-cyan-400 me-2 align-middle" />{ar ? "عقدة العالم" : "Universe node"}</p><p><span className="inline-block w-3 h-3 rounded-full bg-violet-400 me-2 align-middle" />{ar ? "عقدة العلاقة" : "Relationship node"}</p><p><span className="inline-block w-8 border-t border-primary align-middle me-2" />{ar ? "انتماء العمل للعالم" : "Work belongs to universe"}</p><p><span className="inline-block w-8 border-t border-border align-middle me-2" />{ar ? "ظهور الشخصية في عمل" : "Character appearance"}</p></div></div></Card>
    </section>
  </main>;
}
