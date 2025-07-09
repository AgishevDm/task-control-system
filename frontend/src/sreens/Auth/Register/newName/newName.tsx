import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import './newName.scss';

export default function NewName() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('registrationData');
    return savedData 
      ? JSON.parse(savedData)
      : { firstName: '', lastName: '', login: '' };
  });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('registrationData', JSON.stringify(formData));
  }, [formData]);

  const handleNext = () => {
    if (!formData.firstName || !formData.lastName || !formData.login) {
      setError('Все поля обязательны для заполнения');
      return;
    }
    navigate('../password');
  };

  return (
    <div className="name-container">
      <button className="close-btn" onClick={() => navigate('/login')}>
        <FaTimes />
      </button>
      
      <div className="auth-container">
        <div className="form-section">
          <h2>Регистрация</h2>
          <p className="step-info">Шаг 1 из 4</p>
          
          <div className="input-group">
            <div className="input-field">
              <label>Фамилия</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({...formData, lastName: e.target.value});
                    setError('');
                  }}
                />
              </div>
            </div>

            <div className="input-field">
              <label>Имя</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({...formData, firstName: e.target.value});
                    setError('');
                  }}
                />
              </div>
            </div>

            <div className="input-field">
              <label>Логин</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => {
                    setFormData({...formData, login: e.target.value});
                    setError('');
                  }}
                />
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button 
              className="btn next"
              onClick={handleNext}
              disabled={!formData.firstName || !formData.lastName || !formData.login}
            >
              Далее
            </button>
          </div>

          <div className="login-link">
            Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
          </div>
        </div>

        <div className="graphic-section">
          Давайте пройдем регистрацию
        </div>
      </div>
    </div>
  );
}