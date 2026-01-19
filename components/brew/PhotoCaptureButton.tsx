"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCamera } from "@/lib/hooks/useCamera";
import { analyzeProductImage, AnalyzeImageResult, AIConfig } from "@/lib/services/aiService";
import { useToast } from "@/hooks/use-toast";

// Icons
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

interface PhotoCaptureButtonProps {
  productType: "coffee" | "grinder" | "brewer";
  aiConfig?: AIConfig;
  onResult: (result: AnalyzeImageResult) => void;
  showTooltip?: boolean;
}

const productTypeLabels = {
  coffee: "coffee bag",
  grinder: "grinder",
  brewer: "brewer",
};

export function PhotoCaptureButton({
  productType,
  aiConfig,
  onResult,
  showTooltip = false,
}: PhotoCaptureButtonProps) {
  const { toast } = useToast();
  const { captureImage, selectImage, isCapturing } = useCamera();
  const [processing, setProcessing] = useState(false);

  const handleImageCapture = async (useCamera: boolean) => {
    const imageBase64 = useCamera ? await captureImage() : await selectImage();

    if (!imageBase64) {
      return;
    }

    setProcessing(true);
    try {
      const result = await analyzeProductImage(imageBase64, productType, aiConfig);

      if (result.confidence < 0.3) {
        toast({
          title: "Low confidence",
          description: "Could not clearly identify the product. Try a clearer photo.",
          variant: "destructive",
        });
        return;
      }

      onResult(result);

      toast({
        title: "Image analyzed",
        description: "Product information detected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const isLoading = isCapturing || processing;

  const tooltipText = `Photo your ${productTypeLabels[productType]} for AI identification`;

  const buttonContent = (
    <div className="relative">
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          <CameraIcon className="h-4 w-4" />
          <SparklesIcon className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
        </>
      )}
    </div>
  );

  const dropdownButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isLoading}
          className="border-purple-500/50 hover:bg-purple-500/10"
          title={tooltipText}
        >
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleImageCapture(true)}>
          <CameraIcon className="h-4 w-4 mr-2" />
          Take Photo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleImageCapture(false)}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Choose from Library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (showTooltip) {
    return (
      <div className="group relative">
        {dropdownButton}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          <div className="font-medium">AI Photo Scanner</div>
          <div className="text-muted-foreground mt-0.5">
            Take a photo of your {productTypeLabels[productType]} to auto-identify
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-border" />
        </div>
      </div>
    );
  }

  return dropdownButton;
}
