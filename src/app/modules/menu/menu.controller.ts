import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { menuService } from './menu.service';

const createMenu = catchAsync(async (req: Request, res: Response) => {
  const result = await menuService.createMenu(
    req.user.userId,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Menu created successfully',
    data: result,
  });
});

const getAllMenus = catchAsync(async (req: Request, res: Response) => {
  const result = await menuService.getAllMenus(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Menus fetched successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getMenuById = catchAsync(async (req: Request, res: Response) => {
  const result = await menuService.getMenuById(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Menu fetched successfully',
    data: result,
  });
});

const updateMenu = catchAsync(async (req: Request, res: Response) => {
  const result = await menuService.updateMenu(
    req.params.id as string,
    req.user.userId,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Menu updated successfully',
    data: result,
  });
});

const deleteMenu = catchAsync(async (req: Request, res: Response) => {
  const result = await menuService.deleteMenu(
    req.params.id as string,
    req.user.userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Menu deleted successfully',
    data: result,
  });
});

export const menuController = {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
};
