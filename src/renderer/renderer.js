/**
 * Renderer process for Wikisource Manager
 * Handles UI interactions and communication with main process
 */

class WikiManagerRenderer {
    constructor() {
        this.selectedFiles = [];
        this.isUploading = false;
        this.uploadResults = [];
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
            filesList: document.getElementById('filesList'),
            progressContainer: document.getElementById('progressContainer'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            uploadResults: document.getElementById('uploadResults'),
            resultsList: document.getElementById('resultsList'),
            message: document.getElementById('message'),
            uploadBtn: document.getElementById('uploadBtn'),
            clearBtn: document.getElementById('clearBtn'),
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
        // Upload button
        this.elements.uploadBtn.addEventListener('click', () => this.uploadFiles());

        // Clear files button
        this.elements.clearBtn.addEventListener('click', () => this.clearFiles());

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

        // Drop zone events (clicking opens file dialog)
        this.elements.dropZone.addEventListener('click', () => this.selectFiles());
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // File list event delegation for remove buttons
        this.elements.filesList.addEventListener('click', (e) => {
          console.log('File list click event:', e);
            if (e.target.classList.contains('file-remove')) {
                console.log('Contains file-remove:', e.target);
                const fileItem = e.target.closest('.file-item');
                if (fileItem) {
                    console.log('Contains file-remove:', e.target);
                    const fileId = fileItem.getAttribute('data-file-id');
                    this.removeFile(fileId);
                }
            }
        });

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
                    <small style="color: ${credentialsStatus.hasCredentials ? '#38a169' : '#e53e3e'}">
                        ${credentialsStatus.hasCredentials ? `✅ Авторизовано: ${credentialsStatus.username}` : '❌ Облікові дані відсутні'}
                    </small><br>
                    Версія ${version}
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
    async selectFiles() {
        if (this.isUploading) return;

        try {
            if (!window.electronAPI) {
                this.showMessage('error', 'Electron API недоступне');
                return;
            }

            const fileDataList = await window.electronAPI.openFiles();
            if (fileDataList && fileDataList.length > 0) {
                await this.addFiles(fileDataList);
            }
        } catch (error) {
            console.error('File selection failed:', error);
            this.showMessage('error', 'Не вдалося вибрати файли: ' + error.message);
        }
    }

    /**
     * Add files to the selection and update UI
     */
    async addFiles(fileDataList) {
        const validFiles = [];
        const invalidFiles = [];

        // Validate each file
        for (const fileData of fileDataList) {
            const exists = this.selectedFiles.some(f => f.fileName === fileData.fileName && f.fileSize === fileData.fileSize);
            if (exists) {
                continue; // Skip duplicates
            }

            // Validate filename format
            const validation = await this.validateFileName(fileData.fileName);
            if (validation.isValid) {
                validFiles.push({
                    ...fileData,
                    id: Date.now() + Math.random(), // Unique ID for each file
                    status: 'pending',
                    parsed: validation.parsed
                });
            } else {
                invalidFiles.push({
                    fileName: fileData.fileName,
                    error: validation.error
                });
            }
        }

        // Add valid files to selection
        this.selectedFiles.push(...validFiles);

        // Show validation results
        if (invalidFiles.length > 0) {
            this.showFileValidationErrors(invalidFiles, validFiles.length);
        } else if (validFiles.length > 0) {
            this.showMessage('success', `Додано ${validFiles.length} файл(ів) до списку`);
        }

        this.updateFilesDisplay();
        this.updateUploadButton();
        
        if (validFiles.length === 0 && invalidFiles.length > 0) {
            // Don't hide message if there are only validation errors
        } else {
            this.hideMessage();
        }
    }

    /**
     * Update the files list display
     */
    updateFilesDisplay() {
        if (this.selectedFiles.length === 0) {
            this.elements.filesList.innerHTML = '';
            this.elements.clearBtn.style.display = 'none';
            return;
        }

        this.elements.clearBtn.style.display = 'inline-block';
        
        this.elements.filesList.innerHTML = this.selectedFiles.map(file => {
            let statusHtml = '';
            let cssClass = '';
            
            switch (file.status) {
                case 'pending':
                    statusHtml = '<span class="file-status">Очікує завантаження</span>';
                    break;
                case 'uploading':
                    cssClass = 'uploading';
                    statusHtml = '<span class="file-status">Завантажується...</span>';
                    break;
                case 'success':
                    cssClass = 'success';
                    statusHtml = `<span class="file-status">✅ Завантажено</span>`;
                    if (file.pageUrl) {
                        statusHtml += `<br><a href="${file.pageUrl}" class="file-link" target="_blank">Переглянути сторінку</a>`;
                    }
                    break;
                case 'error':
                    cssClass = 'error';
                    statusHtml = `<span class="file-status">❌ Помилка: ${file.error}</span>`;
                    break;
            }

            return `
                <div class="file-item ${cssClass}" data-file-id="${file.id}">
                    <div class="file-info-left">
                        <div class="file-name">${file.fileName}</div>
                        <div class="file-size">${this.formatFileSize(file.fileSize)}</div>
                        ${statusHtml}
                    </div>
                    ${file.status === 'pending' ? `<button class="file-remove">Видалити</button>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Remove a file from the selection
     */
    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
        this.updateFilesDisplay();
        this.updateUploadButton();
    }

    /**
     * Clear all files
     */
    clearFiles() {
        if (this.isUploading) return;
        
        this.selectedFiles = [];
        this.uploadResults = [];
        this.updateFilesDisplay();
        this.updateUploadButton();
        this.elements.uploadResults.classList.remove('show');
        this.hideMessage();
    }

    /**
     * Update upload button state
     */
    updateUploadButton() {
        const hasPendingFiles = this.selectedFiles.some(f => f.status === 'pending');
        this.elements.uploadBtn.disabled = !hasPendingFiles || this.isUploading;
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
    async handleDrop(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('dragover');
        
        if (this.isUploading) return;

        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => {
            return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        });

        if (validFiles.length === 0) {
            this.showMessage('error', 'Будь ласка, виберіть PDF-файли');
            return;
        }

        if (validFiles.length !== files.length) {
            this.showMessage('warning', `Додано тільки ${validFiles.length} PDF-файлів з ${files.length} обраних`);
        }

        // Create file data objects
        const fileDataList = validFiles.map(file => ({
            filePath: file.path || file.name, // Fallback for drag-drop
            fileName: file.name,
            fileSize: file.size,
            file: file // Keep reference for later use
        }));

        await this.addFiles(fileDataList);
    }

    /**
     * Upload all selected files
     */
    async uploadFiles() {
        const pendingFiles = this.selectedFiles.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0 || this.isUploading) return;

        try {
            this.isUploading = true;
            this.elements.uploadBtn.disabled = true;
            this.elements.clearBtn.disabled = true;
            this.elements.progressContainer.classList.add('show');
            this.hideMessage();

            if (!window.electronAPI) {
                throw new Error('Electron API недоступне');
            }

            this.uploadResults = [];
            let successCount = 0;
            let errorCount = 0;

            // Upload files one by one
            for (let i = 0; i < pendingFiles.length; i++) {
                const file = pendingFiles[i];
                const progressText = `Завантаження ${i + 1} з ${pendingFiles.length}: ${file.fileName}`;
                
                this.updateProgress((i / pendingFiles.length) * 100, progressText);
                
                // Update file status to uploading
                file.status = 'uploading';
                this.updateFilesDisplay();

                try {
                    // Start the upload for this file
                    const result = await window.electronAPI.uploadFile(file.filePath);

                    if (result.success) {
                        file.status = 'success';
                        file.pageUrl = result.pageUrl; // Store the page URL
                        successCount++;
                        
                        this.uploadResults.push({
                            fileName: file.fileName,
                            success: true,
                            pageUrl: result.pageUrl,
                            message: result.message
                        });
                    } else {
                        throw new Error(result.message);
                    }
                } catch (fileError) {
                    console.error(`Upload failed for ${file.fileName}:`, fileError);
                    file.status = 'error';
                    file.error = fileError.message;
                    errorCount++;
                    
                    this.uploadResults.push({
                        fileName: file.fileName,
                        success: false,
                        error: fileError.message
                    });
                }

                this.updateFilesDisplay();
            }

            // Show final results
            this.updateProgress(100, `Завершено: ${successCount} успішно, ${errorCount} помилок`);
            this.showUploadResults();

            if (errorCount === 0) {
                this.showMessage('success', `Всі файли (${successCount}) успішно опубліковано!`);
            } else if (successCount === 0) {
                this.showMessage('error', `Жоден файл не вдалося опублікувати (${errorCount} помилок)`);
            } else {
                this.showMessage('warning', `${successCount} файлів опубліковано, ${errorCount} з помилками`);
            }

        } catch (error) {
            console.error('Upload process failed:', error);
            this.showMessage('error', 'Процес публікації не вдався: ' + error.message);
            this.updateProgress(0, 'Публікація не вдалася');
        } finally {
            this.isUploading = false;
            this.elements.uploadBtn.disabled = false;
            this.elements.clearBtn.disabled = false;
            this.updateUploadButton();
        }
    }

    /**
     * Show upload results
     */
    showUploadResults() {
        if (this.uploadResults.length === 0) return;

        const resultsHtml = this.uploadResults.map(result => {
            if (result.success) {
                return `
                    <div class="file-item success">
                        <div class="file-info-left">
                            <div class="file-name">✅ ${result.fileName}</div>
                            <div class="file-status">${result.message}</div>
                            ${result.pageUrl ? `<a href="${result.pageUrl}" class="file-link" target="_blank">Переглянути сторінку</a>` : ''}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="file-item error">
                        <div class="file-info-left">
                            <div class="file-name">❌ ${result.fileName}</div>
                            <div class="file-status">Помилка: ${result.error}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        this.elements.resultsList.innerHTML = resultsHtml;
        this.elements.uploadResults.classList.add('show');
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

    /**
     * Validate filename format using parseFileName
     */
    async validateFileName(fileName) {
        try {
            if (!window.electronAPI) {
                return {
                    isValid: false,
                    error: 'Electron API недоступне'
                };
            }

            const result = await window.electronAPI.validateFileName(fileName);
            return result;
        } catch (error) {
            console.error('Filename validation failed:', error);
            return {
                isValid: false,
                error: 'Помилка валідації: ' + error.message
            };
        }
    }

    /**
     * Show file validation errors with helpful format description
     */
    showFileValidationErrors(invalidFiles, validCount) {
        const errorList = invalidFiles.map(f => `• ${f.fileName}: ${f.error}`).join('<br>');
        
        const formatExample = 'ЦДАВО Р-1-2-3. 1920-1930. Назва документу.pdf';
        const formatDescription = `
            <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; text-align: left;">
                <strong>Очікуваний формат назви файлу:</strong><br>
                <code style="background: #e9ecef; padding: 0.2rem 0.4rem; border-radius: 3px;">${formatExample}</code><br><br>
                <strong>Структура:</strong><br>
                • <strong>АРХІВ</strong> - код архіву (наприклад: ЦДАВО, ДАЛО, ЦДІАК)<br>
                • <strong>Фонд</strong> - номер або код фонду (наприклад: Р1, 123, П45)<br>
                • <strong>Опис-Справа</strong> - через дефіс (наприклад: 2-3, 15-248)<br>
                • <strong>Роки</strong> - рік або діапазон років (наприклад: 1920, 1920-1930)<br>
                • <strong>Назва</strong> - описова назва документу<br><br>
                <strong>Приклади правильних назв:</strong><br>
                • ЦДАВО Р1-2-3. 1920. Протокол засідання.pdf<br>
                • ДАЛО 123-4-56. 1925-1930. Листування.pdf<br>
                • ЦДІАК П789-10-11. 1918. Акт передачі.pdf
            </div>
        `;

        let message = `<strong>Помилки у назвах файлів (${invalidFiles.length}):</strong><br>${errorList}`;
        
        if (validCount > 0) {
            message = `<strong>Додано ${validCount} файл(ів). Помилки у ${invalidFiles.length} файлах:</strong><br>${errorList}`;
        }
        
        message += formatDescription;

        this.elements.message.className = 'message show error';
        this.elements.message.innerHTML = message;
    }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WikiManagerRenderer();
});

// Handle any uncaught errors
window.addEventListener('error', (error) => {
    console.error('Uncaught error:', error);
});

// Development helper
if (process.env.NODE_ENV === 'development') {
    console.log('Wikisource Manager Renderer loaded in development mode');
}
