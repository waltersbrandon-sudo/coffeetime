"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { parseVoiceInput, ParseVoiceResult, AIConfig } from "@/lib/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { Coffee, Grinder, Brewer } from "@/lib/types";

// Icons
function MicIcon({ className }: { className?: string }) {
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
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
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

interface VoiceInputButtonProps {
  coffees: Coffee[];
  grinders: Grinder[];
  brewers: Brewer[];
  aiConfig?: AIConfig;
  onResult: (result: ParseVoiceResult) => void;
}

export function VoiceInputButton({
  coffees,
  grinders,
  brewers,
  aiConfig,
  onResult,
}: VoiceInputButtonProps) {
  const { toast } = useToast();
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();
  const [processing, setProcessing] = useState(false);

  const handleClick = async () => {
    if (isListening) {
      stopListening();

      if (!transcript.trim()) {
        toast({
          title: "No speech detected",
          description: "Please try again and speak clearly",
          variant: "destructive",
        });
        return;
      }

      // Process the transcript
      setProcessing(true);
      try {
        const result = await parseVoiceInput(
          transcript,
          {
            coffees: coffees.map((c) => ({ id: c.id, name: c.name })),
            grinders: grinders.map((g) => ({ id: g.id, name: g.name })),
            brewers: brewers.map((b) => ({ id: b.id, name: b.name })),
          },
          aiConfig
        );

        onResult(result);
        resetTranscript();

        toast({
          title: "Voice processed",
          description: "Review the parsed values below",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process voice",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleClick}
        disabled={processing}
        className={`border-purple-500/50 hover:bg-purple-500/10 ${
          isListening ? "bg-purple-500/20 animate-pulse" : ""
        }`}
        title="Voice input (AI)"
        data-voice-trigger
      >
        <div className="relative">
          {processing ? (
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
              <MicIcon className={`h-4 w-4 ${isListening ? "text-red-500" : ""}`} />
              <SparklesIcon className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
            </>
          )}
        </div>
      </Button>

      {/* Live transcript indicator */}
      {isListening && transcript && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-[200px] p-2 bg-popover border border-border rounded-md shadow-lg text-xs">
          <p className="text-muted-foreground italic truncate">{transcript}</p>
        </div>
      )}
    </div>
  );
}
