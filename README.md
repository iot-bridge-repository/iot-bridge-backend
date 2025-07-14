# IoT Bridge Backend - Research Project

## 📌 Project Overview

This backend system is designed to support an IoT platform that enables organizations to manage their users, devices, and data visualization settings. It provides RESTful APIs, integrates with MQTT for IoT device communication, and implements role-based access control for security and flexibility.

This project was developed as part of a bachelor's thesis in Information Technology.

## 🚀 Project setup

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
JWT_SECRET=your-jwt-secret-key

# 🌍 Application Environment
NODE_ENV=development  # Choose "development" for development mode or "production" for production mode, but by default it is set to "development"

# ✉️ Email Configuration
EMAIL_SERVICE_ADDRESS=your-email@gmail.com
EMAIL_SERVICE_PASSWORD=your-app-password  # Use an App Password from Gmail

# 📡 MQTT Configuration
MQTT_BROKER_URL=mqtt://your-broker-url:your-broker-port
MQTT_BROKER_USERNAME=your-broker-username
MQTT_BROKER_PASSWORD=your-broker-password

# 🔥Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-key

# 🌍 Application Environment
NODE_ENV=development  # Choose "development" for development mode or "production" for production mode, but by default it is set to "development"

# 🧪 TESTING MODE
TESTING_MODE=false  # Set to "true" to for testing mode
```

EMAIL_SERVICE_PASSWORD → Do not use your regular Gmail password. Use an App Password from Google.

🔗 How to get an App Password:
1. Go to Google Account Security.
2. Enable 2-Step Verification (if not already enabled).
3. Search App passwords, and create an app password.
4. Use the password for EMAIL_SERVICE_PASSWORD.

FIREBASE_SERVICE_ACCOUNT_KEY → Get the Firebase service account key from the Firebase Console then create a firebase folder in the project root and place the service account key there.

#### 3️⃣ Create database

Create a postgreSQL database according to name in DB_NAME.

#### 4️⃣ Run migrations

After configuring the database, run the following command to run the migration:

```bash
$ npx typeorm-ts-node-commonjs migration:run -d src/database/database.config.ts
```

#### 5️⃣ Run scripts to add Admin System user

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
$ npx ts-node src/database/scripts/addUsersAdminSystem.ts
```

### 6️⃣ Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### 7️⃣ Run tests

```bash
# sanity test
$ k6 run test/k6/scenarios/sanity.test.js
```

Before running the sanity test, ensure that the TESTING_MODE environment variable is set to true in your .env file.

Also, make sure that the database contains an Admin System user with the username adminSystem with password 12345678, as well as a regular user with the username userDummy with password 12345678, and remember not to create those users in the production database.

After running the tests, you can clean the database by running the following command:

```bash
$ npx ts-node src/database/scripts/cleanTestData.ts
```

## 📖 Websocket and MQTT Documentation

### 1️⃣ 📡 WebSocket

#### 🔸 Event: `device-id/{deviceId}/pin/{pin}`
Emitted by server to send real-time sensor data for a specific pin of a device.

**Payload:**
```json
{
  "value": 23.5,
  "time": "2025-05-27T12:00:00Z"
}
```

### 2️⃣ 🛰️ MQTT

#### 🔸 Topic: `auth-code/{authCode}`
This topic is used to send the auth code to the client.

**Payload:**
```json
{
  "V1": 23.5,
  "V2": 23.5
}
```
