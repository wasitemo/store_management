import pg from "pg";

const store = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
pg.types.setTypeParser(1082, (val) => val);
store.connect();

export default store;
