// Laravel: the keys your .env is expected to define. Everything is `string | undefined`, because
// nothing guarantees a variable is actually set — read required ones through env.ts, next door.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_SECRET?: string;
      JWT_REFRESH_EXPIRES_IN?: string;
      JWT_SESSION_MAX_LIFETIME?: string;
      NODE_ENV?: string;
      SEED_USER_PASSWORD?: string;
    }
  }
}

export {};
