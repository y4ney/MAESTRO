'use server';
/**
 * @fileOverview 根据提供的系统架构描述，生成特定 MAESTRO 层级的综合威胁分析。
 *
 * - suggestThreatsForLayer - 启动威胁分析过程的函数。
 * - SuggestThreatsForLayerInput - suggestThreatsForLayer 函数的输入类型。
 * - SuggestThreatsForLayerOutput - suggestThreatsForLayer 函数的返回类型。
 */

import {ai, createAIInstance} from '@/ai/genkit';
import {z} from 'genkit';
import type { APIConfigData } from '@/app/api-config';

const SuggestThreatsForLayerInputSchema = z.object({
  architectureDescription: z
    .string()
    .describe('系统架构的详细描述。'),
  layerName: z.string().describe('要分析的 MAESTRO 层级名称。'),
  layerDescription: z.string().describe('MAESTRO 层级的描述。'),
});
export type SuggestThreatsForLayerInput = z.infer<
  typeof SuggestThreatsForLayerInputSchema
>;

const SuggestThreatsForLayerOutputSchema = z.object({
  threatAnalysis: z
    .string()
    .describe(
      '指定层级的综合威胁分析，格式为 Markdown。'
    ),
});
export type SuggestThreatsForLayerOutput = z.infer<
  typeof SuggestThreatsForLayerOutputSchema
>;

function createPrompt(aiInstance: any, model?: string) {
  return aiInstance.definePrompt({
    name: 'suggestThreatsForLayerPrompt',
    input: {schema: SuggestThreatsForLayerInputSchema},
    output: {schema: SuggestThreatsForLayerOutputSchema},
    model: model,
    prompt: `你是一名安全分析师，专注于识别多智能体系统中的潜在安全漏洞，重点关注 MAESTRO 架构。

你的任务是为指定的 MAESTRO 层级生成威胁分析。

**系统架构描述：**
{{{architectureDescription}}}

**要分析的 MAESTRO 层级：** {{layerName}}
**层级描述：** {{{layerDescription}}}

**需考虑的智能体因素：**
- 非确定性
- 自主性
- 无信任边界
- 动态身份和访问控制
- 智能体间交互、委托和通信复杂性

**说明：**
1. 分析提供的系统架构和 MAESTRO 层级描述。
2. 生成分为两个类别的威胁分析，格式为 Markdown。
3. **类别 1：传统威胁：** 识别该层级的固有安全威胁，忽略智能体因素。例如，对于"基础模型"，这可能包括模型中毒、数据泄露或成员推断攻击。
4. **类别 2：智能体威胁：** 推理"需考虑的智能体因素"中的每一个可能如何在该特定层级中引入新威胁或加剧现有威胁。如果某个因素适用，描述潜在威胁。如果不适用，可以说明。
5. 将整个输出格式化为单个 Markdown 字符串。使用标题、粗体文本和列表使报告清晰易读。

**威胁分析：**`,
  });
}

async function suggestThreatsForLayerFlow(
  aiInstance: any,
  model: string | undefined,
  input: SuggestThreatsForLayerInput
): Promise<SuggestThreatsForLayerOutput> {
  const prompt = createPrompt(aiInstance, model);
  const flow = aiInstance.defineFlow(
    {
      name: 'suggestThreatsForLayerFlow',
      inputSchema: SuggestThreatsForLayerInputSchema,
      outputSchema: SuggestThreatsForLayerOutputSchema,
    },
    async (flowInput: SuggestThreatsForLayerInput) => {
      const {output} = await prompt(flowInput);
      return output!;
    }
  );
  return await flow(input);
}

export async function suggestThreatsForLayer(
  input: SuggestThreatsForLayerInput,
  config?: APIConfigData
): Promise<SuggestThreatsForLayerOutput> {
  if (config) {
    const { ai: aiInstance, model } = createAIInstance({ ...config, model: config.model });
    return suggestThreatsForLayerFlow(aiInstance, model, input);
  } else {
    // 使用默认 AI 实例，从 process.env 获取模型
    const model = process.env.LLM_MODEL || (process.env.LLM_PROVIDER === 'google' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    // 添加提供商前缀
    const provider = process.env.LLM_PROVIDER ?? 'google';
    const fullModel = provider === 'openai' ? `openai/${model}` : (provider === 'ollama' ? `ollama/${model}` : `googleai/${model}`);
    return suggestThreatsForLayerFlow(ai, fullModel, input);
  }
}
