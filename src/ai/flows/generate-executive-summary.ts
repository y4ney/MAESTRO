'use server';
/**
 * @fileOverview 生成 MAESTRO 威胁分析的高级摘要。
 *
 * - generateExecutiveSummary - 创建高级摘要的函数。
 * - GenerateExecutiveSummaryInput - 函数的输入类型。
 * - GenerateExecutiveSummaryOutput - 函数的返回类型。
 */

import {ai, createAIInstance} from '@/ai/genkit';
import {z} from 'genkit';
import type { APIConfigData } from '@/app/api-config';

const LayerDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  threat: z.string().nullable(),
  mitigation: z.object({
    recommendation: z.string(),
    reasoning: z.string(),
    caveats: z.string(),
  }).nullable(),
  status: z.enum(['pending', 'analyzing', 'complete', 'error']),
});

const GenerateExecutiveSummaryInputSchema = z.object({
  architectureDescription: z.string().describe('已分析的系统架构。'),
  analysisResults: z.array(LayerDataSchema).describe('每个 MAESTRO 层级的威胁分析结果数组。'),
});
export type GenerateExecutiveSummaryInput = z.infer<typeof GenerateExecutiveSummaryInputSchema>;

const GenerateExecutiveSummaryOutputSchema = z.object({
  summary: z.string().describe('威胁分析的 Markdown 格式高级摘要。'),
});
export type GenerateExecutiveSummaryOutput = z.infer<typeof GenerateExecutiveSummaryOutputSchema>;

function createPrompt(aiInstance: any, model?: string) {
  return aiInstance.definePrompt({
    name: 'generateExecutiveSummaryPrompt',
    input: {schema: GenerateExecutiveSummaryInputSchema},
    output: {schema: GenerateExecutiveSummaryOutputSchema},
    model: model,
    prompt: `你是一名首席安全分析师。你的任务是为 MAESTRO 威胁分析报告编写高级摘要。

摘要应该：
1. 简要确认已分析的架构。
2. 突出在所有层级中识别的最关键威胁。
3. 提及关键的缓解主题或最重要的推荐操作。
4. 以关于深度防御策略重要性的声明结束。
5. 简洁、专业，适合领导层受众。
6. 将输出格式化为单个 Markdown 字符串。
7. 包含 MAESTRO 框架的链接：https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro

**已分析架构：**
{{{architectureDescription}}}

**分析结果：**
{{#each analysisResults}}
---
**层级：** {{name}}
**状态：** {{status}}}
{{#if threat}}
**威胁：}}
{{{threat}}}
{{/if}}
{{#if mitigation}}
**缓解：}}
- **建议：** {{mitigation.recommendation}}
- **推理：** {{mitigation.reasoning}}
{{/if}}
{{/each}}

根据提供的详细信息，生成高级摘要。`,
  });
}

async function generateExecutiveSummaryFlow(
  aiInstance: any,
  model: string | undefined,
  input: GenerateExecutiveSummaryInput
): Promise<GenerateExecutiveSummaryOutput> {
  const prompt = createPrompt(aiInstance, model);
  const flow = aiInstance.defineFlow(
    {
      name: 'generateExecutiveSummaryFlow',
      inputSchema: GenerateExecutiveSummaryInputSchema,
      outputSchema: GenerateExecutiveSummaryOutputSchema,
    },
    async (flowInput: GenerateExecutiveSummaryInput) => {
      const {output} = await prompt(flowInput);
      return output!;
    }
  );
  return await flow(input);
}

export async function generateExecutiveSummary(
  input: GenerateExecutiveSummaryInput,
  config?: APIConfigData
): Promise<GenerateExecutiveSummaryOutput> {
  if (config) {
    const { ai: aiInstance, model } = createAIInstance({ ...config, model: config.model });
    return generateExecutiveSummaryFlow(aiInstance, model, input);
  } else {
    // 使用默认 AI 实例，从 process.env 获取模型
    const model = process.env.LLM_MODEL || (process.env.LLM_PROVIDER === 'google' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    // 添加提供商前缀
    const provider = process.env.LLM_PROVIDER ?? 'google';
    const fullModel = provider === 'openai' ? `openai/${model}` : (provider === 'ollama' ? `ollama/${model}` : `googleai/${model}`);
    return generateExecutiveSummaryFlow(ai, fullModel, input);
  }
}
