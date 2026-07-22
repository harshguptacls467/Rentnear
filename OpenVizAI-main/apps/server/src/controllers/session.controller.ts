import { IAuthUser } from "@interfaces/user";
import SessionService from "@services/session.service";
import { HTTP_STATUS_CODE, successResponse } from "@utils/index";
import { Request, Response, NextFunction } from 'express';
import logger from '@logger/index';
import { UpdateSessionData } from "@services/types";


class SessionController {

 public async getAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req.user as IAuthUser).id;
      const sessions = await SessionService.getAllSessions(
        employeeId,
      );
      return successResponse(res, HTTP_STATUS_CODE.OK, 'Success', sessions);
    } catch (error) {
      logger.error('Error in getAllSessions', error);
      next(error);
    }
  }

  public async createNewSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const employeeId = (req.user as IAuthUser).id;
      const { title = 'New Session' } = req.body;
      const session = await SessionService.createNewSession(employeeId, title);
      return successResponse(res, HTTP_STATUS_CODE.OK, 'Success', session);
    } catch (error) {
      logger.error('Error in createNewSession', error);
      next(error);
    }
  }

  public async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { title, is_pinned } = req.body;

      const updateData: UpdateSessionData = {};
      title && (updateData.title = title);
      is_pinned !== undefined && (updateData.is_pinned = is_pinned);
      await SessionService.updateSession(sessionId, updateData);

      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        'Success',
        'Session updated successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  // public async deleteSession(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { sessionId } = req.params;
  //     await SessionService.deleteSession(sessionId);
  //     return successResponse(
  //       res,
  //       HTTP_STATUS_CODE.OK,
  //       'Success',
  //       'Session deleted successfully',
  //     );
  //   } catch (error) {
  //     next(error);
  //   }
  // }
  
}

export default new SessionController();
