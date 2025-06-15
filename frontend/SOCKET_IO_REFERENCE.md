# 🔌 Socket.IO Events Referansı

## 🚀 Bağlantı Kurma

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token') // JWT token
  }
});

// Bağlantı başarılı
socket.on('connect', () => {
  console.log('Socket bağlandı:', socket.id);
});

// Bağlantı hatası
socket.on('connect_error', (error) => {
  console.error('Socket bağlantı hatası:', error);
});
```

---

## 📨 Client → Server Events

### 🏠 Conversation'a Katılma
```javascript
socket.emit('joinConversation', conversationId);
```

### 💬 Mesaj Gönderme
```javascript
socket.emit('sendMessage', {
  conversationId: 'conversation_id',
  content: 'Merhaba! Kitap hala müsait mi?'
});
```

### 🚪 Conversation'dan Ayrılma
```javascript
socket.emit('leaveConversation', conversationId);
```

---

## 📩 Server → Client Events

### 🆕 Yeni Mesaj
```javascript
socket.on('newMessage', (message) => {
  console.log('Yeni mesaj geldi:', message);
  /*
  message = {
    _id: "message_id",
    conversation: "conversation_id",
    sender: {
      _id: "user_id",
      username: "alice",
      avatar: "avatar_url"
    },
    content: "Merhaba!",
    isRead: false,
    createdAt: "2025-05-27T22:30:00.000Z"
  }
  */
});
```

### 🔔 Yeni Bildirim
```javascript
socket.on('newNotification', (notification) => {
  console.log('Yeni bildirim:', notification);
  /*
  notification = {
    _id: "notification_id",
    type: "new_offer",
    title: "Yeni Teklif",
    message: "Alice size bir teklif gönderdi",
    data: {
      offerId: "offer_id",
      listingId: "listing_id"
    },
    priority: "medium",
    createdAt: "2025-05-27T22:30:00.000Z"
  }
  */
});
```

### ✅ Mesaj Okundu
```javascript
socket.on('messageRead', (data) => {
  console.log('Mesaj okundu:', data);
  /*
  data = {
    messageId: "message_id",
    conversationId: "conversation_id",
    readBy: "user_id"
  }
  */
});
```

### 🚫 Conversation Sonlandı
```javascript
socket.on('conversationEnded', (data) => {
  console.log('Conversation sonlandı:', data);
  /*
  data = {
    conversationId: "conversation_id",
    reason: "offer_accepted", // veya "offer_rejected"
    endedAt: "2025-05-27T22:30:00.000Z"
  }
  */
});
```

### ❌ Hata
```javascript
socket.on('error', (error) => {
  console.error('Socket hatası:', error);
  /*
  error = {
    message: "Hata açıklaması",
    code: "ERROR_CODE"
  }
  */
});
```

---

## 🎯 Frontend Entegrasyon Örneği

### React Hook Örneği
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    // Event listeners
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('conversationEnded', (data) => {
      // Conversation UI'ını güncelle
      console.log('Conversation ended:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const sendMessage = (conversationId, content) => {
    if (socket) {
      socket.emit('sendMessage', { conversationId, content });
    }
  };

  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('joinConversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('leaveConversation', conversationId);
    }
  };

  return {
    socket,
    messages,
    notifications,
    sendMessage,
    joinConversation,
    leaveConversation
  };
};

export default useSocket;
```

### Chat Component Örneği
```javascript
import React, { useState, useEffect } from 'react';
import useSocket from './useSocket';

const ChatComponent = ({ conversationId, token }) => {
  const [messageText, setMessageText] = useState('');
  const { messages, sendMessage, joinConversation, leaveConversation } = useSocket(token);

  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(conversationId, messageText);
      setMessageText('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <div key={message._id} className="message">
            <strong>{message.sender.username}:</strong>
            <span>{message.content}</span>
            <small>{new Date(message.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      
      <div className="message-input">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Mesajınızı yazın..."
        />
        <button onClick={handleSendMessage}>Gönder</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

---

## 🔔 Notification Types

| Type | Açıklama | Priority | Data Fields |
|------|----------|----------|-------------|
| `new_offer` | Yeni teklif geldi | medium | `offerId`, `listingId`, `fromUser` |
| `offer_chat_accepted` | Chat kabul edildi | medium | `offerId`, `conversationId` |
| `offer_accepted` | Teklif kabul edildi | high | `offerId`, `listingId` |
| `offer_rejected` | Teklif reddedildi | medium | `offerId`, `listingId` |
| `offer_cancelled` | Teklif iptal edildi | low | `offerId`, `listingId` |
| `new_message` | Yeni mesaj | medium | `messageId`, `conversationId`, `sender` |
| `conversation_ended` | Conversation sonlandı | medium | `conversationId`, `reason` |
| `review_required` | Review gerekli | high | `tradeOfferId`, `reviewee` |
| `review_received` | Review alındı | medium | `reviewId`, `reviewer`, `rating` |
| `listing_created` | Yeni ilan oluşturuldu | low | `listingId` |

---

## 🛡️ Güvenlik Notları

### 🔐 Authentication
- Socket bağlantısında JWT token gerekli
- Geçersiz token ile bağlantı reddedilir
- Token expire olursa otomatik disconnect

### 🚫 Authorization
- Kullanıcı sadece kendi conversation'larına katılabilir
- Mesaj gönderme yetkisi conversation katılımcılarına özel
- Notification'lar kullanıcıya özel

### 🔒 Rate Limiting
- Mesaj gönderme: Dakikada maksimum 60 mesaj
- Conversation join: Dakikada maksimum 10 join
- Spam koruması aktif

---

## 🧪 Test Senaryoları

### ✅ Başarılı Akışlar
1. **Normal Mesajlaşma**:
   - Conversation'a join → Mesaj gönder → Karşı taraf alır
   
2. **Real-time Notification**:
   - Teklif gönder → Karşı tarafa anlık bildirim

3. **Conversation End**:
   - Teklif kabul → Conversation sonlanır → Her iki tarafa bildirim

### ❌ Hata Senaryoları
1. **Geçersiz Token**:
   - Bağlantı reddedilir
   
2. **Yetkisiz Erişim**:
   - Başkasının conversation'ına katılma denemesi
   
3. **Sonlanmış Conversation**:
   - Mesaj gönderme denemesi → Hata

---

## 📊 Performance Optimizasyonu

### 🚀 Best Practices
- Connection pooling kullan
- Gereksiz event listener'ları temizle
- Message pagination uygula
- Debounce typing indicators

### 💾 Memory Management
```javascript
// Component unmount'ta socket'i temizle
useEffect(() => {
  return () => {
    socket?.disconnect();
  };
}, []);

// Event listener'ları temizle
useEffect(() => {
  const handleNewMessage = (message) => {
    // Handle message
  };

  socket?.on('newMessage', handleNewMessage);

  return () => {
    socket?.off('newMessage', handleNewMessage);
  };
}, [socket]);
```

Bu Socket.IO referansı ile real-time özelliklerinizi kolayca entegre edebilirsiniz! 