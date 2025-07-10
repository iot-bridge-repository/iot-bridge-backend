import register from "../auth/register-flow.js";
import forgotPassword from "../auth/forgot-password-flow.js";
import login from "../auth/login-flow.js";
import profile from "../auth/profile-flow.js";
import changeEmailAndPassword from "../auth/change-email-and-password-flow.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  // 1. Auth
  const user = register();
  forgotPassword(user.email);
  const jwtToken = login(user);
  profile(jwtToken, user);
  changeEmailAndPassword(jwtToken, user);
}