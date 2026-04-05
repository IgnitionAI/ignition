export const version = '0.1.0';

export default {
  name: 'core',
  version
};

export { IgnitionEnv } from './ignition-env';
export type { IgnitionEnvConfig } from './ignition-env';
export type { Experience, AgentInterface } from './types';
export {
  ExperienceSchema,
  IgnitionEnvConfigSchema,
} from './schemas';
