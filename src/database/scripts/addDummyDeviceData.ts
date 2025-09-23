import { DataSource } from "typeorm";
import 'dotenv/config'
import { DeviceData } from "../entities/device-data";
import AppDataSource from "../database.config";

const addDummyDeviceData = async (dataSource: DataSource) => {
  const deviceDataRepository = dataSource.getRepository(DeviceData);

  const dummyData: DeviceData[] = [];

  for (let i = 0; i < 1000; i++) {
    const data = new DeviceData();
    data.device_id = '892e17be-d44c-4766-8e2e-6e71edf4e74d'; // gunakan ID acak untuk simulasi device
    data.pin = `V${Math.floor(Math.random() * 5)}`; // V0 sampai V4
    data.value = parseFloat((Math.random() * 100).toFixed(2)); // value antara 0.00 sampai 100.00
    dummyData.push(data);
  }

  // Insert ke database
  await deviceDataRepository.save(dummyData);
  console.log('✅ 1000 dummy device data inserted successfully.');
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    console.log('Database connected! Running device data script...');
    await addDummyDeviceData(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error('❌ Error while running device data script:', error);
  });
