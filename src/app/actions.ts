"use server";

import { recommendMitigations } from "@/ai/flows/recommend-mitigations";
import { suggestThreatsForLayer } from "@/ai/flows/suggest-threats-for-layer";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { generateArchitectureDiagram } from "@/ai/flows/generate-architecture-diagram";
import type { APIConfigData } from "@/app/api-config";
import { createAIInstance } from "@/ai/genkit";

import { type RecommendMitigationsOutput } from "@/ai/flows/recommend-mitigations";
import { type SuggestThreatsForLayerOutput } from "@/ai/flows/suggest-threats-for-layer";
import { type GenerateExecutiveSummaryOutput } from "@/ai/flows/generate-executive-summary";
import { type GenerateArchitectureDiagramOutput } from "@/ai/flows/generate-architecture-diagram";

import { LayerData } from "@/lib/types";
import { AIErrorHandler } from "@/lib/ai-error-handler";
import { withRetry } from "@/lib/retry-utils";

// 建议特定 MAESTRO 层级的威胁
export async function suggestThreat(
  architectureDescription: string,
  layerName: string,
  layerDescription: string,
  apiConfig?: APIConfigData
): Promise<SuggestThreatsForLayerOutput> {
  return withRetry(async () => {
    try {
      const result = await suggestThreatsForLayer(
        {
          architectureDescription,
          layerName,
          layerDescription,
        },
        apiConfig
      );
      return result;
    } catch (error) {
      const maestroError = AIErrorHandler.handleAIFlowError(error, 'suggestThreatsForLayer', {
        layerName,
        architectureDescription: architectureDescription.slice(0, 100) + '...'
      });
      throw maestroError;
    }
  }, undefined, (error) => {
    if (error instanceof Error && error.message.includes('MaestroError')) {
      const maestroError = JSON.parse(error.message.split('MaestroError: ')[1]);
      return AIErrorHandler.shouldRetry(maestroError);
    }
    return true;
  });
}

// 推荐缓解策略
export async function recommendMitigation(
  threatDescription: string,
  layerName: string,
  apiConfig?: APIConfigData
): Promise<RecommendMitigationsOutput> {
  return withRetry(async () => {
    try {
      const result = await recommendMitigations(
        {
          threatDescription,
          layer: layerName,
        },
        apiConfig
      );
      return result;
    } catch (error) {
      const maestroError = AIErrorHandler.handleAIFlowError(error, 'recommendMitigations', {
        layerName,
        threatDescription: threatDescription.slice(0, 100) + '...'
      });
      throw maestroError;
    }
  }, undefined, (error) => {
    if (error instanceof Error && error.message.includes('MaestroError')) {
      const maestroError = JSON.parse(error.message.split('MaestroError: ')[1]);
      return AIErrorHandler.shouldRetry(maestroError);
    }
    return true;
  });
}

// 生成执行摘要
export async function getExecutiveSummary(
  architectureDescription: string,
  analysisResults: LayerData[],
  apiConfig?: APIConfigData
): Promise<GenerateExecutiveSummaryOutput> {
  return withRetry(async () => {
    try {
      const result = await generateExecutiveSummary(
        {
          architectureDescription,
          analysisResults,
        },
        apiConfig
      );
      return result;
    } catch (error) {
      const maestroError = AIErrorHandler.handleAIFlowError(error, 'generateExecutiveSummary', {
        architectureDescription: architectureDescription.slice(0, 100) + '...',
        layerCount: analysisResults.length
      });
      throw maestroError;
    }
  }, undefined, (error) => {
    if (error instanceof Error && error.message.includes('MaestroError')) {
      const maestroError = JSON.parse(error.message.split('MaestroError: ')[1]);
      return AIErrorHandler.shouldRetry(maestroError);
    }
    return true;
  });
}

// 生成架构图
export async function getArchitectureDiagram(
  architectureDescription: string,
  apiConfig?: APIConfigData
): Promise<GenerateArchitectureDiagramOutput> {
  return withRetry(async () => {
    try {
      const result = await generateArchitectureDiagram(
        {
          architectureDescription,
        },
        apiConfig
      );
      return result;
    } catch (error) {
      const maestroError = AIErrorHandler.handleAIFlowError(error, 'generateArchitectureDiagram', {
        architectureDescription: architectureDescription.slice(0, 100) + '...'
      });
      throw maestroError;
    }
  }, undefined, (error) => {
    if (error instanceof Error && error.message.includes('MaestroError')) {
      const maestroError = JSON.parse(error.message.split('MaestroError: ')[1]);
      return AIErrorHandler.shouldRetry(maestroError);
    }
    return true;
  });
}

// 测试 API 配置可用性
export async function testApiConnection(
  config: APIConfigData
): Promise<{ success: boolean; message: string }> {
  try {
    const { ai: aiInstance, model } = createAIInstance({ ...config, model: config.model });

    // 使用 AI 实例测试连接
    const result = await aiInstance.generate({
      prompt: '请简单回复"连接成功"四个字来测试API是否正常工作。',
      model: model,
      output: {
        format: 'text',
      },
    });

    if (result.text && result.text.includes('连接成功')) {
      return {
        success: true,
        message: '连接成功！API 配置有效。'
      };
    }

    return {
      success: false,
      message: '无法连接到 API，请检查配置。'
    };
  } catch (error) {
    console.error('测试 API 连接时出错:', error);
    return {
      success: false,
      message: `连接失败：${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
