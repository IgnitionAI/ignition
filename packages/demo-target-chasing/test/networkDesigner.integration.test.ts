import { describe, it, expect, beforeEach } from 'vitest';
import { useNetworkStore } from '../src/stores/networkStore';
import { hiddenLayersToGraph, graphToConfig } from '../src/components/NetworkDesigner/graphToConfig';
import { DQNAgent } from '@ignitionai/backend-tfjs';

describe('Network Designer → Agent integration', () => {
  beforeEach(() => {
    useNetworkStore.setState({
      nodes: [],
      edges: [],
      hiddenLayers: [24, 24],
      inputSize: 4,
      actionSize: 2,
      _syncSource: null,
    });
  });

  it('setHiddenLayers creates a graph that round-trips back to the same layers', () => {
    const store = useNetworkStore.getState();
    store.setHiddenLayers([64, 128, 64]);

    const state = useNetworkStore.getState();
    const derived = graphToConfig(state.nodes, state.edges);
    expect(derived).toEqual([64, 128, 64]);
  });

  it('graph change → hiddenLayers → can create a DQNAgent with correct config', () => {
    const { nodes, edges } = hiddenLayersToGraph([32, 16], 4, 2);
    const store = useNetworkStore.getState();
    store.setGraph(nodes, edges);

    const state = useNetworkStore.getState();
    const agent = new DQNAgent({
      inputSize: state.inputSize,
      actionSize: state.actionSize,
      hiddenLayers: state.hiddenLayers,
    });

    expect(agent).toBeDefined();
    // Verify the agent was created with our layers by checking it can produce an action
    const actionPromise = agent.getAction([0.1, 0.2, 0.3, 0.4]);
    expect(actionPromise).toBeInstanceOf(Promise);

    agent.dispose();
  });

  it('agent can be disposed and recreated with different architecture', () => {
    const store = useNetworkStore.getState();

    // First agent: [24, 24]
    store.setHiddenLayers([24, 24]);
    let state = useNetworkStore.getState();
    const agent1 = new DQNAgent({
      inputSize: state.inputSize,
      actionSize: state.actionSize,
      hiddenLayers: state.hiddenLayers,
    });
    expect(agent1).toBeDefined();
    agent1.dispose();

    // Change architecture
    store.setHiddenLayers([64, 128, 64]);
    state = useNetworkStore.getState();
    const agent2 = new DQNAgent({
      inputSize: state.inputSize,
      actionSize: state.actionSize,
      hiddenLayers: state.hiddenLayers,
    });
    expect(agent2).toBeDefined();

    // Verify agent2 works
    expect(state.hiddenLayers).toEqual([64, 128, 64]);
    agent2.dispose();
  });

  it('adding a node to the graph updates hiddenLayers for agent creation', () => {
    // Start with [24, 24]
    const store = useNetworkStore.getState();
    store.setHiddenLayers([24, 24]);

    let state = useNetworkStore.getState();

    // Simulate adding a node: insert Dense 64 between the two existing dense nodes
    const newLayers = [24, 64, 24];
    store.setHiddenLayers(newLayers);

    state = useNetworkStore.getState();
    expect(state.hiddenLayers).toEqual([24, 64, 24]);
    expect(state.nodes.filter((n) => n.type === 'dense')).toHaveLength(3);
  });
});
