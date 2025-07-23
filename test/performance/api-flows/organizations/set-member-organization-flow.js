import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function setMemberOrganizationFlow(organizationId, userJwtToken, memberJwtToken) {
  // 1. Get organization member list
  const getOrganizationsMemberListRes = http.get(`${BASE_URL}organizations/${organizationId}/member-list`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetOrganizationsMemberListRes = check(getOrganizationsMemberListRes, {
    'get organization member list success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetOrganizationsMemberListRes) {
    fail(`get organization member list failed by virtual user with id ${__VU}, status: ${getOrganizationsMemberListRes.status}, body: ${getOrganizationsMemberListRes.body}`);
  }
  const memberId = getOrganizationsMemberListRes.json('data').find(user => user.username === 'userDummy').user_id;
  const lokalMemberId = getOrganizationsMemberListRes.json('data').find(user => user.username === `lokalMemberTest${__VU}${__ITER+1}`).user_id;
  sleep(1);

  // 2. Patch organization member roles
  const patchOrganizationsMemberRolesRes = http.patch(`${BASE_URL}organizations/${organizationId}/member-roles`,
    JSON.stringify({
      user_id: memberId,
      new_role: 'Operator',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPatchOrganizationsMemberRolesRes = check(patchOrganizationsMemberRolesRes, {
    'patch organization member roles success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchOrganizationsMemberRolesRes) {
    fail(`patch organization member roles failed by virtual user with id ${__VU}, status: ${patchOrganizationsMemberRolesRes.status}, body: ${patchOrganizationsMemberRolesRes.body}`);
  }
  sleep(1);

  // 3. Delete organization member
  const deleteOrganizationsMemberRes = http.del(`${BASE_URL}organizations/${organizationId}/member/${lokalMemberId}`, null,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    }
  );
  const checkDeleteOrganizationsMemberRes = check(deleteOrganizationsMemberRes, {
    'delete organization member success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteOrganizationsMemberRes) {
    fail(`delete organization member failed by virtual user with id ${__VU}, status: ${deleteOrganizationsMemberRes.status}, body: ${deleteOrganizationsMemberRes.body}`);
  }
  sleep(1);

  // 4. Delete organization leave
  const deleteOrganizationsLeaveRes = http.del(`${BASE_URL}organizations/${organizationId}/leave`, null,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberJwtToken}`,
      },
    }
  );
  const checkDeleteOrganizationsLeaveRes = check(deleteOrganizationsLeaveRes, {
    'delete organization leave success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkDeleteOrganizationsLeaveRes) {
    fail(`delete organization leave failed by virtual user with id ${__VU}, status: ${deleteOrganizationsLeaveRes.status}, body: ${deleteOrganizationsLeaveRes.body}`);
  }
  sleep(1);
}
