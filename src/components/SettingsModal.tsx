import React, { useState, useEffect } from 'react';
import Button from './Button';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
  onMessage: (message: Message) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  show, 
  onClose, 
  onCredentialsUpdated, 
  onMessage 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null);

  useEffect(() => {
    if (show) {
      loadCredentialsStatus();
    }
  }, [show]);

  const loadCredentialsStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getCredentialsStatus();
        setCredentialsStatus(status);
        
        if (status.hasCredentials) {
          setUsername(status.username || '');
        }
      }
    } catch (error) {
      console.error('Failed to load credentials status:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      onMessage({
        type: 'error',
        text: 'Будь ласка, заповніть всі поля'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API недоступне');
      }

      const result = await window.electronAPI.saveCredentials(
        username.trim(),
        password.trim()
      );

      if (result.success) {
        onMessage({
          type: 'success',
          text: 'Облікові дані успішно збережено!'
        });
        if (result.warning) {
          onMessage({
            type: 'warning',
            text: result.warning
          });
        }
        onCredentialsUpdated();
        onClose();
        // Clear password for security
        setPassword('');
      } else {
        onMessage({
          type: 'error',
          text: result.message || 'Не вдалося зберегти облікові дані'
        });
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
      onMessage({
        type: 'error',
        text: 'Помилка збереження: ' + (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Ви впевнені, що хочете видалити збережені облікові дані?')) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API недоступне');
      }

      const result = await window.electronAPI.clearCredentials();

      if (result.success) {
        onMessage({
          type: 'success',
          text: 'Облікові дані видалено!'
        });
        setUsername('');
        setPassword('');
        onCredentialsUpdated();
      } else {
        onMessage({
          type: 'error',
          text: result.message || 'Не вдалося видалити облікові дані'
        });
      }
    } catch (error) {
      console.error('Failed to remove credentials:', error);
      onMessage({
        type: 'error',
        text: 'Помилка видалення: ' + (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div id="settings-modal" className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Налаштування облікових даних</h2>
        
        <p>
          Для завантаження файлів до Вікібібліотеки потрібно створити бота та отримати облікові дані.
          <br/>
          <a href="https://www.mediawiki.org/wiki/Special:BotPasswords" target="_blank" rel="noopener noreferrer">
            🔗 Створити бота
          </a>
        </p>

        {credentialsStatus?.hasCredentials && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
            <strong>✅ Облікові дані збережено</strong><br/>
            Користувач: {credentialsStatus.username}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="username">Ім'я бота:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ім'я бота (не ваш основний акаунт!)"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль бота:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль бота (не ваш основний пароль!)"
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <Button 
              type="submit" 
              disabled={isLoading}
              loading={isLoading}
            >
              Зберегти
            </Button>
            
            {credentialsStatus?.hasCredentials && (
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleRemove}
                disabled={isLoading}
              >
                Видалити облікові дані
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Скасувати
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
