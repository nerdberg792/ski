export interface AppleReminder {
  id: string;
  name: string;
  body: string;
  completed: boolean;
  dueDate?: string;
  priority?: string;
  listName?: string;
}

export interface AppleRemindersCreateResult {
  success: boolean;
  error?: string;
  reminderId?: string;
}

export interface AppleRemindersListResult {
  success: boolean;
  reminders?: AppleReminder[];
  error?: string;
}

export interface AppleRemindersCompleteResult {
  success: boolean;
  error?: string;
}

