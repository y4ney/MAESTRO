
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { USE_CASES } from "@/data/use-cases";
import { Spinner } from "./icons";
import { X } from "lucide-react";

const formSchema = z.object({
  architectureDescription: z
    .string()
    .min(50, {
      message: "架构描述必须至少 50 个字符。",
    })
    .max(5000, {
      message: "描述不能超过 5000 个字符。",
    }),
  preset: z.string().optional(),
});

type SidebarInputFormProps = {
  onAnalyze: (architectureDescription: string) => Promise<void>;
  onStop: () => void;
  isAnalyzing: boolean;
  buttonText: string;
  onDescriptionChange: (description: string) => void;
};

export function SidebarInputForm({
  onAnalyze,
  onStop,
  isAnalyzing,
  buttonText,
  onDescriptionChange,
}: SidebarInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      architectureDescription: USE_CASES[0].description,
      preset: USE_CASES[0].value,
    },
  });

  const archDescription = form.watch("architectureDescription");
  React.useEffect(() => {
    onDescriptionChange(archDescription);
  }, [archDescription, onDescriptionChange]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalyze(values.architectureDescription);
  }

  // 处理预设变更
  const handlePresetChange = (value: string) => {
    const selectedUseCase = USE_CASES.find((uc) => uc.value === value);
    if (selectedUseCase) {
      form.setValue("architectureDescription", selectedUseCase.description);
      form.setValue("preset", selectedUseCase.value);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          <FormField
            control={form.control}
            name="preset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>使用案例预设</FormLabel>
                <Select
                  onValueChange={handlePresetChange}
                  defaultValue={field.value}
                  disabled={isAnalyzing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择预设用例" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USE_CASES.map((useCase) => (
                      <SelectItem key={useCase.value} value={useCase.value}>
                        {useCase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择预设以自动填充描述。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="architectureDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>架构描述</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="详细描述您的系统架构..."
                    className="resize-none h-64"
                    {...field}
                    disabled={isAnalyzing}
                  />
                </FormControl>
                <FormDescription>
                  提供详细描述以进行精确的 AI 威胁分析。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="p-4 border-t bg-sidebar-background">
           {isAnalyzing ? (
              <Button type="button" variant="destructive" className="w-full" onClick={onStop}>
                <X className="mr-2 h-4 w-4" />
                停止分析
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={isAnalyzing}>
                {isAnalyzing && <Spinner className="mr-2 h-4 w-4" />}
                {buttonText}
              </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
