import { useState } from 'react';
import { createApiClient } from '../../api/client';
import { User, Chat } from '../../types/chat';
import './UserSelector.css';
import { useAuth } from '../../context/AuthContext';

export const UserSelector = ({ 
  onSelect, 
  userChats,
  onSelectChat,
  onChatCreated
}: { 
  onSelect: (userId: string) => void;
  userChats: Chat[];
  onSelectChat: (chatId: string) => void;
  onChatCreated?: () => void;
}) => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'search' | 'group'>('chats');
  const apiClient = createApiClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
      const transformedUsers = res.data.map((user: { primarykey: string; }) => ({
        ...user,
        id: user.primarykey
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  function formatMessageTime(dateString: string | Date): string {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();
    const isCurrentYear = messageDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Вчера';
    } else if (isCurrentYear) {
      return messageDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
      });
    } else {
      return messageDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    }
  }

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');

  const addUserToGroup = (user: User) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setUsers([]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    try {
      const res = await apiClient.post('/chat/group', {
        title: groupName,
        memberIds: selectedUsers.map(u => u.id),
      });
      onSelectChat(res.data.primarykey);
      if (onChatCreated) {
        onChatCreated();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  return (
    <div className="user-selector">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          Мои чаты
        </button>
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Новый чат
        </button>
        <button 
          className={`tab ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => setActiveTab('group')}
        >
          Создать группу
        </button>
      </div>
      
      {activeTab === 'chats' ? (
        <div className="chats-list">
          {userChats.length > 0 ? (
            userChats.map(chat => {
              if (chat.isPrivate) {
                const otherUser = chat.members.find(member => member.accountRef.id !== authUser?.id)?.accountRef;
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                
                return (
                  <div 
                    key={chat.primarykey} 
                    className="chat-card"
                    onClick={() => onSelectChat(chat.primarykey)}
                  >
                    <div className="user-avatar">
                      {otherUser?.avatarUrl ? (
                        <img
                          src={otherUser.avatarUrl} 
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="chat-content">
                      <div className="chat-header">
                        <span className="chat-name">
                          {otherUser?.firstName} {otherUser?.lastName}
                        </span>
                        {lastMessage && (
                          <span className="chat-time">
                            {formatMessageTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {lastMessage && (
                        <div className="last-message">
                          <span className="last-message-content">
                            {lastMessage.content}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                
                return (
                  <div 
                    key={chat.primarykey} 
                    className="chat-card"
                    onClick={() => onSelectChat(chat.primarykey)}
                  >
                    <div className="group-avatar">
                      {chat.members.slice(0, 2).map((member, index) => (
                        <div 
                          key={member.accountRef.id} 
                          className={`group-avatar-item ${index === 1 ? 'second-avatar' : ''}`}
                        >
                          {member.accountRef.avatarUrl ? (
                            <img
                              src={member.accountRef.avatarUrl}
                              alt={`${member.accountRef.firstName} ${member.accountRef.lastName}`}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {member.accountRef.firstName?.[0]}{member.accountRef.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      ))}
                      {chat.members.length > 2 && (
                        <div className="group-avatar-count">+{chat.members.length - 2}</div>
                      )}
                    </div>
                    
                    <div className="chat-content">
                      <div className="chat-header">
                        <span className="chat-name">
                          {chat.title}
                        </span>
                        {lastMessage && (
                          <span className="chat-time">
                            {formatMessageTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="chat-members">
                        {chat.members.length} участников
                      </div>
                      
                      {lastMessage && (
                        <div className="last-message">
                          <span className="last-sender">
                            {lastMessage.account === authUser?.id 
                              ? 'Вы' 
                              : `${lastMessage.accountRef?.firstName}`}:
                          </span>
                          <span className="last-message-content">
                            {lastMessage.content}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <div className="no-results">У вас пока нет чатов</div>
          )}
        </div>
      ) : (
        <>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите логин, email или имя"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={!searchQuery.trim() || loading}>
              {loading ? 'Ищем...' : 'Найти'}
            </button>
          </div>

          {activeTab === 'group' && (
            <div className="create-group">
              <h3 className="create-group-title">Создать новую группу</h3>
              <input
                type="text"
                placeholder="Название группы"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="group-members">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="selected-user">
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <button onClick={() => removeUser(user.id)}>×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName || selectedUsers.length === 0}
              >
                Создать группу
              </button>
            </div>
          )}

          <div className="users-list">
            {users.length > 0 ? (
              users.map(user => (
                <div 
                  key={user.id} 
                  className="user-card" 
                  onClick={() => {
                    if (activeTab === 'group') {
                      addUserToGroup(user);
                    } else {
                      onSelect(user.id);
                    }
                  }}
                >
                  <div className="user-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="user-login">@{user.login}</div>
                  </div>
                </div>
              ))
            ) : (
              !loading && <div className="no-results">Ничего не найдено</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};