import authController from "@controllers/auth.controller";
import authMiddleware from "@middlewares/authMiddleware";
import { Router } from "express";

class AuthRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/login", authController.loginWithEmail);

    this.router.post("/token/refresh", authController.refreshToken);

    // Get current authenticated user
    this.router.get("/me", authMiddleware, authController.getUser);
  }
}

export default new AuthRouter().router;
