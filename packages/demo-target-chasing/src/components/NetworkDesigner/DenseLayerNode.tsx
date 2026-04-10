import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

interface DenseLayerData {
  units: number;
  onUnitsChange?: (nodeId: string, units: number) => void;
  onDelete?: (nodeId: string) => void;
}

function DenseLayerNodeComponent({ id, data }: NodeProps<DenseLayerData>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(data.units));

  const commitEdit = useCallback(() => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed > 0) {
      data.onUnitsChange?.(id, parsed);
    } else {
      setDraft(String(data.units));
    }
    setEditing(false);
  }, [draft, data, id]);

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        background: '#2a2a3e',
        border: '1px solid #6366f1',
        color: '#e2e8f0',
        fontSize: 13,
        minWidth: 100,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600, marginBottom: 2 }}>Dense</div>
      {editing ? (
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
          autoFocus
          min={1}
          style={{
            width: 50,
            textAlign: 'center',
            background: '#1a1a2e',
            color: '#e2e8f0',
            border: '1px solid #6366f1',
            borderRadius: 3,
            fontSize: 13,
          }}
        />
      ) : (
        <div
          onClick={() => {
            setDraft(String(data.units));
            setEditing(true);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to edit"
        >
          {data.units} units
        </div>
      )}
      {data.onDelete && (
        <button
          onClick={() => data.onDelete?.(id)}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            fontSize: 11,
            cursor: 'pointer',
            lineHeight: '18px',
            padding: 0,
          }}
          title="Remove layer"
        >
          x
        </button>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const DenseLayerNode = memo(DenseLayerNodeComponent);
