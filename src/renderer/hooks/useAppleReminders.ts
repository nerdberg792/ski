import { useMemo } from "react";
import type {
  AppleReminder,
  AppleRemindersCreateResult,
  AppleRemindersListResult,
  AppleRemindersCompleteResult,
} from "../../types/apple-reminders";

export interface UseAppleRemindersResult {
  create: (payload: {
    title: string;
    listName?: string;
    dueDate?: string;
    priority?: string;
    notes?: string;
  }) => Promise<AppleRemindersCreateResult>;
  list: (payload: { listName?: string; completed?: boolean }) => Promise<AppleRemindersListResult>;
  complete: (reminderId: string) => Promise<AppleRemindersCompleteResult>;
  isAvailable: boolean;
}

export function useAppleReminders(): UseAppleRemindersResult {
  const skyAppleReminders = useMemo(() => window.sky?.appleReminders, []);

  const create = async (payload: {
    title: string;
    listName?: string;
    dueDate?: string;
    priority?: string;
    notes?: string;
  }): Promise<AppleRemindersCreateResult> => {
    console.log("🔔 [useAppleReminders] create called with payload:", payload);
    console.log("🔔 [useAppleReminders] skyAppleReminders available:", !!skyAppleReminders);
    
    if (!skyAppleReminders) {
      console.error("❌ [useAppleReminders] Apple Reminders API not available");
      return { success: false, error: "Apple Reminders integration is not available" };
    }
    try {
      console.log("📞 [useAppleReminders] Calling skyAppleReminders.create...");
      const result = await skyAppleReminders.create(payload);
      console.log("📞 [useAppleReminders] Result received:", result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ [useAppleReminders] Error in create:", message, error);
      return { success: false, error: message };
    }
  };

  const list = async (payload: {
    listName?: string;
    completed?: boolean;
  }): Promise<AppleRemindersListResult> => {
    if (!skyAppleReminders) {
      return { success: false, reminders: [], error: "Apple Reminders integration is not available" };
    }
    try {
      return await skyAppleReminders.list(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, reminders: [], error: message };
    }
  };

  const complete = async (reminderId: string): Promise<AppleRemindersCompleteResult> => {
    if (!skyAppleReminders) {
      return { success: false, error: "Apple Reminders integration is not available" };
    }
    try {
      return await skyAppleReminders.complete(reminderId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    create,
    list,
    complete,
    isAvailable: Boolean(skyAppleReminders),
  };
}

