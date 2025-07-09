import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.scss';

export default function Login() {
  const [credentials, setCredentials] = useState({ 
    loginOrEmail: '', 
    password: '', 
    remember: false 
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!credentials.loginOrEmail || !credentials.password) {
      setAuthError('Все поля обязательны для заполнения');
      return;
    }
    
    try {
      await login(credentials);
    } catch {
      // Ошибка уже обработана в AuthContext
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="auth-container">
        <div className="graphic-section">
          <span>Добро пожаловать!</span>
        </div>
        
        <div className="form-section">
          <h2>Вход в систему</h2>

          {authError && (
            <div className="error-message visible">
              {authError}
            </div>
          )}
          
          <div className="input-field">
            <label>Логин или Email</label>
            <div className="input-wrapper">
              <input
                type="text"
                value={credentials.loginOrEmail}
                onChange={(e) => {
                    setCredentials({...credentials, loginOrEmail: e.target.value});
                    setAuthError(null);
                 }}
                onKeyPress={handleKeyPress}
                placeholder="Введите ваш логин или email"
              />
            </div>
          </div>

          <div className="input-field">
            <label>Пароль</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => {
                    setCredentials({...credentials, password: e.target.value});
                    setAuthError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Введите ваш пароль"
              />
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={credentials.remember}
              onChange={(e) => setCredentials({...credentials, remember: e.target.checked})}
            />
            Запомнить меня
          </label>

          <button 
            className="auth-button" 
            onClick={handleLogin}
            disabled={!credentials.loginOrEmail || !credentials.password}
          >
            Войти
          </button>
          
          <div className="auth-links">
            <div 
              className="register-link"
              onClick={() => navigate('/register')}
            >
              Нет аккаунта? Зарегистрироваться
            </div>
            <div 
              className="forgot-password-link"
              onClick={() => navigate('/forgot-password')}
            >
              Забыли пароль?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}