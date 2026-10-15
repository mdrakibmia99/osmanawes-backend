import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constants';
import { queueController } from './queue.controller';
import { queueValidation } from './queue.validation';

const router = Router();

router.patch(
  '/update',
  auth(USER_ROLE.BUSINESS),
  validateRequest(queueValidation.updateQueueValidationSchema),
  queueController.updateQueue,
);

export const queueRoutes = router;
