import React, { useRef, useState } from 'react';
import api from '../api';
import { FaUpload } from 'react-icons/fa';
import styles from './FileUpload.module.css';

const FileUpload = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Upload the file
      await api.post("/ingest/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Step 2: Get the preview, which now processes it into SQL
      const previewRes = await api.get(`/data/preview/${file.name}`);
      
      // Pass both the file object and its data up to the parent
      onUploadSuccess(file, previewRes.data);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed!");
    } finally {
      setUploading(false);
      // Reset the input so you can upload the same file again
      event.target.value = null;
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".csv, .xlsx, .pdf"
      />
      <button onClick={handleClick} className={styles.uploadButton} disabled={uploading}>
        <FaUpload />
        <span>{uploading ? 'Processing...' : 'Upload Document'}</span>
      </button>
    </>
  );
};

export default FileUpload;