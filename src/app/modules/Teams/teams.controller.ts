import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { teamsService } from './teams.service';

const createTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await teamsService.createTeam(req.user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Team member created successfully',
    data: result,
  });
});

const getAllTeams = catchAsync(async (req: Request, res: Response) => {
  const result = await teamsService.getAllTeams(req.user.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team members fetched successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await teamsService.updateTeam(
    req.params.id as string,
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team member updated successfully',
    data: result,
  });
});

const deleteTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await teamsService.deleteTeam(
    req.params.id as string,
    req.user.userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team member deleted successfully',
    data: result,
  });
});

export const teamsController = {
  createTeam,
  getAllTeams,
  updateTeam,
  deleteTeam,
};
