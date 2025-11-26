/**
 * Utility functions for calculating and managing custom column widths
 */

/**
 * Calculates proportional widths for columns when one column width is changed
 * @param currentWidths - Current widths of all columns (as percentages)
 * @param changedIndex - Index of the column that was changed
 * @param newWidth - New width (as percentage) for the changed column
 * @returns Array of adjusted widths that sum to 100%
 */
export function calculateProportionalWidths(
  currentWidths: number[],
  changedIndex: number,
  newWidth: number
): number[] {
  // Clamp newWidth between 0 and 100
  const clampedWidth = Math.max(0, Math.min(100, newWidth));
  
  // Calculate remaining width
  const remaining = 100 - clampedWidth;
  
  // Get other columns (excluding the changed one)
  const otherColumns = currentWidths.filter((_, index) => index !== changedIndex);
  
  // If no other columns, return just the changed width
  if (otherColumns.length === 0) {
    return [clampedWidth];
  }
  
  // Calculate total of other columns
  const totalOther = otherColumns.reduce((sum, width) => sum + width, 0);
  
  // If totalOther is 0 or negative, distribute remaining equally
  if (totalOther <= 0) {
    const equalWidth = remaining / otherColumns.length;
    const result = [...currentWidths];
    result[changedIndex] = clampedWidth;
    let otherIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (i !== changedIndex) {
        result[i] = equalWidth;
        otherIndex++;
      }
    }
    return normalizeWidths(result);
  }
  
  // Calculate scale factor to proportionally adjust other columns
  const scaleFactor = remaining / totalOther;
  
  // Apply proportional adjustment
  const result = [...currentWidths];
  result[changedIndex] = clampedWidth;
  let otherIndex = 0;
  for (let i = 0; i < result.length; i++) {
    if (i !== changedIndex) {
      result[i] = currentWidths[i] * scaleFactor;
      otherIndex++;
    }
  }
  
  // Normalize to ensure sum is exactly 100%
  return normalizeWidths(result);
}

/**
 * Normalizes an array of widths to ensure they sum to exactly 100%
 * Distributes any rounding errors to the largest column
 */
export function normalizeWidths(widths: number[]): number[] {
  if (widths.length === 0) return [];
  
  // Round to 2 decimal places
  const rounded = widths.map(w => Math.round(w * 100) / 100);
  
  // Calculate sum
  const sum = rounded.reduce((s, w) => s + w, 0);
  
  // Calculate difference
  const diff = 100 - sum;
  
  // If difference is very small, we're good
  if (Math.abs(diff) < 0.01) {
    return rounded;
  }
  
  // Find index of largest column
  const maxIndex = rounded.reduce((maxIdx, w, idx) => 
    w > rounded[maxIdx] ? idx : maxIdx, 0
  );
  
  // Add difference to largest column
  const normalized = [...rounded];
  normalized[maxIndex] = Math.round((normalized[maxIndex] + diff) * 100) / 100;
  
  return normalized;
}

/**
 * Converts column layout fractions to percentages
 * @param fractions - Array of fractions from COLUMN_LAYOUTS (e.g., [6, 6] for 50/50)
 * @returns Array of percentages (e.g., [50, 50])
 */
export function fractionsToPercentages(fractions: number[]): number[] {
  const total = fractions.reduce((sum, f) => sum + f, 0);
  if (total === 0) return fractions.map(() => 0);
  
  return fractions.map(f => Math.round((f / total) * 100 * 100) / 100);
}

/**
 * Converts percentages to CSS Grid fractions
 * @param percentages - Array of percentages (e.g., [40, 60])
 * @returns CSS Grid template string (e.g., "40fr 60fr")
 */
export function percentagesToGridTemplate(percentages: number[]): string {
  return percentages.map(p => `${p}fr`).join(' ');
}

/**
 * Gets the current column widths for a device, falling back to default layout if no custom widths
 */
export function getColumnWidthsForDevice(
  row: { columnLayout: string; customColumnWidths?: { desktop?: number[]; tablet?: number[]; mobile?: number[] } },
  deviceType: 'desktop' | 'tablet' | 'mobile',
  defaultLayouts: Record<string, number[]>
): number[] {
  // Check for custom widths for this device
  const customWidths = row.customColumnWidths?.[deviceType];
  if (customWidths && customWidths.length > 0) {
    return normalizeWidths(customWidths);
  }
  
  // Fallback to desktop custom widths if on tablet/mobile
  if (deviceType === 'tablet' || deviceType === 'mobile') {
    const desktopCustom = row.customColumnWidths?.desktop;
    if (desktopCustom && desktopCustom.length > 0) {
      return normalizeWidths(desktopCustom);
    }
  }
  
  // Fallback to default layout
  const defaultFractions = defaultLayouts[row.columnLayout];
  if (defaultFractions) {
    return fractionsToPercentages(defaultFractions);
  }
  
  // Last resort: equal distribution
  const columnCount = row.customColumnWidths?.desktop?.length || 
                     defaultFractions?.length || 
                     1;
  return new Array(columnCount).fill(100 / columnCount);
}

