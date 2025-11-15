import { Route, Routes } from 'react-router-dom';
import NotificationModule from './index';

/**
 * Notification Module Routes
 * Main entry point for notification system dashboard
 */
const NotificationRoutes = () => {
  return (
    <Routes>
      <Route path="/*" element={<NotificationModule />} />
    </Routes>
  );
};

export default NotificationRoutes;
