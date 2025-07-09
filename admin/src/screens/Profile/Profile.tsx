import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FiX, FiEdit, FiTrash2, FiUserPlus, FiEye, FiEyeOff, FiMoreVertical, FiPlus, FiSearch } from 'react-icons/fi';
import './Profile.scss';

type UserRole = 'admin' | 'super';

type User = {
  id: string;
  avatar: string;
  name: string;
  login: string;
  email: string;
  password: string;
  role: UserRole;
};

type FormData = Omit<User, 'id'> & {
  id?: string; 
};

export default function Profile() {
  // Состояние текущего пользователя
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'current',
    name: 'Иван Иванов',
    login: 'admin_ivan',
    email: 'ivan@admin.com',
    password: 'securepassword',
    role: 'admin',
    avatar: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    login: '',
    email: '',
    password: '',
    role: 'admin',
    avatar: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [showContextMenuId, setShowContextMenuId] = useState<string | null>(null); // Уникальный ID для меню
  const contextMenuRef = useRef<HTMLDivElement>(null);

   // Фильтрация данных
   const filteredUsers = useMemo(() => 
    users.filter(user =>
      Object.values(user).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    ),
  [users, searchQuery]);

   // Обработчик поиска
   const handleSearch = useCallback(() => {
  }, []);

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedUser(null);
    resetForm();
  }, []);

  // Обработчик аватарки текущего пользователя
  const handleMainAvatar = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentUser(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }, []);

  // Обработчик аватарки в форме
  const handleFormAvatar = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }, []);

  // Валидация формы
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Обязательное поле';
    if (!formData.login.trim()) newErrors.login = 'Обязательное поле';
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = 'Некорректный email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      login: '',
      email: '',
      password: '',
      role: 'admin',
      avatar: ''
    });
    setErrors({});
  }, []);

  // Сохранение пользователя
  const handleSaveUser = useCallback(() => {
    if (!validateForm()) return;

    if (modalType === 'edit' && formData.id) {
      if (formData.id === 'current') {
        // Обновление текущего пользователя
        setCurrentUser(prev => ({
          ...prev,
          ...formData,
          id: 'current' // Сохраняем ID текущего пользователя
        }));
      } else {
        // Обновление пользователя из списка
        setUsers(prev => prev.map(user =>
          user.id === formData.id ? { ...formData, id: formData.id } as User : user
        ));
      }
    } else {
      // Создание нового пользователя
      const newUser: User = {
        id: Date.now().toString(),
        ...formData
      };
      setUsers(prev => [newUser, ...prev]);
    }

    handleCloseModal();
  }, [formData, modalType]);

  return (
    <div className="admin-page">
      <h1 className="page-header">Профиль администратора</h1>
      <div className="content-box">
        {/* Текущий профиль */}
        <div className="current-profile">
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={() => mainFileInputRef.current?.click()}>
              <input
                type="file"
                ref={mainFileInputRef}
                accept="image/*"
                onChange={handleMainAvatar}
                style={{ display: 'none' }}
              />
              {currentUser.avatar ? (
                <>
                  <img src={currentUser.avatar} alt="Аватар" />
                  <button
                    className="remove-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentUser(prev => ({ ...prev, avatar: '' }));
                    }}
                  >
                    <FiX />
                  </button>
                </>
              ) : (
                <div className="avatar-placeholder">
                  <FiPlus />
                </div>
              )}
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-header">
              <div className="name-role">
                <h2>{currentUser.name}</h2>
                <span className="role-badge">{currentUser.role}</span>
              </div>
              <button
                className="edit-profile-btn"
                onClick={() => {
                  setFormData({
                    ...currentUser
                  });
                  setModalType('edit');
                }}
              >
                <FiEdit /> Редактировать профиль
              </button>
            </div>

            <div className="info-grid">
              <div className="info-row">
                <span>Логин:</span>
                <p>{currentUser.login}</p>
              </div>
              <div className="info-row">
                <span>Email:</span>
                <p>{currentUser.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Управление пользователями */}
        <div className="users-management">
        <div className="header">
          <h3>Управление администарторами и супер-пользователями</h3>
          <div className="controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <FiSearch className="search-icon" onClick={handleSearch} />
            </div>
              <button
                className="add-user-btn"
                onClick={() => {
                  resetForm();
                  setModalType('add');
                }}
              >
                <FiUserPlus /> Добавить
              </button>
            </div>
          </div>

          <div className="users-table">
            <div className="table-header">
              <div>Аватар</div>
              <div>ФИО</div>
              <div>Логин</div>
              <div>Email</div>
              <div>Пароль</div>
              <div>Роль</div>
              <div>Действия</div>
            </div>

            {users.map(user => (
              <div key={user.id} className="table-row">
                <div className="avatar-cell">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Аватар" />
                  ) : (
                    <div className="avatar-placeholder">
                      <FiPlus />
                    </div>
                  )}
                </div>
                <div>{user.name}</div>
                <div>{user.login}</div>
                <div>{user.email}</div>
                <div className="password-cell">
                  <div className="password-field">
                    <span>{'•'.repeat(8)}</span>
                    <div className="password-hover">{user.password}</div>
                  </div>
                </div>
                <div className="role-badge">{user.role}</div>
                <div className="actions">
                  <FiMoreVertical
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContextMenuId(user.id); 
                    }}
                  />
                  {showContextMenuId === user.id && (
                    <div className="context-menu" ref={contextMenuRef}>
                      <button onClick={() => {
                        setFormData({
                          ...user
                        });
                        setModalType('edit');
                        setShowContextMenuId(null);
                      }}>
                        <FiEdit /> Редактировать
                      </button>
                      <button onClick={() => {
                        setUsers(prev => prev.filter(u => u.id !== user.id)); // Удаляем по ID
                        setShowContextMenuId(null);
                      }}>
                        <FiTrash2 /> Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-btn" onClick={handleCloseModal}>
              <FiX />
            </button>
            <h3>{modalType === 'add' ? 'Новый пользователь' : 'Редактирование'}</h3>

            <div className="avatar-upload">
              <div className="avatar-preview" onClick={() => formFileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={formFileInputRef}
                  accept="image/*"
                  onChange={handleFormAvatar}
                  style={{ display: 'none' }}
                />
                {formData.avatar ? (
                  <>
                    <img src={formData.avatar} alt="Аватар" />
                    <button
                      className="remove-avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, avatar: '' }));
                      }}
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <div className="avatar-placeholder">
                    <FiPlus />
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>ФИО *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Логин *</label>
                <input
                  value={formData.login}
                  onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                />
                {errors.login && <span className="error">{errors.login}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Пароль</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Роль *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                >
                  <option value="admin">Администратор</option>
                  <option value="super">Суперпользователь</option>
                </select>
              </div>
            </div>

            <button className="submit-btn" onClick={handleSaveUser}>
              {modalType === 'add' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}