import { useCallback, useEffect, useRef, useState } from 'react';
import type { GraphData, GraphVisualSettings } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useSimulation } from './useSimulation';

interface Graph2DProps {
  graph: GraphData;
  visual: GraphVisualSettings;
  focusId: string | null;
  selectedIds: string[];
  hoveredId: string | null;
}

interface Transform { x: number; y: number; scale: number }

export function Graph2D({ graph, visual, focusId, selectedIds, hoveredId }: Graph2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulation = useSimulation(true);
  const transform = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const drag = useRef<{ nodeId?: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const selectNode = useGraphStore((state) => state.selectNode);
  const moveNode = useGraphStore((state) => state.moveNode);
  const openContextMenu = useUIStore((state) => state.openContextMenu);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const project = useCallback((x: number, y: number): [number, number] => {
    const { width, height } = size;
    return [width / 2 + (x + transform.current.x) * transform.current.scale, height / 2 + (y + transform.current.y) * transform.current.scale];
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    context.fillStyle = visual.background === 'graphite' ? '#111317' : '#08090b';
    context.fillRect(0, 0, size.width, size.height);

    const positions = simulation.current.getPositions();
    const selected = new Set(selectedIds);
    for (const edge of graph.edges) {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) continue;
      const [x1, y1] = project(source.x, source.z);
      const [x2, y2] = project(target.x, target.z);
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      const highlighted = selected.has(edge.source) || selected.has(edge.target);
      context.strokeStyle = highlighted ? 'rgba(79,216,232,0.8)' : `rgba(110,128,146,${0.15 + edge.strength * 0.35})`;
      context.lineWidth = highlighted ? 1.8 : 0.7 + edge.strength;
      context.stroke();
    }
    for (const node of graph.nodes) {
      const position = positions.get(node.id) ?? node.position;
      const [x, y] = project(position.x, position.z);
      const radius = (4 + node.importance * 7) * transform.current.scale;
      const color = node.color ?? NODE_TYPE_INFO[node.type].color;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `${color}33`;
      context.fill();
      context.strokeStyle = selected.has(node.id) || hoveredId === node.id ? '#ffffff' : color;
      context.lineWidth = selected.has(node.id) ? 2 : 1;
      context.stroke();
      if (visual.showLabels && (node.importance > 0.55 || hoveredId === node.id || selected.has(node.id))) {
        context.fillStyle = '#b8bec7';
        context.font = '10px Inter, sans-serif';
        context.fillText(node.title, x + radius + 5, y + 3);
      }
    }
    if (focusId) {
      const node = graph.nodes.find((item) => item.id === focusId);
      const position = node && positions.get(node.id);
      if (position) {
        const [x, y] = project(position.x, position.z);
        context.beginPath();
        context.arc(x, y, 22, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(79,216,232,0.45)';
        context.lineWidth = 1;
        context.stroke();
      }
    }
  }, [size, graph, selectedIds, hoveredId, focusId, visual, project, simulation]);

  const pickNode = (clientX: number, clientY: number): string | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const positions = simulation.current.getPositions();
    let closest: { id: string; distance: number } | null = null;
    for (const node of graph.nodes) {
      const position = positions.get(node.id) ?? node.position;
      const [x, y] = project(position.x, position.z);
      const distance = Math.hypot(x - (clientX - rect.left), y - (clientY - rect.top));
      if (distance < 14 && (!closest || distance < closest.distance)) closest = { id: node.id, distance };
    }
    return closest?.id ?? null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
      onPointerDown={(event) => {
        const id = pickNode(event.clientX, event.clientY);
        drag.current = { nodeId: id ?? undefined, startX: event.clientX, startY: event.clientY, originX: transform.current.x, originY: transform.current.y };
        if (id) selectNode(id, event.shiftKey);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const dx = event.clientX - drag.current.startX;
        const dy = event.clientY - drag.current.startY;
        if (drag.current.nodeId) {
          const position = simulation.current.getPosition(drag.current.nodeId);
          if (position) {
            const next = { ...position, x: position.x + dx / (12 * transform.current.scale), z: position.z + dy / (12 * transform.current.scale) };
            simulation.current.setPosition(drag.current.nodeId, next);
            moveNode(drag.current.nodeId, next);
          }
          drag.current.startX = event.clientX;
          drag.current.startY = event.clientY;
        } else {
          transform.current.x = drag.current.originX + dx / transform.current.scale;
          transform.current.y = drag.current.originY + dy / transform.current.scale;
        }
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerLeave={() => { drag.current = null; }}
      onWheel={(event) => {
        event.preventDefault();
        transform.current.scale = Math.min(4, Math.max(0.15, transform.current.scale * (event.deltaY > 0 ? 0.92 : 1.08)));
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        const id = pickNode(event.clientX, event.clientY);
        if (id) selectNode(id);
        openContextMenu({ x: event.clientX, y: event.clientY, target: id ? 'node' : 'graph', targetId: id ?? undefined });
      }}
      aria-label="Two dimensional graph canvas"
    />
  );
}
