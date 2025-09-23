import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function getOrganization(organizationId, adminSystemJwtToken) {
  // 1. Get organization
  const getOrganizationsRes = http.get(`${BASE_URL}organizations/${organizationId}`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminSystemJwtToken}`,
    },
  });
  const checkGetOrganizationsRes = check(getOrganizationsRes, {
    'get organization success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetOrganizationsRes) {
    fail(`get organization failed by virtual user with id ${__VU}, status: ${getOrganizationsRes.status}, body: ${getOrganizationsRes.body}`);
  }
  sleep(1);
}