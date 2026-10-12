import { Router } from 'express';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constants';
import { categoryController } from './category.controller';
import { categoryValidation } from './category.validation';

const upload = fileUpload('./public/uploads/category');

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory
);

router.post(
  '/',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory
);

router.get(
  '/',
  categoryController.getAllCategories
);

router.get(
  '/:id',
  categoryController.getCategoryById
);

router.patch(
  '/update/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory
);

router.patch(
  '/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory
);

router.delete(
  '/delete/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  categoryController.deleteCategory
);

router.delete(
  '/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  categoryController.deleteCategory
);

export const categoryRoutes = router;
export default router;
