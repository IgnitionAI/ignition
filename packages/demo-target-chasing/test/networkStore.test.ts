import { describe, it, expect, beforeEach } from 'vitest';
import { useNetworkStore } from '../src/stores/networkStore';
import { hiddenLayersToGraph } from '../src/components/NetworkDesigner/graphToConfig';

describe('networkStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useNetworkStore.setState({
      nodes: [],
      edges: [],
      hiddenLayers: [24, 24],
      inputSize: 9,
      actionSize: 4,
      _syncSource: null,
    });
  });

  it('initializes with default hiddenLayers [24, 24]', () => {
    const state = useNetworkStore.getState();
    expect(state.hiddenLayers).toEqual([24, 24]);
  });

  it('setHiddenLayers updates layers and rebuilds graph', () => {
    const store = useNetworkStore.getState();
    store.setHiddenLayers([64, 128, 64]);

    const state = useNetworkStore.getState();
    expect(state.hiddenLayers).toEqual([64, 128, 64]);
    expect(state.nodes.length).toBe(5); // input + 3 dense + output
    expect(state.edges.length).toBe(4); // 4 connections
  });

  it('setGraph updates graph and recomputes hiddenLayers', () => {
    const { nodes, edges } = hiddenLayersToGraph([32, 16], 4, 2);
    const store = useNetworkStore.getState();
    store.setGraph(nodes, edges);

    const state = useNetworkStore.getState();
    expect(state.hiddenLayers).toEqual([32, 16]);
    expect(state.nodes).toEqual(nodes);
    expect(state.edges).toEqual(edges);
  });

  it('bidirectional sync does not loop: setHiddenLayers → graph → no re-derive', () => {
    const store = useNetworkStore.getState();

    // setHiddenLayers sets _syncSource = 'config'
    store.setHiddenLayers([128]);

    const state = useNetworkStore.getState();
    // After the sync completes, _syncSource should be 'config' (or null after consumption)
    expect(state.hiddenLayers).toEqual([128]);

    // Now if setGraph is called with source='config', it just accepts without re-deriving
    // This is the anti-loop mechanism
    const storeAfter = useNetworkStore.getState();
    storeAfter.setGraph(state.nodes, state.edges);
    expect(useNetworkStore.getState().hiddenLayers).toEqual([128]);
  });

  it('setSizes rebuilds graph with new input/action sizes', () => {
    const store = useNetworkStore.getState();
    store.setHiddenLayers([64]);
    store.setSizes(8, 3);

    const state = useNetworkStore.getState();
    expect(state.inputSize).toBe(8);
    expect(state.actionSize).toBe(3);

    const inputNode = state.nodes.find((n) => n.id === 'input');
    expect(inputNode?.data.label).toContain('8');

    const outputNode = state.nodes.find((n) => n.id === 'output');
    expect(outputNode?.data.label).toContain('3');
  });
});
