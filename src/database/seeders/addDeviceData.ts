import { DataSource } from "typeorm";
import 'dotenv/config'
import { DeviceData } from "../../common/entities";
import AppDataSource from "../database.config";

const addDeviceData = async (dataSource: DataSource) => {
  const deviceDataRepository = dataSource.getRepository(DeviceData);

  const dummyData: DeviceData[] = [];

  for (let i = 0; i < 50; i++) {
    const data = new DeviceData();
    data.device_id = '560d8eda-8eae-4e9f-bf6e-50ab884c72ef'; // gunakan ID acak untuk simulasi device
    data.pin = `V${Math.floor(Math.random() * 5)}`; // V0 sampai V4
    data.value = (Math.random() * 100).toFixed(2); // value antara 0.00 sampai 100.00
    dummyData.push(data);
  }

  // Insert ke database
  await deviceDataRepository.save(dummyData);
  console.log('✅ 50 dummy device data inserted successfully.');
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log('Database connected! Running device data seeder...');
    await addDeviceData(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error('❌ Error while running device data seeder:', error);
  });
