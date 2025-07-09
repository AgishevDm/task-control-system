// src/components/ShareModal.tsx
import React, { useState, useEffect } from 'react';
import { FileApi } from '../api/fileHierarchy';
import UserSearchInput from './UserSearchInput';
import { User } from '../types/calendar';
import './ShareModal.scss';

type SharePermission = 'VIEW' | 'COMMENT' | 'EDIT';

interface ShareModalProps {
  fileId: string;
  visible: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ fileId, visible, onClose }) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [permission, setPermission] = useState<SharePermission>('VIEW');
  const [shares, setShares] = useState<{ id: string; permission: SharePermission; name: string; }[]>([]);

  // Загрузить текущие шаринги
  useEffect(() => {
    if (!visible) return;
    FileApi.getFileShares(fileId).then(setShares);
    // очистим выбор, чтобы при каждом открытии не было старого состояния
    setSelectedUsers([]);
  }, [visible, fileId]);

  const handleSelectUser = (user: User) => {
    // не дублируем
    if (!selectedUsers.find(u => u.primarykey === user.primarykey)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.primarykey !== userId));
  };

  const applyShare = async () => {
    for (const user of selectedUsers) {
      await FileApi.shareFile(fileId, user.primarykey, permission);
    }
    const updated = await FileApi.getFileShares(fileId);
    setShares(updated);
    setSelectedUsers([]);
  };

  const revokeShare = async (accountId: string) => {
    console.log(fileId, accountId)
    await FileApi.unshareFile(fileId, accountId);
    setShares(shares.filter(s => s.id !== accountId));
  };

  if (!visible) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal share-modal">
        <h3>Расшарить файл</h3>

        <div className="field">
          <label>Пользователи</label>
          <UserSearchInput
            selectedUsers={selectedUsers}
            onSelect={handleSelectUser}
            onRemove={handleRemoveUser}
          />
        </div>

        <div className="field">
          <label>Права</label>
          <select
            value={permission}
            onChange={e => setPermission(e.target.value as SharePermission)}
          >
            <option value="VIEW">Просмотр</option>
            <option value="COMMENT">Комментирование</option>
            <option value="EDIT">Редактирование</option>
          </select>
        </div>

        <div className="buttons">
          <button
            onClick={applyShare}
            disabled={selectedUsers.length === 0}
          >
            Применить
          </button>
          <button onClick={onClose} className="cancel">
            Отмена
          </button>
        </div>

        <hr/>

        <h4>Уже расшарено:</h4>
        <ul className="shares-list">
          {shares.map(s => (
            <li key={s.id}>
              {/* имя пользователя можно получить из UserSearchInput cache или по API */}
              <span>{s.name}</span> — {s.permission}
              <button onClick={() => revokeShare(s.id)}>Отозвать</button>
            </li>
          ))}
          {shares.length === 0 && <li>Никому не расшарено</li>}
        </ul>
      </div>
    </div>
  );
};
