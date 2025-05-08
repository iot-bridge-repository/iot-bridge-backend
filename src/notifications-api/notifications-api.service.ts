import { Injectable, Logger, InternalServerErrorException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from '../common/entities';

@Injectable()
export class NotificationsApiService {
  private readonly logger = new Logger(NotificationsApiService.name);
  constructor(
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
  ) {}

  async get(id: string) {
    try {
      const notifications = await this.userNotificationRepository.find({
        select: { id: true, subject: true, message: true, type: true, created_at: true },
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

  async delete(notificationId: string) {
    try {
      await this.userNotificationRepository.delete({ id: notificationId });
      this.logger.log(`Successfully delete notification with id: ${notificationId}`);
      return {
        message: 'Successfully delete notification.',
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete notification, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete notification, please try again later');
    }
  }

  async deleteAll(id: string) {
    try {
      await this.userNotificationRepository.delete({ user_id: id });
      this.logger.log(`Successfully delete all notification with user_id: ${id}`);
      return {
        message: 'Successfully delete all notification.',
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete all notification, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete all notification, please try again later');
    }
  }
}
