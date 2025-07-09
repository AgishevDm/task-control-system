import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../../enums/roles/role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: SystemRole[]) => {
  if (!roles || roles.length === 0) {
    throw new Error('At least one role must be specified');
  }
  return SetMetadata(ROLES_KEY, roles);
};
