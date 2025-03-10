import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import 'dotenv/config'
import { UserRole, User } from "../../entities/user.entity";
import AppDataSource from "../../config/database.config";

const createUsersAdminSystem = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  // Ambil data dari .env
  const emails = process.env.ADMIN_SYSTEM_EMAILS?.split(",") || [];
  const phoneNumbers = process.env.ADMIN_SYSTEM_PHONE_NUMBERS?.split(",") || [];
  const usernames = process.env.ADMIN_SYSTEM_USERNAMES?.split(",") || [];
  const password = process.env.ADMIN_SYSTEM_PASSWORD ?? "";

  if (emails.length !== phoneNumbers.length || emails.length !== usernames.length) {
    console.error("Data di .env tidak valid. Pastikan jumlah email, nomor telepon, dan username sama.");
    return;
  }

  // Hash password sebelum disimpan
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Data seeder
  const usersAdminSystem = emails.map((email, index) => ({
    id: uuidv4(),
    email,
    phone_number: phoneNumbers[index],
    username: usernames[index],
    password: hashedPassword,
    profile_picture: null,
    role: UserRole.ADMIN_SYSTEM,
    created_at: new Date(),
  }));

  // Insert data ke database
  await userRepository.insert(usersAdminSystem);
  console.log("User admin system berhasil ditambahkan.");
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log("Database connected! Running seeder...");
    await createUsersAdminSystem(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error("Error saat menjalankan seeder:", error);
  });
