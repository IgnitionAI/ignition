import 'reactflow/dist/style.css';

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

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

  const extractNetworkStructure = (currentNodes: Node[]) => {
    const hiddenLayers: number[] = [];
    currentNodes.forEach((node) => {
      if (node.type === 'default' && node.data?.label?.includes('Dense')) {
        const match = node.data.label.match(/Neurons: (\d+)/);
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
      <h3>Network Designer (Drag & Drop - Basic)</h3>
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
        Note: This is a basic visual representation. Add/remove/connect nodes to define layers.
        Neuron counts need manual adjustment via the config panel for now.
      </p>
    </div>
  );
}
