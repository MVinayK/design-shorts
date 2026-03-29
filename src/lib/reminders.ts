import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Preferences, StreakState } from '../types';

const REMINDER_CHANNEL_ID = 'reading-reminders';
const REMINDER_IDENTIFIER_PREFIX = 'design-shorts-reading-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getReminderTimes(cadence: Preferences['readingReminderCadence']) {
  if (cadence === 'once') {
    return [{ hour: 8, minute: 30 }];
  }

  if (cadence === 'twice') {
    return [
      { hour: 8, minute: 30 },
      { hour: 20, minute: 0 },
    ];
  }

  return [];
}

function getReminderCopy(index: number, total: number, streakState?: StreakState) {
  const streak = streakState?.currentStreak ?? 0;
  const bodyPool =
    total === 1
      ? streak > 0
        ? [`Keep your ${streak}-day streak alive with one strong topic.`, `Day ${streak + 1} starts with one architecture idea.`]
        : ['Two minutes. One architecture idea.', 'Sharp systems thinking fits in a short break.']
      : index === 0
        ? streak > 0
          ? [`Morning rep: protect your ${streak}-day streak.`, `Start day ${streak + 1} with one design tradeoff.`]
          : ['Start the day with one good design tradeoff.', 'Morning sharpness: one system design idea.']
        : streak > 0
          ? [`Evening reset: one more topic keeps your ${streak}-day streak alive.`, `Close the day strong and carry the streak forward.`]
          : ['Close the day with one more design win.', 'Evening reset: one more topic and you are sharper.'];

  return {
    title: 'Design Shorts',
    body: bodyPool[index % bodyPool.length],
  };
}

async function ensureReminderChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Reading reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 220],
    lightColor: '#2d66c2',
  });
}

async function cancelExistingReminderScheduleAsync() {
  if (Platform.OS === 'web') {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderRequests = scheduled.filter((request) =>
    request.identifier.startsWith(REMINDER_IDENTIFIER_PREFIX),
  );

  await Promise.all(
    reminderRequests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

export async function syncReadingReminderSchedule(
  cadence: Preferences['readingReminderCadence'],
  streakState?: StreakState,
): Promise<{ scheduled: boolean; granted: boolean }> {
  if (Platform.OS === 'web') {
    return { scheduled: false, granted: true };
  }

  await cancelExistingReminderScheduleAsync();

  if (cadence === 'off') {
    return { scheduled: false, granted: true };
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  const permissions =
    existingPermissions.granted || existingPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      ? existingPermissions
      : await Notifications.requestPermissionsAsync();
  const granted =
    permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    return { scheduled: false, granted: false };
  }

  await ensureReminderChannelAsync();

  const reminderTimes = getReminderTimes(cadence);
  await Promise.all(
    reminderTimes.map((time, index) => {
      const copy = getReminderCopy(index, reminderTimes.length, streakState);

      return Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_IDENTIFIER_PREFIX}-${index}`,
        content: {
          title: copy.title,
          body: copy.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: REMINDER_CHANNEL_ID,
          hour: time.hour,
          minute: time.minute,
        },
      });
    }),
  );

  return { scheduled: true, granted: true };
}
