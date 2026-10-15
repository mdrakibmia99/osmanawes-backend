import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constants';
import { teamsController } from './teams.controller';
import { teamsValidation } from './teams.validation';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.BUSINESS),
  validateRequest(teamsValidation.createTeamValidationSchema),
  teamsController.createTeam,
);

router.get('/', auth(USER_ROLE.BUSINESS), teamsController.getAllTeams);

router.patch(
  '/update/:id',
  auth(USER_ROLE.BUSINESS),
  validateRequest(teamsValidation.updateTeamValidationSchema),
  teamsController.updateTeam,
);

router.delete(
  '/delete/:id',
  auth(USER_ROLE.BUSINESS),
  teamsController.deleteTeam,
);

export const teamsRoutes = router;
