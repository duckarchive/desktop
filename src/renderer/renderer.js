/**
 * Renderer process for Wikisource Manager
 * Handles UI interactions and communication with main process
 */

class WikiManagerRenderer {
    constructor() {
        this.selectedFile = null;
        this.isUploading = false;
        this.initializeElements();
        this.setupEventListeners();
        this.loadAppVersion();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileDetails: document.getElementById('fileDetails'),
            progressContainer: document.getElementById('progressContainer'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            message: document.getElementById('message'),
            selectBtn: document.getElementById('selectBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            version: document.getElementById('version'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeModal: document.getElementById('closeModal'),
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            storageInfo: document.getElementById('storageInfo'),
            saveCredsBtn: document.getElementById('saveCredsBtn'),
            clearCredsBtn: document.getElementById('clearCredsBtn')
        };
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // File selection button
        this.elements.selectBtn.addEventListener('click', () => this.selectFile());

        // Upload button
        this.elements.uploadBtn.addEventListener('click', () => this.uploadFile());

        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());

        // Modal close
        this.elements.closeModal.addEventListener('click', () => this.closeSettings());
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });

        // Credentials buttons
        this.elements.saveCredsBtn.addEventListener('click', () => this.saveCredentials());
        this.elements.clearCredsBtn.addEventListener('click', () => this.clearCredentials());

        // Drop zone events
        this.elements.dropZone.addEventListener('click', () => this.selectFile());
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Listen for upload progress updates
        if (window.electronAPI) {
            window.electronAPI.onUploadProgress((data) => {
                this.updateProgress(data.progress, data.message);
            });
        }

        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.settingsModal.classList.contains('show')) {
                this.closeSettings();
            }
        });
    }

    /**
     * Load and display app version and credentials status
     */
    async loadAppVersion() {
        try {
            if (window.electronAPI) {
                const version = await window.electronAPI.getVersion();
                const credentialsStatus = await window.electronAPI.getCredentialsStatus();
                
                this.elements.version.innerHTML = `
                    Версія ${version}<br>
                    <small style="color: ${credentialsStatus.hasCredentials ? '#38a169' : '#e53e3e'}">
                        ${credentialsStatus.hasCredentials ? '✅ Облікові дані налаштовано' : '❌ Облікові дані відсутні'}
                    </small><br>
                    <small style="color: #718096">
                        Користувач: ${credentialsStatus.username}
                    </small>
                `;

                // Show warning if credentials are missing
                if (!credentialsStatus.hasCredentials) {
                    this.showMessage('error', 
                        'Облікові дані відсутні! Будь ласка, налаштуйте свої облікові дані Вікімедіа-бота за допомогою кнопки Налаштування.'
                    );
                }
            } else {
                this.elements.version.textContent = 'Версія: Розробка';
            }
        } catch (error) {
            console.error('Failed to load version:', error);
            this.elements.version.textContent = 'Версія: Невідома';
        }
    }

    /**
     * Handle file selection through dialog
     */
    async selectFile() {
        if (this.isUploading) return;

        try {
            if (!window.electronAPI) {
                this.showMessage('error', 'Electron API недоступне');
                return;
            }

            const fileData = await window.electronAPI.openFile();
            if (fileData) {
                this.setSelectedFile(fileData);
            }
        } catch (error) {
            console.error('File selection failed:', error);
            this.showMessage('error', 'Не вдалося вибрати файл: ' + error.message);
        }
    }

    /**
     * Set the selected file and update UI
     */
    setSelectedFile(fileData) {
        this.selectedFile = fileData;
        
        // Update file info display
        this.elements.fileDetails.innerHTML = `
            <div><strong>Файл:</strong> ${fileData.fileName}</div>
            <div><strong>Розмір:</strong> ${this.formatFileSize(fileData.fileSize)}</div>
            <div><strong>Шлях:</strong> ${fileData.filePath}</div>
        `;
        
        this.elements.fileInfo.classList.add('show');
        this.elements.uploadBtn.disabled = false;
        this.hideMessage();
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.elements.dropZone.classList.add('dragover');
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('dragover');
    }

    /**
     * Handle file drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('dragover');
        
        if (this.isUploading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            
            // Check if it's a PDF
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                this.showMessage('error', 'Будь ласка, виберіть PDF-файл');
                return;
            }

            // Create file data object similar to what the dialog returns
            const fileData = {
                filePath: file.path, // Note: file.path might not be available in all contexts
                fileName: file.name,
                fileSize: file.size
            };

            this.setSelectedFile(fileData);
        }
    }

    /**
     * Upload the selected file
     */
    async uploadFile() {
        if (!this.selectedFile || this.isUploading) return;

        try {
            this.isUploading = true;
            this.elements.uploadBtn.disabled = true;
            this.elements.selectBtn.disabled = true;
            this.elements.progressContainer.classList.add('show');
            this.hideMessage();

            if (!window.electronAPI) {
                throw new Error('Electron API недоступне');
            }

            // Start the upload
            const result = await window.electronAPI.uploadFile(this.selectedFile.filePath);

            if (result.success) {
                this.showMessage('success', result.message);
                this.updateProgress(100, 'Публікацію завершено успішно!');
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Upload failed:', error);
            this.showMessage('error', 'Публікація не вдалася: ' + error.message);
            this.updateProgress(0, 'Публікація не вдалася');
        } finally {
            this.isUploading = false;
            this.elements.uploadBtn.disabled = false;
            this.elements.selectBtn.disabled = false;
        }
    }

    /**
     * Update progress bar and text
     */
    updateProgress(progress, message) {
        this.elements.progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        this.elements.progressText.textContent = message;
    }

    /**
     * Show a message to the user
     */
    showMessage(type, text) {
        this.elements.message.className = `message show ${type}`;
        this.elements.message.textContent = text;
    }

    /**
     * Hide the message
     */
    hideMessage() {
        this.elements.message.classList.remove('show');
    }

    /**
     * Open settings modal
     */
    async openSettings() {
        try {
            this.elements.settingsModal.classList.add('show');
            
            // Load current credentials and storage info
            if (window.electronAPI) {
                const [credentials, status] = await Promise.all([
                    window.electronAPI.getCredentials(),
                    window.electronAPI.getCredentialsStatus()
                ]);

                if (credentials.success && credentials.credentials) {
                    this.elements.username.value = credentials.credentials.username || '';
                    this.elements.password.value = ''; // Never populate password field
                    this.elements.password.placeholder = credentials.credentials.hasPassword ? 
                        'Пароль збережено (залиште порожнім, щоб зберегти поточний)' : 'Введіть пароль бота';
                }

                // Update storage info
                this.elements.storageInfo.innerHTML = `
                    <div><strong>Інформація про сховище:</strong></div>
                    <div>📁 Шлях: ${status.storagePath}</div>
                    <div>🔐 Шифрування: ${status.encrypted ? 'Увімкнено' : 'Тільки Base64'}</div>
                    <div>🕐 Останнє оновлення: ${status.lastUpdated}</div>
                `;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showMessage('error', 'Не вдалося завантажити налаштування');
        }
    }

    /**
     * Close settings modal
     */
    closeSettings() {
        this.elements.settingsModal.classList.remove('show');
        // Clear form
        this.elements.username.value = '';
        this.elements.password.value = '';
        this.elements.password.placeholder = 'Bot password or app password';
    }

    /**
     * Save credentials
     */
    async saveCredentials() {
        try {
            const username = this.elements.username.value.trim();
            const password = this.elements.password.value;

            if (!username) {
                this.showMessage('error', 'Необхідно вказати ім\'я користувача');
                return;
            }

            // If password is empty and we have saved credentials, keep the current password
            if (!password) {
                const current = await window.electronAPI.getCredentials();
                if (!current.success || !current.credentials?.hasPassword) {
                    this.showMessage('error', 'Необхідно вказати пароль');
                    return;
                }
                // If we have a saved password and user left field empty, just update username
                // This is handled by the backend
            }

            this.elements.saveCredsBtn.disabled = true;
            this.elements.saveCredsBtn.textContent = 'Збереження...';

            const result = await window.electronAPI.saveCredentials(username, password || '');

            if (result.success) {
                this.showMessage('success', result.message);
                if (result.warning) {
                    setTimeout(() => {
                        this.showMessage('error', result.warning);
                    }, 3000);
                }
                this.closeSettings();
                // Reload version info to update status
                this.loadAppVersion();
            } else {
                this.showMessage('error', result.message);
            }
        } catch (error) {
            console.error('Failed to save credentials:', error);
            this.showMessage('error', 'Не вдалося зберегти облікові дані: ' + error.message);
        } finally {
            this.elements.saveCredsBtn.disabled = false;
            this.elements.saveCredsBtn.textContent = 'Зберегти облікові дані';
        }
    }

    /**
     * Clear credentials
     */
    async clearCredentials() {
        try {
            if (!confirm('Ви впевнені, що хочете видалити всі збережені облікові дані?')) {
                return;
            }

            this.elements.clearCredsBtn.disabled = true;
            this.elements.clearCredsBtn.textContent = 'Видалення...';

            const result = await window.electronAPI.clearCredentials();

            if (result.success) {
                this.showMessage('success', result.message);
                this.closeSettings();
                // Reload version info to update status
                this.loadAppVersion();
            } else {
                this.showMessage('error', result.message);
            }
        } catch (error) {
            console.error('Failed to clear credentials:', error);
            this.showMessage('error', 'Не вдалося видалити облікові дані: ' + error.message);
        } finally {
            this.elements.clearCredsBtn.disabled = false;
            this.elements.clearCredsBtn.textContent = 'Видалити облікові дані';
        }
    }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WikiManagerRenderer();
});

// Handle any uncaught errors
window.addEventListener('error', (error) => {
    console.error('Uncaught error:', error);
});

// Development helper
if (process.env.NODE_ENV === 'development') {
    console.log('Wikisource Manager Renderer loaded in development mode');
}
