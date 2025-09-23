import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { generateUser } from '../../utils/helper.js';
import { BASE_URL } from '../../utils/config.js';

export default function registerFlow () {
  const user = generateUser();

  // 1. Register
  const postRegisterRes = http.post(`${BASE_URL}auth/register`, JSON.stringify(user), 
    { headers: { 'Content-Type': 'application/json' } }
  );
  const checkPostRegisterRes = check(postRegisterRes, {
    'post register success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostRegisterRes) {
    fail(`post register failed by virtual user with id ${__VU}, status: ${postRegisterRes.status}, body: ${postRegisterRes.body}`);
  }
  const verifyToken = postRegisterRes.json('data.verifyToken');
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

  return {
    email: user.email,
    username: user.username,
    phone_number: user.phone_number,
    password: user.password
  }
}
