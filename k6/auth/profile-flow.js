import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../utils/config.js';

export default function profile(userJwtToken, user) {
  // 1. Get profile
  const getProfileRes = http.get(`${BASE_URL}auth/profile`, {
    headers: {
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetProfileRes = check(getProfileRes, {
    'get profile success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetProfileRes) {
    fail(`get profile failed by virtual user with id ${__VU}, status: ${getProfileRes.status}, body: ${getProfileRes.body}`,);
  }
  sleep(1);

  // 2. Patch profile
  const patchProfileRes = http.patch(`${BASE_URL}auth/profile`,
    JSON.stringify({
      username: user.username,
      phone_number: user.phone_number,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPatchProfileRes = check(patchProfileRes, {
    'patch profile success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchProfileRes) {
    fail(`patch profile failed by virtual user with id ${__VU}, status: ${patchProfileRes.status}, body: ${patchProfileRes.body}`);
  }
  sleep(1);
}
