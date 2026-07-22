import 'module-alias/register';
import express, {
  Request,
  Response,
  Express,
  Router,
  NextFunction,
} from 'express';
import cors from 'cors';
import logger from '@logger/index';
import { PORT, HOST } from '@config/secrets';
import {
  customErrorHandler,
  HTTP_STATUS_CODE,
  successResponse,
} from '@utils/index';
import { ErrorHandler } from '@middlewares/index';
import allRoutes from '@routes/index';
import authMiddleware from '@middlewares/authMiddleware';

class Server {
  public app: Express;
  public router: Router = express.Router();
  public allRoutes: Router;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }

  private config() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.set('trust proxy', 2);
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime.bigint();

      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        logger.info(
          `[${req.method}] ${req.originalUrl} => Status: ${res.statusCode} - Duration: ${durationMs.toFixed(2)} ms`,
        );
      });

      next();
    });
    this.setupCors();
  }

  private setupCors() {
    this.app.use(
      cors({
        origin: '*',
        credentials: true,
      }),
    );
  }

  private routes() {
    this.app.get('/', (req: Request, res: Response) => {
      return successResponse(
        res,
        HTTP_STATUS_CODE.OK,
        'AI Agent - Gen-AI Project',
      );
    });

    allRoutes.forEach((route) => {
      if (route.path !== '/auth') {
        this.app.use(
          '/api' + route.path,
          authMiddleware,
          route.router,
        );
      } else {
        this.app.use('/api' + route.path, route.router);
      }
    });

    this.app.all('*', (req: Request) => {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.NOT_FOUND,
        `can't find ${req.originalUrl} on server`,
      );
    });

    this.app.use(ErrorHandler.middleware);
  }

  public async start() {
    try {
      logger.info('Initializing AI Agent...');

      this.app.listen(Number(PORT), () => {
        logger.info(
          `AI Agent Server is running on http://${HOST}:${PORT}`,
        );
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new Server();
(async () => {
  await server.start();
})();

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

