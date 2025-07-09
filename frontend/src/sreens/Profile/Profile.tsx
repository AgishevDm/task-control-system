import React, { useEffect, useState } from 'react';
import ProfileHeader from './ProfileHeader/ProfileHeader';
import TasksSection from './TasksSection/TasksSection';
import CalendarSection from './CalendarSection/CalendarSection';
import TimeDataSection from './TimeDataSection/TimeDataSection';
import EditProfileModal from './EditProfileModal/EditProfileModal';
import './Profile.scss';
import { ProfileApi, ProfileViewData, UserProfile } from '../../api/profile';

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await ProfileApi.getProfile();
                setUserData({
                    primarykey: data.primarykey,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    login: data.login,
                    avatarUrl: data.avatarUrl,
                    createAt: new Date(data.createAt),
                    editAt: new Date(data.editAt)
                });
            } catch (err) {
                setError('Не удалось загрузить профиль');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSaveProfile = async (updatedUser: UserProfile, oldPassword?: string, newPassword?: string) => {
        try {
            const response = await ProfileApi.updateProfile({
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                login: updatedUser.login,
                avatarUrl: updatedUser.avatarUrl || null
              });

            if (newPassword && oldPassword) {
                await ProfileApi.changePassword({
                oldPassword,
                newPassword
                });
            }
      
            setUserData(response);
        } catch (error) {
          console.error('Ошибка при сохранении профиля:', error);
        }
      };

      if (loading) return (
        <div className="page-container">
          <div className="scroll-container">
            <div className="profile-container">
              <div className="tasks-wrapper">
                <div className="loading-container">
                  <div className="wave-loading">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="loading-text">Загружаем данные профиля...</div>
                </div>
              </div>
              <div className="calendar-wrapper"></div>
            </div>
          </div>
        </div>
      );
    if (error) return <div>{error}</div>;
    if (!userData) return <div>Данные профиля отсутствуют</div>;

    const profileViewData: ProfileViewData = {
        name: `${userData.firstName} ${userData.lastName}`,
        login: userData.login,
        email: userData.email,
        avatar: userData.avatarUrl || undefined
    };

    return (
        <div className="page-container">
            <ProfileHeader 
                userData={profileViewData}
                onEditClick={() => setShowEditModal(true)}
            />
            
            <div className="scroll-container">
                <div className="profile-container">
                    <div className="tasks-wrapper">
                        <div className="tasks-header">
                            <h2>Текущие задачи</h2>
                            <TimeDataSection />
                        </div>
                        <TasksSection />
                    </div>

                    <div className="calendar-wrapper">
                        <CalendarSection />
                    </div>
                </div>
            </div>

            {showEditModal && userData && (
                <EditProfileModal
                    userData={userData}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSaveProfile}
                />
            )}
        </div>
    );
};

export default Profile;