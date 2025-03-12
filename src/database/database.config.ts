import { DataSource, DataSourceOptions } from "typeorm";
import 'dotenv/config'
import { User } from "../entities/user.entity";

const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as DataSourceOptions["type"],
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
} as DataSourceOptions);

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!")
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err)
  })

export default AppDataSource
