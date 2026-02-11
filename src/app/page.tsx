'use client';

import { useState } from 'react';

export default function Home() {
  const [uploadResult, setUploadResult] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleChat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChatLoading(true);
    setChatResponse(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      });
      
      const data = await response.json();
      setChatResponse(data);
    } catch (error) {
      setChatResponse({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>
        Multimodal Learning Assistant
      </h1>

      {/* Upload Section */}
      <div style={{ marginBottom: '60px', padding: '20px', border: '2px solid #eee', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>📤 Upload Documents</h2>
        
        <form onSubmit={handleUpload} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
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
              cursor: uploadLoading ? 'not-allowed' : 'pointer'
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
            fontSize: '12px'
          }}>
            {uploadResult}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '60px', padding: '20px', border: '2px solid #ecececff', borderRadius: '8px', backgroundColor: '#000000ff' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>💬 Chat with Your Notes</h2>
        
        <form onSubmit={handleChat} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question about your notes... (e.g., 'What is photosynthesis?')"
              style={{ 
                display: 'block',
                width: '100%',
                padding: '12px',
                border: '1px solid #ffffffff',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={chatLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: chatLoading ? '#999' : '#10a37f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: chatLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {chatLoading ? 'Thinking...' : 'Ask Claude'}
          </button>
        </form>

        {chatResponse && (
          <div>
            {chatResponse.error ? (
              <div style={{ color: 'red', padding: '16px', backgroundColor: '#fee', borderRadius: '4px' }}>
                Error: {chatResponse.error}
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #4c5c58ff'
                }}>
                  <strong style={{ display: 'block', marginBottom: '12px', color: '#10a37f' }}>
                    Claude's Answer:
                  </strong>
                  <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {chatResponse.response}
                  </p>
                </div>

                {chatResponse.sources && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <strong>Sources used:</strong>
                    {chatResponse.sources.map((s: any, i: number) => (
                      <span key={i}>
                        {' '}{s.fileName} ({s.similarity}% match){i < chatResponse.sources.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div style={{ padding: '20px', border: '2px solid #eee', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>🔍 Search Your Notes</h2>
        
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., pendulum equations, photosynthesis"
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
              backgroundColor: searchLoading ? '#999' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searchLoading ? 'not-allowed' : 'pointer'
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
                No results found.
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '16px', fontWeight: '500' }}>
                  Found {searchResults.results?.length} results
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
                        backgroundColor: '#0070f3',
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