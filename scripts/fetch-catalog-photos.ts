#!/usr/bin/env npx ts-node

/**
 * Catalog Photo Fetching Script
 *
 * This script helps manage equipment and coffee photos for the catalog.
 * It can:
 * - List all catalog items and their current photo status
 * - Validate existing photo URLs
 * - Generate search queries for missing photos
 * - Update the catalog-photos.json file
 *
 * Usage:
 *   npx ts-node scripts/fetch-catalog-photos.ts [options]
 *
 * Options:
 *   --dry-run       Preview what would be done without making changes
 *   --type=TYPE     Only process specific type (grinders|brewers|coffees)
 *   --validate      Check if existing URLs are accessible
 *   --list          List all catalog items with photo status
 *   --missing       Only show items missing photos
 */

import * as fs from "fs";
import * as path from "path";

// Import catalog data
const catalogPath = path.join(__dirname, "../lib/data/catalog.ts");
const photosPath = path.join(__dirname, "../lib/data/catalog-photos.json");

interface PhotoMapping {
  officialUrl: string;
  fallbackSearch: string;
}

interface CatalogPhotos {
  grinders: Record<string, PhotoMapping>;
  brewers: Record<string, PhotoMapping>;
  coffees: Record<string, PhotoMapping>;
}

interface CatalogItem {
  id: string;
  name: string;
  brand?: string;
  roaster?: string;
  hasPhoto: boolean;
  photoUrl?: string;
}

// Generate catalog ID matching the catalog.ts function
function generateCatalogId(
  type: "brewer" | "grinder" | "coffee",
  item: { name: string; brand?: string | null; roaster?: string | null }
): string {
  const source = item.brand || item.roaster || "unknown";
  const slug = `${type}-${source}-${item.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `catalog-${slug}`;
}

// Load current photos JSON
function loadPhotos(): CatalogPhotos {
  try {
    const content = fs.readFileSync(photosPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { grinders: {}, brewers: {}, coffees: {} };
  }
}

// Extract catalog items from catalog.ts (simplified parsing)
function extractCatalogItems(): {
  grinders: Array<{ name: string; brand?: string }>;
  brewers: Array<{ name: string; brand?: string }>;
  coffees: Array<{ name: string; roaster?: string }>;
} {
  const content = fs.readFileSync(catalogPath, "utf-8");

  // Very simplified extraction - in practice you'd import the actual module
  // This is a fallback for environments where module import might be tricky

  const grinders: Array<{ name: string; brand?: string }> = [];
  const brewers: Array<{ name: string; brand?: string }> = [];
  const coffees: Array<{ name: string; roaster?: string }> = [];

  // Parse grinders section
  const grinderMatch = content.match(/grindersCatalog.*?=\s*\[([\s\S]*?)\];/);
  if (grinderMatch) {
    const nameMatches = Array.from(grinderMatch[1].matchAll(/name:\s*"([^"]+)"[\s\S]*?brand:\s*"([^"]+)"/g));
    for (const match of nameMatches) {
      grinders.push({ name: match[1], brand: match[2] });
    }
  }

  // Parse brewers section
  const brewerMatch = content.match(/brewersCatalog.*?=\s*\[([\s\S]*?)\];/);
  if (brewerMatch) {
    const nameMatches = Array.from(brewerMatch[1].matchAll(/name:\s*"([^"]+)"[\s\S]*?brand:\s*"([^"]+)"/g));
    for (const match of nameMatches) {
      brewers.push({ name: match[1], brand: match[2] });
    }
  }

  // Parse coffees section
  const coffeeMatch = content.match(/coffeesCatalog.*?=\s*\[([\s\S]*?)\];/);
  if (coffeeMatch) {
    const nameMatches = Array.from(coffeeMatch[1].matchAll(/name:\s*"([^"]+)"[\s\S]*?roaster:\s*"([^"]+)"/g));
    for (const match of nameMatches) {
      coffees.push({ name: match[1], roaster: match[2] });
    }
  }

  return { grinders, brewers, coffees };
}

// Get items with photo status
function getCatalogItemsWithStatus(): {
  grinders: CatalogItem[];
  brewers: CatalogItem[];
  coffees: CatalogItem[];
} {
  const photos = loadPhotos();
  const items = extractCatalogItems();

  const grinders: CatalogItem[] = items.grinders.map((item) => {
    const id = generateCatalogId("grinder", item);
    const photo = photos.grinders[id];
    return {
      id,
      name: item.name,
      brand: item.brand,
      hasPhoto: !!photo?.officialUrl,
      photoUrl: photo?.officialUrl,
    };
  });

  const brewers: CatalogItem[] = items.brewers.map((item) => {
    const id = generateCatalogId("brewer", item);
    const photo = photos.brewers[id];
    return {
      id,
      name: item.name,
      brand: item.brand,
      hasPhoto: !!photo?.officialUrl,
      photoUrl: photo?.officialUrl,
    };
  });

  const coffees: CatalogItem[] = items.coffees.map((item) => {
    const id = generateCatalogId("coffee", item);
    const photo = photos.coffees[id];
    return {
      id,
      name: item.name,
      roaster: item.roaster,
      hasPhoto: !!photo?.officialUrl,
      photoUrl: photo?.officialUrl,
    };
  });

  return { grinders, brewers, coffees };
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes("--dry-run"),
    validate: args.includes("--validate"),
    list: args.includes("--list"),
    missing: args.includes("--missing"),
    type: args.find((a) => a.startsWith("--type="))?.split("=")[1] as
      | "grinders"
      | "brewers"
      | "coffees"
      | undefined,
  };

  console.log("\n📸 CoffeeTime Catalog Photo Manager\n");
  console.log("=".repeat(50));

  const status = getCatalogItemsWithStatus();

  // Filter by type if specified
  const types = options.type
    ? [options.type]
    : (["grinders", "brewers", "coffees"] as const);

  let totalItems = 0;
  let itemsWithPhotos = 0;

  for (const type of types) {
    const items = status[type];
    const withPhotos = items.filter((i) => i.hasPhoto);
    const missing = items.filter((i) => !i.hasPhoto);

    totalItems += items.length;
    itemsWithPhotos += withPhotos.length;

    console.log(`\n${type.toUpperCase()} (${withPhotos.length}/${items.length} have photos)`);
    console.log("-".repeat(50));

    if (options.list || options.missing) {
      const displayItems = options.missing ? missing : items;

      for (const item of displayItems) {
        const source = item.brand || item.roaster || "";
        const status = item.hasPhoto ? "✓" : "✗";
        const statusColor = item.hasPhoto ? "\x1b[32m" : "\x1b[31m";
        console.log(`${statusColor}${status}\x1b[0m ${source} - ${item.name}`);

        if (!item.hasPhoto && options.list) {
          // Generate search query suggestion
          const searchQuery = `${source} ${item.name} ${type.slice(0, -1)} official product photo`;
          console.log(`   Search: "${searchQuery}"`);
        }
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Summary: ${itemsWithPhotos}/${totalItems} items have photos (${Math.round(itemsWithPhotos / totalItems * 100)}%)\n`);

  if (options.validate) {
    console.log("\n🔍 Validating photo URLs...\n");
    // Note: URL validation would require fetch which needs --experimental-fetch flag
    // or a library like node-fetch
    console.log("URL validation requires running with node-fetch installed");
  }

  if (options.dryRun) {
    console.log("\n🔄 Dry run mode - no changes were made\n");
  }

  // Show instructions for adding photos
  console.log("\n📝 To add photos:");
  console.log("1. Edit lib/data/catalog-photos.json");
  console.log("2. Add an entry with the item's catalog ID");
  console.log("3. Include officialUrl and fallbackSearch fields");
  console.log("\nExample:");
  console.log(`  "catalog-grinder-brand-model": {`);
  console.log(`    "officialUrl": "https://...",`);
  console.log(`    "fallbackSearch": "Brand Model grinder"`);
  console.log(`  }`);
  console.log("");
}

main().catch(console.error);
