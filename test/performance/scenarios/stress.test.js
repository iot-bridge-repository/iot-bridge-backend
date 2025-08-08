import registerFlow from "../api-flows/auth/register-flow.js";
import forgotPasswordFlow from "../api-flows/auth/forgot-password-flow.js";
import login from "../api-flows/auth/login.js";
import updateProfileFlow from "../api-flows/auth/update-profile-flow.js";
import changeEmailAndPasswordFlow from "../api-flows/auth/change-email-and-password-flow.js";
import createOrganizationFlow from "../api-flows/organizations/create-organization-flow.js";
import updateOrganizationProfileflow from "../api-flows/organizations/update-organization-profile-flow.js";
import addMemberOrganizationFlow from "../api-flows/organizations/add-member-organization-flow.js";
import setMemberOrganizationFlow from "../api-flows/organizations/set-member-organization-flow.js";
import getOrganization from "../api-flows/organizations/get-organization.js";
import deviceCrudFlow from "../api-flows/devices/device-crud-flow.js";
import widgetBoxCrudFlow from "../api-flows/devices/widget-box-crud-flow.js";
import notificationEventCrudFlow from "../api-flows/devices/notification-event-crud-flow.js";
import getDeviceReport from "../api-flows/devices/get-device-report.js";
import getAndDeleteNotification from "../api-flows/notifications/get-and-delete-notification.js";
import getUser from "../api-flows/users/get-user.js";
import wsDevicePinSubscription from "../ws/device-pin-subscription.js";
import mqttDeviceDataPublish from "../mqtt/device-data-publish.js";

export const options = {
  stages: [
    { duration: '2m',  target: 20 },
    { duration: '2m',  target: 50 },
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 400 },
    { duration: '3m',  target: 600 },
    /*{ duration: '3m',  target: 800 },
    { duration: '5m',  target: 1000 },
    { duration: '2m',  target: 400 }, */
    { duration: '1m',  target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<1500'],  // Mayoritas request harus di bawah 1 detik, 99% di bawah 1.5 detik
    http_req_failed: ['rate<0.01'],                   // Error rate tidak boleh lebih dari 1%
    ws_connecting: ['p(95)<100'],                     // Koneksi WebSocket harus cepat (<100ms untuk 95% koneksi)
    ws_msgs_received: ['count>0'],                    // Harus menerima pesan selama sesi
    ws_session_duration: ['avg>=5000'],               // Pastikan sesi WebSocket berlangsung seperti yang diharapkan
  }
};

export default function () {
const mqttDeviceDataPublishBaseUrl = (__ENV.MQTT_DEVICE_DATA_PUBLISH_BASE_URL && __ENV.MQTT_DEVICE_DATA_PUBLISH_BASE_URL.trim() !== '')
  ? __ENV.MQTT_DEVICE_DATA_PUBLISH_BASE_URL.trim()
  : 'http://localhost:4000';

  const adminSystemJwtToken = login('adminSystem');
  const memberJwtToken = login('userDummy');

  // 1. Auth
  const user = registerFlow();
  forgotPasswordFlow(user.email);
  const userJwtToken = login(user.email);
  updateProfileFlow(userJwtToken, user);
  changeEmailAndPasswordFlow(user.email, userJwtToken);

  // 2. Organizations
  const organizationId = createOrganizationFlow(user.username, userJwtToken, adminSystemJwtToken);
  updateOrganizationProfileflow(organizationId, userJwtToken, user.username);
  addMemberOrganizationFlow(userJwtToken, organizationId, memberJwtToken);
  setMemberOrganizationFlow(organizationId, userJwtToken, memberJwtToken);
  getOrganization(organizationId, adminSystemJwtToken);

  // 3. Devices
  const device = deviceCrudFlow(organizationId, user.username, userJwtToken);
  mqttDeviceDataPublish(mqttDeviceDataPublishBaseUrl, device.authCode, 20);
  widgetBoxCrudFlow(organizationId, device.id, userJwtToken, user.username);
  wsDevicePinSubscription(device.id, "V1", 5);
  notificationEventCrudFlow(organizationId, device.id, userJwtToken, user.username);
  getDeviceReport(organizationId, device.id, userJwtToken);

  // 4. Notifications
  getAndDeleteNotification(userJwtToken);

  // 5. Users
  getUser(adminSystemJwtToken, user.username);
}