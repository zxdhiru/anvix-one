import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/common/database/schema/platform/*.ts',
  out: './drizzle/platform',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://anvix:anvix_dev_password@localhost:5433/anvix_platform',
  },
});
