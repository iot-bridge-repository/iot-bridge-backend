import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function deviceCrudFlow (organizationId, username, userJwtToken) {
  // 1. Post devices
  const postDevicesRes = http.post(`${BASE_URL}organizations/${organizationId}/devices`,
    JSON.stringify({
      name: `Device-test-${username}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostDevicesRes = check(postDevicesRes, {
    'post device success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostDevicesRes) {
    fail(`post device failed by virtual user with id ${__VU}, status: ${postDevicesRes.status}, body: ${postDevicesRes.body}`);
  }
  const deviceId = postDevicesRes.json('data.id');
  sleep(1);

  // 2. Get device search
  const getDevicesSearchRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/search?name=`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetDevicesSearchRes = check(getDevicesSearchRes, {
    'get device search success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetDevicesSearchRes) {
    fail(`get device search failed by virtual user with id ${__VU}, status: ${getDevicesSearchRes.status}, body: ${getDevicesSearchRes.body}`);
  }
  sleep(1);

  // 3. Get device
  const getDevicesRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetDevicesRes = check(getDevicesRes, {
    'get device success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetDevicesRes) {
    fail(`get device failed by virtual user with id ${__VU}, status: ${getDevicesRes.status}, body: ${getDevicesRes.body}`);
  }
  sleep(1);

  // 4. Patch devices
  const patchDevicesRes = http.patch(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}`,
    JSON.stringify({
      name: `Device-test-${username}-edit`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPatchDevicesRes = check(patchDevicesRes, {
    'patch device success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchDevicesRes) {
    fail(`patch device failed by virtual user with id ${__VU}, status: ${patchDevicesRes.status}, body: ${patchDevicesRes.body}`);
  }
  sleep(1);

  // 5. Delete device
  const deleteDevicesRes = http.del(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}`, null,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDevicesRes = check(deleteDevicesRes, {
    'delete device success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDevicesRes) {
    fail(`delete device failed by virtual user with id ${__VU}, status: ${deleteDevicesRes.status}, body: ${deleteDevicesRes.body}`);
  }
  sleep(1);

  // 6. Post devices 2
  const postDevices2Res = http.post(`${BASE_URL}organizations/${organizationId}/devices`,
    JSON.stringify({
      name: `Device-test-${username}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostDevices2Res = check(postDevices2Res, {
    'post device 2 success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostDevices2Res) {
    fail(`post device 2 failed by virtual user with id ${__VU}, status: ${postDevices2Res.status}, body: ${postDevices2Res.body}`);
  }
  sleep(1);

  return{
    id: postDevices2Res.json('data.id'),
    authCode: postDevices2Res.json('data.auth_code'),
  } 
}
