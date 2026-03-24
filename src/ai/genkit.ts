import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import openAI from '@genkit-ai/compat-oai/openai';
import {ollama} from 'genkitx-ollama';
import {openAICompatible} from '@genkit-ai/compat-oai';

const provider = process.env.LLM_PROVIDER ?? 'google';

const config: {
  plugins: any[],
  model: string,
} = {
  plugins: [] as any[],
  model: '',
};

switch (provider) {
  case 'openai':
    config.plugins = [openAI({apiKey: process.env.OPENAI_API_KEY})];
    config.model = `openai/${process.env.LLM_MODEL || 'gpt-4o-mini'}`;
    break;
  case 'ollama':
    config.plugins = [ollama({
      serverAddress: process.env.OLLAMA_SERVER_ADDRESS || 'http://localhost:11434',
      models: [{
        name: process.env.LLM_MODEL || 'qwen3:8b',
        type: 'generate',
      }]
    })];
    config.model = `ollama/${process.env.LLM_MODEL || 'qwen3:8b'}`;
    break;
  default:
    // Only initialize Google AI if API key is provided
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      config.plugins = [googleAI()];
      config.model = `googleai/${process.env.LLM_MODEL || 'gemini-2.5-flash'}`;
    } else {
      // Use openai-compatible plugin with default settings when no API key
      config.plugins = [openAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })];
      config.model = `openai/${process.env.LLM_MODEL || 'gpt-4o-mini'}`;
    }
}

export const ai = genkit(config);

// API Configuration types for custom endpoints
export interface APIConfig {
  provider: 'openai-compatible';
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

// Factory function to create dynamic AI instances with custom configuration
// Returns both the AI instance and the model string
export function createAIInstance(config: APIConfig) {
  const plugins: any[] = [];
  let model: string = '';

  if (config.provider === 'openai-compatible') {
    plugins.push(openAICompatible({
      name: 'custom',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      baseURL: config.baseURL || 'https://api.openai.com/v1',
    }));
    // Model format: custom/<model-name>
    model = `custom/${config.model || 'gpt-4o-mini'}`;
  }

  const aiInstance = genkit({ plugins });
  return { ai: aiInstance, model };
}

