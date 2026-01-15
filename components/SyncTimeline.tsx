
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Task, SyncConnection } from '../types';

interface SyncTimelineProps {
  tasks: Task[];
}

const SyncTimeline: React.FC<SyncTimelineProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 300;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const nodes = tasks.map((t, i) => ({
      ...t,
      x: margin.left + (i * (width - margin.left - margin.right)) / (tasks.length - 1 || 1),
      y: height / 2 + (Math.sin(i) * 50)
    }));

    // Draw grid lines
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(0, width, 50))
      .enter()
      .append("line")
      .attr("x1", d => d)
      .attr("x2", d => d)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1);

    // Connections (Simulated Synchronicity)
    const links = nodes.slice(0, -1).map((n, i) => ({
      source: n,
      target: nodes[i + 1],
      active: n.synced && nodes[i+1].synced
    }));

    svg.selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("d", d => `M ${d.source.x} ${d.source.y} Q ${(d.source.x + d.target.x) / 2} ${height} ${d.target.x} ${d.target.y}`)
      .attr("fill", "none")
      .attr("stroke", d => d.active ? "#06b6d4" : "#334155")
      .attr("stroke-width", d => d.active ? 2 : 1)
      .attr("stroke-dasharray", d => d.active ? "none" : "4,4")
      .attr("opacity", 0.5);

    // Task Nodes
    const nodeGroups = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        if (d.category === 'work') return '#3b82f6';
        if (d.category === 'personal') return '#10b981';
        if (d.category === 'growth') return '#8b5cf6';
        return '#64748b';
      })
      .attr("stroke", "#020617")
      .attr("stroke-width", 2);

    nodeGroups.append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .text(d => d.title.length > 10 ? d.title.substring(0, 8) + '...' : d.title);

  }, [tasks]);

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
          <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse" />
          Neural Sync Map
        </h4>
        <span className="text-[10px] mono text-slate-600">Active Nodes: {tasks.filter(t => t.synced).length}/{tasks.length}</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 800 300" className="w-full h-auto" />
    </div>
  );
};

export default SyncTimeline;
