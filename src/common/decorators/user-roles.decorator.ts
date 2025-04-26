import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities';

export const USER_ROLES_KEY = 'userRolesKey';
export const UserRoles = (roles: UserRole) => SetMetadata(USER_ROLES_KEY, roles);
