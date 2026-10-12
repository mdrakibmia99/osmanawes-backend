import { HydratedDocument, Model, Types } from 'mongoose';
import { IAddress } from '../../interface/common.interface';
import { LOGIN_WITH_INTERFACE } from '../auth/auth.constant';
import { GENDER_INTERFACE, SUBSCRIPTION_INTERFACE, USER_ROLE, USER_ROLE_INTERFACE } from './user.constants';

export interface TBusinessAddress {
  coordinates?: [number, number];
  address?: string;
}

export interface TBusinessDetails {
  businessName?: string;
  businessNumber?: string;
  categoryId?: Types.ObjectId | string;
  shortBio?: string;
  coverPhoto?: string;
  BusinessAddress?: TBusinessAddress;
}

export interface TUser {
  _id?: Types.ObjectId | string;
  appleId?: string;
  email: string;
  password: string;
  role: USER_ROLE_INTERFACE;
  address?: IAddress;

  // common fields for all users
  fullName?: string;
  dob?: Date;
  gender?: GENDER_INTERFACE;

  phone?: {
    code?: string;
    number?: string;
  };

  profileImage?: string;
  about?: string;

  // status flags
  isBlocked?: boolean;
  isVerifiedByAdmin?: boolean;
  hasCompletedProfile?: boolean;
  isDeleted?: boolean;

  passwordChangedAt?: Date | null;
  loginWth?: LOGIN_WITH_INTERFACE;
  fcmToken?: string | null;

  lastActiveAt?: Date;

  // Optional AI / Subscription fields
  subscriptionType?: SUBSCRIPTION_INTERFACE;
  subscriptionExpiresAt?: Date | null;
  scriptGeneratedCount?: number;

  // Business specific fields (applicable when role === 'business')
  businessDetails?: TBusinessDetails;
  openingHoursId?: Types.ObjectId | string;
  subscriptionId?: Types.ObjectId | string;
  queueId?: Types.ObjectId | string;
  LegalCompliance?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface TUserCreate {
  email: string;
  password: string;
  fullName?: string;
  role?: USER_ROLE_INTERFACE;
  appleId?: string;
  address?: IAddress;
  dob?: Date;
  gender?: GENDER_INTERFACE;
  phone?: {
    code?: string;
    number?: string;
  };
  profileImage?: string;
  about?: string;
  isBlocked?: boolean;
  isVerifiedByAdmin?: boolean;
  hasCompletedProfile?: boolean;
  isDeleted?: boolean;
  passwordChangedAt?: Date | null;
  loginWth?: LOGIN_WITH_INTERFACE;
  fcmToken?: string | null;
  lastActiveAt?: Date;
  subscriptionType?: SUBSCRIPTION_INTERFACE;
  subscriptionExpiresAt?: Date | null;
  scriptGeneratedCount?: number;
  businessDetails?: TBusinessDetails;
  openingHoursId?: Types.ObjectId | string;
  subscriptionId?: Types.ObjectId | string;
  queueId?: Types.ObjectId | string;
  LegalCompliance?: string[];
}

export interface DeleteAccountPayload {
  password: string;
}

export interface IUserValidationForGoogle {
  accessToken: string;
  role?: typeof USER_ROLE.USER;
  isOrganizationProfile?: boolean;
}

export interface UserModel extends Model<TUser> {
  isUserExist(email: string): Promise<TUser | null>;
  isUserActive(email: string): Promise<TUser | null>;
  IsUserExistById(id: string): Promise<HydratedDocument<TUser> | null>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}

export type IPaginationOption = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
