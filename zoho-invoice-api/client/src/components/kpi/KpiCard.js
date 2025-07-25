import React from 'react';
import { Box } from '@mui/material';

/**
 * KpiCard
 * Reusable card for dashboard KPIs (e.g., Total Students, Paid/Unpaid This Month).
 *
 * Props:
 * - title: string
 * - value: string|number
 * - subtitle: string (optional)
 * - color: string (main color for title)
 * - icon: React node (optional)
 */
export default function KpiCard({ title, value, subtitle, color = '#6366f1', icon }) {
  return (
    <Box style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 200, boxShadow: '0 2px 8px #e0e7ff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 18, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 15, color: '#888', marginTop: 2, marginBottom: 2 }}>{subtitle}</div>}
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}><b>{value}</b></div>
    </Box>
  );
} 