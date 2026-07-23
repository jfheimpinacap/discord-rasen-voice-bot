import type { CommandDependencies } from './types.js';

import { createCommandRegistry, type CommandRegistry } from './registry.js';
import { createSetupCommand } from './setup-command.js';

export function createCommands(dependencies: CommandDependencies): CommandRegistry {
  return createCommandRegistry([createSetupCommand(dependencies)]);
}
