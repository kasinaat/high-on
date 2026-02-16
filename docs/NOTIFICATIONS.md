# Notification System

A global toast notification system for displaying success, error, warning, and info messages across the application.

## Features

- ✅ 4 notification types: success, error, warning, info
- ✅ Auto-dismiss with configurable duration
- ✅ Manual dismiss by clicking the X button
- ✅ Stacked notifications (multiple can show at once)
- ✅ Smooth animations
- ✅ Dark mode support
- ✅ Mobile responsive

## Usage

### 1. Import the hook

```tsx
import { useNotification } from '@/lib/notification-context';
```

### 2. Use in your component

```tsx
function MyComponent() {
  const { showNotification } = useNotification();

  const handleSuccess = () => {
    showNotification('success', 'Operation completed successfully!');
  };

  const handleError = () => {
    showNotification('error', 'Something went wrong');
  };

  // ... rest of component
}
```

## API

### `showNotification(type, message, duration?)`

**Parameters:**
- `type`: `'success' | 'error' | 'warning' | 'info'`
- `message`: `string` - The message to display
- `duration`: `number` (optional) - Time in milliseconds before auto-dismiss (default: 5000). Set to 0 to prevent auto-dismiss.

**Examples:**

```tsx
// Success notification (auto-dismiss after 5 seconds)
showNotification('success', 'Data saved successfully!');

// Error notification (auto-dismiss after 5 seconds)
showNotification('error', 'Failed to load data');

// Warning notification (custom duration: 3 seconds)
showNotification('warning', 'Session expires soon', 3000);

// Info notification (persistent - won't auto-dismiss)
showNotification('info', 'Read this important message', 0);
```

## Notification Types

### Success
Green colored notification for successful operations.
```tsx
showNotification('success', 'Order placed successfully!');
```

### Error
Red colored notification for errors and failures.
```tsx
showNotification('error', 'Failed to process payment');
```

### Warning
Yellow colored notification for warnings and cautions.
```tsx
showNotification('warning', 'Your session will expire in 5 minutes');
```

### Info
Blue colored notification for informational messages.
```tsx
showNotification('info', 'New features are now available');
```

## Examples

### Form Submission
```tsx
const handleSubmit = async (data) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showNotification('success', 'Form submitted successfully!');
    } else {
      showNotification('error', 'Failed to submit form');
    }
  } catch (error) {
    showNotification('error', 'Network error occurred');
  }
};
```

### Data Loading
```tsx
const loadData = async () => {
  try {
    const data = await fetchData();
    showNotification('success', 'Data loaded successfully');
  } catch (error) {
    showNotification('error', error.message || 'Failed to load data');
  }
};
```

### Delete Confirmation
```tsx
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;

  try {
    await deleteItem(id);
    showNotification('success', 'Item deleted successfully');
  } catch (error) {
    showNotification('error', 'Failed to delete item');
  }
};
```

## Already Implemented

The notification system is already integrated in:
- ✅ Checkout page (order placement, cart errors)
- ✅ Dashboard (outlet/product deletion)
- ✅ Global layout (available everywhere)

## Tips

- Keep messages concise and clear
- Use appropriate notification types
- For user actions, always show feedback
- Consider UX: don't overwhelm users with notifications
- Use persistent notifications (duration: 0) sparingly
