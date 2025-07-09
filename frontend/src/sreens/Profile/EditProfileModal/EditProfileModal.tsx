import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiCheck, FiEye, FiEyeOff, FiUpload, FiXCircle } from 'react-icons/fi';
import './EditProfileModal.scss';
import { ProfileApi, UserProfile } from '../../../api/profile';

interface EditProfileModalProps {
  userData: UserProfile;
  onClose: () => void;
  onSave: (data: UserProfile, password?: string, newPassword?: string) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ userData, onClose, onSave }) => {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    login: string;
    avatarUrl?: string | null;
    avatarFile?: File;  // Изменим тип на необязательный
  }>({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    login: userData.login,
    avatarUrl: userData.avatarUrl || null,
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmailVerified(formData.email === userData.email);
  }, [formData.email, userData.email]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, avatarUrl: 'Файл слишком большой (макс. 10MB)' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, avatarUrl: 'Пожалуйста, загрузите изображение' });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setFormData({ 
        ...formData, 
        avatarUrl: previewUrl,
        avatarFile: file
      });
      setErrors({ ...errors, avatar: '' });
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Вы уверены, что хотите удалить аватар?')) {
      setFormData({ 
        ...formData, 
        avatarUrl: null,
        avatarFile: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Имя обязательно';
    if (!formData.login.trim()) newErrors.login = 'Логин обязателен';
    if (!formData.email.trim()) newErrors.email = 'Email обязателен';
    if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updateData: Partial<UserProfile> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        login: formData.login,
        avatarUrl: formData.avatarUrl || null
      };

      let newAvatarUrl = formData.avatarUrl;
      if (formData.avatarFile) {
        const { avatarUrl } = await ProfileApi.uploadAvatar(formData.avatarFile);
        newAvatarUrl = avatarUrl;
        updateData.avatarUrl = avatarUrl;
      }

      const updatedUser = await ProfileApi.updateProfile(updateData);

      if (newPassword) {
        await ProfileApi.changePassword({
          oldPassword,
          newPassword
        });
      }

      onSave({
        ...userData,
        ...updateData,
        avatarUrl: newAvatarUrl || null,
        editAt: new Date()
      }, oldPassword, newPassword);

      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setErrors({
        ...errors,
        form: 'Не удалось сохранить изменения. Проверьте введенные данные.'
      });
    }
  };

  return (
    <div className="edit-profile-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="avatar-section">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            {formData.avatarUrl ? (
              <>
                <img src={formData.avatarUrl} alt="Аватар" className="avatar" />
                <button className="remove-avatar" onClick={handleRemoveAvatar}>
                  <FiXCircle size={20} />
                </button>
              </>
            ) : (
              <div className="avatar-placeholder">
                <FiUpload size={32} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            hidden
          />
        </div>

        <div className="form-group">
          <label>Фамилия</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Имя</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Логин</label>
          <input
            type="text"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          />
          {errors.login && <span className="error">{errors.login}</span>}
        </div>

        <div className="form-group email-group">
          <label>Email</label>
          <div className="input-with-button">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              readOnly
            />
            {emailVerified ? (
              <FiCheck className="verified-icon" />
            ) : (
              <button
                className="verify-button"
                onClick={() => setEmailVerified(true)}
              >
                Подтвердить
              </button>
            )}
          </div>
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="password-section">
          <div className="form-group">
            <label>Старый пароль</label>
            <div className="password-input">
              <input
                type={showPasswords.old ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
              >
                {showPasswords.old ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Новый пароль</label>
            <div className="password-input">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              >
                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Подтвердите пароль</label>
            <div className="password-input">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              >
                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="action-buttons">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="save-btn" onClick={handleSave}>
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;