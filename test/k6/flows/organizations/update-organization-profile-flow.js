import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function updateOrganizationProfileflow (organizationId, userJwtToken, username) {
  // 1. Get organization profile
  const getOrganizationsProfileRes = http.get(`${BASE_URL}organizations/${organizationId}/profile`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetOrganizationsProfileRes = check(getOrganizationsProfileRes, {
    'get organization profile success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetOrganizationsProfileRes) {
    fail(`get organization profile failed by virtual user with id ${__VU}, status: ${getOrganizationsProfileRes.status}, body: ${getOrganizationsProfileRes.body}`);
  }
  sleep(1);

  // 2. Patch organization profile
  const patchOrganizationsProfileRes = http.patch(`${BASE_URL}organizations/${organizationId}/profile` ,
    JSON.stringify({
      name: `Organization-test-${username}`,
      description: `This is a description of the organization-test-${__VU}`,
      location: 'Universitas Lampung',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userJwtToken}`,
      },
    },
  );
  const checkPatchOrganizationsProfileRes = check(patchOrganizationsProfileRes, {
    'patch organization success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchOrganizationsProfileRes) {
    fail(`patch organization failed by virtual user with id ${__VU}, status: ${patchOrganizationsProfileRes.status}, body: ${patchOrganizationsProfileRes.body}`);
  }
  sleep(1);
}
