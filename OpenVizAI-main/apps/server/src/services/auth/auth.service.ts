import { prisma } from "@db";
import logger from "@logger/index";
import TokenService from "./token.service";

class AuthService {
  public async login(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        const newUser = await prisma.user.create({
          data: {
            email: email,
          },
        });
        const tokens = await TokenService.generateToken(newUser.id);

        return {
          tokens: tokens,
          user: newUser,
        };
      }

      const tokens = await TokenService.generateToken(user.id);

      return {
        tokens: tokens,
        user: user,
      };
    } catch (err) {
      logger.error("Error in demo login");
      throw err;
    }
  }

  public async getUserDetails(userId: string) {
    const userDetails = await prisma.user.findUnique({
      where: {
        id: userId,
      }
    })

    return userDetails;
  }
}

export default new AuthService();
