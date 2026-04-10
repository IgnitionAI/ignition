import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import { graphToConfig, hiddenLayersToGraph } from '../components/NetworkDesigner/graphToConfig';

type SyncSource = 'graph' | 'config' | null;

interface NetworkStore {
  nodes: Node[];
  edges: Edge[];
  hiddenLayers: number[];
  inputSize: number;
  actionSize: number;
  /** Tracks which side triggered the last update to prevent loops */
  _syncSource: SyncSource;

  setGraph: (nodes: Node[], edges: Edge[]) => void;
  setHiddenLayers: (layers: number[]) => void;
  setSizes: (inputSize: number, actionSize: number) => void;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  nodes: [],
  edges: [],
  hiddenLayers: [24, 24],
  inputSize: 9,
  actionSize: 4,
  _syncSource: null,

  setGraph: (nodes, edges) => {
    const state = get();
    if (state._syncSource === 'config') {
      // Config triggered this — just accept the graph, don't re-derive layers
      set({ nodes, edges, _syncSource: null });
      return;
    }
    const layers = graphToConfig(nodes, edges);
    set({ nodes, edges, hiddenLayers: layers, _syncSource: 'graph' });
  },

  setHiddenLayers: (layers) => {
    const state = get();
    if (state._syncSource === 'graph') {
      // Graph triggered this — just accept the layers, don't re-derive graph
      set({ hiddenLayers: layers, _syncSource: null });
      return;
    }
    const { nodes, edges } = hiddenLayersToGraph(layers, state.inputSize, state.actionSize);
    set({ hiddenLayers: layers, nodes, edges, _syncSource: 'config' });
  },

  setSizes: (inputSize, actionSize) => {
    const state = get();
    const { nodes, edges } = hiddenLayersToGraph(state.hiddenLayers, inputSize, actionSize);
    set({ inputSize, actionSize, nodes, edges });
  },
}));
