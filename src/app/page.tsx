'use client';

import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult('Uploading...');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Test File Upload</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Upload Images or PDFs
          </label>
          <input
            type="file"
            name="files"
            multiple
            accept="image/*,application/pdf"
            style={{ 
              display: 'block',
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#999' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {result && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Result:</h2>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}