import React from 'react';

const Modal = ({ children, onClose }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'white',
    padding: '20px',
    borderRadius: '6px',
    minWidth: '300px',
    maxWidth: '90%',
    maxHeight: '90%',
    overflowY: 'auto',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '5px',
    right: '10px',
    fontSize: '20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
  }
};

export default Modal;
