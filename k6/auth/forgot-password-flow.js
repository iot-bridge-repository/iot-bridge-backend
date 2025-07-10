import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../utils/config.js';

export default function forgotPassword (email) {
  // 1. Post forgot password
  const postForgotPasswordRes = http.post( `${BASE_URL}auth/forgot-password`,
    JSON.stringify({ email }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const checkPostForgotPasswordRes = check(postForgotPasswordRes, {
    'post forgot password success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostForgotPasswordRes) {
    fail(`post forgot password failed by virtual user with id ${__VU}, status: ${postForgotPasswordRes.status}, body: ${postForgotPasswordRes.body}`);
  }
  const resetPasswordToken = postForgotPasswordRes.json('data.resetPasswordToken');
  sleep(1);

  // 2. Get reset password
  const getResetPasswordRes = http.get( `${BASE_URL}auth/reset-password/${resetPasswordToken}`);
  const checkGetResetPasswordRes = check(getResetPasswordRes, {
    'get reset password success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetResetPasswordRes) {
    fail(`get reset password failed by virtual user with id ${__VU}, status: ${getResetPasswordRes.status}, body: ${getResetPasswordRes.body}`);
  }
  sleep(1);

  // 3. Post reset password
  const postResetPasswordRes = http.post( `${BASE_URL}auth/reset-password`,
    JSON.stringify({ 
      token: resetPasswordToken,
      new_password: '12345678',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const checkPostResetPasswordRes = check(postResetPasswordRes, {
    'post reset password success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostResetPasswordRes) {
    fail(`post reset password failed by virtual user with id ${__VU}, status: ${postResetPasswordRes.status}, body: ${postResetPasswordRes.body}`);
  }
  sleep(1);
}