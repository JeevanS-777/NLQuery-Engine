import { useState } from 'react';
import { useVoiceRecorder } from 'use-voice-recorder';
import api from '../api';

export const useAppVoice = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const { isRecording, start, stop, audioBlob } = useVoiceRecorder();

    const transcribeAudio = async (blob) => {
        if (!blob) return null;

        setIsTranscribing(true);
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        try {
            const response = await api.post("/voice/transcribe", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data.text;
        } catch (error) {
            console.error("Transcription API Error:", error);
            alert("Failed to transcribe audio.");
            return null;
        } finally {
            setIsTranscribing(false);
        }
    };

    return {
        isRecording,
        isTranscribing,
        startRecording: start,
        stopRecording: stop,
        audioBlob,
        transcribeAudio
    };
};
