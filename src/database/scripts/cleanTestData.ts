import { DataSource, Like  } from "typeorm";
import { User } from "../entities/user";
import { Organization } from "../entities/organization";
import AppDataSource from "../database.config";

const cleanTestData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  const organizationRepository = dataSource.getRepository(Organization);

  // Delete all users and organizations
  await organizationRepository.delete({
    name: Like('Organization-test-%'),
  });
  await userRepository.delete({
    username: Like('userTest_%'),
  })
  console.log('✅ Test data cleaned.');
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log('Database connected! Running clean test data script...');
    await cleanTestData(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error('❌ Error while running device data seeder:', error);
  });
