/**
 * Drag-and-drop file upload handling.
 */
const Upload = (() => {
  let zone, fileInput, fileList;

  function init() {
    zone = document.getElementById('upload-zone');
    fileInput = document.getElementById('file-input');
    fileList = document.getElementById('file-list');

    if (!zone || !fileInput) return;

    // Drag events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    });

    // Click to browse
    zone.addEventListener('click', (e) => {
      if (e.target.id !== 'btn-browse' && !e.target.closest('#btn-browse')) {
        fileInput.click();
      }
    });

    document.getElementById('btn-browse').addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        addFiles(fileInput.files);
        fileInput.value = '';
      }
    });
  }

  function addFiles(fileListObj) {
    const state = AppState.getState();
    const newFiles = Array.from(fileListObj);
    AppState.updateState('files', state.files.concat(newFiles));
    renderFileList();
  }

  function removeFile(index) {
    const state = AppState.getState();
    const updated = state.files.filter((_, i) => i !== index);
    AppState.updateState('files', updated);
    renderFileList();
  }

  function renderFileList() {
    const state = AppState.getState();
    if (!fileList) return;

    if (state.files.length === 0) {
      fileList.innerHTML = '';
      return;
    }

    fileList.innerHTML = state.files.map((file, i) => `
      <div class="file-item">
        <div class="file-item-icon">${getFileIcon(file.name)}</div>
        <div class="file-item-info">
          <div class="file-item-name">${escapeHtml(file.name)}</div>
          <div class="file-item-size">${formatSize(file.size)}</div>
        </div>
        <button class="file-item-remove" data-index="${i}" type="button" aria-label="Remove file">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

    // Attach remove handlers
    fileList.querySelectorAll('.file-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFile(parseInt(btn.dataset.index));
      });
    });
  }

  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      pdf: 'PDF', doc: 'DOC', docx: 'DOC',
      xls: 'XLS', xlsx: 'XLS', csv: 'CSV',
      jpg: 'IMG', jpeg: 'IMG', png: 'IMG', gif: 'IMG', webp: 'IMG',
      txt: 'TXT', zip: 'ZIP', rar: 'ZIP'
    };
    return map[ext] || 'FILE';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();
