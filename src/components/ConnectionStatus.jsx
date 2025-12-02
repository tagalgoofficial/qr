import { useEffect, useState } from 'react';
import useAuthStore from '../contexts/authStore';

const ConnectionStatus = () => {
  const { isOnline, error } = useAuthStore();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!isOnline || error === 'No internet connection') {
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [isOnline, error]);

  if (!showStatus) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">
          {!isOnline ? 'No Internet Connection' : 'Connection Error'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
