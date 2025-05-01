import { Injectable, Logger, InternalServerErrorException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from '../common/entities';

@Injectable()
export class NotificationApiService {
  private readonly logger = new Logger(NotificationApiService.name);
  constructor(
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
  ) {}

  async get(id: string) {
    try {
      const notifications = await this.userNotificationRepository.find({
        select: { subject: true, message: true, type: true, created_at: true },
        where: { user_id: id },
        order: { created_at: 'DESC' },
      });
      this.logger.log(`Successfully get notifications for user id: ${id}`);
      return {
        message: 'List of notifications.',
        data: notifications,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get notification by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get notification, please try again later');
    }
  }
}
