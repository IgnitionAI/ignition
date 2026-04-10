import 'reactflow/dist/style.css';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type NodeTypes,
} from 'reactflow';

import { DenseLayerNode } from './DenseLayerNode';
import { InputOutputNode } from './InputOutputNode';
import { hiddenLayersToGraph } from './graphToConfig';
import { useNetworkStore } from '../../stores/networkStore';

const nodeTypes: NodeTypes = {
  dense: DenseLayerNode,
  inputOutput: InputOutputNode,
};

interface NetworkDesignerProps {
  onNetworkChange?: (layers: number[]) => void;
}

export function NetworkDesigner({ onNetworkChange }: NetworkDesignerProps) {
  const { nodes, edges, hiddenLayers, inputSize, actionSize, setGraph, setHiddenLayers } =
    useNetworkStore();

  // Initialize graph from store's hiddenLayers on first render
  useEffect(() => {
    if (nodes.length === 0) {
      const { nodes: initNodes, edges: initEdges } = hiddenLayersToGraph(
        hiddenLayers,
        inputSize,
        actionSize,
      );
      setGraph(initNodes, initEdges);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent whenever hiddenLayers changes
  useEffect(() => {
    onNetworkChange?.(hiddenLayers);
  }, [hiddenLayers, onNetworkChange]);

  const handleUnitsChange = useCallback(
    (nodeId: string, units: number) => {
      const updatedNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, units } } : n,
      );
      setGraph(updatedNodes, edges);
    },
    [nodes, edges, setGraph],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // Find the node to remove
      const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;

      // Find edges going into and out of this node
      const inEdge = edges.find((e) => e.target === nodeId);
      const outEdge = edges.find((e) => e.source === nodeId);

      // Remove the node
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);

      // Remove old edges and bridge the gap
      let updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      if (inEdge && outEdge) {
        updatedEdges = [
          ...updatedEdges,
          {
            id: `${inEdge.source}-${outEdge.target}`,
            source: inEdge.source,
            target: outEdge.target,
            animated: true,
          },
        ];
      }

      setGraph(updatedNodes, updatedEdges);
    },
    [nodes, edges, setGraph],
  );

  // Inject callbacks into node data so custom nodes can call them
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) =>
        n.type === 'dense'
          ? { ...n, data: { ...n.data, onUnitsChange: handleUnitsChange, onDelete: handleDeleteNode } }
          : n,
      ),
    [nodes, handleUnitsChange, handleDeleteNode],
  );

  const addDenseLayer = useCallback(() => {
    // Insert a new Dense 64 node before the output node
    const outputIdx = nodes.findIndex((n) => n.id === 'output');
    const lastDense = [...nodes].reverse().find((n) => n.type === 'dense');
    const prevId = lastDense ? lastDense.id : 'input';

    const newId = `dense_${Date.now()}`;
    const prevNode = nodes.find((n) => n.id === prevId);
    const newNode = {
      id: newId,
      type: 'dense' as const,
      position: {
        x: (prevNode?.position.x ?? 200) + 200,
        y: prevNode?.position.y ?? 100,
      },
      data: { units: 64 },
    };

    // Update output node position
    const updatedNodes = nodes.map((n) =>
      n.id === 'output' ? { ...n, position: { ...n.position, x: newNode.position.x + 200 } } : n,
    );

    // Remove the edge going into output from prevId, add two new edges
    const updatedEdges = edges.filter((e) => !(e.source === prevId && e.target === 'output'));
    updatedEdges.push(
      { id: `${prevId}-${newId}`, source: prevId, target: newId, animated: true },
      { id: `${newId}-output`, source: newId, target: 'output', animated: true },
    );

    setGraph([...updatedNodes, newNode], updatedEdges);
  }, [nodes, edges, setGraph]);

  return (
    <div className="network-designer-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Network Designer</h3>
        <button
          onClick={addDenseLayer}
          style={{
            padding: '4px 12px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          + Add Dense Layer
        </button>
      </div>
      <div style={{ height: 300, border: '1px solid #555', borderRadius: '4px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithCallbacks}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
