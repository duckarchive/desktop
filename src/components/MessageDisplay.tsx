
interface MessageDisplayProps {
  message: Message | null;
  onClose: () => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onClose }) => {
  if (!message) {
    return null;
  }

  return (
    <div id="message" className={`message ${message.type}`}>
      <button className="message-close" onClick={onClose}>×</button>
      {message.html ? (
        <div dangerouslySetInnerHTML={{ __html: message.text }} />
      ) : (
        <div>{message.text}</div>
      )}
    </div>
  );
};

export default MessageDisplay;
