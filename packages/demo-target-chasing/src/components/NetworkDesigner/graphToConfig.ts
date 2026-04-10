import type { Node, Edge } from 'reactflow';

/**
 * Extract hiddenLayers from a React Flow graph by walking the edge chain
 * from the input node to the output node in topological order.
 *
 * Dense nodes must have `type: 'dense'` and `data.units: number`.
 * Input node: `id === 'input'`, Output node: `id === 'output'`.
 */
export function graphToConfig(nodes: Node[], edges: Edge[]): number[] {
  if (nodes.length === 0) return [];

  // Build adjacency: source → target
  const adj = new Map<string, string>();
  for (const edge of edges) {
    adj.set(edge.source, edge.target);
  }

  // Walk chain from 'input' node
  const layers: number[] = [];
  let current = 'input';

  while (adj.has(current)) {
    const next = adj.get(current)!;
    const node = nodes.find((n) => n.id === next);
    if (!node) break;

    if (node.type === 'dense' && typeof node.data?.units === 'number') {
      layers.push(node.data.units);
    }

    if (next === 'output') break;
    current = next;
  }

  return layers;
}

/**
 * Build a React Flow graph (nodes + edges) from a hiddenLayers array.
 * Creates input → dense_0 → dense_1 → ... → output chain.
 */
export function hiddenLayersToGraph(
  layers: number[],
  inputSize: number,
  actionSize: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const spacing = 200;

  // Input node
  nodes.push({
    id: 'input',
    type: 'inputOutput',
    position: { x: 50, y: 100 },
    data: { label: `Input (${inputSize})`, role: 'input' },
  });

  // Dense nodes
  for (let i = 0; i < layers.length; i++) {
    nodes.push({
      id: `dense_${i}`,
      type: 'dense',
      position: { x: 50 + spacing * (i + 1), y: 100 },
      data: { units: layers[i] },
    });
  }

  // Output node
  nodes.push({
    id: 'output',
    type: 'inputOutput',
    position: { x: 50 + spacing * (layers.length + 1), y: 100 },
    data: { label: `Output (${actionSize})`, role: 'output' },
  });

  // Edges: input → d0 → d1 → ... → output
  const chain = ['input', ...layers.map((_, i) => `dense_${i}`), 'output'];
  for (let i = 0; i < chain.length - 1; i++) {
    edges.push({
      id: `${chain[i]}-${chain[i + 1]}`,
      source: chain[i],
      target: chain[i + 1],
      animated: true,
    });
  }

  return { nodes, edges };
}
