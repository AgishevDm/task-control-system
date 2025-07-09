import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { UserSelector } from './UserSelector';
import { createApiClient } from '../../api/client';
import './Messages.css';
import { Message, User, Chat } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';
import { FaEllipsisV } from 'react-icons/fa';

const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Сегодня';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Вчера';
  } else {
    return messageDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const groupMessagesByDate = (messages: Message[]) => {
  const grouped: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(message);
  });

  return grouped;
};

export const GroupChatInfo = ({ chat, onRemoveMember, onDeleteChat }: {
  chat?: Chat;
  onRemoveMember: (memberId: string) => void;
  onDeleteChat: () => void;
}) => {
  const { user: authUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  if (!chat) return null;

  const isAdmin = chat.account === authUser?.id;

  return (
    <div className="group-header">
      <div className="group-title-container">
        <h3 className="group-title">{chat.title}</h3>
        <div className="group-actions">
          <button 
            className="group-menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <FaEllipsisV />
          </button>
          
          {showMenu && (
            <div className="group-menu">
              <button 
                className="group-menu-item"
                onClick={() => {
                  setShowMembers(!showMembers);
                  setShowMenu(false);
                }}
              >
                Участники ({chat.members.length})
              </button>
              {isAdmin && (
                <>
                  <button 
                    className="group-menu-item danger"
                    onClick={() => {
                      onDeleteChat();
                      setShowMenu(false);
                    }}
                  >
                    Удалить группу
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showMembers && (
        <div className="group-members-dropdown">
          <div className="members-list">
            {chat.members.map((member) => (
              <div key={member.accountRef.id} className="member-item">
                <div className="member-info">
                  <img 
                    src={member.accountRef.avatarUrl || '/default-avatar.png'} 
                    alt={member.accountRef.firstName} 
                    className="member-avatar"
                  />
                  <span>
                    {member.accountRef.firstName} {member.accountRef.lastName}
                    {member.accountRef.id === chat.account && ' (создатель)'}
                  </span>
                </div>
                {isAdmin && member.accountRef.id !== chat.account && (
                  <button 
                    className="remove-member-button"
                    onClick={() => onRemoveMember(member.accountRef.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Messages = () => {
  const { user: authUser } = useAuth();
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const apiClient = createApiClient();
  const { messages, sendMessage, isConnected } = useChat(currentChat);
  const [currentRecipient, setCurrentRecipient] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingChats, setLoadingChats] = useState(true);

  const loadUserChats = useCallback(async () => {
    try {
      setLoadingChats(true);
      const response = await apiClient.get('/chat/my');
      setUserChats(response.data);
    } catch (error) {
      console.error('Failed to load user chats:', error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadUserChats();
  }, []);

  const handleStartChat = async (userId: string) => {
    setLoadingChat(true);
    try {
      const res = await apiClient.post(`/chat/private/${userId}`);
      if (res.data.chatId) {
        setCurrentChat(res.data.chatId);
        const userRes = await apiClient.get(`/users/${userId}`);
        setCurrentRecipient({
          id: userRes.data.primarykey,
          login: userRes.data.login,
          firstName: userRes.data.firstName,
          lastName: userRes.data.lastName,
          avatarUrl: userRes.data.avatarUrl,
          email: userRes.data.email
        });
        
        await loadUserChats();
      } else {
        throw new Error('Chat ID not received');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      alert('Не удалось начать чат. Пожалуйста, попробуйте позже.');
    } finally {
      setLoadingChat(false);
    }
  };
  
  const handleSelectChat = (chatId: string) => {
    const chat = userChats.find(c => c.primarykey === chatId);
    setCurrentChat(chatId);
    
    if (chat?.isPrivate) {
      const recipient = userChats.find((i) => i.primarykey === chatId)?.members.find((i) => i.accountRef.id !== authUser?.id);
      setCurrentRecipient({
        id: recipient?.accountRef.id || '',
        login: recipient?.accountRef.login,
        firstName: recipient?.accountRef.firstName || '',
        lastName: recipient?.accountRef.lastName || '',
        avatarUrl: recipient?.accountRef.avatarUrl,
        email: recipient?.accountRef.email
      })
    } else {
      setCurrentRecipient(null);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !isConnected) return;
    
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleBackClick = () => {
    setCurrentChat(null);
    setCurrentRecipient(null);
  };

  if (!currentChat) {
    return loadingChats ? (
      <div className="page-container">
      <div className="scroll-container">
        <div className="profile-container">
          <div className="tasks-wrapper">
            <div className="loading-container">
              <div className="wave-loading">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="loading-text">Загружаем чаты...</div>
            </div>
          </div>
          <div className="calendar-wrapper"></div>
        </div>
      </div>
    </div>
    ) : (
      <UserSelector 
        onSelect={handleStartChat} 
        userChats={userChats} 
        onSelectChat={handleSelectChat}
        onChatCreated={loadUserChats}
      />
    );
  }

  if (loadingChats) {
    return <div>Загрузка...</div>;
  }

  const currentChatData = userChats.find(c => c.primarykey === currentChat);
  if (!currentChatData) {
    return <div>Чат не найден</div>;
  }

  const groupedMessages = groupMessagesByDate(
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );

  const handleRemoveMember = async (memberId: string) => {
    try {
      await apiClient.delete(`/chat/group/${currentChat}/members/${memberId}`);
      await loadUserChats();
      const updatedChats = await apiClient.get('/chat/my');
      setUserChats(updatedChats.data);
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Не удалось удалить участника');
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await apiClient.delete(`/chat/group/${currentChat}`);
      setCurrentChat(null);
      setCurrentRecipient(null);
      await loadUserChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Не удалось удалить чат');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button 
          onClick={handleBackClick}
          className="back-button"
          title="Вернуться к списку чатов"
        >
          <FaArrowLeft />
        </button>

        {currentRecipient ? (
          <div className="recipient-info">
            {currentRecipient?.avatarUrl ? (
              <img
                src={currentRecipient?.avatarUrl || '/default-avatar.png'}
                alt={currentRecipient?.firstName}
                className="recipient-avatar"
              />
            ) : (
              <div className="recipient-avatar avatar-placeholder">
                {currentRecipient?.firstName[0]}{currentRecipient?.lastName[0]}
              </div>
            )}
            <div className="recipient-name">
              {currentRecipient?.firstName} {currentRecipient?.lastName}
            </div>
          </div>
        ) : (
          <GroupChatInfo 
            chat={userChats.find(c => c.primarykey === currentChat)!} 
            onRemoveMember={handleRemoveMember}
            onDeleteChat={handleDeleteChat}
          />
        )}
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
      
      <div className="messages-list">
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey} className="message-day-group">
            <div className="message-date-divider">
              <span>{formatMessageDate(new Date(dateKey))}</span>
            </div>
            
            {dayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.account.id === authUser?.id ? 'my-message' : 'other-message'}`}
              >
                {msg.account.id && msg.account.id !== authUser?.id && (
                  <img
                    src={msg.account.avatarUrl || '/default-avatar.png'} 
                    alt={msg.account.firstName}
                    className="message-avatar"
                  />
                )}
                <div className="message-content-wrapper">
                  {msg.account.id && msg.account.id !== authUser?.id && (
                    <div className="message-author">{msg.account.firstName}</div>
                  )}
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    <span className="message-time-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите сообщение"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend} 
          disabled={!message.trim() || !isConnected}
        >
          {isConnected ? 'Отправить' : 'Подключение...'}
        </button>
      </div>
    </div>
  );
};