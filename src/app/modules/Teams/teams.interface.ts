import { Model, Types } from 'mongoose';

export interface ITeam {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  businessUserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeamModel = Model<ITeam, Record<string, unknown>>;
