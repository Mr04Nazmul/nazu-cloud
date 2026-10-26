import postgres from "postgres";
import { databaseTlsOptions } from "./tls";
let pool: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  return (pool ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: databaseTlsOptions({
      url: process.env.DATABASE_URL,
      mode: process.env.DB_SSL,
      ca: process.env.DB_SSL_CA,
      nodeEnv: process.env.NODE_ENV,
    }),
  }));
}
