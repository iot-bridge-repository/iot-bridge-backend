import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function widgetBoxCrudFlow(organizationId, deviceId, userJwtToken, username) {
  // 1. Get pin list
  const getPinListRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/pin-list`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetPinListRes = check(getPinListRes, {
    'get pin list for widget box success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetPinListRes) {
    fail(`get pin list for widget box failed by virtual user with id ${__VU}, status: ${getPinListRes.status}, body: ${getPinListRes.body}`);
  }
  sleep(1);

  // 2. Put widget box
  const putWidgetBoxRes = http.put(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/widget-boxes`,
    JSON.stringify({
      name: `Widget-box-test-${username}`,
      pin: "V1",
      unit: "Celcius",
      min_value: "0",
      max_value: "100",
      default_value: "50"
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPutWidgetBoxRes = check(putWidgetBoxRes, {
    'put widget box success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPutWidgetBoxRes) {
    fail(`put widget box failed by virtual user with id ${__VU}, status: ${putWidgetBoxRes.status}, body: ${putWidgetBoxRes.body}`);
  }
  const widgetBoxId = putWidgetBoxRes.json('data.id');
  sleep(1);

  // 3. Get widget box list
  const getWidgetBoxListRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/widget-boxes/list`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetWidgetboxListRes = check(getWidgetBoxListRes, {
    'get widget box list success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetWidgetboxListRes) {
    fail(`get widget box list failed by virtual user with id ${__VU}, status: ${getWidgetBoxListRes.status}, body: ${getWidgetBoxListRes.body}`);
  }
  sleep(1);

  // 4. Get widget box
  const getWidgetBoxRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/widget-boxes/${widgetBoxId}`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetWidgetBoxRes = check(getWidgetBoxRes, {
    'get widget box success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetWidgetBoxRes) {
    fail(`get widget box failed by virtual user with id ${__VU}, status: ${getWidgetBoxRes.status}, body: ${getWidgetBoxRes.body}`);
  }
  sleep(1);

  // 5. Delete widget box
  const deleteWidgetBoxRes = http.del(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/widget-boxes/${widgetBoxId}`, null,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDeleteWidgetBoxRes = check(deleteWidgetBoxRes, {
    'delete widget box success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteWidgetBoxRes) {
    fail(`delete widget box failed by virtual user with id ${__VU}, status: ${deleteWidgetBoxRes.status}, body: ${deleteWidgetBoxRes.body}`);
  }
}
