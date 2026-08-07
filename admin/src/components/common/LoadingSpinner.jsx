import React from 'react';

const LoadingSpinner = ({ size = 40, color = 'var(--accent-color)' }) => {
  return (
    <div 
      className="loading-spinner"
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(255, 255, 255, 0.1)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
