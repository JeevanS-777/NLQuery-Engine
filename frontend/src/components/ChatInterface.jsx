import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import { FaPaperPlane, FaComments, FaCode, FaMicrophone, FaStop, FaVolumeMute, FaVolumeUp, FaTrash, FaSync } from 'react-icons/fa';
import styles from './ChatInterface.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = ({ file, onNewMessage, onDeleteMessage, onClearChat, onMessageClick, settings }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const[voiceModeEnabled, setVoiceModeEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState('latest');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;

            // Show scrollbar only if it hits the 30vh CSS max-height limit
            const maxHeight = window.innerHeight * 0.3;
            inputRef.current.style.overflowY = inputRef.current.scrollHeight >= maxHeight ? 'auto' : 'hidden';
        }
    }, [input]);

    const stopHardwareMic = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current.abort();
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
    },[]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => stopHardwareMic(), 3000);
                const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                setInput(transcript);
            };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, [stopHardwareMic]);

    const speakAnswer = (text) => {
        if (!voiceModeEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#_`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === settings.voiceName);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;
        stopHardwareMic();
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text };
        onNewMessage(userMsg);
        setInput("");
        setLoading(true);

        try {
            const history = file.chatHistory.map(m => ({ role: m.role, content: m.content }));
            const response = await api.post("/chat/ask", { message: text, fileContext: { name: file.name, id: file.id }, history: history });
            const botMsg = { id: `b-${Date.now()}`, role: 'bot', content: response.data.nl_answer, sqlDetails: response.data.sql_dialects, chartConfig: response.data.chart_config };
            onNewMessage(botMsg, response.data.sql_dialects, response.data.chart_config);
            setActiveMessageId(botMsg.id);
            speakAnswer(response.data.nl_answer);
        } catch (err) {
            onNewMessage({ id: `e-${Date.now()}`, role: 'bot', content: "⚠️ Connection error." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [file.chatHistory, loading, isListening]);

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <div className={styles.headerInfo}><FaComments className={styles.headerIcon}/> <span>{file.name}</span></div>
                <div className={styles.headerActions}>
                    <button onClick={onClearChat} className={styles.headerBtn} data-tooltip-bottom="Reset Chat"><FaSync /></button>
                    <button onClick={() => { setVoiceModeEnabled(!voiceModeEnabled); window.speechSynthesis.cancel(); }} className={`${styles.headerBtn} ${voiceModeEnabled ? styles.activeVoice : ''}`} data-tooltip-bottom={voiceModeEnabled ? "Mute Voice" : "Enable Voice"}>
                        {voiceModeEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                        {isSpeaking && <span className={styles.audioPing}></span>}
                    </button>
                </div>
            </div>

            <div className={styles.messagesArea}>
                <AnimatePresence initial={false}>
                    {file.chatHistory.map((msg, i) => {
                        const hasSql = msg.sqlDetails && Object.keys(msg.sqlDetails).length > 0;
                        const isFocused = activeMessageId === msg.id || (activeMessageId === 'latest' && i === file.chatHistory.length - 1 && msg.role === 'bot');
                        const isSystem = msg.id?.startsWith('sys-');

                        return (
                            <motion.div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.role]}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className={`${styles.bubble} ${hasSql ? styles.interactiveBubble : ''} ${isFocused && hasSql ? styles.focusedBubble : ''} ${isSystem ? styles.systemBubble : ''}`} onClick={() => hasSql && (onMessageClick(msg.sqlDetails, msg.chartConfig), setActiveMessageId(msg.id))}>
                                    <ReactMarkdown children={msg.content} />
                                    {hasSql && <div className={styles.sqlBadge}><FaCode /> Analytics</div>}
                                </div>
                                {!isSystem && (
                                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id); }} data-tooltip="Delete"><FaTrash /></button>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {(loading || isListening) && <div className={`${styles.messageWrapper} ${styles.bot}`}><div className={styles.bubble}>{isListening ? "Listening..." : "Thinking..."}</div></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
                <textarea
                    ref={inputRef}
                    className={styles.input}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Ask a question..."
                    rows={1}
                    disabled={loading}
                />
                <button className={`${styles.voiceButton} ${isListening ? styles.recording : ''}`} onClick={isListening ? stopHardwareMic : () => recognitionRef.current?.start()} data-tooltip="Voice">
                    {isListening ? <FaStop /> : <FaMicrophone />}
                </button>
                <button className={styles.sendButton} onClick={handleSend} disabled={loading || !input.trim()} data-tooltip="Send"><FaPaperPlane /></button>
            </div>
        </div>
    );
};
export default ChatInterface;
