import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../utils/config.js';

export default function changeEmailandPassword(email, jwtToken) {
  // 1. Patch email
  const patchEmailRes = http.patch(`${BASE_URL}auth/email`,
    JSON.stringify({
      new_email: `edited${email}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  );
  const checkPatchEmailRes = check(patchEmailRes, {
    'patch email success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchEmailRes) {
    fail(`patch email failed by virtual user with id ${__VU}, status: ${patchEmailRes.status}, body: ${patchEmailRes.body}`);
  }
  const verifyToken = patchEmailRes.json('data.verifyToken');
  sleep(1);

  // 2. Verify Email
  const getVerifyRes = http.get(`${BASE_URL}auth/verify-email?token=${verifyToken}`);
  const checkGetVerifyRes = check(getVerifyRes, {
    'get verify email success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetVerifyRes) {
    fail(`get verify email failed by virtual user with id ${__VU}, status: ${getVerifyRes.status}, body: ${getVerifyRes.body}`);
  }
  sleep(1);

  // 3. Patch password
  const patchPasswordRes = http.patch(`${BASE_URL}auth/password`,
    JSON.stringify({
      old_password: '12345678',
      new_password: '12345678',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  );
  const checkPatchPasswordRes = check(patchPasswordRes, {
    'patch password success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchPasswordRes) {
    fail(`patch password failed by virtual user with id ${__VU}, status: ${patchPasswordRes.status}, body: ${patchPasswordRes.body}`);
  }
  sleep(1); 
}
