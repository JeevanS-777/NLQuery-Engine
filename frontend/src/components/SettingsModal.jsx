import React, { useEffect, useState } from 'react';
import { FaTimes, FaRobot, FaVolumeUp } from 'react-icons/fa';
import styles from './SettingsModal.module.css';

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            // Filter for English only for better results
            setVoices(availableVoices.filter(v => v.lang.includes('en')));
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2><FaRobot /> System Settings</h2>
                    <button onClick={onClose} className={styles.closeBtn}><FaTimes /></button>
                </div>

                <div className={styles.content}>
                    <div className={styles.group}>
                        <label>AI Model (Data Brain)</label>
                        <select
                            value={settings.model}
                            onChange={(e) => onSave({...settings, model: e.target.value})}
                        >
                            <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Smart)</option>
                        </select>
                    </div>

                    <div className={styles.group}>
                        <label><FaVolumeUp /> AI Voice Personality</label>
                        <select
                            value={settings.voiceName}
                            onChange={(e) => onSave({...settings, voiceName: e.target.value})}
                        >
                            {voices.map(v => (
                                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
