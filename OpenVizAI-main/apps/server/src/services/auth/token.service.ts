import { JWT_SECRET } from "@config/secrets";
import IJwtPayload from "@interfaces/auth";
import jwt from "jsonwebtoken";

export default class TokenService {
  static async generateToken(id: string) {
    const access_token = jwt.sign({ id }, JWT_SECRET, {
      expiresIn: "24h",
      algorithm: "HS256",
    });

    const refresh_token = jwt.sign({ id }, JWT_SECRET, {
      expiresIn: "10d",
      algorithm: "HS256",
    });

    return { access_token, refresh_token };
  }

  static async refreshToken(refresh_token: string) {
    // Verify the refresh token - let JWT errors propagate to error handler
    const payload = jwt.verify(refresh_token, JWT_SECRET) as IJwtPayload;
    // Generate new tokens
    const { id } = payload;
    return await this.generateToken(id);
  }
}
