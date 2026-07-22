import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

export interface IAIDatabaseAdapter {
  getCheckpointSaver(): Promise<PostgresSaver>;
  getPool(): Pool;
}


