'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ fileName: string; similarity: number }>;
};

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  //auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setUploadStatus(`Uploaded ${files.length} file(s)`);
      
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      setUploadStatus('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.error || 'No response',
        sources: data.sources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to get response'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      });

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults({ error: 'Search failed' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #333',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          OmniSyn - Multimodal Learning Assistant
        </h1>
        
        <div style={{ position: 'relative' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #fff',
              borderRadius: '6px',
              backgroundColor: uploading ? '#333' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          </label>
          {uploadStatus && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        padding: '24px',
        height: 'calc(100vh - 73px)'
      }}>
        
        {/* Chat Section */}
        <div style={{
          border: '1px solid #333',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #333',
            fontWeight: '600'
          }}>
            💬 Chat with Your Notes
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                marginTop: '40px'
              }}>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No messages yet</p>
                <p style={{ fontSize: '14px' }}>Upload some notes and ask a question!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: msg.role === 'user' ? '#fff' : '#1a1a1a',
                    color: msg.role === 'user' ? '#000' : '#fff',
                    border: `1px solid ${msg.role === 'user' ? '#fff' : '#333'}`
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {msg.content}
                    </div>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #333',
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        Sources: {msg.sources.map((s, i) => (
                          <span key={i}>
                            {s.fileName} ({s.similarity}%)
                            {i < msg.sources!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {chatLoading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333'
              }}>
                <span style={{ opacity: 0.6 }}>Thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{
            padding: '16px',
            borderTop: '1px solid #333',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={chatLoading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#000',
                border: '1px solid #fff',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: chatLoading || !input.trim() ? '#333' : '#fff',
                color: chatLoading || !input.trim() ? '#666' : '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Send
            </button>
          </form>
        </div>

        {/* Search Section */}
        <div style={{
          border: '1px solid #333',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #333',
            fontWeight: '600'
          }}>
            🔍 Search Notes
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} style={{
            padding: '16px',
            borderBottom: '1px solid #333'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., photosynthesis"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#000',
                border: '1px solid #fff',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '12px'
              }}
            />
            <button
              type="submit"
              disabled={searchLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: searchLoading ? '#333' : '#fff',
                color: searchLoading ? '#666' : '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Results */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}>
            {searchResults?.results?.length > 0 ? (
              searchResults.results.map((result: any) => (
                <div
                  key={result.id}
                  style={{
                    padding: '12px',
                    marginBottom: '12px',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    backgroundColor: '#1a1a1a'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: '600' }}>{result.fileName}</span>
                    <span style={{ color: '#888' }}>
                      {(result.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.4' }}>
                    {result.textContent}
                  </div>
                </div>
              ))
            ) : searchResults?.error ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
                {searchResults.error}
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                No results yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}