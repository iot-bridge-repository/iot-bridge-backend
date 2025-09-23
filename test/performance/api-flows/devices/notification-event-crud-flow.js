import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function notificationEventCrudFlow(organizationId, deviceId, userJwtToken, username) {
  // 1. Get pin list
  const getPinListRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/pin-list`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetPinListRes = check(getPinListRes, {
    'get pin list for notification event success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetPinListRes) {
    fail(`get pin list for notification event failed by virtual user with id ${__VU}, status: ${getPinListRes.status}, body: ${getPinListRes.body}`);
  }
  sleep(1);

  // 2. Post notification event
  const postNotificationEventRes = http.post(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events`,
    JSON.stringify({
      pin: "V1",
      subject: `Notfication-event-test-${username}`,
      message: "suhu telalu dingin, nyalakan pompa",
      comparison_type: "=",
      threshold_value: "50",
      is_active: true
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostNotificationEventRes = check(postNotificationEventRes, {
    'post notification event success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostNotificationEventRes) {
    fail(`post notification event failed by virtual user with id ${__VU}, status: ${postNotificationEventRes.status}, body: ${postNotificationEventRes.body}`);
  }
  const notificationEventId = postNotificationEventRes.json('data.id');
  sleep(1);

  // 3. Get notification event list
  const getNotificationEventListRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events/list`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkNotificationEventListRes = check(getNotificationEventListRes , {
    'get notification event list success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkNotificationEventListRes) {
    fail(`get notification event list failed by virtual user with id ${__VU}, status: ${getNotificationEventListRes.status}, body: ${getNotificationEventListRes.body}`);
  }
  sleep(1);

  // 4. Get notification event
  const getNotificationEventRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events/${notificationEventId}`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkNotificationEventRes = check(getNotificationEventRes , {
    'get notification event success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkNotificationEventRes) {
    fail(`get notification event failed by virtual user with id ${__VU}, status: ${getNotificationEventRes.status}, body: ${getNotificationEventRes.body}`);
  }
  sleep(1);

  // 5. Patch notification event
  const patchNotificationEventRes = http.patch(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events/${notificationEventId}`,
    JSON.stringify({
      pin: "V1",
      subject: `Notfication-event-test-${username}-edit`,
      message: "suhu telalu dingin, nyalakan pompa",
      comparison_type: "=",
      threshold_value: "50",
      is_active: true
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPatchNotificationEventRes = check(patchNotificationEventRes, {
    'patch notification event success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchNotificationEventRes) {
    fail(`patch notification event failed by virtual user with id ${__VU}, status: ${patchNotificationEventRes.status}, body: ${patchNotificationEventRes.body}`);
  }
  sleep(1);

  // 6. Delete notification event
  const deleteNotificationEventRes = http.del(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events/${notificationEventId}`, null,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDeleteNotificationEventRes = check(deleteNotificationEventRes, {
    'delete notification event success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteNotificationEventRes) {
    fail(`delete notification event failed by virtual user with id ${__VU}, status: ${deleteNotificationEventRes.status}, body: ${deleteNotificationEventRes.body}`);
  }

  // 2. Post notification event 2
  const postNotificationEvent2Res = http.post(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/notification-events`,
    JSON.stringify({
      pin: "V1",
      subject: `Notfication-event-test-${username}`,
      message: "suhu telalu dingin, nyalakan pompa",
      comparison_type: "=",
      threshold_value: "50",
      is_active: true
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostNotificationEvent2Res = check(postNotificationEvent2Res, {
    'post notification event 2 success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostNotificationEvent2Res) {
    fail(`post notification event 2 failed by virtual user with id ${__VU}, status: ${postNotificationEvent2Res.status}, body: ${postNotificationEvent2Res.body}`);
  }
  sleep(1);
}
