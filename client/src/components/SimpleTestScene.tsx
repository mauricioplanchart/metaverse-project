import React from 'react';

const SimpleTestScene: React.FC = () => {
  console.log('🧪 SimpleTestScene rendering...');
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🌍 Metaverse Test</h1>
      <p style={{ fontSize: '24px', marginBottom: '40px' }}>If you can see this, the app is working!</p>
      
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h3>Debug Information</h3>
        <p>✅ Component is rendering</p>
        <p>✅ Styling is working</p>
        <p>✅ JavaScript is executing</p>
        <p>✅ React is functioning</p>
      </div>
      
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(0, 255, 0, 0.3)'
      }}>
        <h4>Next Steps:</h4>
        <p>If you see this page, the issue is with Babylon.js</p>
        <p>If you see a white page, there's a deeper React/rendering issue</p>
      </div>
    </div>
  );
};

export default SimpleTestScene; 