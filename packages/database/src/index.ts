import postgres from 'postgres';
let pool: ReturnType<typeof postgres> | undefined;
export function db() { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured'); return pool ??= postgres(process.env.DATABASE_URL,{max:5,prepare:false,connect_timeout:10,idle_timeout:20,ssl:process.env.DB_SSL==='disable'?false:'require'}); }
