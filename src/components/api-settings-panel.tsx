"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { testApiConnection } from "@/app/actions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Settings, Save, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  baseURL: z
    .string()
    .min(1, { message: "Base URL 是必需的。" })
    .url({ message: "请输入有效的 URL。" }),
  apiKey: z
    .string()
    .min(1, { message: "API Key 是必需的。" }),
  model: z
    .string()
    .min(1, { message: "Model 是必需的。" }),
});

type ApiSettingsPanelProps = {
  onSave?: (config: { baseURL: string; apiKey: string; model: string }) => void;
  onClear?: () => void;
  currentConfig?: { baseURL: string; apiKey: string; model: string } | null;
};

export function ApiSettingsPanel({
  onSave,
  onClear,
  currentConfig,
}: ApiSettingsPanelProps) {
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseURL: "",
      apiKey: "",
      model: "",
    },
  });

  // 组件挂载时加载保存的配置
  useEffect(() => {
    const saved = localStorage.getItem("apiConfig");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        form.setValue("baseURL", config.baseURL || "");
        form.setValue("apiKey", config.apiKey || "");
        form.setValue("model", config.model || "");
      } catch (e) {
        console.error("解析保存的配置失败:", e);
      }
    }
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const config = {
      provider: "openai-compatible" as const,
      ...values,
    };

    try {
      localStorage.setItem("apiConfig", JSON.stringify(config));
      setStatusMessage({ type: "success", message: "配置保存成功！" });

      // 3 秒后清除消息
      setTimeout(() => setStatusMessage(null), 3000);

      // 如果提供了回调，则调用父组件回调
      if (onSave) {
        onSave(values);
      }

      // 为其他组件派发事件
      window.dispatchEvent(new CustomEvent("apiConfigChanged", { detail: config }));
    } catch (e) {
      setStatusMessage({
        type: "error",
        message: "保存配置失败，请重试。",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }

  async function handleClear() {
    localStorage.removeItem("apiConfig");
    form.reset();
    setStatusMessage({ type: "success", message: "配置已清除！" });
    setTimeout(() => setStatusMessage(null), 3000);

    if (onClear) {
      onClear();
    }

    // 为其他组件派发事件
    window.dispatchEvent(new CustomEvent("apiConfigChanged", { detail: null }));
  }

  async function handleTest() {
    const values = form.getValues();
    if (!values.baseURL || !values.apiKey || !values.model) {
      setStatusMessage({ type: "error", message: "请填写所有配置项后再测试。" });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const result = await testApiConnection({
        provider: "openai-compatible",
        ...values,
      });

      setStatusMessage({
        type: result.success ? "success" : "error",
        message: result.message,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: `测试失败：${error instanceof Error ? error.message : "未知错误"}`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">API 配置</h2>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{statusMessage.message}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="baseURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://api.openai.com/v1"
                    {...field}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>
                  OpenAI 兼容 API 的基础 URL（如智谱、OpenRouter 以及本地 LLM 服务器）。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    {...field}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>
                  所选提供商的 API 密钥。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input
                    placeholder="openai/gpt-4o-mini"
                    {...field}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>
                  模型标识符（如 "glm-4.7"、"openai/gpt-4o-mini"、"anthropic/claude-3-5-sonnet"）。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isTesting ? "测试中..." : "测试连接"}
            </Button>
            <Button type="submit" className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              清除
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <p className="font-semibold">支持的提供商：</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>OpenAI (api.openai.com)</li>
          <li>OpenRouter (openrouter.ai)</li>
          <li>任何 OpenAI 兼容的 API 接口</li>
        </ul>
        <p className="pt-2">
          配置保存在浏览器本地。刷新页面以继续使用保存的设置。
        </p>
      </div>
    </div>
  );
}
