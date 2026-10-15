import { model, Schema } from 'mongoose';
import { IMenu, MenuModel } from './menu.interface';

const menuSchema = new Schema<IMenu, MenuModel>(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    businessUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business user is required'],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Menu = model<IMenu, MenuModel>('Menu', menuSchema);

export default Menu;
