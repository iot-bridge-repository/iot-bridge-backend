import { SharedArray } from 'k6/data';

const baseUsers = new SharedArray('baseUsers', () => [
  {
    emailPrefix: 'userTest',
    password: '12345678',
    username: 'userTest',
  },
]);

export function generateUser() {
  const base = baseUsers[0];

  const index = __VU * 1000 + __ITER + 1;
  const randPhone = Math.floor(100000000 + Math.random() * 1000000000);

  return {
    email: `${base.emailPrefix}${index}@example.com`,
    username: `${base.username}_${index}`,
    phone_number: `085${randPhone}`,
    password: base.password,
  };
}
