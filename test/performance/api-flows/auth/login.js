import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function login (identity) {
  // 1. Login
  const postLoginRes = http.post( `${BASE_URL}auth/login`,
    JSON.stringify({
      identity: identity,
      password: '12345678',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const checkPostLoginRes = check(postLoginRes, {
    'post login success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostLoginRes) {
    fail(`post login failed by virtual user with id ${__VU}, status: ${postLoginRes.status}, body: ${postLoginRes.body}`);
  }
  sleep(1);

  return postLoginRes.json('data.token');
}
