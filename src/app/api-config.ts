"use server"

import type { APIConfig } from '@/ai/genkit';

export interface APIConfigData {
  provider: 'openai-compatible';
  baseURL: string;
  apiKey: string;
  model: string;
}

// In-memory storage for API configuration
// (Actual persistence is handled by localStorage on the client side)
let currentConfig: APIConfigData | null = null;

export async function setAPIConfig(config: APIConfigData): Promise<{ success: boolean }> {
  currentConfig = config;
  return { success: true };
}

export async function getAPIConfig(): Promise<APIConfigData | null> {
  return currentConfig;
}

export async function clearAPIConfig(): Promise<{ success: boolean }> {
  currentConfig = null;
  return { success: true };
}
