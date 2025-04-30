import 'reactflow/dist/style.css';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
} from 'reactflow';

// Combine node + edge type
type Element = any;

const initialElements: Element[] = [
  { id: 'input', type: 'input', data: { label: 'Input (Size: 9)' }, position: { x: 100, y: 100 } },
  { id: 'hidden1', type: 'default', data: { label: 'Dense (Neurons: 64)' }, position: { x: 300, y: 50 } },
  { id: 'hidden2', type: 'default', data: { label: 'Dense (Neurons: 64)' }, position: { x: 300, y: 150 } },
  { id: 'output', type: 'output', data: { label: 'Output (Actions: 4)' }, position: { x: 500, y: 100 } },
  { id: 'e-input-h1', source: 'input', target: 'hidden1', animated: true },
  { id: 'e-input-h2', source: 'input', target: 'hidden2', animated: true },
  { id: 'e-h1-output', source: 'hidden1', target: 'output', animated: true },
  { id: 'e-h2-output', source: 'hidden2', target: 'output', animated: true },
];

interface NetworkDesignerProps {
  onNetworkChange: (layers: number[]) => void;
}

export function NetworkDesigner({ onNetworkChange }: NetworkDesignerProps) {
  const [elements, setElements] = useState<Element[]>(initialElements);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onNodesDelete = useCallback(
    (nodesToRemove: Node[]) =>
      setElements((els: Element[]) =>
        els.filter((el) => !(el as Node).id || !nodesToRemove.some((n) => n.id === (el as Node).id))
      ),
    []
  );
  
  const onEdgesDelete = useCallback(
    (edgesToRemove: Edge[]) =>
      setElements((els: Element[]) =>
        els.filter((el) => !(el as Edge).id || !edgesToRemove.some((e) => e.id === (el as Edge).id))
      ),
    []
  );

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setElements((els: Element[]) => addEdge({ ...params, animated: true }, els)),
    []
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    instance.fitView();
    extractNetworkStructure(initialElements);
  }, []);

  const extractNetworkStructure = (currentElements: Element[]) => {
    const hiddenLayers: number[] = [];
    currentElements.forEach((el) => {
      if ('type' in el && el.type === 'default' && el.data?.label?.includes('Dense')) {
        const match = el.data.label.match(/Neurons: (\d+)/);
        if (match && match[1]) {
          hiddenLayers.push(parseInt(match[1], 10));
        }
      }
    });

    console.log('Extracted hidden layers:', hiddenLayers);
    onNetworkChange(hiddenLayers);
  };

  useEffect(() => {
    if (reactFlowInstance) {
      extractNetworkStructure(elements);
    }
  }, [elements, reactFlowInstance]);

  return (
    <div className="network-designer-panel">
      <h3>Network Designer (Drag & Drop - Basic)</h3>
      <div style={{ height: 300, border: '1px solid #555', borderRadius: '4px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={elements.filter((e): e is Node => 'position' in e)}
            edges={elements.filter((e): e is Edge => 'source' in e && 'target' in e)}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onInit={onInit}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
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
