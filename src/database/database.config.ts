import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entities/user";
import { Organization } from "./entities/organization";
import { DeviceData } from "../common/entities";
import 'dotenv/config'

const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as DataSourceOptions["type"],
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: ["src/database/migrations/*.ts"],
  entities: [User, Organization, DeviceData],
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
