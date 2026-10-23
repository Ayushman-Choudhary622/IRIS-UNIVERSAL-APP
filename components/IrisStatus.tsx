import React from 'react';

type StatusType = 'ready' | 'demo' | 'connected' | 'offline' | 'beta' | 'warning' | 'danger' | 'coming-soon';

interface IrisStatusProps {
  type: StatusType;
  label?: string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  ready: { label: 'READY', className: 'status-ready' },
  demo: { label: 'DEMO', className: 'status-demo' },
  connected: { label: 'CONNECTED', className: 'status-connected' },
  offline: { label: 'OFFLINE', className: 'status-offline' },
  beta: { label: 'BETA', className: 'status-beta' },
  warning: { label: 'WARNING', className: 'status-warning' },
  danger: { label: 'DANGER', className: 'status-danger' },
  'coming-soon': { label: 'COMING SOON', className: 'status-offline' },
};

export default function IrisStatus({ type, label, showDot = true }: IrisStatusProps) {
  const config = STATUS_CONFIG[type];
  return (
    <span className={`status-badge ${config.className}`}>
      {showDot && <span className="status-dot" />}
      {label || config.label}
    </span>
  );
}
