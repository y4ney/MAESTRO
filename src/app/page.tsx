
"use client";

import * as React from "react";
import jsPDF from "jspdf";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayerCard } from "@/components/layer-card";
import { SidebarInputForm } from "@/components/sidebar-input-form";
import { suggestThreat, recommendMitigation, getExecutiveSummary, getArchitectureDiagram } from "@/app/actions";
import { MAESTRO_LAYERS } from "@/data/maestro";
import { type LayerData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Terminal, ToyBrick } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiSettingsPanel } from "@/components/api-settings-panel";
import type { APIConfigData } from "@/app/api-config";
import { Spinner } from "@/components/icons";
import { MermaidDiagram } from "@/components/mermaid-diagram";

// 初始化层级数据
const INITIAL_LAYERS: LayerData[] = MAESTRO_LAYERS.map((layer) => ({
  ...layer,
  threat: null,
  mitigation: null,
  status: "pending",
}));

// MAESTRO 方法论摘要
const MAESTRO_METHODOLOGY_SUMMARY = `本报告采用 MAESTRO（Multi-Agent Environment, Security, Threat, Risk, and Outcome）框架进行智能体 AI 威胁建模。MAESTRO 提供了一种结构化的七层方法，用于系统分析和缓解多智能体系统中的安全风险。它既解决了传统安全漏洞，也解决了由自主性、非确定性等智能体因素和复杂的智能体间交互带来的新型威胁。以下部分详细说明了基于提供的系统架构的每一层分析。

如需了解框架详情，请访问：https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro`;


export default function Home() {
  const [layers, setLayers] = React.useState<LayerData[]>(INITIAL_LAYERS);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [buttonText, setButtonText] = React.useState("生成分析");
  const [logs, setLogs] = React.useState<string[]>([]);
  const logsContainerRef = React.useRef<HTMLDivElement>(null);
  const analysisCancelledRef = React.useRef(false);
  const [currentArchitecture, setCurrentArchitecture] = React.useState("");
  const [executiveSummary, setExecutiveSummary] = React.useState<string | null>(null);
  const [mermaidCode, setMermaidCode] = React.useState<string>("");
  const [isGeneratingDiagram, setIsGeneratingDiagram] = React.useState(false);
  const diagramContainerRef = React.useRef<HTMLDivElement>(null);
  const [apiConfig, setApiConfig] = React.useState<APIConfigData | null>(null);


  // 自动滚动日志到底部
  React.useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 组件挂载时从 localStorage 加载 API 配置
  React.useEffect(() => {
    const saved = localStorage.getItem('apiConfig');
    if (saved) {
      try {
        setApiConfig(JSON.parse(saved));
      } catch (e) {
        console.error("解析保存的 API 配置失败:", e);
      }
    }

    // 监听来自设置面板的配置更改
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<APIConfigData | null>;
      setApiConfig(customEvent.detail);
    };

    window.addEventListener('apiConfigChanged', handleConfigChange);
    return () => {
      window.removeEventListener('apiConfigChanged', handleConfigChange);
    };
  }, []);

  // 添加日志
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // 更新层级状态
  const updateLayerStatus = (layerId: string, status: LayerData["status"]) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, status } : l))
    );
  };

  // 停止分析
  const handleStop = () => {
    analysisCancelledRef.current = true;
    addLog("已请求停止分析。完成当前步骤...");
  };

  // 开始分析
  const handleAnalyze = async (architectureDescription: string) => {
    analysisCancelledRef.current = false;
    setIsAnalyzing(true);
    setCurrentArchitecture(architectureDescription);
    setExecutiveSummary(null);
    setLogs([]);
    setLayers(INITIAL_LAYERS);
    // 注意：我们故意不在这里清除 mermaidCode，
    // 以保持图表在分析之间保持持久化。
    addLog("正在开始 MAESTRO 威胁分析...");

    let finalLayers: LayerData[] = [];

    for (const layer of MAESTRO_LAYERS) {
      if (analysisCancelledRef.current) {
        addLog(`用户已停止分析。`);
        break;
      }
      try {
        setButtonText(`正在分析: ${layer.name}`);
        addLog(`[${layer.name}] 分析已开始...`);
        updateLayerStatus(layer.id, "analyzing");

        if (analysisCancelledRef.current) continue;
        addLog(`[${layer.name}] 正在调用 AI 建议威胁...`);
        const threatResult = await suggestThreat(
          architectureDescription,
          layer.name,
          layer.description,
          apiConfig || undefined
        );
        const threat = threatResult.threatAnalysis;

        if (analysisCancelledRef.current) {
           addLog(`[${layer.name}] 在缓解步骤之前停止了分析。`);
           updateLayerStatus(layer.id, "error");
           continue;
        }
        addLog(`[${layer.name}] 已收到威胁分析。`);
        setLayers((prev) =>
          prev.map((l) => (l.id === layer.id ? { ...l, threat } : l))
        );

        if (analysisCancelledRef.current) continue;
        addLog(`[${layer.name}] 正在调用 AI 获取缓解策略...`);
        const mitigation = await recommendMitigation(threat, layer.name, apiConfig || undefined);
        addLog(`[${layer.name}] 已收到缓解建议。`);
        setLayers((prev) => {
          const newLayers = prev.map((l) =>
            l.id === layer.id ? { ...l, mitigation, status: "complete" as const } : l
          );
          finalLayers = newLayers;
          return newLayers;
        });

        addLog(`[${layer.name}] 分析完成。`);
      } catch (error) {
        if (!analysisCancelledRef.current) {
          console.error(`分析层级 ${layer.name} 时出错:`, error);
          const errorMessage = error instanceof Error ? error.message : "发生了未知错误。";
          addLog(`[${layer.name}] 错误: ${errorMessage}`);
          updateLayerStatus(layer.id, "error");
        }
      }
    }

    if (!analysisCancelledRef.current && finalLayers.some(l => l.status === 'complete')) {
        addLog("正在生成执行摘要...");
        try {
            const summaryResult = await getExecutiveSummary(architectureDescription, finalLayers, apiConfig || undefined);
            setExecutiveSummary(summaryResult.summary);
            addLog("执行摘要已生成。");
        } catch (error) {
            console.error("生成执行摘要时出错:", error);
            addLog("无法生成执行摘要。");
        }
    }

    setButtonText("生成分析");
    if (!analysisCancelledRef.current) {
      addLog("完整分析已完成。");
    }
    setIsAnalyzing(false);
  };

  // 生成架构图
  const handleGenerateDiagram = async () => {
    if (!currentArchitecture) {
      addLog("请先提供架构描述。");
      return;
    }
    setIsGeneratingDiagram(true);
    addLog("正在生成架构图...");
    try {
      const result = await getArchitectureDiagram(currentArchitecture, apiConfig || undefined);
      setMermaidCode(result.mermaidCode);
      addLog("架构图已成功生成。");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "发生了未知错误。";
      addLog(`架构图生成失败: ${errorMessage}`);
      console.error("架构图生成错误:", error);
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // 下载 PDF 报告
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    addLog("PDF 生成已开始...");

    try {
        const doc = new jsPDF({unit: "px", format: "letter"});
        const margin = 30;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        let y = margin;

        // 文本选项接口
        interface TextOptions {
            size?: number;
            style?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            x?: number;
            align?: 'left' | 'center' | 'right' | 'justify';
            color?: number;
        }

        // 添加文本
        const addText = (text: string, options: TextOptions = {}) => {
            const { size = 10, style = 'normal', x = margin, align = 'left', color = 0 } = options;

            doc.setFontSize(size);
            doc.setFont("helvetica", style);
            doc.setTextColor(color);

            const lines = doc.splitTextToSize(text, usableWidth - (x > margin ? (x - margin) : 0));

            lines.forEach((line: string) => {
                const textHeight = doc.getTextDimensions(line).h;
                if (y + textHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, x, y, { align: align || 'left' });
                y += textHeight * 1.15; // 添加行间距
            });
        };

        addLog("正在组装 PDF 文档...");

        // --- 页眉 ---
        addText("MAESTRO 威胁分析报告", { size: 20, style: "bold", align: "center", x: pageWidth / 2 });
        y += 10;

        // --- 免责声明与开发者信息 ---
        addText("开发者: DistributedApps.ai", { size: 8, color: 150 });
        y += 12;

        const disclaimer = "本报告由 AI 助手基于 MAESTRO 框架生成。AI 可能会犯错；请始终与安全专家一起检查威胁和缓解措施。";
        addText(disclaimer, { size: 8, color: 100 });
        y += 20;

        // --- 架构描述 ---
        if (currentArchitecture) {
            addText("已分析的系统架构", { size: 16, style: "bold" });
            y+= 6;
            addText(currentArchitecture, { size: 10, color: 80 });
            y += 10;
        }

        // --- 架构图 ---
        if (mermaidCode && diagramContainerRef.current) {
          addLog("正在将图表添加到 PDF...");
          y += 10;
          if (y + 200 > pageHeight - margin) { // 检查是否有图表空间
              doc.addPage();
              y = margin;
          }
          addText("架构图", { size: 16, style: "bold" });
          y += 6;

          const svgElement = diagramContainerRef.current.querySelector('svg');
          if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const svgSize = svgElement.getBoundingClientRect();
              canvas.width = svgSize.width * 2; // 提高分辨率
              canvas.height = svgSize.height * 2;
              canvas.style.width = `${svgSize.width}px`;
              canvas.style.height = `${svgSize.height}px`;

              const img = new Image();
              img.src = "data:image/svg+xml;base64," + btoa(svgData);

              await new Promise<void>((resolve) => {
                  img.onload = () => {
                      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const imgData = canvas.toDataURL("image/png");
                      const imgWidth = usableWidth * 0.8;
                      const imgHeight = (img.height * imgWidth) / img.width;
                      doc.addImage(imgData, "PNG", margin + (usableWidth * 0.1), y, imgWidth, imgHeight);
                      y += imgHeight + 20;
                      resolve();
                  };
              });
          } else {
              addLog("找不到图表的渲染 SVG。");
          }
        }

        // --- 执行摘要 ---
        addText("执行摘要", { size: 16, style: "bold" });
        y+= 6;
        const summaryToUse = executiveSummary || MAESTRO_METHODOLOGY_SUMMARY;
        addText(summaryToUse.replace(/###\s|##\s|#\s|\*\*/g, ''), { size: 10, color: 80 });
        y += 16;

        // --- 逐层分析 ---
        layers.forEach((layer) => {
            if (y + 60 > pageHeight - margin) { // 预防性分页检查
              doc.addPage();
              y = margin;
            }

            doc.setDrawColor(220);
            doc.line(margin, y, pageWidth - margin, y);
            y += 16;

            addText(layer.name, { size: 14, style: "bold" });
            y += 4;

            if (layer.status === "pending" || layer.status === 'analyzing') {
                addText("等待 AI 调查...", { size: 10, style: "italic", color: 150 });
            } else if (layer.status === 'error') {
                addText("分析过程中发生错误。", { size: 10, style: "italic", color: 200 });
            } else if (layer.threat && layer.mitigation) {
                addText("已识别的威胁", { size: 12, style: "bold" });
                addText(layer.threat.replace(/###\s|##\s|#\s|\*\*/g, ''), { size: 10, color: 80 });
                y += 8;

                addText("缓解策略", { size: 12, style: "bold" });

                addText("建议:", { size: 10, style: "bold", x: margin + 4 });
                addText(layer.mitigation.recommendation, { size: 10, x: margin + 8, color: 80});
                y += 4;

                addText("推理:", { size: 10, style: "bold", x: margin + 4});
                addText(layer.mitigation.reasoning, { size: 10, x: margin + 8, color: 80 });
                y += 4;

                addText("注意事项:", { size: 10, style: "bold", x: margin + 4 });
                addText(layer.mitigation.caveats, { size: 10, x: margin + 8, color: 80 });
            }
            y += 10;
        });

        addLog("正在保存 PDF 文件...");
        doc.save("MAESTRO_威胁分析.pdf");
        addLog("PDF 报告已成功保存。");
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "PDF 生成过程中发生未知错误。";
        addLog(`PDF 生成错误: ${errorMessage}`);
        console.error("PDF 生成错误:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary"><rect width="256" height="256" fill="none"/><path d="M45.1,182.2a7.9,7.9,0,0,1-6.2-13.4l80-96a7.9,7.9,0,0,1,12.2,0l80,96a8,8,0,0,1-12.2,10.8L128,88.2,51.3,179.6a7.9,7.9,0,0,1-6.2,2.6Z" fill="currentColor"/><path d="M210.9,202.8,137.1,72.6a8.2,8.2,0,0,0-14.2,0L48.9,202.8a8,8,0,0,0,7.1,13.2H203.8a8,8,0,0,0,7.1-13.2Zm-8.1,4.4H56L128,96.3Z" fill="currentColor"/></svg>
            <h1 className="text-xl font-headline font-semibold">
              MAESTRO
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <Tabs defaultValue="input" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">输入</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>
            <TabsContent value="input" className="flex-grow overflow-auto p-0">
              <SidebarInputForm
                onAnalyze={handleAnalyze}
                onStop={handleStop}
                isAnalyzing={isAnalyzing}
                buttonText={buttonText}
                onDescriptionChange={(desc) => {
                  setCurrentArchitecture(desc);
                }}
              />
            </TabsContent>
            <TabsContent value="settings" className="flex-grow overflow-auto">
              <ApiSettingsPanel />
            </TabsContent>
          </Tabs>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
                  威胁分析器
                </h1>
                <p className="text-muted-foreground">
                  多智能体系统的 AI 驱动威胁分析
                </p>
              </div>
            </div>
             <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
              下载 PDF 报告
            </Button>
          </div>

          <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                  <Terminal className="h-5 w-5 text-muted-foreground"/>
                  <CardTitle className="text-base font-medium">分析进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40 w-full rounded-md border bg-muted/50 p-4">
                    <div ref={logsContainerRef}>
                      {logs.map((log, index) => (
                        <p key={index} className="text-sm font-mono text-muted-foreground">
                          <span className="text-primary mr-2">&gt;</span>{log}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

             <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <ToyBrick className="h-5 w-5 text-muted-foreground"/>
                    <CardTitle className="text-base font-medium">架构图</CardTitle>
                  </div>
                  <Button size="sm" onClick={handleGenerateDiagram} disabled={isGeneratingDiagram || !currentArchitecture}>
                    {isGeneratingDiagram && <Spinner className="mr-2 h-4 w-4" />}
                    生成
                  </Button>
                </CardHeader>
                <CardContent>
                   <div ref={diagramContainerRef} className="flex items-center justify-center min-h-[140px] w-full rounded-md border border-dashed bg-muted/50 p-4">
                      {isGeneratingDiagram ? (
                          <div className="text-center text-muted-foreground">
                              <Spinner className="h-6 w-6 mx-auto mb-2" />
                              <p className="text-sm">AI 正在生成图表...</p>
                          </div>
                      ) : mermaidCode ? (
                          <MermaidDiagram code={mermaidCode} />
                      ) : (
                          <div className="text-center text-muted-foreground">
                              <p className="text-sm">点击 &apos;生成&apos; 创建图表</p>
                              <p className="text-xs">基于架构描述。</p>
                          </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {layers.map((layer) => (
              <div key={layer.id} className="lg:col-span-4 md:col-span-6">
                <LayerCard layer={layer} />
              </div>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
