import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './routes/AppRoutes';
import './index.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Keyboard accessibility helper for confirmations and modals (SweetAlert2 and Bootstrap)
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const isInput = activeEl && (
    activeEl.tagName === 'INPUT' || 
    activeEl.tagName === 'TEXTAREA' || 
    activeEl.isContentEditable
  );

  // 1. SweetAlert2 navigation
  if (document.body.classList.contains('swal2-shown')) {
    const swalContainer = document.querySelector('.swal2-container');
    if (swalContainer) {
      const visibleButtons = Array.from(swalContainer.querySelectorAll('.swal2-actions button'))
        .filter(btn => btn.style.display !== 'none' && !btn.disabled);

      if (visibleButtons.length > 0) {
        const index = visibleButtons.indexOf(activeEl);

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          if (!isInput) {
            e.preventDefault();
            e.stopPropagation();
            const nextIndex = index === -1 ? 0 : (index - 1 + visibleButtons.length) % visibleButtons.length;
            visibleButtons[nextIndex].focus();
          }
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          if (!isInput) {
            e.preventDefault();
            e.stopPropagation();
            const nextIndex = index === -1 ? 0 : (index + 1) % visibleButtons.length;
            visibleButtons[nextIndex].focus();
          }
        } else if (e.key === 'Enter') {
          if (index !== -1) {
            e.preventDefault();
            e.stopPropagation();
            visibleButtons[index].click();
          } else {
            const confirmBtn = swalContainer.querySelector('.swal2-confirm');
            if (confirmBtn && confirmBtn.style.display !== 'none' && !confirmBtn.disabled) {
              e.preventDefault();
              e.stopPropagation();
              confirmBtn.click();
            }
          }
        }
      }
    }
    return;
  }

  // 2. Bootstrap Modals navigation
  const activeModal = document.querySelector('.modal.show');
  if (activeModal) {
    const footerButtons = Array.from(activeModal.querySelectorAll('.modal-footer button, .modal-footer a'))
      .filter(btn => btn.style.display !== 'none' && !btn.disabled);

    if (footerButtons.length > 0) {
      const index = footerButtons.indexOf(activeEl);

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();
          const nextIndex = index === -1 ? 0 : (index - 1 + footerButtons.length) % footerButtons.length;
          footerButtons[nextIndex].focus();
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();
          const nextIndex = index === -1 ? 0 : (index + 1) % footerButtons.length;
          footerButtons[nextIndex].focus();
        }
      } else if (e.key === 'Enter') {
        if (index !== -1) {
          e.preventDefault();
          e.stopPropagation();
          footerButtons[index].click();
        } else if (!isInput) {
          const primaryBtn = footerButtons.find(btn => btn.classList.contains('btn-primary') || btn.classList.contains('btn-warning') || btn.classList.contains('btn-danger'));
          if (primaryBtn) {
            e.preventDefault();
            e.stopPropagation();
            primaryBtn.click();
          }
        }
      }
    }
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
