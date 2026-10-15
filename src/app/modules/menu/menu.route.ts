import { Router } from 'express';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constants';
import { menuController } from './menu.controller';
import { menuValidation } from './menu.validation';

const upload = fileUpload('./public/uploads/menu');
const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.BUSINESS),
  upload.single('image'),
  parseData(),
  validateRequest(menuValidation.createMenuValidationSchema),
  menuController.createMenu,
);

router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

router.patch(
  '/update/:id',
  auth(USER_ROLE.BUSINESS),
  upload.single('image'),
  parseData(),
  validateRequest(menuValidation.updateMenuValidationSchema),
  menuController.updateMenu,
);

router.delete(
  '/delete/:id',
  auth(USER_ROLE.BUSINESS),
  menuController.deleteMenu,
);

export const menuRoutes = router;
