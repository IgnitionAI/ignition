import { useNotificationStore } from '../stores/notificationStore';

const colorMap = {
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
};

export function Notifications() {
  const { notifications, dismiss } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 320,
      }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => dismiss(n.id)}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            background: '#1a1a2e',
            borderLeft: `4px solid ${colorMap[n.type]}`,
            color: '#e2e8f0',
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
