import React from 'react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>Yes, Reset</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
