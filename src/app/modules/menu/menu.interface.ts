import { Model, Types } from 'mongoose';

export interface IMenu {
  _id?: Types.ObjectId;
  itemName: string;
  image: string;
  businessUserId: Types.ObjectId | string;
  categoryId: Types.ObjectId | string;
  price: number;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MenuModel = Model<IMenu, Record<string, unknown>>;
