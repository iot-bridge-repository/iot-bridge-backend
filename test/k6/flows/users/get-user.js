import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function getUser(adminSystemJwtToken, username) {
  // 1. Get user
  const getUsersRes = http.get(`${BASE_URL}users/search?identity=`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSystemJwtToken}`,
    },
  });
  const checkGetUsersRes = check(getUsersRes, {
    'get user success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetUsersRes) {
    fail(`get user failed by virtual user with id ${__VU}, status: ${getUsersRes.status}, body: ${getUsersRes.body}`);
  }
  const userId = getUsersRes.json('data').find(user => user.username === `${username}`).id;
  sleep(1);

  // 2. Get user by id
  const getUsersByIdRes = http.get(`${BASE_URL}users/${userId}`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSystemJwtToken}`,
    },
  });
  const checkGetUsersByIdRes = check(getUsersByIdRes, {
    'get user by id success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetUsersByIdRes) {
    fail(`get user by id failed by virtual user with id ${__VU}, status: ${getUsersByIdRes.status}, body: ${getUsersByIdRes.body}`);
  }
  sleep(1);

}
