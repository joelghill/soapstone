import dotenv from "dotenv";
import { cleanEnv, host, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  LOG_LEVEL: str({
    default: "info",
    devDefault: testOnly("debug"),
    choices: ["debug", "info", "warn", "error"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  PUBLIC_URL: str({}),
  DB_URL: str({ default: undefined }),
  DB_HOST: str({ devDefault: "localhost" }),
  DB_PORT: port({ devDefault: 5432 }),
  DB_NAME: str({ devDefault: "soapstone" }),
  DB_USER: str({ devDefault: "soapstone" }),
  DB_PASSWORD: str({ devDefault: "changeme" }),
  DB_CA_CERT: str({ devDefault: undefined }),
  COOKIE_SECRET: str({ devDefault: "00000000000000000000000000000000" }),
});
