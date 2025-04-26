import { Request } from 'express';
import { UserRole } from '../entities';

export default interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}
