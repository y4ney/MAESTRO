'use server';
/**
 * @fileOverview 为系统架构生成 Mermaid 语法图表。
 *
 * - generateArchitectureDiagram - 创建 Mermaid 图表脚本的函数。
 * - GenerateArchitectureDiagramInput - 函数的输入类型。
 * - GenerateArchitectureDiagramOutput - 函数的返回类型。
 */

import {ai, createAIInstance} from '@/ai/genkit';
import {z} from 'genkit';
import type { APIConfigData } from '@/app/api-config';

const GenerateArchitectureDiagramInputSchema = z.object({
  architectureDescription: z.string().describe('要可视化的系统架构。'),
});
export type GenerateArchitectureDiagramInput = z.infer<typeof GenerateArchitectureDiagramInputSchema>;

const GenerateArchitectureDiagramOutputSchema = z.object({
  mermaidCode: z.string().describe("表示架构图的 Mermaid.js 语法脚本。必须包含在 ```mermaid ... ``` 代码块中。"),
});
export type GenerateArchitectureDiagramOutput = z.infer<typeof GenerateArchitectureDiagramOutputSchema>;

function createPrompt(aiInstance: any, model?: string) {
  return aiInstance.definePrompt({
    name: 'generateArchitectureDiagramPrompt',
    input: { schema: GenerateArchitectureDiagramInputSchema },
    output: { schema: GenerateArchitectureDiagramOutputSchema },
    model: model,
    prompt: `你是系统架构和 Mermaid 图表语法的专家。你的任务是将系统描述转换为简化的 Mermaid 脚本。

    **系统描述：**
    {{{architectureDescription}}}

    **说明：**
    1. 生成一个 \`graph TD\`（自上而下）图表。
    2.  保持语法简单。使用节点 ID 和文本标签（例如，\`A[智能体]\`）。
    3.  使用简单的箭头连接器，如 \`-->\` 表示交互。
    4.  **至关重要，不要在节点文本标签中使用括号、方括号或任何其他特殊字符。** 例如，使用 '智能体 A' 而不是 '智能体 A（观察者）'。这是为了避免渲染错误。
    5.  表示关键组件（智能体、服务、数据库）及其关系。
    6.  最终输出必须仅为 Mermaid 代码，包含在 Markdown 代码块中，如下所示：
    \`\`\`mermaid
    graph TD;
        节点1[标签一] --> 节点2[标签二];
    \`\`\`
    `,
  });
}

async function generateArchitectureDiagramFlow(
  aiInstance: any,
  model: string | undefined,
  input: GenerateArchitectureDiagramInput
): Promise<GenerateArchitectureDiagramOutput> {
  const prompt = createPrompt(aiInstance, model);
  const flow = aiInstance.defineFlow(
    {
      name: 'generateArchitectureDiagramFlow',
      inputSchema: GenerateArchitectureDiagramInputSchema,
      outputSchema: GenerateArchitectureDiagramOutputSchema,
    },
    async (flowInput: GenerateArchitectureDiagramInput) => {
      try {
        const { output } = await prompt(flowInput);

        if (!output?.mermaidCode) {
          throw new Error("AI 未返回任何 Mermaid 代码。");
        }

        const mermaidCode = output.mermaidCode.replace(/```mermaid\n|```/g, '').trim();

        return {
          mermaidCode: mermaidCode
        };

      } catch(e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("generateArchitectureDiagramFlow 中的错误:", errorMessage);
        throw new Error(`生成图表脚本失败。原因：${errorMessage}`);
      }
    }
  );
  return await flow(input);
}

export async function generateArchitectureDiagram(
  input: GenerateArchitectureDiagramInput,
  config?: APIConfigData
): Promise<GenerateArchitectureDiagramOutput> {
  if (config) {
    const { ai: aiInstance, model } = createAIInstance({ ...config, model: config.model });
    return generateArchitectureDiagramFlow(aiInstance, model, input);
  } else {
    // 使用默认 AI 实例，从 process.env 获取模型
    const model = process.env.LLM_MODEL || (process.env.LLM_PROVIDER === 'google' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    // 添加提供商前缀
    const provider = process.env.LLM_PROVIDER ?? 'google';
    const fullModel = provider === 'openai' ? `openai/${model}` : (provider === 'ollama' ? `ollama/${model}` : `googleai/${model}`);
    return generateArchitectureDiagramFlow(ai, fullModel, input);
  }
}
