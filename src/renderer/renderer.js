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
            version: document.getElementById('version')
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
    }

    /**
     * Load and display app version and environment status
     */
    async loadAppVersion() {
        try {
            if (window.electronAPI) {
                const version = await window.electronAPI.getVersion();
                const envStatus = await window.electronAPI.getEnvStatus();
                
                this.elements.version.innerHTML = `
                    Version ${version}<br>
                    <small style="color: ${envStatus.hasCredentials ? '#38a169' : '#e53e3e'}">
                        ${envStatus.hasCredentials ? '✅ Credentials configured' : '❌ Credentials missing'}
                    </small><br>
                    <small style="color: #718096">
                        User: ${envStatus.username}
                    </small>
                `;

                // Show warning if credentials are missing
                if (!envStatus.hasCredentials) {
                    this.showMessage('error', 
                        `Missing credentials! Please configure your .env file at:\n${envStatus.envPath}`
                    );
                }
            } else {
                this.elements.version.textContent = 'Version: Development';
            }
        } catch (error) {
            console.error('Failed to load version:', error);
            this.elements.version.textContent = 'Version: Unknown';
        }
    }

    /**
     * Handle file selection through dialog
     */
    async selectFile() {
        if (this.isUploading) return;

        try {
            if (!window.electronAPI) {
                this.showMessage('error', 'Electron API not available');
                return;
            }

            const fileData = await window.electronAPI.openFile();
            if (fileData) {
                this.setSelectedFile(fileData);
            }
        } catch (error) {
            console.error('File selection failed:', error);
            this.showMessage('error', 'Failed to select file: ' + error.message);
        }
    }

    /**
     * Set the selected file and update UI
     */
    setSelectedFile(fileData) {
        this.selectedFile = fileData;
        
        // Update file info display
        this.elements.fileDetails.innerHTML = `
            <div><strong>File:</strong> ${fileData.fileName}</div>
            <div><strong>Size:</strong> ${this.formatFileSize(fileData.fileSize)}</div>
            <div><strong>Path:</strong> ${fileData.filePath}</div>
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
                this.showMessage('error', 'Please select a PDF file');
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
                throw new Error('Electron API not available');
            }

            // Start the upload
            const result = await window.electronAPI.uploadFile(this.selectedFile.filePath);

            if (result.success) {
                this.showMessage('success', result.message);
                this.updateProgress(100, 'Upload completed successfully!');
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Upload failed:', error);
            this.showMessage('error', 'Upload failed: ' + error.message);
            this.updateProgress(0, 'Upload failed');
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
