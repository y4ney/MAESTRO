// recommend-mitigations.ts
'use server';
/**
 * @fileOverview 针对已识别威胁的 AI 驱动缓解策略。
 *
 * - recommendMitigations - 生成缓解策略的函数。
 * - RecommendMitigationsInput - recommendMitigations 函数的输入类型。
 * - RecommendMitigationsOutput - recommendMitigations 函数的返回类型。
 */

import {ai, createAIInstance} from '@/ai/genkit';
import {z} from 'genkit';
import type { APIConfigData } from '@/app/api-config';

const RecommendMitigationsInputSchema = z.object({
  threatDescription: z.string().describe('已识别威胁的描述。'),
  layer: z.string().describe('威胁所属的 MAESTRO 层级。'),
});
export type RecommendMitigationsInput = z.infer<typeof RecommendMitigationsInputSchema>;

const RecommendMitigationsOutputSchema = z.object({
  recommendation: z.string().describe('推荐的缓解策略。'),
  reasoning: z.string().describe('建议背后的推理。'),
  caveats: z.string().describe('缓解策略的注意事项或限制。'),
});
export type RecommendMitigationsOutput = z.infer<typeof RecommendMitigationsOutputSchema>;

function createPrompt(aiInstance: any, model?: string) {
  return aiInstance.definePrompt({
    name: 'recommendMitigationsPrompt',
    input: {schema: RecommendMitigationsInputSchema},
    output: {schema: RecommendMitigationsOutputSchema},
    model: model,
    prompt: `你是一名网络安全专家，为 MAESTRO 架构中已识别的威胁提供缓解策略。

对于下面描述的威胁，提供缓解建议、该建议背后的推理，以及策略的任何注意事项或限制。

威胁描述：{{{threatDescription}}}
MAESTRO 层级：{{{layer}}}

确保响应包含建议、推理和注意事项，清晰简洁。
`,
  });
}

async function recommendMitigationsFlow(
  aiInstance: any,
  model: string | undefined,
  input: RecommendMitigationsInput
): Promise<RecommendMitigationsOutput> {
  const prompt = createPrompt(aiInstance, model);
  const flow = aiInstance.defineFlow(
    {
      name: 'recommendMitigationsFlow',
      inputSchema: RecommendMitigationsInputSchema,
      outputSchema: RecommendMitigationsOutputSchema,
    },
    async (flowInput: RecommendMitigationsInput) => {
      const {output} = await prompt(flowInput);
      return output!;
    }
  );
  return await flow(input);
}

export async function recommendMitigations(
  input: RecommendMitigationsInput,
  config?: APIConfigData
): Promise<RecommendMitigationsOutput> {
  if (config) {
    const { ai: aiInstance, model } = createAIInstance({ ...config, model: config.model });
    return recommendMitigationsFlow(aiInstance, model, input);
  } else {
    // 使用默认 AI 实例，从 process.env 获取模型
    const model = process.env.LLM_MODEL || (process.env.LLM_PROVIDER === 'google' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    // 添加提供商前缀
    const provider = process.env.LLM_PROVIDER ?? 'google';
    const fullModel = provider === 'openai' ? `openai/${model}` : (provider === 'ollama' ? `ollama/${model}` : `googleai/${model}`);
    return recommendMitigationsFlow(ai, fullModel, input);
  }
}
