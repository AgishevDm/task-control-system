import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiUser, 
  FiSettings, 
  FiBell, 
  FiFileText, 
  FiCalendar,
  FiMessageSquare,
  FiBox,
  FiFileMinus
} from 'react-icons/fi';
import { TbLogout2 } from "react-icons/tb";
import './Sidebar.scss';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/', icon: <FiHome /> },
    { path: '/profile', icon: <FiUser /> },
    { path: '/settings', icon: <FiSettings /> },
    { path: '/notifications', icon: <FiBell /> },
    { path: '/task', icon: <FiFileText /> },
    { path: '/calendar', icon: <FiCalendar /> },
    { path: '/messages', icon: <FiMessageSquare /> },
    { path: '/projects', icon: <FiBox /> },
    { path: '/files', icon: <FiFileMinus /> },
  ];

  return (
    <div className="sidebar">
      <div className="nav-buttons">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`nav-button ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
          </button>
        ))}
        <button 
          className="nav-button logout"
          onClick={handleLogout}
        >
          <TbLogout2 />
        </button>
      </div>
    </div>
  );
}