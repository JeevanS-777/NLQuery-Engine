import React, { useState, useRef } from 'react';
import * as RRP from 'react-resizable-panels';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import InsightPanel from './components/InsightPanel';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import { FaCog } from 'react-icons/fa';
import './App.css';

const { Panel, PanelGroup, PanelResizeHandle } = RRP;

export default function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dqa-settings');
    return saved ? JSON.parse(saved) : { model: 'llama-3.1-8b-instant', voiceName: '' };
  });

  const [files, setFiles] = useState([]);
  const[activeFileId, setActiveFileId] = useState(null);
  const [technicalDetails, setTechnicalDetails] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const[isSettingsOpen, setSettingsOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sidebarRef = useRef(null);
  const insightRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleClearActiveChat = () => {
      setFiles(prev => prev.map(f => f.id === activeFileId ? {
          ...f,
          chatHistory:[{ id: `sys-clear-${Date.now()}`, role: 'bot', content: "Context reset. How can I help you now?" }],
          lastSqlDetails: null,
          lastChartConfig: null
      } : f));
      setTechnicalDetails(null); setChartConfig(null);
      setConfirmOpen(false);
      toast.success("Chat history cleared.");
  };

  const handleNewMessage = (newMessages, sqlDialects = null, newChartConfig = undefined) => {
    const msgsWithIds = (Array.isArray(newMessages) ? newMessages : [newMessages]).map(m => ({
        ...m, id: m.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        const cleanedHistory = f.chatHistory.filter(m => !m.id?.startsWith('sys-'));
        return {
          ...f,
          chatHistory:[...cleanedHistory, ...msgsWithIds],
          lastSqlDetails: sqlDialects || f.lastSqlDetails,
          lastChartConfig: newChartConfig !== undefined ? newChartConfig : f.lastChartConfig
        };
      }
      return f;
    }));
    if (sqlDialects) setTechnicalDetails(sqlDialects);
    if (newChartConfig !== undefined) setChartConfig(newChartConfig);
  };

  return (
    <div className="app-studio" data-dragging={isDragging}>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#1A1A1A', color: '#fff', border: '1px solid #333' }}} />
      <ConfirmModal isOpen={isConfirmOpen} title="Reset Chat?" message="Delete history for this session?" onConfirm={handleClearActiveChat} onCancel={() => setConfirmOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={(s) => { setSettings(s); localStorage.setItem('dqa-settings', JSON.stringify(s)); toast.success("Settings updated"); }} />

      <div className="action-dock">
          <button onClick={() => setSettingsOpen(true)} className="dock-btn" data-tooltip="Settings"><FaCog /></button>
      </div>

      <PanelGroup direction="horizontal" autoSaveId="dqa-layout-v14" onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}>
        <Panel ref={sidebarRef} defaultSize={20} minSize={15} maxSize={35} collapsible={true} collapsedSize={4} className="panel-outer">
            <Sidebar
                files={files} activeFileId={activeFileId}
                onFileSelect={(id) => { setActiveFileId(id); const sel = files.find(f => f.id === id); setTechnicalDetails(sel?.lastSqlDetails || null); setChartConfig(sel?.lastChartConfig || null); }}
                onUploadSuccess={(file, data) => { const newFile = { id: `file-${Date.now()}`, name: file.name, previewData: data, chatHistory:[{ id: `sys-start-${Date.now()}`, role: 'bot', content: `Context established for **${file.name}**.` }] }; setFiles(prev => [...prev, newFile]); setActiveFileId(newFile.id); toast.success("File uploaded"); }}
                onDeleteFile={(id) => { setFiles(prev => prev.filter(f => f.id !== id)); if(activeFileId === id) {setActiveFileId(null); setTechnicalDetails(null); setChartConfig(null);} }}
                isCollapsed={false} onToggle={() => sidebarRef.current?.collapse()}
            />
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel minSize={35}>
          <div className="panel-container main-border">
            {activeFile ? (
              <ChatInterface
                key={activeFile.id} file={activeFile} settings={settings}
                onNewMessage={handleNewMessage}
                onDeleteMessage={(mid) => { setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, chatHistory: f.chatHistory.filter(m => m.id !== mid) } : f)); toast.success("Deleted"); }}
                onClearChat={() => setConfirmOpen(true)}
                onMessageClick={(sql, chart) => { setTechnicalDetails(sql); setChartConfig(chart); }}
              />
            ) : (
              <div className="placeholder"><h2>AI Data Studio</h2><p>Upload a document to begin.</p></div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel ref={insightRef} defaultSize={30} minSize={20} maxSize={45} collapsible={true} collapsedSize={4} className="panel-outer">
            <InsightPanel file={activeFile} technicalDetails={technicalDetails} chartConfig={chartConfig} isCollapsed={false} onToggle={() => insightRef.current?.collapse()}/>
        </Panel>
      </PanelGroup>
    </div>
  );
}
