import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './shared/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { token, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
