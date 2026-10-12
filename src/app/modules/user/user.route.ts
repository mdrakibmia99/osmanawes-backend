import { Router } from 'express';
import auth, { authForCompleteProfile } from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import validateRequest from '../../middleware/validateRequest';
import { resentOtpValidations } from '../otp/otp.validation';
import { userController } from './user.controller';
import { userValidation } from './user.validation';
import { USER_ROLE } from './user.constants';

const upload = fileUpload('./public/uploads/profile');
const businessUpload = fileUpload('./public/uploads/business');

export const userRoutes = Router();

// Registration & Verification
userRoutes
  .post(
    '/create',
    validateRequest(userValidation.userValidationSchema),
    userController.createUser,
  )
  .post(
    '/create-user-verify-otp',
    validateRequest(resentOtpValidations.verifyOtpZodSchema),
    userController.userCreateVerification,
  );

// User Profile (General)
userRoutes
  .get(
    '/get-user-profile',
    auth(USER_ROLE.USER, USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
    userController.getUserProfile,
  )
  .delete(
    '/delete-my-account',
    auth(USER_ROLE.USER, USER_ROLE.BUSINESS),
    userController.deleteMyAccount,
  );

userRoutes.get(
  '/get-my-profile',
  auth(USER_ROLE.USER, USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  userController.getMyProfile,
);

// Standard Customer Profile Completion & Updates
userRoutes.post(
  '/complete-my-profile',
  auth(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(userValidation.completeProfileSchema),
  userController.completeMyProfile,
);

userRoutes.patch(
  '/update-my-profile',
  auth(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  upload.single('image'),
  parseData(),
  validateRequest(userValidation.updateProfileSchema),
  userController.updateMyProfile,
);

// Business Profile Completion & Updates
userRoutes.post(
  '/complete-business-profile',
  auth(USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  businessUpload.fields([
    { name: 'coverPhoto', maxCount: 1 },
    { name: 'LegalCompliance', maxCount: 10 },
  ]),
  parseData(),
  validateRequest(userValidation.completeBusinessProfileSchema),
  userController.completeBusinessProfile,
);

userRoutes.patch(
  '/update-business-profile',
  auth(USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  businessUpload.fields([
    { name: 'coverPhoto', maxCount: 1 },
    { name: 'LegalCompliance', maxCount: 10 },
  ]),
  parseData(),
  validateRequest(userValidation.updateBusinessProfileSchema),
  userController.updateBusinessProfile,
);

// FCM Token
userRoutes.post(
  '/set-or-remove-fcm-token',
  auth(USER_ROLE.USER, USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(userValidation.fcmTokenValidationSchema),
  userController.fcmTokenSetOrRemove,
);
