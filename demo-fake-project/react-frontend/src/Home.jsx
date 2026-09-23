import { useEffect, useState } from 'react';
import socket from './socket/socket';

const Home = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    console.log("🚀 ~ handleFileChange ~ e:", e)
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🟢 Connected socket:', socket.id);
    });

    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off('chat message');
      socket.off('notification');
      socket.off('connect');
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim() && !file) return;

    const payload = {
      text: message,
      fileName: file ? file.name : null,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit('chat message', payload);

    setMessage('');
    setFile(null);
  };

  return (
    <div className="home">
      <h2>💬 React Chat App</h2>

      {/* 🔔 Notifications */}
      <div className="notification-box">
        {notifications.map((note, index) => (
          <div className="notification" key={index}>
            {note.message}
            <div className="notification-time">{note.time}</div>
          </div>
        ))}
      </div>

      {/* 💬 Chat Messages */}
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div className="message" key={index}>
            <p>{msg.text}</p>

            {msg.fileName && (
              <div className="file-info">
                📎 <span>{msg.fileName}</span>
              </div>
            )}

            <span className="time">{msg.time}</span>
          </div>
        ))}
      </div>
      <div className="show_file">
        {file && (
          <div className="file-info">
            📎 <span>{file.name}</span>
          </div>
        )}
      </div>
      <div className="input-box">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />

        <div className="upload-box">
          <input type="file" id="file-upload" onChange={handleFileChange} />
          <label htmlFor="file-upload">📁 Upload</label>
        </div>

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Home;
