import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { RedisService, cacheService, cacheKeys, CACHE_TTL } from '../../redis';
import { CATEGORY_SEARCHABLE_FIELDS } from './category.constants';
import { ICategory } from './category.interface';
import { Category } from './category.model';

/**
 * Invalidate all category caches by pattern when admin makes any change
 */
const clearCategoryCache = async () => {
  await Promise.all([
    cacheService.delByPattern(cacheKeys.categorySinglePattern()),   // 'category:*' (all single categories)
    cacheService.delByPattern(cacheKeys.categoriesAllPattern()), // 'categories:*' (all category lists)
  ]);
};

const createCategory = async (payload: ICategory) => {
  const isCategoryExist = await Category.findOne({ name: payload.name });
  if (isCategoryExist) {
    throw new AppError(httpStatus.CONFLICT, 'Category already exists!');
  }

  const result = await Category.create(payload);

  // Clear category cache by pattern
  await clearCategoryCache();

  return result;
};

const getAllCategories = async (query: Record<string, unknown>) => {
  const queryHash = JSON.stringify(query);
  const cacheKey = cacheKeys.categoriesList(queryHash);

  // 1. Check Redis cache first
  const cachedCategories = await RedisService.get<{ meta: any; result: any }>(cacheKey);
  if (cachedCategories) {
    return cachedCategories;
  }

  // 2. Cache miss: Fetch from MongoDB using lean()
  const categoryQuery = new QueryBuilder(Category.find().lean(), query)
    .search(CATEGORY_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    categoryQuery.modelQuery,
    categoryQuery.countTotal(),
  ]);

  const responseData = { meta, result };

  // 3. Store in Redis with TTL
  await RedisService.set(cacheKey, responseData, CACHE_TTL.ONE_HOUR);

  return responseData;
};

const getCategoryById = async (id: string) => {
  const cacheKey = cacheKeys.categoryById(id);

  // 1. Check Redis cache first
  const cachedCategory = await RedisService.get<ICategory>(cacheKey);
  if (cachedCategory) {
    return cachedCategory;
  }

  // 2. Cache miss: Fetch from MongoDB using lean()
  const category = await Category.findById(id).lean();
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }

  // 3. Store in Redis with TTL
  await RedisService.set(cacheKey, category, CACHE_TTL.ONE_HOUR);

  return category;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const isCategoryExist = await Category.findById(id);
  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }

  if (payload.name) {
    const isDuplicate = await Category.findOne({
      name: payload.name,
      _id: { $ne: id },
    });
    if (isDuplicate) {
      throw new AppError(httpStatus.CONFLICT, 'Category name already exists!');
    }
  }

  const result = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  // Clear category cache by pattern
  await clearCategoryCache();

  return result;
};

const deleteCategory = async (id: string) => {
  const isCategoryExist = await Category.findById(id);
  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }

  const result = await Category.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  ).lean();

  // Clear category cache by pattern
  await clearCategoryCache();

  return result;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  clearCategoryCache,
};

export default categoryService;
