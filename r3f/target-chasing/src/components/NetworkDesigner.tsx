import 'reactflow/dist/style.css';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowProvider,
} from 'reactflow';

interface NetworkDesignerProps {
  onNetworkChange: (layers: number[]) => void;
}

// New ReactFlow versions separate nodes and edges
type FlowElement = Node | Edge;

const initialNodes: Node[] = [
  { id: 'input', type: 'input', data: { label: 'Input (Size: 9)' }, position: { x: 100, y: 100 } },
  { id: 'hidden1', type: 'default', data: { label: 'Dense (Neurons: 64)' }, position: { x: 300, y: 50 } },
  { id: 'hidden2', type: 'default', data: { label: 'Dense (Neurons: 64)' }, position: { x: 300, y: 150 } },
  { id: 'output', type: 'output', data: { label: 'Output (Actions: 4)' }, position: { x: 500, y: 100 } },
];

const initialEdges: Edge[] = [
  { id: 'e-input-h1', source: 'input', target: 'hidden1', animated: true },
  { id: 'e-input-h2', source: 'input', target: 'hidden2', animated: true },
  { id: 'e-h1-output', source: 'hidden1', target: 'output', animated: true },
  { id: 'e-h2-output', source: 'hidden2', target: 'output', animated: true },
];

export function NetworkDesigner({ onNetworkChange }: NetworkDesignerProps) {
  const { t, i18n } = useTranslation();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const relabel = useCallback((node: Node, currentLabel: string): string => {
    // ponytail: le chiffre est extrait du label courant pour survivre au changement de langue
    const n = currentLabel.match(/\d+/)?.[0] ?? '0';
    if (node.type === 'input') return t('network.nodeInput', { size: n });
    if (node.type === 'output') return t('network.nodeOutput', { actions: n });
    return t('network.nodeDense', { neurons: n });
  }, [t]);

  // Re-traduire les labels des nœuds quand la langue change
  useEffect(() => {
    setNodes(nds => nds.map(node => ({ ...node, data: { ...node.data, label: relabel(node, node.data.label as string) } })));
  }, [i18n.language, relabel]);

  const extractNetworkStructure = (currentNodes: Node[]) => {
    const hiddenLayers: number[] = [];
    currentNodes.forEach((node) => {
      if (node.type === 'default' && node.data?.label?.includes('Dense')) {
        const match = node.data.label.match(/(\d+)/);
        if (match && match[1]) {
          hiddenLayers.push(parseInt(match[1], 10));
        }
      }
    });
    onNetworkChange(hiddenLayers);
  };

  useEffect(() => {
    extractNetworkStructure(nodes);
  }, [nodes]);

  return (
    <div className="network-designer-panel">
      <h3>{t('network.title')}</h3>
      <div style={{ height: 300, border: '1px solid #555', borderRadius: '4px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <p style={{ fontSize: '0.8em', color: '#ccc', marginTop: '5px' }}>
        {t('network.note')}
      </p>
    </div>
  );
}
