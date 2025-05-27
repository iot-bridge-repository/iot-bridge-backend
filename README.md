<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

#### 1️⃣ Install dependencies

Run the following command to install all required dependencies:

```bash
$ npm install
```

#### 2️⃣ Configure .env

Add the following variables to the .env file in the project root:

```bash
# 📦 Database config
DB_TYPE=postgres # must be postgres
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# 🔐 JWT Configuration
JWT_SECRET=your_jwt_secret_key

# 🌍 Application Environment
NODE_ENV=development  # Use "development" or "production"

# ✉️ Email Configuration
EMAIL_SERVICE_ADDRESS=your-email@gmail.com
EMAIL_SERVICE_PASSWORD=your-app-password  # Use an App Password from Gmail

# 📡 MQTT Configuration
MQTT_BROKER_URL=mqtt://your-broker-url:your-broker-port
MQTT_BROKER_USERNAME=your-broker-username
MQTT_BROKER_PASSWORD=your-broker-password
```

NODE_ENV → Choose "development" for development mode or "production" for production mode.

EMAIL_SERVICE_PASSWORD → Do not use your regular Gmail password. Use an App Password from Google.

🔗 How to get an App Password:
1. Go to Google Account Security.
2. Enable 2-Step Verification (if not already enabled).
3. Search App passwords, and create an app password.
4. Use the password for EMAIL_SERVICE_PASSWORD.

#### 3️⃣ Create database

Create database according to name in DB_NAME.

#### 4️⃣ Run migrations

After configuring the database, run the following command to run the migration:

```bash
$ npx typeorm-ts-node-commonjs migration:run -d src/database/database.config.ts
```

#### 5️⃣ Run seeders (Admin System)

If you don't want to add a Admin System user, you can skip this step.

To add a System Admin user to the database, add the following variables in .env:

```bash
ADMIN_SYSTEM_EMAILS=admin1@example.com,admin2@example.com,admin3@example.com,admin4@example.com,admin5@example.com
ADMIN_SYSTEM_PHONE_NUMBERS=08xxxxxxxx,08xxxxxxxx,08xxxxxxxx,08xxxxxxxx,08xxxxxxxx
ADMIN_SYSTEM_USERNAMES=admin1,admin2,admin3,admin4,admin5
ADMIN_SYSTEM_PASSWORD=password123
```

Remember the password must be at least 6 characters and a maximum of 20. 

You can only fill in one password for all users and the deafult password is `12345678`.

Then run the following command:

```bash
$ npx ts-node src/database/seeders/createUsersAdminSystem.ts
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Websocket and MQTT Documentation

### 📡 WebSocket

#### 🔸 Event: `device-id/{deviceId}/pin/{pin}`
Emitted by server to send real-time sensor data for a specific pin of a device.

**Payload:**
```json
{
  "value": 23.5,
  "time": "2025-05-27T12:00:00Z"
}
```

### 🛰️ MQTT

#### 🔸 Topic: `auth-code/{authCode}`
This topic is used to send the auth code to the client.

**Payload:**
```json
{
  "V1": 23.5,
  "V2": 23.5
}
```
