import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { CACHE_TTL, cacheKeys, cacheService, RedisService } from '../../redis';
import { ITeam } from './teams.interface';
import { Team } from './teams.model';

const clearTeamsCache = async (businessUserId: string) => {
  await cacheService.delByPattern(cacheKeys.teamsPattern(businessUserId));
};

const createTeam = async (
  businessUserId: string,
  payload: Omit<ITeam, '_id' | 'businessUserId' | 'createdAt' | 'updatedAt'>,
) => {
  const result = await Team.create({ ...payload, businessUserId });
  await clearTeamsCache(businessUserId);
  return result;
};

const getAllTeams = async (
  businessUserId: string,
  query: Record<string, unknown>,
) => {
  const safeQuery = { ...query };
  delete safeQuery.businessUserId;

  const cacheKey = cacheKeys.teamsList(businessUserId, JSON.stringify(safeQuery));
  const cachedTeams = await RedisService.get<{
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPage?: number;
    };
    result: ITeam[];
  }>(cacheKey);

  if (cachedTeams) {
    return cachedTeams;
  }

  const teamQuery = new QueryBuilder(
    Team.find({ businessUserId }).lean(),
    safeQuery,
  )
    .search(['name', 'email', 'role'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    teamQuery.modelQuery,
    teamQuery.countTotal(),
  ]);

  const response = { meta, result };
  await RedisService.set(cacheKey, response, CACHE_TTL.ONE_HOUR);
  return response;
};

const updateTeam = async (
  id: string,
  businessUserId: string,
  payload: Partial<Pick<ITeam, 'name' | 'email' | 'role'>>,
) => {
  const result = await Team.findOneAndUpdate(
    { _id: id, businessUserId },
    { $set: payload },
    { new: true, runValidators: true },
  ).lean();

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  }

  await clearTeamsCache(businessUserId);
  return result;
};

const deleteTeam = async (id: string, businessUserId: string) => {
  const result = await Team.findOneAndDelete({ _id: id, businessUserId }).lean();

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Team member not found');
  }

  await clearTeamsCache(businessUserId);
  return result;
};

export const teamsService = {
  createTeam,
  getAllTeams,
  updateTeam,
  deleteTeam,
};
