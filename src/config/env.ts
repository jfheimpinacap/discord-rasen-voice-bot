import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const snowflakeSchema = z.string().regex(/^\d{17,20}$/, {
  message: 'must be a numeric Discord snowflake (17 to 20 digits)',
});

const environmentSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'is required'),
  DISCORD_CLIENT_ID: snowflakeSchema,
  DISCORD_GUILD_ID: snowflakeSchema,
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export type Environment = z.infer<typeof environmentSchema>;

export class EnvironmentValidationError extends Error {
  public constructor(issues: readonly z.ZodIssue[]) {
    const details = issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    super(`Invalid environment configuration: ${details}`);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnvironment(input: Record<string, string | undefined>): Environment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    throw new EnvironmentValidationError(result.error.issues);
  }

  return result.data;
}

export function getEnvironment(): Environment {
  return validateEnvironment(process.env);
}
