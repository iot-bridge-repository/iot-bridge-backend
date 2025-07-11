import register from "../auth/register-flow.js";
import forgotPassword from "../auth/forgot-password-flow.js";
import login from "../auth/login-flow.js";
import profile from "../auth/profile-flow.js";
import changeEmailAndPassword from "../auth/change-email-and-password-flow.js";
import createOrganization from "../organizations/create-flow.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const adminSystemJwtToken = login('adminSystem@example.com');

  // 1. Auth
  const user = register();
  forgotPassword(user.email);
  const jwtToken = login(user.email);
  profile(jwtToken, user);
  changeEmailAndPassword(user.email, jwtToken);

  // 2. Organization
  createOrganization(user.username, jwtToken, adminSystemJwtToken);
}