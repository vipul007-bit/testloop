import type { Request, Response, NextFunction } from 'express';
export type UserRole = 'doctor' | 'nurse' | 'lab_tech' | 'pharmacist' | 'admin' | 'authority';
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    fullName: string;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map