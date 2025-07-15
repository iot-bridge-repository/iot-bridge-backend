import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import 'dotenv/config'
import { UserRole, User } from "../entities/user";
import AppDataSource from "../database.config";

const createUsersAdminSystem = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  // Get data from environment variables
  const usernames = process.env.ADMIN_SYSTEM_USERNAMES?.split(",") || [];
  const emails = process.env.ADMIN_SYSTEM_EMAILS?.split(",") || [];
  const phoneNumbers = process.env.ADMIN_SYSTEM_PHONE_NUMBERS?.split(",") || [];
  const password = process.env.ADMIN_SYSTEM_PASSWORD ?? "12345678";

  if (emails.length !== phoneNumbers.length || emails.length !== usernames.length || phoneNumbers.length !== usernames.length) {
    console.error("Data in .env is invalid. Emails, phone numbers, and usernames must have the same length.");
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Data seeder
  const usersAdminSystem = usernames.map((username, index) => ({
    id: uuidv4(),
    username,
    email: emails[index],
    phone_number: phoneNumbers[index],
    password: hashedPassword,
    profile_picture: null,
    role: UserRole.ADMIN_SYSTEM,
    is_email_verified: true,
    created_at: new Date(),
  }));

  // Insert data into the database
  await userRepository.save(usersAdminSystem);
  console.log("User admin system successfully added.");
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log("Database connected! Running admin system script...");
    await createUsersAdminSystem(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error("Error while running admin system script:", error);
  });
