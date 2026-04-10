import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

interface InputOutputData {
  label: string;
  role: 'input' | 'output';
}

function InputOutputNodeComponent({ data }: NodeProps<InputOutputData>) {
  const isInput = data.role === 'input';

  return (
    <div
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        background: isInput ? '#1e3a5f' : '#3a1e5f',
        border: `1px solid ${isInput ? '#3b82f6' : '#a855f7'}`,
        color: '#e2e8f0',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'center',
        minWidth: 100,
      }}
    >
      {isInput && <Handle type="source" position={Position.Right} />}
      {!isInput && <Handle type="target" position={Position.Left} />}
      {data.label}
    </div>
  );
}

export const InputOutputNode = memo(InputOutputNodeComponent);
