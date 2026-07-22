import productionLogger from './productionLogger';
import devLogger from './devLogger';
import { NODE_ENV } from '@config/secrets';

const logger = NODE_ENV === 'development' ? devLogger() : productionLogger();

export default logger;

