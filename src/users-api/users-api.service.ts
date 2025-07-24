import { Injectable, Logger, HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../common/entities';

@Injectable()
export class UsersApiService {
  private readonly logger = new Logger(UsersApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) { }

  async getSearch(identity: string) {
    try {
      const users = await this.userRepository.find({
        select: { id: true, username: true, email: true, phone_number: true, role: true },
        where: [
          { username: ILike(`%${identity}%`) },
          { email: ILike(`%${identity}%`) },
          { phone_number: ILike(`%${identity}%`) },
        ],
      });

      this.logger.log(`Success to search users. Searched users with identity: ${identity}, found ${users.length} users`);
      return {
        message: 'Users list.',
        data: users,
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to search users, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to search users, please try another time');
    }
  }

  async get(userID: string) {
    try {
      const user = await this.userRepository.findOne({
        select: { username: true, email: true, phone_number: true },
        where: { id: userID },
      });
      if (!user) {
        this.logger.warn(`Failed to get user by id. User not found by id: ${userID}`);
        throw new NotFoundException('User not found');
      }

      const organizationMember = await this.userRepository
        .createQueryBuilder('u')
        .select([
          'o.name AS organization_name',
          'om.status AS status',
        ])
        .leftJoin('organization_members', 'om', 'u.id = om.user_id')
        .leftJoin('organizations', 'o', 'om.organization_id = o.id')
        .where('u.id = :id', { id: userID })
        .getRawMany();

      this.logger.log(`Success to get user by id. User get user details by id: ${userID}`);
      return {
        message: 'Users details.',
        data: {
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          organizationMember,
        },
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get user by id, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get user by id, please try another time');
    }
  }
}
