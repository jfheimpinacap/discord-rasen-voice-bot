import { describe, expect, it } from 'vitest';

import { EnvironmentValidationError, validateEnvironment } from '../src/config/env.js';

const validEnvironment = {
  DISCORD_TOKEN: 'test-token-that-must-not-appear-in-errors',
  DISCORD_CLIENT_ID: '123456789012345678',
  DISCORD_GUILD_ID: '987654321098765432',
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
};

describe('validateEnvironment', () => {
  it('accepts valid configuration and preserves Discord IDs as strings', () => {
    const environment = validateEnvironment(validEnvironment);

    expect(environment).toEqual(validEnvironment);
    expect(typeof environment.DISCORD_CLIENT_ID).toBe('string');
    expect(typeof environment.DISCORD_GUILD_ID).toBe('string');
  });

  it('rejects a missing Discord token without exposing its value', () => {
    const input = { ...validEnvironment, DISCORD_TOKEN: undefined };

    expect(() => validateEnvironment(input)).toThrow(EnvironmentValidationError);
    expect(() => validateEnvironment(input)).not.toThrow(validEnvironment.DISCORD_TOKEN);
  });

  it('rejects an invalid Discord client ID', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, DISCORD_CLIENT_ID: 'not-a-snowflake' }),
    ).toThrow('DISCORD_CLIENT_ID');
  });

  it('rejects an invalid Discord guild ID', () => {
    expect(() => validateEnvironment({ ...validEnvironment, DISCORD_GUILD_ID: '1234' })).toThrow(
      'DISCORD_GUILD_ID',
    );
  });

  it('rejects an invalid NODE_ENV value', () => {
    expect(() => validateEnvironment({ ...validEnvironment, NODE_ENV: 'staging' })).toThrow(
      'NODE_ENV',
    );
  });
});
