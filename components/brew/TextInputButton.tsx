"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseVoiceInput, ParseVoiceResult, AIConfig } from "@/lib/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { Coffee, Grinder, Brewer } from "@/lib/types";

// Icons
function ClipboardIcon({ className }: { className?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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

interface TextInputButtonProps {
  coffees: Coffee[];
  grinders: Grinder[];
  brewers: Brewer[];
  aiConfig?: AIConfig;
  onResult: (result: ParseVoiceResult) => void;
}

export function TextInputButton({
  coffees,
  grinders,
  brewers,
  aiConfig,
  onResult,
}: TextInputButtonProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({
        title: "No text entered",
        description: "Please paste or type your brew notes",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await parseVoiceInput(
        text,
        {
          coffees: coffees.map((c) => ({ id: c.id, name: c.name })),
          grinders: grinders.map((g) => ({ id: g.id, name: g.name })),
          brewers: brewers.map((b) => ({ id: b.id, name: b.name })),
        },
        aiConfig
      );

      onResult(result);
      setDialogOpen(false);
      setText("");

      toast({
        title: "Notes processed",
        description: "Review the parsed values below",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process notes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDialogOpen(true)}
        className="border-purple-500/50 hover:bg-purple-500/10"
        title="Paste notes (AI)"
        data-text-trigger
      >
        <div className="relative">
          <ClipboardIcon className="h-4 w-4" />
          <SparklesIcon className="absolute -top-1 -right-1 h-3 w-3 text-purple-500" />
        </div>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              Paste Brew Notes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Paste your brew notes and AI will extract the structured data. Include details like:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Coffee name, roaster, origin</li>
              <li>Grinder and grind setting</li>
              <li>Dose, water amount, temperature</li>
              <li>Brew time, technique notes</li>
              <li>Tasting notes and rating</li>
            </ul>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: Used 18g of Counter Culture Hologram on my Comandante at 24 clicks. 300g water at 205°F. Total time 3:30. Tasted sweet with notes of blueberry and chocolate. Rated 8/10."
              rows={6}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setText("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={processing || !text.trim()}>
              {processing ? (
                <span className="flex items-center gap-2">
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
                  Processing...
                </span>
              ) : (
                "Parse Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
