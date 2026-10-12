import { model, Query, Schema } from 'mongoose';
import { CategoryModel, ICategory } from './category.interface';

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'Category image is required'],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ isDeleted: 1 });

// Soft delete query middleware
categorySchema.pre<Query<any, ICategory>>(/^find/, function (next) {
  const query = this;
  if (!(query.getOptions() as any)?.ignoreDeleted) {
    query.find({ isDeleted: { $ne: true } });
  }
  next();
});

categorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);
export default Category;
