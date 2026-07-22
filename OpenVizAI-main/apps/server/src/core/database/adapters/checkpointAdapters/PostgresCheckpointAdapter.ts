import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { DatabaseConfig } from '../../../types/config';
import { IAIDatabaseAdapter } from '../../interfaces/ICheckpointDatabaseAdapter';
import { Pool } from 'pg';

export class PostgresCheckpointAdapter implements IAIDatabaseAdapter {
  private pool: Pool;
  private config: DatabaseConfig;
  private postgresSaver: PostgresSaver;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = new Pool({
      connectionString: this.config.connectionString,
    });
  }

  async getCheckpointSaver(): Promise<PostgresSaver> {
    if (!this.postgresSaver) {
      this.postgresSaver = new PostgresSaver(this.pool);
    }
    return this.postgresSaver;
  }

  getPool(): Pool {
    return this.pool;
  }
}
