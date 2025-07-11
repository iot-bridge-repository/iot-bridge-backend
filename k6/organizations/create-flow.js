import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../utils/config.js';

export default function createOrganization(username, jwtToken, adminSystemJwtToken) {
  // 1. Post organization propose
  const postOrganizationsProposeRes = http.post(`${BASE_URL}organizations/propose`,
    JSON.stringify({
      name: `Organization-test-${username}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  );
  const checkPostOrganizationsProposeRes = check(postOrganizationsProposeRes, {
    'propose organization success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostOrganizationsProposeRes) {
    fail(`propose organization failed by virtual user with id ${__VU}, status: ${postOrganizationsProposeRes.status}, body: ${postOrganizationsProposeRes.body}`);
  }
  const organizationId = postOrganizationsProposeRes.json('data.id');
  sleep(1);

  // 2. Get organization search
  const getOrganizationsSearchRes = http.get(`${BASE_URL}organizations/search?keyword=`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSystemJwtToken}`,
    },
  });
  const checkGetOrganizationsSearchRes = check(getOrganizationsSearchRes, {
    'get organization search success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetOrganizationsSearchRes) {
    fail(`get organization search failed by virtual user with id ${__VU}, status: ${getOrganizationsSearchRes.status}, body: ${getOrganizationsSearchRes.body}`);
  }
  sleep(1);

  // 3. Patch organization verify
  const patchOrganizationsUnverifyRes = http.patch(`${BASE_URL}organizations/unverify`,
    JSON.stringify({
      organization_id: organizationId,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSystemJwtToken}`,
      },
    },
  );
  const checkPatchOrganizationsUnverifyRes = check(patchOrganizationsUnverifyRes, {
    'unverify organization success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchOrganizationsUnverifyRes) {
    fail(`unverify organization failed by virtual user with id ${__VU}, status: ${patchOrganizationsUnverifyRes.status}, body: ${patchOrganizationsUnverifyRes.body}`);
  }
  sleep(1);

  // 4. Patch organization verify
  const patchOrganizationsVerifyRes = http.patch(`${BASE_URL}organizations/verify`,
    JSON.stringify({
      organization_id: organizationId,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSystemJwtToken}`,
      },
    },
  );
  const checkPatchOrganizationsVerifyRes = check(patchOrganizationsVerifyRes, {
    'verfy organization success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPatchOrganizationsVerifyRes) {
    fail(`verfy organization failed by virtual user with id ${__VU}, status: ${patchOrganizationsVerifyRes.status}, body: ${patchOrganizationsVerifyRes.body}`);
  }
  sleep(1);

  return organizationId;
}
