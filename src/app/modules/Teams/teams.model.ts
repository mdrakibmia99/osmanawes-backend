import { model, Schema } from 'mongoose';
import { ITeam, TeamModel } from './teams.interface';

const teamSchema = new Schema<ITeam, TeamModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    businessUserId: {
      type: String,
      required: [true, 'Business user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

teamSchema.index({ businessUserId: 1, createdAt: -1 });

export const Team = model<ITeam, TeamModel>('Team', teamSchema);

export default Team;
