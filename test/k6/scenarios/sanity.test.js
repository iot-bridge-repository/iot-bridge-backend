import registerFlow from "../flows/auth/register-flow.js";
import forgotPasswordFlow from "../flows/auth/forgot-password-flow.js";
import login from "../flows/auth/login.js";
import updateProfileFlow from "../flows/auth/update-profile-flow.js";
import changeEmailAndPasswordFlow from "../flows/auth/change-email-and-password-flow.js";
import createOrganizationFlow from "../flows/organizations/create-organization-flow.js";
import updateOrganizationProfileflow from "../flows/organizations/update-organization-profile-flow.js";
import addMemberOrganizationFlow from "../flows/organizations/add-member-organization-flow.js";
import setMemberOrganizationFlow from "../flows/organizations/set-member-organization-flow.js";
import getOrganization from "../flows/organizations/get-organization.js";
import deviceCrudFlow from "../flows/devices/device-crud-flow.js";
import widgetBoxCrudFlow from "../flows/devices/widget-box-crud-flow.js";
import notificationEventCrudFlow from "../flows/devices/notification-event-crud-flow.js";
import getDeviceReport from "../flows/devices/get-device-report.js";
import getAndDeleteNotification from "../flows/notifications/get-and-delete-notification.js";
import getUser from "../flows/users/get-user.js";
import wsDevicePinSubscription from "../ws/device-pin-subscription.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
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
  const deviceId = deviceCrudFlow(organizationId, user.username, userJwtToken);
  widgetBoxCrudFlow(organizationId, deviceId, userJwtToken, user.username);
  wsDevicePinSubscription(deviceId, "V1", 5);
  notificationEventCrudFlow(organizationId, deviceId, userJwtToken, user.username);
  getDeviceReport(organizationId, deviceId, userJwtToken);

  // 4. Notifications
  getAndDeleteNotification(userJwtToken);

  // 5. Users
  getUser(adminSystemJwtToken, user.username);
}