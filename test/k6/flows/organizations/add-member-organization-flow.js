import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function addMemberOrganizationFlow(userJwtToken, organizationId, memberJwtToken) {
  // 1. Get user
  const getUsersRes = http.get(`${BASE_URL}users/search?identity=`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetUsersRes = check(getUsersRes, {
    'get user success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetUsersRes) {
    fail(`get user failed by virtual user with id ${__VU}, status: ${getUsersRes.status}, body: ${getUsersRes.body}`);
  }
  const userDummyId = getUsersRes.json('data').find(user => user.username === 'userDummy').id;
  sleep(1);

  // 2. Post organization member invitation
  const postOrganizationsMembersInvitationRes = http.post(`${BASE_URL}organizations/${organizationId}/member-invitation`,
    JSON.stringify({
      user_id: userDummyId,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostOrganizationsMembersInvitationRes = check(postOrganizationsMembersInvitationRes, {
    'post organization member invitation success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostOrganizationsMembersInvitationRes) {
    fail(`post organization member invitation failed by virtual user with id ${__VU}, status: ${postOrganizationsMembersInvitationRes.status}, body: ${postOrganizationsMembersInvitationRes.body}`);
  }
  sleep(1);

  // 3. Patch organization member invitation response
  const patchOrganizationsMembersInvitationResponseRes = http.patch(`${BASE_URL}organizations/${organizationId}/member-invitation-response`,
    JSON.stringify({
      is_accepted: true,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberJwtToken}`,
      },
    },
  );
  const checkPatchOrganizationsMembersInvitationResponseRes = check(patchOrganizationsMembersInvitationResponseRes, {
    'patch organization member invitation response success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchOrganizationsMembersInvitationResponseRes) {
    fail(`patch organization member invitation response failed by virtual user with id ${__VU}, status: ${patchOrganizationsMembersInvitationResponseRes.status}, body: ${patchOrganizationsMembersInvitationResponseRes.body}`);
  }
  sleep(1);

  // 4. Post organization lokal member
  const postOrganizationsLokalMemberRes = http.post(`${BASE_URL}organizations/${organizationId}/lokal-member`,
    JSON.stringify({
      username: `lokalMemberTest${__ITER}`,
      password: '12345678',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPostOrganizationsLokalMemberRes = check(postOrganizationsLokalMemberRes, {
    'post organization lokal member invitation success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostOrganizationsLokalMemberRes) {
    fail(`post organization lokal member invitation failed by virtual user with id ${__VU}, status: ${postOrganizationsLokalMemberRes.status}, body: ${postOrganizationsLokalMemberRes.body}`);
  }
  sleep(1);
}
