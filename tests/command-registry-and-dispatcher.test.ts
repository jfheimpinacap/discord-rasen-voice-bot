import { describe, expect, it, vi } from 'vitest';

import { createCommandRegistry } from '../src/discord/commands/registry.js';
import { createSetupCommand } from '../src/discord/commands/setup-command.js';
import type { SlashCommand } from '../src/discord/commands/types.js';
import { createInteractionDispatcher } from '../src/discord/interactions.js';

const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
const dependencies = {
  configurationRepository: { findByGuildId: vi.fn(), upsert: vi.fn() },
  logger,
};

describe('command registry and interaction dispatcher', () => {
  it('contains setup and exposes its administrative permission JSON', () => {
    const command = createSetupCommand(dependencies);
    const registry = createCommandRegistry([command]);

    expect(registry.find('setup')).toBe(command);
    expect(registry.toJSON()[0]?.default_member_permissions).toBeDefined();
  });

  it('rejects duplicate command names', () => {
    const command: SlashCommand = { data: { name: 'duplicate', description: 'A command', type: 1 }, execute: async () => undefined };
    expect(() => createCommandRegistry([command, command])).toThrow('Duplicate slash command name');
  });

  it('ignores interactions that are not chat input commands', async () => {
    const dispatcher = createInteractionDispatcher(createCommandRegistry([]), logger);
    await dispatcher({ isChatInputCommand: () => false } as never);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('executes the matching command and safely replies after an unexpected error', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('unexpected'));
    const command: SlashCommand = { data: { name: 'test', description: 'Test', type: 1 }, execute };
    const interaction = {
      isChatInputCommand: () => true,
      commandName: 'test', guildId: '123456789012345678', user: { id: '234567890123456789' },
      deferred: false, replied: false, reply: vi.fn(), editReply: vi.fn(), followUp: vi.fn(),
    };
    await createInteractionDispatcher(createCommandRegistry([command]), logger)(interaction as never);

    expect(execute).toHaveBeenCalledWith(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
  });
});
