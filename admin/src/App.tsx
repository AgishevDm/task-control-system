import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout/Layout';
import Login from './screens/Login/Login';
import Analytics from './screens/Analytics/Analytics';
import Maps from './screens/Maps/Maps';
import News from './screens/News/News';
import Feedback from './screens/Feedback/Feedback';
import Profile from './screens/Profile/Profile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="analytics" replace /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'maps', element: <Maps /> },
      { path: 'news', element: <News /> },
      { path: 'feedback', element: <Feedback /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;