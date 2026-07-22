import { Router } from 'express';
import aiController from '@controllers/ai.controller';
import sessionController from '@controllers/session.controller';

class AIRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', aiController.generateAnswer);

    this.router.get('/sessions/:sessionId',aiController.getSessionMessages);

    this.router.get('/sessions',sessionController.getAllSessions)

  }


}

export default new AIRouter().router;

