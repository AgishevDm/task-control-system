import apiClient from './client';

export interface UserProfile {
  primarykey: string;
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  avatarUrl?: string | null;
  createAt: Date;
  editAt: Date;
}

export interface ProfileViewData {
  name: string;
  login: string;
  email: string;
  avatar?: string;
}

export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}

export const ProfileApi = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch('/profile', profileData);
    return {
      ...response.data,
      createAt: new Date(response.data.createAt),
      editAt: new Date(response.data.editAt),
    };
  },

  async changePassword(passwordData: PasswordChangeData): Promise<void> {
    await apiClient.post('/profile/change-password', passwordData);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
};