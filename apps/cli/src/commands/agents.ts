import { AgentDefinition, AgentStore, BUILTIN_AGENTS } from '@forgecode/agent-manager';

type BuiltinAgent = Omit<AgentDefinition, 'id' | 'createdAt' | 'updatedAt'>;

export function listAgents(): void {
  const store = new AgentStore();
  const custom = store.list();
  console.log('\nBuilt-in Agents:');
  BUILTIN_AGENTS.forEach((a: BuiltinAgent, i: number) =>
    console.log(`  ${i + 1}. ${a.name} — ${a.description}`),
  );
  if (custom.length > 0) {
    console.log('\nCustom Agents:');
    custom.forEach((a: AgentDefinition, i: number) =>
      console.log(`  ${i + 1}. ${a.name} — ${a.description}`),
    );
  }
  console.log('');
}
