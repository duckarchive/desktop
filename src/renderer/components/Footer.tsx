import React from 'react';

interface FooterProps {
  version: string;
  credentialsStatus: any;
  onOpenSettings: () => void;
}

const Footer: React.FC<FooterProps> = ({ version, credentialsStatus, onOpenSettings }) => {
  return (
    <footer>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            className="btn secondary" 
            onClick={onOpenSettings}
          >
            ⚙️ Налаштування
          </button>
        </div>
        
        <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
          <div>Версія: {version}</div>
          <div style={{ marginTop: '0.2rem' }}>
            {credentialsStatus?.hasCredentials ? (
              <span style={{ color: '#28a745' }}>✅ Облікові дані налаштовано</span>
            ) : (
              <span style={{ color: '#dc3545' }}>❌ Облікові дані відсутні</span>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
        <a href="https://github.com/your-username/wiki-manager" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'none' }}>
          📂 Вихідний код
        </a>
        {' | '}
        <a href="https://uk.wikisource.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'none' }}>
          📚 Українська Вікібібліотека
        </a>
      </div>
    </footer>
  );
};

export default Footer;
