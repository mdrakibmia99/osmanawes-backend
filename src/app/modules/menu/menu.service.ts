import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { cleanupUpload } from '../../helpers/s3Helper';
import { CACHE_TTL, cacheKeys, cacheService, RedisService } from '../../redis';
import { storeFile } from '../../utils/fileHelper';
import { Category } from '../category/category.model';
import { IMenu } from './menu.interface';
import { Menu } from './menu.model';

const clearMenuCache = async () => {
  await Promise.all([
    cacheService.delByPattern(cacheKeys.menuSinglePattern()),
    cacheService.delByPattern(cacheKeys.menusAllPattern()),
  ]);
};

const createMenu = async (
  businessUserId: string,
  payload: Omit<IMenu, '_id' | 'businessUserId' | 'createdAt' | 'updatedAt'>,
  file?: Express.Multer.File,
) => {
  let storedImage: string | undefined;
  let result;

  try {
    const category = await Category.findById(payload.categoryId);
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }

    if (!file && !payload.image) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Menu image is required');
    }

    storedImage = file ? await storeFile('menu', file) : payload.image;
    result = await Menu.create({
      ...payload,
      businessUserId,
      image: storedImage,
    });
  } catch (error) {
    await cleanupUpload(file, storedImage);
    throw error;
  }

  await clearMenuCache();
  return result;
};

const getAllMenus = async (query: Record<string, unknown>) => {
  const cacheKey = cacheKeys.menusList(JSON.stringify(query));
  const cachedMenus = await RedisService.get<{
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPage?: number;
    };
    result: IMenu[];
  }>(cacheKey);

  if (cachedMenus) {
    return cachedMenus;
  }

  const menuQuery = new QueryBuilder(Menu.find().populate('categoryId').lean(), query)
    .search(['itemName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    menuQuery.modelQuery,
    menuQuery.countTotal(),
  ]);

  const response = { meta, result };
  await RedisService.set(cacheKey, response, CACHE_TTL.ONE_HOUR);

  return response;
};

const getMenuById = async (id: string) => {
  const cacheKey = cacheKeys.menuById(id);
  const cachedMenu = await RedisService.get<IMenu>(cacheKey);

  if (cachedMenu) {
    return cachedMenu;
  }

  const menu = await Menu.findById(id).populate('categoryId').lean();
  if (!menu) {
    throw new AppError(httpStatus.NOT_FOUND, 'Menu not found');
  }

  await RedisService.set(cacheKey, menu, CACHE_TTL.ONE_HOUR);
  return menu;
};

const updateMenu = async (
  id: string,
  businessUserId: string,
  payload: Partial<Omit<IMenu, 'businessUserId'>>,
  file?: Express.Multer.File,
) => {
  let storedImage: string | undefined;
  let result;

  try {
    const menu = await Menu.findOne({ _id: id, businessUserId });
    if (!menu) {
      throw new AppError(httpStatus.NOT_FOUND, 'Menu not found');
    }

    if (payload.categoryId) {
      const category = await Category.findById(payload.categoryId);
      if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
      }
    }

    storedImage = file ? await storeFile('menu', file) : undefined;
    const updatePayload = storedImage
      ? { ...payload, image: storedImage }
      : payload;

    result = await Menu.findOneAndUpdate(
      { _id: id, businessUserId },
      updatePayload,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('categoryId')
      .lean();
  } catch (error) {
    await cleanupUpload(file, storedImage);
    throw error;
  }

  await clearMenuCache();
  return result;
};

const deleteMenu = async (id: string, businessUserId: string) => {
  const result = await Menu.findOneAndDelete({ _id: id, businessUserId }).lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Menu not found');
  }

  await clearMenuCache();
  return result;
};

export const menuService = {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
};
