import { describe, it, expect } from 'vitest';
import { graphToConfig, hiddenLayersToGraph } from '../src/components/NetworkDesigner/graphToConfig';
import type { Node, Edge } from 'reactflow';

function makeNode(id: string, type: string, units?: number): Node {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: type === 'dense' ? { units } : { label: id },
  };
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

describe('graphToConfig', () => {
  it('returns [] for a graph with only input and output', () => {
    const nodes = [makeNode('input', 'input'), makeNode('output', 'output')];
    const edges = [makeEdge('input', 'output')];
    expect(graphToConfig(nodes, edges)).toEqual([]);
  });

  it('returns [64] for a single dense node', () => {
    const nodes = [
      makeNode('input', 'input'),
      makeNode('d1', 'dense', 64),
      makeNode('output', 'output'),
    ];
    const edges = [makeEdge('input', 'd1'), makeEdge('d1', 'output')];
    expect(graphToConfig(nodes, edges)).toEqual([64]);
  });

  it('returns [64, 128, 64] for a chain of three dense nodes', () => {
    const nodes = [
      makeNode('input', 'input'),
      makeNode('d1', 'dense', 64),
      makeNode('d2', 'dense', 128),
      makeNode('d3', 'dense', 64),
      makeNode('output', 'output'),
    ];
    const edges = [
      makeEdge('input', 'd1'),
      makeEdge('d1', 'd2'),
      makeEdge('d2', 'd3'),
      makeEdge('d3', 'output'),
    ];
    expect(graphToConfig(nodes, edges)).toEqual([64, 128, 64]);
  });

  it('returns correct order regardless of node array order', () => {
    const nodes = [
      makeNode('output', 'output'),
      makeNode('d2', 'dense', 32),
      makeNode('input', 'input'),
      makeNode('d1', 'dense', 16),
    ];
    const edges = [
      makeEdge('input', 'd1'),
      makeEdge('d1', 'd2'),
      makeEdge('d2', 'output'),
    ];
    expect(graphToConfig(nodes, edges)).toEqual([16, 32]);
  });

  it('returns [] for empty nodes/edges', () => {
    expect(graphToConfig([], [])).toEqual([]);
  });
});

describe('hiddenLayersToGraph', () => {
  it('creates input, output, and dense nodes for [64, 32]', () => {
    const { nodes, edges } = hiddenLayersToGraph([64, 32], 4, 2);

    const inputNode = nodes.find((n) => n.type === 'inputOutput' && n.id === 'input');
    const outputNode = nodes.find((n) => n.type === 'inputOutput' && n.id === 'output');
    const denseNodes = nodes.filter((n) => n.type === 'dense');

    expect(inputNode).toBeDefined();
    expect(outputNode).toBeDefined();
    expect(denseNodes).toHaveLength(2);
    expect(denseNodes[0].data.units).toBe(64);
    expect(denseNodes[1].data.units).toBe(32);
    expect(edges).toHaveLength(3); // input->d0, d0->d1, d1->output
  });

  it('creates only input and output for []', () => {
    const { nodes, edges } = hiddenLayersToGraph([], 4, 2);
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1); // input->output
  });

  it('round-trips: hiddenLayersToGraph → graphToConfig', () => {
    const layers = [128, 64, 32];
    const { nodes, edges } = hiddenLayersToGraph(layers, 8, 4);
    expect(graphToConfig(nodes, edges)).toEqual(layers);
  });
});
