/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { DeleteAccountPayload, IUserValidationForGoogle, TUser, TUserCreate } from './user.interface';
import { User } from './user.models';
import config from '../../config';
import QueryBuilder from '../../builder/QueryBuilder';
import { otpServices } from '../otp/otp.service';
import { generateOptAndExpireTime } from '../otp/otp.utils';
import { TPurposeType, TReceiverType } from '../otp/otp.interface';
import { otpSendEmail } from '../../utils/emailNotification';
import { createToken, verifyToken } from '../../utils/tokenManage';
import { USER_ROLE } from './user.constants';
import { IJwtPayload } from '../auth/auth.interface';
import { generateAndReturnTokens, verifyAppleToken, verifyGoogleToken } from '../auth/auth.utils';
import { RedisService, cacheService, cacheKeys, CACHE_TTL } from '../../redis';

import { LOGIN_WITH } from '../auth/auth.constant';
import { OpeningHour } from '../openingHour/openingHour.model';
import { Queue } from '../queueService/queue.model';
import { Category } from '../category/category.model';
import { storeFile, storeFiles } from '../../utils/fileHelper';

export type IFilter = {
  searchTerm?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface OTPVerifyAndCreateUserProps {
  otp: string;
  token: string;
}

const createUserToken = async (payload: TUserCreate) => {
  console.log('Payload received in user token service');

  const { email, fullName, password, role } = payload;
  const userRole = role || USER_ROLE.USER;

  // Check if user already exists
  const userExist = await User.findOne({ email }).setOptions({ ignoreDeleted: true });
  if (userExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User already exist!!');
  }

  // Check existing OTP status
  const { isExist, isExpireOtp } = await otpServices.checkOtpByEmail(email);
  const { otp, expiredAt } = generateOptAndExpireTime();

  if (isExist && !isExpireOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'OTP already sent. Please check your email.',
    );
  }


  const otpPayload = {
    sentTo: email,
    receiverType: 'email' as TReceiverType,
    purpose: 'email-verification' as TPurposeType,
    otp,
    expiredAt,
  };

  // Create or update OTP
  if (isExist && isExpireOtp) {
    await otpServices.updateOtpByEmail(email, {
      otp,
      expiredAt,
    });
  } else if (!isExist) {
    await otpServices.createOtp(otpPayload);
  }
  console.log('OTP payload prepared1:', otpPayload, otp);
  // Send OTP email
  await otpSendEmail({
    sentTo: email,
    subject: 'Your one-time OTP for email verification',
    otp,
  });
  console.log('OTP payload prepared2:', otpPayload, otp);



  // Create token containing user data for later verification
  const tokenPayload: Partial<TUserCreate> = {
    email,
    password,
    fullName,
    role: userRole,
  };
  console.log('Token payload:', tokenPayload);
  const token = createToken({
    payload: tokenPayload,
    access_secret: config.create_user_secret as string,
    expity_time: config.create_user_expire_time as string | number,
  });

  return token;
};



const otpVerifyAndCreateUser = async ({
  otp,
  token,
}: OTPVerifyAndCreateUserProps) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  const decodeData = verifyToken({
    token,
    access_secret: config.create_user_secret as string,
  });

  if (!decodeData) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorized');
  }

  const { password, email, fullName, role } = decodeData as any;
  console.log('decodeData', decodeData);
  // Check OTP match
  const isOtpValid = await otpServices.otpMatch(email, otp);

  if (!isOtpValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email }).setOptions({ ignoreDeleted: true });
  if (existingUser) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'A user already exists with this email',
    );
  }
  const userData = {
    email,
    password,
    fullName,
    role: role || USER_ROLE.USER,
    hasCompletedProfile: role === USER_ROLE.BUSINESS ? false : true, // Business users need to complete profile
  };
  // Create user
  const newUser = await User.create(userData);
  if (!newUser) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'User creation failed',
    );
  }

  // Update OTP status
  await otpServices.updateOtpByEmail(email, { status: 'verified' });

  return generateAndReturnTokens(newUser);
};



const createOrLoginUserWithGoogle = async (payload: IUserValidationForGoogle) => {
  const { accessToken } = payload;

  console.log("payload======>", payload);
  const googleUser = await verifyGoogleToken(accessToken);
  console.log("googleUser======>", googleUser);

  // if (!googleUser) throw new AppError(httpStatus.FORBIDDEN, 'User not found');
  // let user = await User.findOne({ googleId: googleUser.sub }).setOptions({ overrideDeletedFilter: true });
  let user = await User.findOne({ email: googleUser.email }).setOptions({ ignoreDeleted: true });

  if (user) {
    // login login here
    return generateAndReturnTokens(user);
  }


  const email = googleUser.email;

  const userData = {
    fullName: googleUser.name || "New User",
    email,
    password: googleUser.googleId,
    loginWth: LOGIN_WITH.GOOGLE
  }

  // Create user
  const newUser = await User.create(userData);
  if (!newUser) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'User creation failed',
    );
  }

  // Update OTP status
  // await otpServices.updateOtpByEmail(email, { status: 'verified' });

  return generateAndReturnTokens(newUser);
}
const createOrLoginUserWithApple = async (payload: IUserValidationForGoogle) => {
  const { accessToken } = payload;

  const appleUser = await verifyAppleToken(accessToken);
  let user = await User.findOne({ appleId: appleUser.appleId }).setOptions({ ignoreDeleted: true });

  if (user) {
    // login login here
    return generateAndReturnTokens(user);
  }
  const checkExistingUser = await User.findOne({ email: appleUser.email }).setOptions({ ignoreDeleted: true });
  console.log('checkExistingUser', checkExistingUser);
  if (checkExistingUser ) {
    throw new AppError(httpStatus.BAD_REQUEST,`You are already registered with ${checkExistingUser.loginWth === LOGIN_WITH.GOOGLE ? 'Google' : 'Apple'}. Please login with ${checkExistingUser.loginWth === LOGIN_WITH.GOOGLE ? 'Google' : 'Apple'} to continue.`);
  }

  
  const email = appleUser.email;

  const userData = {
    appleId: appleUser.appleId,
    fullName: appleUser?.name || "New User",
    email,
    password: appleUser.appleId,
    loginWth: LOGIN_WITH.APPLE
  }

  // Create user
  const newUser = await User.create(userData);
  if (!newUser) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'User creation failed',
    );
  }

  // Update OTP status
  // await otpServices.updateOtpByEmail(email, { status: 'verified' });

  return generateAndReturnTokens(newUser);
}







// ............................rest

const getAllUserQuery = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  // Build cache key based on query parameters
  const queryHash = JSON.stringify(query);
  const cacheKey = `users:list:${userId}:${queryHash}`;

  // 1. Check Redis cache first
  const cachedUsers = await RedisService.get<{ meta: any; result: any }>(cacheKey);
  if (cachedUsers) {
    return cachedUsers;
  }

  // 2. Cache miss: Fetch from MongoDB using lean() for maximum performance
  const userQuery = new QueryBuilder(User.find({ _id: { $ne: userId } }).lean(), query)
    .search(['fullName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  const responseData = { meta, result };

  // 3. Store in Redis with TTL (300 seconds / 5 minutes)
  await RedisService.set(cacheKey, responseData, 300);

  return responseData;
};

const getAllUserCount = async () => {
  const allUserCount = await User.countDocuments();
  return allUserCount;
};

const getUsersOverview = async (userId: string, year: any) => {
  const cacheKey = cacheKeys.usersOverview(year);

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      // Fetch total user count
      const totalUsers = await User.countDocuments();

      // Fetch user growth over time for the specified year (monthly count with month name)
      const userOverview = await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`),
            }, // Filter by year
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' }, // Group by month of the 'createdAt' date
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            monthName: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 1] }, then: 'January' },
                  { case: { $eq: ['$_id', 2] }, then: 'February' },
                  { case: { $eq: ['$_id', 3] }, then: 'March' },
                  { case: { $eq: ['$_id', 4] }, then: 'April' },
                  { case: { $eq: ['$_id', 5] }, then: 'May' },
                  { case: { $eq: ['$_id', 6] }, then: 'June' },
                  { case: { $eq: ['$_id', 7] }, then: 'July' },
                  { case: { $eq: ['$_id', 8] }, then: 'August' },
                  { case: { $eq: ['$_id', 9] }, then: 'September' },
                  { case: { $eq: ['$_id', 10] }, then: 'October' },
                  { case: { $eq: ['$_id', 11] }, then: 'November' },
                  { case: { $eq: ['$_id', 12] }, then: 'December' },
                ],
                default: 'Unknown', // Default value in case month is not valid
              },
            },
          },
        },
        { $sort: { _id: 1 } }, // Sort by month (ascending)
      ]);

      // Fetch recent users
      const recentUsers = await User.find({ _id: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(6);

      return {
        totalUsers,
        userOverview, // Includes month names with user counts
        recentUsers,
      };
    },
    CACHE_TTL.ONE_HOUR // 1 hour TTL
  );
};

const getUserById = async (id: string) => {
  const cacheKey = `user:${id}:detail`;

  // 1. Check Redis cache first
  const cachedUser = await RedisService.get(cacheKey);
  if (cachedUser) {
    return cachedUser;
  }

  // 2. Cache miss: Fetch from MongoDB using lean()
  const user = await User.findById(id).lean();
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 3. Set to Redis with TTL (300 seconds)
  await RedisService.set(cacheKey, user, 300);

  // 4. Return the fresh result
  return user;
};

// Optimized the function with Redis caching (Configurable TTL: 10 minutes)
const getMyProfile = async (id: string, fields?: string) => {
  // ✅ Default fields to include when no 'fields' query param is provided
  const defaultFields = [
    'dob',
    'gender',
    'phone',
    'address',
    'profileImage',
    'about',
    'role',
    'email',
    'fullName',
    'hasCompletedProfile',
    'businessDetails',
    'openingHoursId',
    'queueId',
    'subscriptionId',
    'LegalCompliance',
  ];

  // ✅ Determine which fields to select
  const selectFields = fields
    ? fields.split(',').map((f) => f.trim()).join(' ') // if fields provided, use only them
    : defaultFields.join(' '); // otherwise, use defaults

  const cacheKey = cacheKeys.userProfile(id, fields);

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      // ✅ Fetch user data from the database
      const userData = await User.findById(id)
        .populate('businessDetails.categoryId')
        .populate('openingHoursId')
        .populate('queueId')
        .populate('subscriptionId')
        .select(selectFields);

      if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }

      return userData;
    },
    CACHE_TTL.TEN_MINUTES // 10 minutes TTL
  );
};


const completeMyProfile = async (userId: string, payload: Partial<TUser>) => {
  console.log('payload===>complete profile', payload);

  const profileData={...payload,hasCompletedProfile: true}
  console.log('profileData ===>', profileData,userId);
  const updateProfile = await User.findByIdAndUpdate(
    userId,
    { $set:  profileData},
    { new: true, runValidators: true }
  );
  console.log('updateProfile==> status', updateProfile);
  if (!updateProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // ✅ Auto-delete cached profile & user lists whenever data changes
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  console.log('updateProfile', updateProfile);
  return updateProfile;
};

const updateMyProfile = async (userId: string, payload: Partial<TUser>) => {
  const updateData: Record<string, unknown> = { ...payload };
  delete updateData.pushNotificationOptions;
  if (payload.pushNotificationOptions) {
    for (const [key, value] of Object.entries(payload.pushNotificationOptions)) {
      updateData[`pushNotificationOptions.${key}`] = value;
    }
  }

  const updateProfile = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();
  if (!updateProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // ✅ Auto-delete cached profile & user lists whenever data changes
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  const token= generateAndReturnTokens(updateProfile);
  return {...updateProfile,accessToken:token.accessToken};
};

const deleteMyAccount = async (id: string, payload: DeleteAccountPayload) => {
  const user: TUser | null = await User.IsUserExistById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user?.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
  }

  if (!(await User.isPasswordMatched(payload.password, user.password))) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  const userDeleted = await User.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!userDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, 'user deleting failed');
  }

  // ✅ Auto-delete cached profile upon deletion
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(id)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  return userDeleted;
};



const getUserProfile = async (userId: string) => {
  const cacheKey = cacheKeys.userProfile(userId);
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const profile = await User.findById(userId).lean();
      if (!profile) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }
      return profile;
    },
    CACHE_TTL.TEN_MINUTES
  );
};
const checkVerifiedStatus = async (token: any) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  try {
    const decoded = verifyToken({
      token,
      access_secret: config.jwt_access_secret as string,
    });

    if (!decoded) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token!');
    }
    const userId = (decoded as IJwtPayload).userId;
    const user = await User.findById(
      userId
    ).setOptions({ ignoreDeleted: true });

    if (!user) {
      return { isVerifiedByAdmin: false };
    }
    const tokenData = generateAndReturnTokens(user);
    return tokenData;
    // return {
    //   isVerifiedByAdmin: user.isVerifiedByAdmin, ...(user.isVerifiedByAdmin && { token: tokenData.accessToken })
    // };
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token!');
  }

};


const fcmTokenSetOrRemove = async (
  userId: string,
  fcmToken: string,
  status: string
) => {


  const updateValue = status === 'set' ? fcmToken : '';
console.log('updateValue', updateValue, 'userId', userId, 'status', status);
  const result = await User.findByIdAndUpdate(
    userId,
    { $set: { fcmToken: updateValue } },
    { new: true }
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return null;
};
const completeBusinessProfile = async (
  userId: string,
  payload: any,
  files?: { [fieldName: string]: Express.Multer.File[] },
) => {
  console.log(payload,"check payload==========>")
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if(user.hasCompletedProfile){
    throw new AppError(httpStatus.BAD_REQUEST, 'Your profile is already completed.');
  }

  // Handle uploaded files
  if (files?.coverPhoto && files.coverPhoto.length > 0) {
    const coverPhotoPath = await storeFile('business', files.coverPhoto[0]);
    if (!payload.businessDetails) payload.businessDetails = {};
    payload.businessDetails.coverPhoto = coverPhotoPath;
  }

  if (files?.LegalCompliance && files.LegalCompliance.length > 0) {
    const uploadedDocs = await storeFiles('business', {
      LegalCompliance: files.LegalCompliance,
    });
    payload.LegalCompliance = uploadedDocs.LegalCompliance || [];
  }

  // Validate category if provided
  if (payload.businessDetails?.categoryId) {
    const categoryExists = await Category.findById(payload.businessDetails.categoryId);
    if (!categoryExists) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Selected category does not exist');
    }
  }

  // 1. Create or update OpeningHour document
  let openingHourDoc;
  if (user.openingHoursId) {
    openingHourDoc = await OpeningHour.findByIdAndUpdate(
      user.openingHoursId,
      { $set: payload.openingHours || {} },
      { new: true, upsert: true },
    );
  } else {
    openingHourDoc = await OpeningHour.create(payload.openingHours || {});
  }

  // 2. Create or update Queue document
  const queueData = {
    businessId: userId,
    maxCapacity: payload.queue?.maxCapacity ?? 0,
    waitTime: payload.queue?.waitTime ?? 0,
    skipPassPrice: payload.queue?.skipPassPrice ?? 0,
  };
  const queueDoc = await Queue.findOneAndUpdate(
    { businessId: userId },
    { $set: queueData },
    { new: true, upsert: true },
  );

  // 3. Update User document with business details & relations
  const userUpdateData: any = {
    role: USER_ROLE.BUSINESS,
    hasCompletedProfile: true,
    openingHoursId: openingHourDoc._id,
    queueId: queueDoc._id,
    businessDetails: payload.businessDetails
  };

  if (payload.LegalCompliance && payload.LegalCompliance.length > 0) {
    userUpdateData.LegalCompliance = payload.LegalCompliance;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: userUpdateData },
    { new: true, runValidators: true },
  )
    .populate('businessDetails.categoryId')
    .populate('openingHoursId')
    .populate('queueId')
    .populate('subscriptionId');

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User update failed');
  }

  // 4. Invalidate Redis cache
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  const tokenData = generateAndReturnTokens(updatedUser);
  return tokenData;
};

const updateBusinessProfile = async (
  userId: string,
  payload: any,
  files?: { [fieldName: string]: Express.Multer.File[] },
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Process files
  if (files?.coverPhoto && files.coverPhoto.length > 0) {
    const coverPhotoPath = await storeFile('business', files.coverPhoto[0]);
    if (!payload.businessDetails) payload.businessDetails = {};
    payload.businessDetails.coverPhoto = coverPhotoPath;
  }

  if (files?.LegalCompliance && files.LegalCompliance.length > 0) {
    const uploadedDocs = await storeFiles('business', {
      LegalCompliance: files.LegalCompliance,
    });
    const existing = user.LegalCompliance || [];
    payload.LegalCompliance = [...existing, ...(uploadedDocs.LegalCompliance || [])];
  }

  // Validate category if provided
  if (payload.businessDetails?.categoryId) {
    const categoryExists = await Category.findById(payload.businessDetails.categoryId);
    if (!categoryExists) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Selected category does not exist');
    }
  }

  // Update opening hours if provided
  if (payload.openingHours && user.openingHoursId) {
    await OpeningHour.findByIdAndUpdate(
      user.openingHoursId,
      { $set: payload.openingHours },
      { new: true, runValidators: true },
    );
  }

  // Update queue if provided
  if (payload.queue && user.queueId) {
    await Queue.findByIdAndUpdate(
      user.queueId,
      { $set: payload.queue },
      { new: true, runValidators: true },
    );
  }

  const userUpdateData: any = {};
  if (payload.businessDetails) {
    userUpdateData.businessDetails = {
      ...(user.businessDetails ? (user.businessDetails as any).toObject?.() || user.businessDetails : {}),
      ...payload.businessDetails,
    };
  }
  if (payload.LegalCompliance) {
    userUpdateData.LegalCompliance = payload.LegalCompliance;
  }
  if (payload.pushNotificationOptions) {
    for (const [key, value] of Object.entries(payload.pushNotificationOptions)) {
      userUpdateData[`pushNotificationOptions.${key}`] = value;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: userUpdateData },
    { new: true, runValidators: true },
  )
    .populate('businessDetails.categoryId')
    .populate('openingHoursId')
    .populate('queueId')
    .populate('subscriptionId');

  // Invalidate Redis cache
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  return updatedUser;
};

export const userService = {
  createUserToken,
  otpVerifyAndCreateUser,
  getMyProfile,
  updateMyProfile,
  // updateMyProfile2,
  getUserById,
  completeMyProfile,
  completeBusinessProfile,
  updateBusinessProfile,
  deleteMyAccount,
  getAllUserQuery,
  getAllUserCount,
  getUsersOverview,
  getUserProfile,
  checkVerifiedStatus,
  createOrLoginUserWithGoogle,
  createOrLoginUserWithApple,
  fcmTokenSetOrRemove,
};

export const UserService = userService;
