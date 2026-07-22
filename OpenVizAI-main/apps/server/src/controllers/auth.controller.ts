import logger from "@logger/index";
import { successResponse } from "@utils/responseGenerator";
import { Request, Response, NextFunction } from "express";
import AuthService from "@services/auth/auth.service";
import { HTTP_STATUS_CODE } from "@utils/httpStatusCodes";
import TokenService from "@services/auth/token.service";
import { IAuthUser } from "@interfaces/user";

class AuthController {


  public async loginWithEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email } = req.body;

      const result = await AuthService.login(email);

      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        "User logged in successfully",
        result,
      );
    } catch (error) {
      logger.error("Error in demo login with email", error);
      next(error);
    }
  }

  /**
   * Refresh token
   */
  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh } = req.body;
      const tokens = await TokenService.refreshToken(refresh);

      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        'Successfully refreshed token',
        tokens,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user details
   */
  public async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IAuthUser;
      const userDetails = await AuthService.getUserDetails(user.id);

      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        'User fetched successfully',
        userDetails,
      );
    } catch (error) {
      next(error);
    }
  }
  
}

export default new AuthController();
