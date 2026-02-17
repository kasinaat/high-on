// Example usage of the notification system

import { useNotification } from '@/lib/notification-context';

export function ExampleComponent() {
  const { showNotification } = useNotification();

  // Success notification
  const handleSuccess = () => {
    showNotification('success', 'Operation completed successfully!');
  };

  // Error notification
  const handleError = () => {
    showNotification('error', 'Something went wrong. Please try again.');
  };

  // Warning notification
  const handleWarning = () => {
    showNotification('warning', 'Please review your information before submitting.');
  };

  // Info notification
  const handleInfo = () => {
    showNotification('info', 'Your session will expire in 5 minutes.');
  };

  // Custom duration (default is 5000ms)
  const handleCustomDuration = () => {
    showNotification('success', 'This will disappear in 3 seconds', 3000);
  };

  // Persistent notification (duration = 0 means it won't auto-dismiss)
  const handlePersistent = () => {
    showNotification('info', 'This will stay until you close it', 0);
  };

  return (
    
      {/* Your component JSX */}
  );
}
