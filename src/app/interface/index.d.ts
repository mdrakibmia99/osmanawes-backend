import { JwtPayload } from 'jsonwebtoken';
import { IJwtPayload } from '../modules/auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload | IJwtPayload;
    }
  }
}


declare module 'express-session' {
  interface SessionData {
    mollieState: string;
  }
}
