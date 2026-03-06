import React from 'react';
import FileUpload from './FileUpload';
import { FaFileCsv, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ files, activeFileId, onFileSelect, onUploadSuccess, onDeleteFile, isCollapsed, onToggle }) => {
  const getFileIcon = (fn) => {
    if (fn.endsWith('.csv')) return <FaFileCsv className={styles.icon} />;
    if (fn.endsWith('.xlsx')) return <FaFileExcel className={styles.icon} color="#207245" />;
    return <FaFilePdf className={styles.icon} color="#B30B00" />;
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!isCollapsed && <span className={styles.title}>Context</span>}
        <button onClick={onToggle} className={styles.toggleBtn} data-tooltip-bottom={isCollapsed ? "Expand" : "Collapse"}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.content}>
          <FileUpload onUploadSuccess={onUploadSuccess} />
          <h2 className={styles.subHeader}>Sessions</h2>
          <ul className={styles.fileList}>
            <AnimatePresence>
              {files.map(file => (
                <motion.li key={file.id} className={`${styles.fileItem} ${activeFileId === file.id ? styles.active : ''}`} onClick={() => onFileSelect(file.id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.fileMain}>{getFileIcon(file.name)}<span className={styles.fileName}>{file.name}</span></div>
                  <button className={styles.deleteFileBtn} onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }} data-tooltip="Delete"><FaTrash /></button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
