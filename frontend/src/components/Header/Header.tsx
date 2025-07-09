import React from 'react';
import { 
  FiBell,
  FiSettings,
  FiUsers,
  FiPackage,
  FiBarChart2,
  FiHelpCircle
} from 'react-icons/fi';
import './Header.scss';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user: authUser } = useAuth();
  const handleAction = (actionName: string) => () => {
    console.log(`${actionName} clicked`);
  };

  return (
    <header className="header">
      <button 
        className="nav-item" 
        onClick={handleAction('Уведомления')}
      >
        <FiBell className="icon" />
        <span className="label">Уведомления</span>
      </button>
      
      <button 
        className="nav-item" 
        onClick={handleAction('Команда')}
      >
        <FiUsers className="icon" />
        <span className="label">Команда</span>
      </button>
      
      <button 
        className="nav-item" 
        onClick={handleAction('Продукты')}
      >
        <FiPackage className="icon" />
        <span className="label">Продукты</span>
      </button>
      
      <button 
        className="nav-item" 
        onClick={handleAction('Аналитика')}
      >
        <FiBarChart2 className="icon" />
        <span className="label">Аналитика</span>
      </button>
      
      <button 
        className="nav-item" 
        onClick={handleAction('Настройки')}
      >
        <FiSettings className="icon" />
        <span className="label">Настройки</span>
      </button>
      
      <button 
        className="nav-item" 
        onClick={handleAction('Поддержка')}
      >
        <FiHelpCircle className="icon" />
        <span className="label">Поддержка</span>
      </button>
      
      <div className="avatar">
        {authUser?.avatarUrl ? (
            <img
              src={authUser?.avatarUrl || '/default-avatar.png'}
              alt={authUser?.firstName}
              className="recipient-avatar"
            />
          ) : (
            <div className="avatar-placeholder">
              {authUser?.firstName[0]} {authUser?.lastName[0]}
            </div>
          )}
      </div>
    </header>
  );
}