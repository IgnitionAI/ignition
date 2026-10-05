import { ContinuousRunner, MultiAgentRunner, type TrainingEnv } from '@ignitionai/core';
import { SACAgent, DQNAgent } from '@ignitionai/backend-tfjs';
import { checkpointCatalogSchema } from '@ignitionai/storage';
import { OnnxAgent } from '@ignitionai/backend-onnx';
import { CartPoleEnv } from '@ignitionai/environments';
const env: TrainingEnv = new CartPoleEnv();
void [env, ContinuousRunner, MultiAgentRunner, SACAgent, DQNAgent, checkpointCatalogSchema, OnnxAgent];

import { createOnnxSession as nodeSession } from '@ignitionai/backend-onnx/node';
import { createOnnxSession as webSession } from '@ignitionai/backend-onnx/web';
void [nodeSession, webSession];
