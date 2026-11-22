import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphData, GraphVisualSettings } from '@/types';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { useSimulation } from './useSimulation';

interface SceneProps {
  graph: GraphData;
  visual: GraphVisualSettings;
  focusId: string | null;
  selectedIds: string[];
  hoveredId: string | null;
}

function NodeField({ graph, visual, selectedIds, hoveredId }: SceneProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const simulation = useSimulation(true);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setHovered = useGraphStore((state) => state.setHovered);
  const openContextMenu = useUIStore((state) => state.openContextMenu);
  const openModal = useUIStore((state) => state.openModal);
  const activeTool = useUIStore((state) => state.activeTool);
  const connectionSource = useGraphStore((state) => state.connectionSourceId);
  const setConnectionSource = useGraphStore((state) => state.setConnectionSource);
  const createEdge = useGraphStore((state) => state.createEdge);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const clock = useRef(0);

  useFrame((_, delta) => {
    const instanced = mesh.current;
    if (!instanced) return;
    clock.current += delta;
    const positions = simulation.current.getPositions();
    graph.nodes.forEach((node, index) => {
      const position = positions.get(node.id) ?? node.position;
      const isSelected = selected.has(node.id);
      const isHovered = hoveredId === node.id;
      const pulse = isSelected ? 1 + Math.sin(clock.current * 4) * 0.06 : 1;
      const scale = (0.75 + node.importance * 1.15) * pulse * visual.nodeScale * (isHovered ? 1.18 : 1);
      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
      const color = new THREE.Color(node.color ?? NODE_TYPE_INFO[node.type].color);
      if (isSelected) color.lerp(new THREE.Color('#ffffff'), 0.35);
      if (node.pinned) color.lerp(new THREE.Color('#e3b35c'), 0.3);
      instanced.setColorAt(index, color);
    });
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  });

  const nodeIdAt = (event: ThreeEvent<MouseEvent>): string | null => {
    if (event.instanceId === undefined) return null;
    return graph.nodes[event.instanceId]?.id ?? null;
  };

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(1, graph.nodes.length)]}
      onPointerOver={(event) => { event.stopPropagation(); const id = nodeIdAt(event); if (id) setHovered(id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(null); document.body.style.cursor = ''; }}
      onClick={(event) => {
        event.stopPropagation();
        const id = nodeIdAt(event);
        if (!id) return;
        if (activeTool === 'connect' && connectionSource && connectionSource !== id) {
          createEdge(connectionSource, id);
        } else if (activeTool === 'connect') {
          setConnectionSource(id);
        } else {
          selectNode(id, event.nativeEvent.shiftKey);
        }
      }}
      onDoubleClick={(event) => {
        const id = nodeIdAt(event);
        if (id) { selectNode(id); openModal('settings'); }
      }}
      onContextMenu={(event) => {
        event.stopPropagation();
        const id = nodeIdAt(event);
        if (!id) return;
        selectNode(id);
        openContextMenu({ x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, target: 'node', targetId: id });
      }}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial roughness={0.32} metalness={0.22} emissive="#0a1216" emissiveIntensity={0.4} />
    </instancedMesh>
  );
}

function EdgeField({ graph, visual }: { graph: GraphData; visual: GraphVisualSettings }) {
  const simulation = useSimulation(false);
  const geometry = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(Math.max(1, graph.edges.length) * 6), [graph.edges.length]);
  const colors = useMemo(() => {
    const array = new Float32Array(Math.max(1, graph.edges.length) * 6);
    for (let i = 0; i < graph.edges.length; i += 1) {
      const color = new THREE.Color('#42505d');
      array.set([color.r, color.g, color.b, color.r, color.g, color.b], i * 6);
    }
    return array;
  }, [graph.edges]);

  useFrame(() => {
    if (!geometry.current) return;
    const simPositions = simulation.current.getPositions();
    graph.edges.forEach((edge, index) => {
      const source = simPositions.get(edge.source) ?? graph.nodes.find((node) => node.id === edge.source)?.position;
      const target = simPositions.get(edge.target) ?? graph.nodes.find((node) => node.id === edge.target)?.position;
      if (!source || !target) return;
      positions.set([source.x, source.y, source.z, target.x, target.y, target.z], index * 6);
    });
    const attribute = geometry.current.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (attribute) attribute.needsUpdate = true;
  });

  return (
    <lineSegments>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={visual.edgeOpacity} depthWrite={false} />
    </lineSegments>
  );
}

function Labels({ graph, visual }: { graph: GraphData; visual: GraphVisualSettings }) {
  if (!visual.showLabels) return null;
  return (
    <>
      {graph.nodes.filter((node) => node.importance > 0.72).slice(0, 40).map((node) => (
        <Html key={node.id} position={[node.position.x, node.position.y + 2.2, node.position.z]} center distanceFactor={60} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300">{node.title}</span>
        </Html>
      ))}
    </>
  );
}

function CameraRig({ focusId, graph }: { focusId: string | null; graph: GraphData }) {
  const { camera } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const target = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(() => {
    if (!focusId) return;
    const node = graph.nodes.find((item) => item.id === focusId);
    if (!node) return;
    target.current.set(node.position.x, node.position.y, node.position.z);
    camera.position.lerp(new THREE.Vector3(node.position.x + 12, node.position.y + 8, node.position.z + 22), 0.045);
    if (controls.current) {
      controls.current.target.lerp(target.current, 0.08);
      controls.current.update();
    }
  });
  return <OrbitControls ref={controls} enableDamping dampingFactor={0.08} minDistance={8} maxDistance={400} />;
}

function Scene(props: SceneProps) {
  const { graph, visual, focusId } = props;
  const background = visual.background === 'graphite' ? '#111317' : visual.background === 'deep' ? '#0a0e14' : '#08090b';
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 100, 380]} />
      <ambientLight intensity={0.65} />
      <pointLight position={[30, 40, 30]} intensity={180} color="#8fd8ff" />
      <pointLight position={[-40, -20, -20]} intensity={120} color="#9d7bf5" />
      {visual.showStarfield && <Stars radius={220} depth={70} count={visual.quality === 'low' ? 800 : 2200} factor={3} saturation={0} fade speed={0.3} />}
      {visual.showGrid && <gridHelper args={[240, 30, '#1a2630', '#12171d']} position={[0, -18, 0]} />}
      <EdgeField graph={graph} visual={visual} />
      <NodeField {...props} />
      <Labels graph={graph} visual={visual} />
      <CameraRig focusId={focusId} graph={graph} />
    </>
  );
}

export function Universe3D({ graph, visual, focusId, selectedIds, hoveredId }: SceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 12, 92], fov: 55, near: 0.1, far: 1000 }}
      dpr={visual.quality === 'low' ? 1 : [1, 1.75]}
      gl={{ antialias: visual.quality !== 'low', alpha: false }}
      onPointerMissed={() => useGraphStore.getState().selectNode(null)}
    >
      <Scene graph={graph} visual={visual} focusId={focusId} selectedIds={selectedIds} hoveredId={hoveredId} />
    </Canvas>
  );
}
