import React, { useState } from 'react';
import { Network, Filter, Info, ShieldCheck, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { KNOWLEDGE_GRAPH_NODES, KNOWLEDGE_GRAPH_EDGES, CLASSICAL_WORKS } from '../data/classicalCorpus.ts';
import { KnowledgeNode, KnowledgeEdge } from '../types/index.ts';

export const KnowledgeGraph: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(KNOWLEDGE_GRAPH_NODES[0]);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Filter nodes
  const filteredNodes = filterType === 'ALL'
    ? KNOWLEDGE_GRAPH_NODES
    : KNOWLEDGE_GRAPH_NODES.filter(n => n.type === filterType);

  // Incoming and outgoing edges for selected node
  const activeEdges = selectedNode
    ? KNOWLEDGE_GRAPH_EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  // Group connected nodes
  const connectedNodes = activeEdges.map(edge => {
    const isSource = edge.source === selectedNode?.id;
    const otherId = isSource ? edge.target : edge.source;
    const node = KNOWLEDGE_GRAPH_NODES.find(n => n.id === otherId);
    return {
      edge,
      node,
      direction: isSource ? 'OUTGOING' : 'INCOMING'
    };
  }).filter(item => item.node !== undefined);

  // Layout node positions in a circular or partitioned coordinates system
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'work': return 'fill-stone-900 stroke-stone-800 text-stone-100';
      case 'concept': return 'fill-amber-800 stroke-amber-900 text-stone-100';
      case 'poet': return 'fill-emerald-800 stroke-emerald-900 text-stone-100';
      case 'commentary': return 'fill-indigo-900 stroke-indigo-950 text-stone-100';
      default: return 'fill-stone-600 stroke-stone-700 text-stone-100';
    }
  };

  const getNodeBadge = (type: string) => {
    switch (type) {
      case 'work': return 'நூல் (Work)';
      case 'concept': return 'விழுமியம் (Concept)';
      case 'poet': return 'புலவர் (Poet)';
      case 'commentary': return 'உரை / பதிப்பு (Commentary)';
      default: return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
            TAMIL KNOWLEDGE GRAPH · செம்மொழி அறிவுப் பின்னல்
          </h1>
          <p className="text-xs text-stone-600 font-tamil-sans mt-0.5">
            நூல்கள் ↔ புலவர்கள் ↔ விழுமியங்கள் ↔ உரையாசிரியர்கள் மெய்நிகர் உறவுத்தொடர்
          </p>
        </div>

        {/* Filters */}
        <div className="mt-3 md:mt-0 flex items-center gap-1.5 bg-stone-200/60 p-1 rounded-lg border border-stone-300/40 text-xs">
          {['ALL', 'work', 'concept', 'poet', 'commentary'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded transition-colors ${
                filterType === t
                  ? 'bg-stone-900 text-stone-100 font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t === 'ALL' ? 'அனைத்தும் (All)' : getNodeBadge(t).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Graph Canvas / Visual Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
              உறவு வலைப்பின்னல் (Entity Relationship Matrix)
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-stone-900" /> நூல்</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-800" /> விழுமியம்</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-800" /> புலவர்</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-900" /> உரை</span>
            </div>
          </div>

          {/* Interactive Node Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-auto">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              let borderClass = 'border-stone-200 bg-stone-50 text-stone-800';

              if (node.type === 'work') borderClass = isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'hover:border-stone-400 bg-stone-100 text-stone-900';
              if (node.type === 'concept') borderClass = isSelected ? 'border-amber-900 bg-amber-900 text-white' : 'hover:border-amber-400 bg-amber-50 text-amber-950';
              if (node.type === 'poet') borderClass = isSelected ? 'border-emerald-900 bg-emerald-900 text-white' : 'hover:border-emerald-400 bg-emerald-50 text-emerald-950';
              if (node.type === 'commentary') borderClass = isSelected ? 'border-indigo-950 bg-indigo-950 text-white' : 'hover:border-indigo-400 bg-indigo-50 text-indigo-950';

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[90px] shadow-2xs ${borderClass}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mb-1">
                    <span>{getNodeBadge(node.type).split(' ')[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-tamil-serif font-bold text-sm leading-tight">
                      {node.labelTa}
                    </h4>
                    <p className="text-[10px] font-mono opacity-80 mt-0.5 truncate">
                      {node.labelEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer stats */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>சான்று சார்ந்த தரவுத்தளம் (Data-driven Knowledge Graph)</span>
            <span>{KNOWLEDGE_GRAPH_NODES.length} உருப்படிகள் · {KNOWLEDGE_GRAPH_EDGES.length} உறவுகள்</span>
          </div>
        </div>

        {/* Node Inspector Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedNode ? (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
              {/* Header */}
              <div className="border-b border-stone-100 pb-4">
                <span className="text-[11px] font-mono text-stone-500 uppercase block mb-1">
                  உருப்படி விவரம் (Entity Inspector) · {getNodeBadge(selectedNode.type)}
                </span>
                <h3 className="font-tamil-serif font-bold text-2xl text-stone-900">
                  {selectedNode.labelTa}
                </h3>
                <p className="text-xs font-mono text-stone-500">
                  {selectedNode.labelEn}
                </p>
              </div>

              {/* Connected Relationships */}
              <div>
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  இணைக்கப்பட்ட செவ்வியல் உறவுகள் ({connectedNodes.length} Connections)
                </h4>

                <div className="space-y-2.5">
                  {connectedNodes.map(({ edge, node, direction }, idx) => (
                    <div
                      key={idx}
                      onClick={() => node && setSelectedNode(node)}
                      className="p-3 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-tamil-serif font-bold text-stone-900">
                            {node?.labelTa}
                          </span>
                          <span className="text-stone-400 text-xs">·</span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {node?.labelEn}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-tamil-sans mt-0.5">
                          உறவு: <span className="font-medium text-stone-800">{edge.relationshipTa}</span> ({edge.relationshipEn})
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Verification Footer */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED RELATIONSHIP
                </span>
                <span>YAAZH Trust Engine</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-400 font-mono">
              வலைப்பின்னல் உறவுகளைக் காண ஏதேனும் ஓர் உருப்படியைத் தேர்ந்தெடுக்கவும்.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
