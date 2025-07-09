import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiChevronLeft,
  FiChevronRight,
  FiPieChart,
  FiMap,
  FiFileText,
  FiMessageSquare,
  FiUser,
  FiLogOut
} from 'react-icons/fi';
import './Sidebar.scss';
import { useState } from 'react';
import { logoutUser } from '../../services/authService';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();

      localStorage.removeItem('token');

      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      alert('Не удалось выйти из системы. Попробуйте снова.');
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <nav className="nav">
        <NavLink 
          to="/admin/analytics" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiPieChart className="nav-icon" />
          <span className="nav-text">Аналитика</span>
        </NavLink>

        <NavLink 
          to="/admin/maps" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiMap className="nav-icon" />
          <span className="nav-text">Карты</span>
        </NavLink>

        <NavLink 
          to="/admin/news" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiFileText className="nav-icon" />
          <span className="nav-text">Новости</span>
        </NavLink>

        <NavLink 
          to="/admin/feedback" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiMessageSquare className="nav-icon" />
          <span className="nav-text">Обратная связь</span>
        </NavLink>

        <NavLink 
          to="/admin/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiUser className="nav-icon" />
          <span className="nav-text">Профиль</span>
        </NavLink>
      </nav>

      <button 
        className="logout-btn" 
        onClick={handleLogout}
        title="Выход"
      >
        <FiLogOut className="icon" />
        {!isCollapsed && <span>Выход</span>}
      </button>
    </div>
  );
}