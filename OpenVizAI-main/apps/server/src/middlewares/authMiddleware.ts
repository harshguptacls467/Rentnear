import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@config/secrets";
import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODE } from "@utils/httpStatusCodes";
import { errorResponse } from "@utils/responseGenerator";
import { prisma } from "@db";
import IJwtPayload from "@interfaces/auth";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const isTokenExists = req.headers.authorization ? true : false;
    let accessToken;

    if (isTokenExists) {
      // Extract token from Authorization header
      accessToken = req.headers.authorization?.split(" ")[1];

      if (!accessToken) {
        return errorResponse(
          res,
          HTTP_STATUS_CODE.UNAUTHORIZED,
          "Invalid token format.",
        );
      }

      // Verify JWT token
      const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET, {
        algorithms: ["HS256"],
      }) as unknown as IJwtPayload;

      // Check if user exists in the database
      const user = await prisma.user.findUnique({
        where: { id: decodedAccessToken.id },
      });

      if (!user) {
        // If user doesn't exist then we can consider token as invalid
        return errorResponse(
          res,
          HTTP_STATUS_CODE.UNAUTHORIZED,
          "Unauthorized.",
        );
      }

      // Attach user object to the request for further processing
      req.user = user;

      // Proceed to the next middleware or route handler
      next();
    } else {
      return errorResponse(
        res,
        HTTP_STATUS_CODE.UNAUTHORIZED,
        `Token doesn't exists.`,
      );
    }
  } catch (error: unknown) {
    next(error);
  }
};

export default authMiddleware;
