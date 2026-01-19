"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { generateProductThumbnail } from "@/lib/services/aiService";
import { uploadThumbnailFromBase64 } from "@/lib/services/storageService";
import { updateCoffee } from "@/lib/services/coffeeService";
import { updateGrinder } from "@/lib/services/grinderService";
import { updateBrewer } from "@/lib/services/brewerService";
import { Coffee, Grinder, Brewer } from "@/lib/types";

type ItemType = "coffee" | "grinder" | "brewer";
type EquipmentItem = Coffee | Grinder | Brewer;

interface UseThumbnailGenerationResult {
  isGenerating: boolean;
  error: string | null;
  generateThumbnail: (
    item: EquipmentItem,
    type: ItemType
  ) => Promise<string | null>;
  regenerateThumbnail: (
    item: EquipmentItem,
    type: ItemType
  ) => Promise<string | null>;
  clearError: () => void;
}

/**
 * Get additional context for the AI prompt based on item type
 */
function getItemContext(item: EquipmentItem, type: ItemType) {
  if (type === "coffee") {
    const coffee = item as Coffee;
    return {
      brand: coffee.roaster || undefined,
      description: [
        coffee.origin,
        coffee.roastLevel,
        coffee.flavorNotes?.join(", "),
      ]
        .filter(Boolean)
        .join(", ") || undefined,
    };
  }

  if (type === "grinder") {
    const grinder = item as Grinder;
    return {
      brand: grinder.brand || undefined,
      model: grinder.model || undefined,
      description: [grinder.type, grinder.burrType]
        .filter(Boolean)
        .join(", ") || undefined,
    };
  }

  if (type === "brewer") {
    const brewer = item as Brewer;
    return {
      brand: brewer.brand || undefined,
      description: [brewer.type, brewer.material]
        .filter(Boolean)
        .join(", ") || undefined,
    };
  }

  return {};
}

/**
 * Update the item's thumbnailURL in Firestore
 */
async function updateItemThumbnailURL(
  userId: string,
  itemId: string,
  type: ItemType,
  thumbnailURL: string
): Promise<void> {
  switch (type) {
    case "coffee":
      await updateCoffee(userId, itemId, { thumbnailURL });
      break;
    case "grinder":
      await updateGrinder(userId, itemId, { thumbnailURL });
      break;
    case "brewer":
      await updateBrewer(userId, itemId, { thumbnailURL });
      break;
  }
}

export function useThumbnailGeneration(): UseThumbnailGenerationResult {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateThumbnail = useCallback(
    async (
      item: EquipmentItem,
      type: ItemType
    ): Promise<string | null> => {
      if (!user) {
        setError("You must be signed in to generate thumbnails");
        return null;
      }

      // Don't regenerate if already has a thumbnail
      if (item.thumbnailURL) {
        return item.thumbnailURL;
      }

      setIsGenerating(true);
      setError(null);

      try {
        // Get context for the AI prompt
        const context = getItemContext(item, type);

        // Generate the image using AI
        const result = await generateProductThumbnail(
          item.name,
          type,
          user.uid,
          context
        );

        // Upload to Firebase Storage
        const thumbnailURL = await uploadThumbnailFromBase64(
          user.uid,
          type,
          item.id,
          result.imageBase64,
          result.mimeType
        );

        // Update the item in Firestore
        await updateItemThumbnailURL(user.uid, item.id, type, thumbnailURL);

        return thumbnailURL;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate thumbnail";
        setError(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [user]
  );

  const regenerateThumbnail = useCallback(
    async (
      item: EquipmentItem,
      type: ItemType
    ): Promise<string | null> => {
      if (!user) {
        setError("You must be signed in to generate thumbnails");
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        // Get context for the AI prompt
        const context = getItemContext(item, type);

        // Generate a new image using AI
        const result = await generateProductThumbnail(
          item.name,
          type,
          user.uid,
          context
        );

        // Upload to Firebase Storage (overwrites existing)
        const thumbnailURL = await uploadThumbnailFromBase64(
          user.uid,
          type,
          item.id,
          result.imageBase64,
          result.mimeType
        );

        // Update the item in Firestore
        await updateItemThumbnailURL(user.uid, item.id, type, thumbnailURL);

        return thumbnailURL;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to regenerate thumbnail";
        setError(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [user]
  );

  return {
    isGenerating,
    error,
    generateThumbnail,
    regenerateThumbnail,
    clearError,
  };
}
