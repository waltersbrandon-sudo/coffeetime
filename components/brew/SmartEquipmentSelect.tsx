"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { EquipmentStats, EquipmentType } from "@/lib/types/equipmentStats";
import { EquipmentPhoto } from "@/components/equipment/EquipmentPhoto";

interface EquipmentItem {
  id: string;
  name: string;
  subtitle?: string;
  photoURL?: string | null;
}

interface SmartEquipmentSelectProps {
  items: EquipmentItem[];
  stats: EquipmentStats;
  equipmentType: EquipmentType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  showThumbnails?: boolean;
}

export function SmartEquipmentSelect({
  items,
  stats,
  equipmentType,
  value,
  onChange,
  placeholder = "Search or select...",
  loading = false,
  showThumbnails = false,
}: SmartEquipmentSelectProps) {
  // Map equipment type to photo type
  const photoType = equipmentType === "coffees" ? "coffee" : equipmentType === "grinders" ? "grinder" : "brewer";
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get selected item for display
  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === value);
  }, [items, value]);

  // Sort items into recently used and all
  const { recentlyUsed, allItems, filteredItems } = useMemo(() => {
    const equipmentStats = stats[equipmentType] || {};

    // Get items with usage stats
    const itemsWithUsage = items.map((item) => ({
      ...item,
      usage: equipmentStats[item.id] || { count: 0, lastUsed: null },
    }));

    // Recently used: items with usage, sorted by frequency (max 5)
    const recentlyUsed = itemsWithUsage
      .filter((item) => item.usage.count > 0)
      .sort((a, b) => b.usage.count - a.usage.count)
      .slice(0, 5);

    // All items: alphabetically sorted
    const allItems = [...items].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    // Filter based on search query
    const query = searchQuery.toLowerCase().trim();
    const filteredItems = query
      ? allItems.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(query))
        )
      : null;

    return { recentlyUsed, allItems, filteredItems };
  }, [items, stats, equipmentType, searchQuery]);

  // Combined list for keyboard navigation
  const navigationItems = useMemo(() => {
    if (filteredItems) {
      return filteredItems;
    }
    // When not filtering, combine recent and all (deduplicated)
    const recentIds = new Set(recentlyUsed.map((item) => item.id));
    const nonRecentItems = allItems.filter((item) => !recentIds.has(item.id));
    return [...recentlyUsed, ...nonRecentItems];
  }, [filteredItems, recentlyUsed, allItems]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [navigationItems.length, searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (itemId: string) => {
      onChange(itemId);
      setIsOpen(false);
      setSearchQuery("");
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < navigationItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (navigationItems[highlightedIndex]) {
          handleSelect(navigationItems[highlightedIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const displayValue = useMemo(() => {
    if (isOpen) {
      return searchQuery;
    }
    return selectedItem?.name || "";
  }, [isOpen, searchQuery, selectedItem]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={loading ? "Loading..." : placeholder}
        className="w-full"
      />

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-auto bg-popover border border-border rounded-md shadow-lg"
        >
          {filteredItems ? (
            // Search results
            filteredItems.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No matches found
              </div>
            ) : (
              <div className="py-1">
                {filteredItems.map((item, index) => (
                  <OptionItem
                    key={item.id}
                    item={item}
                    isHighlighted={index === highlightedIndex}
                    isSelected={item.id === value}
                    onSelect={handleSelect}
                    dataIndex={index}
                    showThumbnail={showThumbnails}
                    photoType={photoType}
                  />
                ))}
              </div>
            )
          ) : (
            // Default view with sections
            <>
              {recentlyUsed.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    Recently Used
                  </div>
                  {recentlyUsed.map((item, index) => (
                    <OptionItem
                      key={`recent-${item.id}`}
                      item={item}
                      isHighlighted={index === highlightedIndex}
                      isSelected={item.id === value}
                      onSelect={handleSelect}
                      dataIndex={index}
                      showThumbnail={showThumbnails}
                      photoType={photoType}
                    />
                  ))}
                </div>
              )}
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  All Equipment
                </div>
                {allItems.map((item, index) => {
                  const adjustedIndex = recentlyUsed.some((r) => r.id === item.id)
                    ? -1
                    : recentlyUsed.length + allItems.filter((a, i) => i < index && !recentlyUsed.some((r) => r.id === a.id)).length;

                  if (recentlyUsed.some((r) => r.id === item.id)) {
                    return null; // Skip items already in recently used
                  }

                  return (
                    <OptionItem
                      key={`all-${item.id}`}
                      item={item}
                      isHighlighted={adjustedIndex === highlightedIndex}
                      isSelected={item.id === value}
                      onSelect={handleSelect}
                      dataIndex={adjustedIndex}
                      showThumbnail={showThumbnails}
                      photoType={photoType}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface OptionItemProps {
  item: EquipmentItem;
  isHighlighted: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  dataIndex: number;
  showThumbnail?: boolean;
  photoType?: "coffee" | "grinder" | "brewer";
}

function OptionItem({
  item,
  isHighlighted,
  isSelected,
  onSelect,
  dataIndex,
  showThumbnail = false,
  photoType = "coffee",
}: OptionItemProps) {
  return (
    <button
      type="button"
      data-index={dataIndex}
      onClick={() => onSelect(item.id)}
      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
        isHighlighted
          ? "bg-accent text-accent-foreground"
          : isSelected
          ? "bg-accent/50"
          : "hover:bg-muted"
      }`}
    >
      <div className={`flex items-center gap-3 ${showThumbnail ? "" : ""}`}>
        {showThumbnail && (
          <EquipmentPhoto
            photoURL={item.photoURL}
            name={item.name}
            type={photoType}
            size="sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className={`truncate ${isHighlighted || isSelected ? "font-medium" : "text-muted-foreground"}`}>
            {item.name}
          </div>
          {item.subtitle && (
            <div className="text-xs text-muted-foreground/70 truncate">{item.subtitle}</div>
          )}
        </div>
      </div>
    </button>
  );
}
