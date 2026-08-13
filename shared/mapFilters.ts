export type MapNode = { id: string; kind: string; label?: string | null; labelAr?: string | null; type?: string | null };
export type MapEdge = { id: string; source: string; target: string; type: string; label?: string | null };

export function toggleMapFilter(value: string, selected: string[], allValues: string[]) {
  const active = selected.length ? selected : allValues;
  const next = active.includes(value) ? active.filter(item => item !== value) : [...active, value];
  return next.length === allValues.length ? [] : next;
}

export function filterMapGraph(nodes: MapNode[], edges: MapEdge[], selectedKinds: string[], selectedRelations: string[], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNodes = nodes.filter(node => {
    const kindMatches = !selectedKinds.length || selectedKinds.includes(node.kind);
    const text = `${node.label ?? ""} ${node.labelAr ?? ""}`.toLowerCase();
    return kindMatches && (!normalizedQuery || text.includes(normalizedQuery));
  });
  const visibleIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(edge => (!selectedRelations.length || selectedRelations.includes(edge.type)) && visibleIds.has(edge.source) && visibleIds.has(edge.target));
  return { visibleNodes, visibleEdges };
}
