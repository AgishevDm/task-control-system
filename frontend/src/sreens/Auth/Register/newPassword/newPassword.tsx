import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import './newPassword.scss';

export default function NewPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState(() => {
    const savedData = localStorage.getItem('registrationData');
    return savedData ? JSON.parse(savedData).password || '' : '';
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('registrationData');
    const data = savedData ? JSON.parse(savedData) : {};
    localStorage.setItem('registrationData', JSON.stringify({...data, password}));
  }, [password]);

  const handleNext = () => {
    if (!password || !confirmPassword) {
      setError('Все поля обязательны для заполнения');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    navigate('../email');
  };

  return (
    <div className="password-container">
      <button className="close-btn" onClick={() => navigate('/login')}>
        <FaTimes />
      </button>
      
      <div className="auth-container">
        <div className="form-section">
          <h2>Создание пароля</h2>
          <p className="step-info">Шаг 2 из 4</p>
          
          <div className="input-group">
            <div className="input-field">
              <label>Пароль</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="new-password"
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="input-field">
              <label>Подтвердите пароль</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="new-password"
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
          </div>

          <div className={`error-message ${error ? 'visible' : ''}`}>
            {error}
          </div>

          <div className="button-group">
            <button 
              className="btn back"
              onClick={() => navigate(-1)}
            >
              Назад
            </button>
            <button 
              className="btn next"
              onClick={handleNext}
              disabled={!password || !confirmPassword}
            >
              Далее
            </button>
          </div>

          <div className="login-link">
            Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
          </div>
        </div>

        <div className="graphic-section">
          Защитите свой аккаунт надежным паролем
        </div>
      </div>
    </div>
  );
}