'use client';
import { useState } from 'react';

export default function Home() {
  const [uploadResult, setUploadResult] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadResult('Uploading...');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setUploadResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setUploadResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      });
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>
        Multimodal Learning Assistant
      </h1>

      <div style={{ marginBottom: '60px', padding: '20px', border: '2px solid #eee', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>📤 Upload Documents</h2>
        
        <form onSubmit={handleUpload} style={{ marginBottom: '20px' }}>
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
            disabled={uploadLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: uploadLoading ? '#999' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploadLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {uploadResult && (
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {uploadResult}
          </pre>
        )}
      </div>

      <div style={{ padding: '20px', border: '2px solid #eee', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>🔍 Search Your Notes</h2>
        
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Ask a question or search for topics
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within notes"
              style={{ 
                display: 'block',
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={searchLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: searchLoading ? '#999' : '#10a37f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searchLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults && (
          <div>
            {searchResults.error ? (
              <div style={{ color: 'red', padding: '16px', backgroundColor: '#fee', borderRadius: '4px' }}>
                Error: {searchResults.error}
              </div>
            ) : searchResults.results?.length === 0 ? (
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
                No results found. Try uploading some documents first!
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '16px', fontWeight: '500' }}>
                  Found {searchResults.results?.length} results (searched {searchResults.total} notes)
                </p>
                
                {searchResults.results?.map((result: any, idx: number) => (
                  <div
                    key={result.id}
                    style={{
                      padding: '16px',
                      marginBottom: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: idx === 0 ? '#f0f9ff' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{result.fileName}</strong>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#10a37f',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {(result.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                      {result.textContent}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}