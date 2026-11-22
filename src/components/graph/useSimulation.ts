import { useEffect, useRef } from 'react';
import { ForceSimulation } from '@/lib/layout/simulation';
import { useGraphStore, useActiveWorkspace } from '@/store/graphStore';

/** Drives physics outside React state and publishes throttled position batches. */
export function useSimulation(enabled: boolean): React.MutableRefObject<ForceSimulation> {
  const workspace = useActiveWorkspace();
  const graph = workspace.graph;
  const settings = workspace.settings.layout;
  const simulation = useRef(new ForceSimulation(settings));
  const frame = useRef(0);
  const graphRef = useRef(graph);

  useEffect(() => { graphRef.current = graph; }, [graph]);

  useEffect(() => {
    simulation.current.initialize(graph, new Map(graph.nodes.map((node) => [node.id, node.position])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, graph.nodes.length]);

  useEffect(() => {
    simulation.current.syncGraph(graph, true);
    simulation.current.setSettings(settings);
  }, [graph, settings]);

  useEffect(() => {
    if (!enabled || settings.kind !== 'force' || !settings.running) return;
    let raf = 0;
    const tick = (): void => {
      frame.current += 1;
      simulation.current.step(1);
      if (frame.current % 8 === 0 && !simulation.current.isSettled()) {
        useGraphStore.getState().batchMoveNodes(simulation.current.getPositions());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, settings.kind, settings.running]);

  return simulation;
}
