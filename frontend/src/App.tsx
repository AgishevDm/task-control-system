import { useMemo, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './sreens/Auth/Login/Login';
import NewName from './sreens/Auth/Register/newName/newName';
import NewPassword from './sreens/Auth/Register/newPassword/newPassword';
import NewEmail from './sreens/Auth/Register/newEmail/newEmail';
import NewEmailConfirm from './sreens/Auth/Register/newEmailConfirm/newEmailConfirm';
import HomePage from './sreens/HomePage/HomePage';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Profile from './sreens/Profile/Profile';
import Settings from './sreens/Settings/Settings';
import Notifications from './sreens/Notifications/Notifications';
import Task from './sreens/Task/Task';
import Calendar from './sreens/Calendar/Calendar';
import { Messages } from './sreens/Messages/Messages';
import Projects from './sreens/Projects/Projects';
import ForgotPasswordEmail from './sreens/Auth/ForgotPassword/ForgotPasswordEmail/ForgotPasswordEmail';
import ForgotPasswordConfirm from './sreens/Auth/ForgotPassword/ForgotPasswordConfirm/ForgotPasswordConfirm';
import ResetPassword from './sreens/Auth/ForgotPassword/ResetPassword/ResetPassword';
import { createApiClient } from './api/client';
import FileManager from './sreens/FileManager/FileManager';
import ProjectPage from './sreens/Projects/ProjectPage';
import ProjectBoard from './sreens/Projects/ProjectBoard';
import { Analytics } from './sreens/Projects/Analytics';
import GanttPage from './sreens/Projects/GantPage';
import Milestones from './sreens/Projects/Milestones';
import { OnlyofficeEditor } from './sreens/FileManager/OnlyofficeEditor';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-container">
      <Header />
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
      <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />}/>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/task" element={<Task />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectPage />}>
            <Route index element={<ProjectBoard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="gant" element={<GanttPage />} />
            <Route path="milestones" element={<Milestones />} />
          </Route>
          <Route path="/files" element ={<FileManager />} />
          <Route path="/onlyoffice-editor" element={<OnlyofficeEditor />} />
        </Route>

        <Route path="/register">
          <Route index element={<Navigate to="name" />} />
          <Route path="name" element={<NewName />} />
          <Route path="password" element={<NewPassword />} />
          <Route path="email" element={<NewEmail />} />
          <Route path="confirm" element={<NewEmailConfirm />} />
        </Route>

        <Route path="/forgot-password">
          <Route index element={<Navigate to="email" />} />
          <Route path="email" element={<ForgotPasswordEmail />} />
          <Route path="confirm" element={<ForgotPasswordConfirm />} />
          <Route path="reset" element={<ResetPassword />} />
        </Route>
      </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}