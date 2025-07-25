import React, { useEffect, useState, useRef } from 'react';
import { Button, Typography, Divider, CircularProgress } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useDashboardData from '../../hooks/useDashboardData';

/**
 * TokenManagerDialog
 * Dialog content for managing Zoho token status and data refresh.
 * Handles token status, generation, and data refresh actions.
 */
export default function TokenManagerDialog({ inDialog = false }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const popupIntervalRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch token status (can be called on demand)
  const fetchStatus = async () => {
    setError(null);
    try {
      const res = await fetch('/api/token/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to fetch token status');
    }
  };

  useEffect(() => {
    fetchStatus();
    return () => {
      if (popupIntervalRef.current) clearInterval(popupIntervalRef.current);
    };
  }, []);

  const handleGenerateToken = () => {
    const popup = window.open('http://localhost:3000/auth/zoho', '_blank', 'width=600,height=700');
    popupIntervalRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupIntervalRef.current);
        fetchStatus();
      }
    }, 500);
  };

  const handleSyncZohoToMongo = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/sync-zoho-to-mongo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg('MongoDB updated with fresh data from Zoho Invoice API.');
      } else {
        let msg = data.error || 'Failed to sync data';
        if (data.zoho) {
          msg += '\nZoho API error: ' + JSON.stringify(data.zoho, null, 2);
        }
        setSyncMsg(msg);
      }
    } catch (err) {
      setSyncMsg('Failed to sync data: ' + (err.message || err));
    }
    setSyncing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: inDialog ? 0 : 40,
      padding: inDialog ? '16px 0 16px 0' : 24,
      width: inDialog ? '100%' : 'fit-content',
      maxWidth: '100vw',
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
      overflow: 'visible'
    }}>
      <Divider sx={{ mb: 3 }} />
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Typography sx={{ mb: 1, fontSize: 17, fontWeight: 500, color: '#222' }}>
            <b>Status:</b> {status && status.valid ? <span style={{ color: '#059669', fontWeight: 700 }}>Valid</span> : <span style={{ color: '#ef4444', fontWeight: 700 }}>Expired / Not Set</span>}
          </Typography>
          {status && status.last_refreshed && (
            <Typography sx={{ mb: 2, fontSize: 15, color: '#666' }}>
              Last Refreshed: {new Date(status.last_refreshed).toLocaleString()}
            </Typography>
          )}
          <div style={{ display: 'flex', flexDirection: inDialog ? 'column' : 'row', gap: 16, margin: inDialog ? '16px 0 0 0' : '16px 0', width: inDialog ? '100%' : 'auto', padding: inDialog ? '0 16px' : 0 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateToken}
              startIcon={<SettingsIcon />}
              sx={{ fontWeight: 700, borderRadius: 2, boxShadow: '0 2px 8px #e0e7ff', fontSize: 16, px: 3, py: 1.2, width: '100%' }}
            >
              Manage Zoho Token
            </Button>
            <Button
              variant="outlined"
              color="info"
              onClick={handleSyncZohoToMongo}
              disabled={syncing}
              startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
              sx={{ fontWeight: 700, borderRadius: 2, fontSize: 16, px: 3, py: 1.2, width: '100%' }}
            >
              {syncing ? 'Syncing...' : 'Sync Zoho to Mongo'}
            </Button>
          </div>
          {syncMsg && (
            <Typography sx={{ mt: 2, fontSize: 15, color: syncMsg.startsWith('MongoDB updated') ? '#059669' : '#ef4444', fontWeight: 600 }}>
              {syncMsg.split('\n').map((line, i) => (
                <pre key={i} style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{line}</pre>
              ))}
            </Typography>
          )}
          <Divider sx={{ my: 3 }} />
          <Typography sx={{ fontSize: 15, color: '#888', textAlign: 'center' }}>
            If your token is expired or after a server restart, click the button above and complete the Zoho login in the new tab.
          </Typography>
        </>
      )}
    </div>
  );
} 