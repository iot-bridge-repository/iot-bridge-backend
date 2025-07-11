import register from "../auth/register-flow.js";
import forgotPassword from "../auth/forgot-password-flow.js";
import login from "../auth/login-flow.js";
import profile from "../auth/profile-flow.js";
import changeEmailAndPassword from "../auth/change-email-and-password-flow.js";
import createOrganization from "../organizations/create-flow.js";
import profileOrganization from "../organizations/profile-flow.js";
import addMemberOrganization from "../organizations/add-member-flow.js";
import setMemberOrganization from "../organizations/set-member-flow.js";
import getOrganization from "../organizations/get-flow.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const adminSystemJwtToken = login('adminSystem');

  // 1. Auth
  const user = register();
  forgotPassword(user.email);
  const userJwtToken = login(user.email);
  profile(userJwtToken, user);
  changeEmailAndPassword(user.email, userJwtToken);

  // 2. Organization
  const organizationId = createOrganization(user.username, userJwtToken, adminSystemJwtToken);
  profileOrganization(organizationId, userJwtToken, user.username);
  const memberJwtToken = login('userDummy');
  addMemberOrganization(userJwtToken, organizationId, memberJwtToken);
  setMemberOrganization(organizationId, userJwtToken, memberJwtToken);
  getOrganization(organizationId, adminSystemJwtToken);
}