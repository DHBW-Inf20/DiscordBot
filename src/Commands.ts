import { Kantine } from "./commands/Kantine";
import { Stundenplan } from "./commands/Stundenplan";
import { Command } from "./types/command"

// Register Commands of the bot
export const Commands: Command[] = [Stundenplan, Kantine];