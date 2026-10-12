import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import catchAsync from '../../utils/catchAsync';
import { storeFile } from '../../utils/fileHelper';
import sendResponse from '../../utils/sendResponse';
import { categoryService } from './category.service';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  if (req.file) {
    req.body.image = await storeFile('category', req.file);
  }

  if (!req.body.image) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Category image is required!');
  }

  const result = await categoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Categories fetched successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.getCategoryById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category fetched successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.file) {
    req.body.image = await storeFile('category', req.file);
  }

  const result = await categoryService.updateCategory(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.deleteCategory(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};

export default categoryController;
