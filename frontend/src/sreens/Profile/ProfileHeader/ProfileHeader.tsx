import React from 'react';
import { FiEdit } from 'react-icons/fi';
import './ProfileHeader.scss';
import { ProfileViewData } from '../../../api/profile';

interface ProfileHeaderProps {
  userData: ProfileViewData;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEditClick }) => {
  return (
    <div className="profile-header">
      <div className="avatar-wrapper">
        <img 
          src={userData.avatar} 
          alt="User avatar"
          className="user-avatar"
        />
      </div>
      <div className="user-info">
        <h1 className="user-name">{userData.name}</h1>
        <p className="user-login">@{userData.login}</p>
        <p className="user-email">{userData.email}</p>
      </div>
      <button className="edit-button" onClick={onEditClick}>
        <FiEdit size={24} />
      </button>
    </div>
  );
};

export default ProfileHeader;