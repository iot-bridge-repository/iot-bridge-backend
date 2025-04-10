import { SetMetadata } from '@nestjs/common';
import { OrganizationMemberRole } from '../entities';

export const ORGANIZATION_MEMBER_ROLES_KEY = 'organizationMemberRoles';
export const OrganizationMemberRoles = (roles: OrganizationMemberRole) => SetMetadata(ORGANIZATION_MEMBER_ROLES_KEY, [roles]);
