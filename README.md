# IoT Bridge Backend - Research Project

## 📌 Project Overview

This backend system is designed to support an IoT platform that enables organizations to manage their users, devices, and data visualization settings. It provides RESTful APIs, integrates with MQTT for IoT device communication, and implements role-based access control for security and flexibility.

This project was developed as part of a bachelor's thesis in Information Technology.

## 🚀 Project setup

### 1️⃣ Install dependencies

Run the following command to install all required dependencies:

```bash
$ npm install
```

### 2️⃣ Configure .env

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
NODE_ENV=development  # Choose "development", "staging", or "production" to set the desired mode, but by default it is set to "development"

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

```

EMAIL_SERVICE_PASSWORD → Do not use your regular Gmail password. Use an App Password from Google.

🔗 How to get an App Password:
1. Go to Google Account Security.
2. Enable 2-Step Verification (if not already enabled).
3. Search App passwords, and create an app password.
4. Use the password for EMAIL_SERVICE_PASSWORD.

FIREBASE_SERVICE_ACCOUNT_KEY → Get the Firebase service account key from the Firebase Console then create a firebase folder in the project root and place the service account key there.

### 3️⃣ Create database

Create a postgreSQL database according to name in DB_NAME.

### 4️⃣ Run migrations

After configuring the database, run the following command to run the migration:

```bash
$ npx typeorm-ts-node-commonjs migration:run -d src/database/database.config.ts
```

### 5️⃣ Run scripts to add Admin System user

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

### 7️⃣ Test

#### 🧪 Performance Test

```bash
# sanity test
$ K6_WEB_DASHBOARD=true k6 run test/performance/scenarios/sanity.test.js

# stress test
$ K6_WEB_DASHBOARD=true k6 run test/performance/scenarios/stress.test.js
```

Make sure the following are done before running the tests:

1. Install K6
If not already installed, install K6 from https://grafana.com/docs/k6/latest/set-up/install-k6/

2. Run the MQTT Test Service
Clone and run this test publisher project with ngrok:
https://github.com/iot-bridge-repository/iot-bridge-mqtt-device-data-publish-test

3. Set the MQTT base URL
After running with ngrok, export the base URL:

```bash
$ export MQTT_DEVICE_DATA_PUBLISH_BASE_URL=https://<your-ngrok-url>
```

4. Set Environment
Ensure the .env file has:

```bash
NODE_ENV=staging
```

5. Create Test Users
- Admin System
Username: adminSystem
Password: 12345678
- Regular User
Username: userDummy
Password: 12345678

Important: Do not create these adminSystem and userDummy users in production database.

After the test is completed, run the following command to clean the test data from the database:

```bash
$ npx ts-node src/database/scripts/cleanTestData.ts
```

## 📖 Websocket and MQTT Documentation

### 1️⃣ 📡 WebSocket

#### 🔸 Connection URL: `ws://localhost:3001`

#### 🔸 Subscription Topic Format:

```json
{
  "type": "subscribe",
  "topic": "device-id/${deviceId}/pin/${pin}"
}
```

#### 🔸 Data Obtained Format:

```json
{
  "data": {
    "deviceId": "{deviceId}",
    "pin": "V1",
    "value": 23.5,
    "time": "2025-05-27T12:00:00Z"
  }
}
```

this is the data format obtained from websocket.

### 2️⃣ 🛰️ MQTT

#### 🔸 Topic: `auth-code/{authCode}`

#### 🔸 Payload Format:

```json
{
  "V1": 23.5,
  "V2": 23.5
}
```

This format is used to send data to the MQTT broker.