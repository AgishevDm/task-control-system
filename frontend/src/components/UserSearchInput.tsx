// components/UserSearchInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types/calendar';
import apiClient from '../api/client';

interface UserSearchInputProps {
  selectedUsers: User[];
  onSelect: (user: User) => void;
  onRemove: (userId: string) => void;
  showInput?: boolean;
}

const UserSearchInput: React.FC<UserSearchInputProps> = ({
  selectedUsers,
  onSelect,
  onRemove,
  showInput = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await apiClient.get(`/users/search?query=${searchQuery}`);
          setSearchResults(response.data);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error('Error searching users:', error);
        }
      } else {
        setSearchResults([]);
        setIsDropdownOpen(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-search-container" ref={dropdownRef}>
      {showInput && (
        <input
          type="text"
          placeholder="Начните вводить имя или логин..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length > 2 && setIsDropdownOpen(true)}
          className="user-search-input"
        />
      )}

      {/* Выпадающий список с результатами поиска */}
      {isDropdownOpen && searchResults.length > 0 && (
        <div className="user-search-dropdown">
          {searchResults.map((user) => (
            <div
              key={user.primarykey}
              className="user-search-result"
              onClick={() => {
                onSelect(user);
                setSearchQuery('');
                setIsDropdownOpen(false);
              }}
            >
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.login} className="user-avatar" />
              )}
              <div className="user-info">
                <span className="user-name">
                  {user.firstName || user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.login}
                </span>
                <span className="user-login">{user.login}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Список выбранных пользователей */}
      <div className="selected-users">
        {selectedUsers.map((user) => (
          <div key={user.primarykey} className="selected-user">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.login} className="user-avatar" />
            )}
            <span className="user-name">
              {user.firstName || user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.login}
            </span>
            <button 
              className="remove-user"
              onClick={() => onRemove(user.primarykey)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearchInput;