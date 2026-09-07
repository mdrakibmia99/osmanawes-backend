import { IAddress } from '../../interface/common.interface';
import { LOGIN_WITH_INTERFACE } from '../auth/auth.constant';
import { SUBSCRIPTION_INTERFACE, USER_ROLE, USER_ROLE_INTERFACE, VOICE_SPECIALIST_TYPES_INTERFACE } from './user.constants';
import { HydratedDocument, Model, Schema } from 'mongoose';





export interface TUserCreate {
  email: string;
  password: string;
  role: USER_ROLE_INTERFACE;

  address?: IAddress;

  // common fields
  fullName?: string;
  dob?: Date;
  gender?: string;



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
  lastActiveAt: Date;

  fcmToken?: string | null;
  subscriptionType: SUBSCRIPTION_INTERFACE;
  subscriptionExpiresAt: Date | null;
  scriptGeneratedCount: number
}

export interface TUser extends TUserCreate {
  _id: string;
  appleId?: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeleteAccountPayload {
  password: string;
}


export interface IUserValidationForGoogle {
  accessToken: string;
  role: typeof USER_ROLE.USER
  isOrganizationProfile?: boolean;

}
export interface UserModel extends Model<TUser> {
  isUserExist(email: string): Promise<TUser>;

  isUserActive(email: string): Promise<TUser>;

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



