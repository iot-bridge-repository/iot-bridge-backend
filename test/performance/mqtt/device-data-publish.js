import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export default function mqttDeviceDataPublish (baseUrl, authCode, timeSeconds) {
  // 1. Post device data publish
  const postDeviceDataPublishRes = http.post(`${baseUrl}/device-data-publish`,
    JSON.stringify({
      authCode: authCode,
      timeSeconds: timeSeconds,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const checkPostDeviceDataPublishRes = check(postDeviceDataPublishRes, {
    'post device data publish success': (r) => r.status >= 200 && r.status < 300,
  });
  if (!checkPostDeviceDataPublishRes) {
    fail(`post device data publish failed by virtual user with id ${__VU}, status: ${postDeviceDataPublishRes.status}, body: ${postDeviceDataPublishRes.body}`);
  }
  sleep(1);
}
