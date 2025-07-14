import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { BASE_URL } from '../../utils/config.js';

export default function getDeviceReport (organizationId, deviceId, userJwtToken) {
  // 1. Get device report
  const getDeviceReportRes = http.get(`${BASE_URL}organizations/${organizationId}/devices/${deviceId}/report`,{
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userJwtToken}`,
    },
  });
  const checkGetDeviceReportRes = check(getDeviceReportRes, {
    'get device report success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkGetDeviceReportRes) {
    fail(`get device report failed by virtual user with id ${__VU}, status: ${getDeviceReportRes.status}, body: ${getDeviceReportRes.body}`);
  }
  sleep(1);
}
