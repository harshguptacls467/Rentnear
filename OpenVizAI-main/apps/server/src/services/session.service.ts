import customErrorHandler from "@utils/customErrorHandler";
import { HTTP_STATUS_CODE } from "@utils/httpStatusCodes";
import { v4 as uuidv4 } from "uuid";
import { IAllSessionQueryParams } from "@interfaces/ai";
import { prisma } from "@db";
import { UpdateSessionData } from "./types";

export default class SessionService {
  /**
   * Retrieves all sessions for a given employee
   * @param employeeId The ID of the employee to retrieve sessions for
   * @returns An array of all sessions for the employee
   */
  static async getAllSessions(
    userId: string,
  ) {
    try {
      return  await prisma.userSession.findMany({
        where: {
          user_id: userId,
        },
      });

    
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to get all sessions",
      );
    }
  }

  /**
   * Ensures that a session exists for the given session ID
   * @param sessionId The ID of the session to check
   * @param employeeId The ID of the employee associated with the session
   * @param title The title of the session
   */
  static async ensureSessionExists(
    sessionId: string,
    userId: string,
    title: string,
  ) {
    try {
      const session = await prisma.userSession.findUnique({
        where: { session_id: sessionId },
      });
      if (!session) {
        await prisma.userSession.create({
          data: {
            session_id: sessionId,
            user_id: userId,
            title: title ? title : "New Session",
          },
        });
      }
    } catch (error) {

      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to ensure session exists",
      );
    }
  }

  /**
   * Adds a new session for the given employee
   * @param employeeId The ID of the employee to add the session for
   * @param title The title of the session
   */
  static async createNewSession(employeeId: string, title: string) {
    const session = await prisma.userSession.create({
      data: {
        session_id: uuidv4(),
        user_id: employeeId,
        title: title,
      },
    });
    return session;
  }

  static async getSessionById(sessionId: string) {
    const session = await prisma.userSession.findUnique({
      where: { session_id: sessionId },
    });
    return session;
  }

  /**
   * Updates a session with the given session ID and update data
   * @param sessionId The ID of the session to update
   * @param updateData The data to update the session with
   * @returns The updated session
   */
  static async updateSession(sessionId: string, updateData: UpdateSessionData) {
    try {
      if (updateData.is_pinned) {
        updateData.pinned_ts = new Date();
      }

      const session = await prisma.userSession.update({
        where: { session_id: sessionId },
        data: updateData,
      });
      return session;
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to update session",
      );
    }
  }

  /**
   * Deletes a session with the given session ID
   * @param sessionId The ID of the session to delete
   */
  // static async deleteSession(sessionId: string) {
  //   try {
  //     await prisma.$transaction(async (tx) => {
  //       await tx.userSession.delete({
  //         where: { session_id: sessionId },
  //       });

  //       await tx.chatHistory.deleteMany({
  //         where: { session_id: sessionId },
  //       });

  //       await tx.checkpointBlob.deleteMany({
  //         where: { thread_id: sessionId },
  //       });

  //       await tx.checkpoint.deleteMany({
  //         where: { thread_id: sessionId },
  //       });

  //       await tx.checkpointWrite.deleteMany({
  //         where: { thread_id: sessionId },
  //       });
  //     });
  //   } catch (error) {
  //     throw new customErrorHandler(
  //       HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
  //       "Failed to delete session",
  //     );
  //   }
  // }
}
