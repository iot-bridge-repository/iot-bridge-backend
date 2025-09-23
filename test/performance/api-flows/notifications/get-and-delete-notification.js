import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function getAndDeleteNotification(userJwtToken) {
  // 1. Get notification
  const getNotificationRes = http.get(`${BASE_URL}notifications`, {
    headers: {
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetNotificationRes = check(getNotificationRes, {
    'get notification success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetNotificationRes) {
    fail(`get notification failed by virtual user with id ${__VU}, status: ${getNotificationRes.status}, body: ${getNotificationRes.body}`,);
  }
  const notificationId = getNotificationRes.json('data[0].id');
  sleep(1);

  // 2. Delete notification by id
  const deleteNotificationByIdRes = http.del(`${BASE_URL}notifications/${notificationId}`, null,
    {
      headers: {
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDeleteNotificationByIdRes = check(deleteNotificationByIdRes, {
    'delete notification by id success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteNotificationByIdRes) {
    fail(`delete notification by id failed by virtual user with id ${__VU}, status: ${deleteNotificationByIdRes.status}, body: ${deleteNotificationByIdRes.body}`,);
  }
  sleep(1);

  // 3. Delete all notification
  const deleteAllNotificationRes = http.del(`${BASE_URL}notifications`, null,
    {
      headers: {
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDeleteAllNotificationRes = check(deleteAllNotificationRes, {
    'delete all notification success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteAllNotificationRes) {
    fail(`delete all notification failed by virtual user with id ${__VU}, status: ${deleteAllNotificationRes.status}, body: ${deleteAllNotificationRes.body}`,);
  }
  sleep(1);
}
