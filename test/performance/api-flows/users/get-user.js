import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function getUser(adminSystemJwtToken, username) {
  // 1. Get users search
  const getUsersSearchRes = http.get(`${BASE_URL}users/search?identity=`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSystemJwtToken}`,
    },
  });
  const checkGetUsersSearchRes = check(getUsersSearchRes, {
    'get users search success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetUsersSearchRes) {
    fail(`get users search failed by virtual user with id ${__VU}, status: ${getUsersSearchRes.status}, body: ${getUsersSearchRes.body}`);
  }
  const userId = getUsersSearchRes.json('data').find(user => user.username === `${username}`).id;
  sleep(1);

  // 2. Get users by id
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
