import React from 'react';
import SupabaseMetaverseTest from './components/SupabaseMetaverseTest';

const SupabaseTestPage: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🧪 Supabase Migration Test</h1>
      <p style={{ fontSize: '16px', marginBottom: '40px', opacity: 0.8 }}>
        Testing the migration from Socket.IO to Supabase Realtime
      </p>
      <SupabaseMetaverseTest />
    </div>
  );
};

export default SupabaseTestPage; 