export interface DatabaseConfig {
  type: 'postgres';
  connectionString?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}
