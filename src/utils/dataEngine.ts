import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DatasetState,
  ColumnMeta,
  NumericalStats,
  CategoricalStats,
  DateStats,
  DataQualityReport,
  AnomalyItem,
} from '../types/dataset';

// Embedded sample superstore dataset for instant testing
export const SAMPLE_CSV_DATA = `Order ID,Date,Product,Category,Quantity,Unit Price,Sales,Customer,City,Region
ORD-1001,2024-01-15,MacBook Pro 16,Electronics,2,2499.00,4998.00,TechCorp Solutions,New York,East
ORD-1002,2024-01-18,Ergonomic Chair,Furniture,4,299.50,1198.00,Apex Innovations,Chicago,Central
ORD-1003,2024-01-20,Wireless Mouse,Electronics,10,29.99,299.90,Global Logistics,Seattle,West
ORD-1004,2024-01-22,Standing Desk,Furniture,1,650.00,650.00,BioHealth Inc,Boston,East
ORD-1005,2024-01-25,LaserJet Printer,Office Supplies,2,380.00,760.00,Zenith Media,Austin,South
ORD-1006,2024-01-28,Noise-Cancelling Headphones,Electronics,5,199.99,999.95,CloudNine Software,San Francisco,West
ORD-1007,2024-02-02,Mechanical Keyboard,Electronics,8,129.50,1036.00,Apex Innovations,Chicago,Central
ORD-1008,2024-02-05,Premium Notebooks (10-Pack),Office Supplies,15,19.99,299.85,TechCorp Solutions,New York,East
ORD-1009,2024-02-08,4K Ultra HD Monitor,Electronics,3,450.00,1350.00,Vanguard Partners,Denver,West
ORD-1010,2024-02-12,Filing Cabinet,Furniture,2,185.00,370.00,Horizon Energy,Houston,South
ORD-1011,2024-02-14,USB-C Hub Multiport,Electronics,12,45.00,540.00,BioHealth Inc,Boston,East
ORD-1012,2024-02-18,Executive Leather Chair,Furniture,2,499.00,998.00,Pinnacle Advisory,Atlanta,South
ORD-1013,2024-02-22,MacBook Pro 16,Electronics,1,2499.00,2499.00,Starlight Studio,Los Angeles,West
ORD-1014,2024-02-26,Ballpoint Pens (Box of 50),Office Supplies,25,12.50,312.50,Zenith Media,Austin,South
ORD-1015,2024-03-01,Standing Desk,Furniture,3,650.00,1950.00,TechCorp Solutions,New York,East
ORD-1016,2024-03-04,Smart Projector,Electronics,1,1200.00,1200.00,Global Logistics,Seattle,West
ORD-1017,2024-03-07,Wireless Mouse,Electronics,6,29.99,179.94,CloudNine Software,San Francisco,West
ORD-1018,2024-03-10,Desk Lamp LED,Furniture,8,45.00,360.00,Horizon Energy,Houston,South
ORD-1019,2024-03-12,Enterprise Server Rack,Electronics,5,9800.00,49000.00,MegaCorp Defense,Dallas,South
ORD-1020,2024-03-15,LaserJet Printer,Office Supplies,3,380.00,1140.00,Apex Innovations,Chicago,Central
ORD-1021,2024-03-18,Mechanical Keyboard,Electronics,4,129.50,518.00,Vanguard Partners,Denver,West
ORD-1022,2024-03-22,Ergonomic Chair,Furniture,5,299.50,1497.50,BioHealth Inc,,East
ORD-1023,2024-03-25,Noise-Cancelling Headphones,Electronics,3,199.99,599.97,,New York,East
ORD-1024,2024-03-28,Premium Notebooks (10-Pack),Office Supplies,,19.99,399.80,Pinnacle Advisory,Atlanta,South
ORD-1025,2024-04-02,MacBook Pro 16,Electronics,3,2499.00,7497.00,CloudNine Software,San Francisco,West
ORD-1026,2024-04-05,USB-C Hub Multiport,Electronics,20,45.00,900.00,Apex Innovations,Chicago,Central
ORD-1027,2024-04-08,Filing Cabinet,Furniture,4,185.00,740.00,TechCorp Solutions,New York,East
ORD-1028,2024-04-12,4K Ultra HD Monitor,Electronics,6,450.00,2700.00,Global Logistics,Seattle,West
ORD-1029,2024-04-15,Ballpoint Pens (Box of 50),Office Supplies,30,12.50,375.00,Horizon Energy,Houston,South
ORD-1030,2024-04-18,Executive Leather Chair,Furniture,1,499.00,499.00,Zenith Media,Austin,South
ORD-1031,2024-04-21,Desk Lamp LED,Furniture,5,45.00,225.00,Vanguard Partners,Denver,West
ORD-1032,2024-04-25,Smart Projector,Electronics,2,1200.00,2400.00,Starlight Studio,Los Angeles,West
ORD-1033,2024-04-28,Standing Desk,Furniture,2,650.00,1300.00,BioHealth Inc,Boston,East
ORD-1034,2024-05-02,MacBook Pro 16,Electronics,4,2499.00,9996.00,MegaCorp Defense,Dallas,South
ORD-1035,2024-05-05,Wireless Mouse,Electronics,15,29.99,449.85,Pinnacle Advisory,Atlanta,South
ORD-1036,2024-05-08,LaserJet Printer,Office Supplies,1,380.00,380.00,CloudNine Software,San Francisco,West
ORD-1037,2024-05-12,Ergonomic Chair,Furniture,6,299.50,1797.00,Apex Innovations,Chicago,Central
ORD-1038,2024-05-15,Mechanical Keyboard,Electronics,10,129.50,1295.00,TechCorp Solutions,New York,East
ORD-1039,2024-05-18,Noise-Cancelling Headphones,Electronics,4,199.99,799.96,Global Logistics,Seattle,West
ORD-1040,2024-05-22,Filing Cabinet,Furniture,3,185.00,555.00,Zenith Media,Austin,South
ORD-1041,2024-05-25,4K Ultra HD Monitor,Electronics,5,450.00,2250.00,BioHealth Inc,Boston,East
ORD-1042,2024-05-28,Standing Desk,Furniture,4,650.00,2600.00,Horizon Energy,Houston,South
ORD-1043,2024-06-02,USB-C Hub Multiport,Electronics,18,45.00,810.00,Starlight Studio,Los Angeles,West
ORD-1044,2024-06-05,Premium Notebooks (10-Pack),Office Supplies,20,19.99,399.80,Vanguard Partners,Denver,West
ORD-1045,2024-06-08,Executive Leather Chair,Furniture,3,499.00,1497.00,MegaCorp Defense,Dallas,South
ORD-1046,2024-06-12,Desk Lamp LED,Furniture,7,45.00,315.00,Pinnacle Advisory,Atlanta,South
ORD-1047,2024-06-15,MacBook Pro 16,Electronics,2,2499.00,4998.00,Apex Innovations,Chicago,Central
ORD-1048,2024-06-18,Smart Projector,Electronics,1,1200.00,1200.00,CloudNine Software,San Francisco,West
ORD-1049,2024-06-22,Wireless Mouse,Electronics,8,29.99,239.92,TechCorp Solutions,New York,East
ORD-1050,2024-06-25,Ballpoint Pens (Box of 50),Office Supplies,40,12.50,500.00,Global Logistics,Seattle,West
ORD-1015,2024-03-01,Standing Desk,Furniture,3,650.00,1950.00,TechCorp Solutions,New York,East
ORD-1035,2024-05-05,Wireless Mouse,Electronics,15,29.99,449.85,Pinnacle Advisory,Atlanta,South`;

export function parseCSVString(csvText: string, filename: string): DatasetState {
  const result = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return buildDatasetState(result.data, filename, csvText.length);
}

export async function parseFile(file: File): Promise<DatasetState> {
  const name = file.name;
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
    return buildDatasetState(rawData, name, file.size);
  } else {
    const text = await file.text();
    return parseCSVString(text, name);
  }
}

export function buildDatasetState(rows: Record<string, any>[], name: string, byteSize: number): DatasetState {
  if (!rows || rows.length === 0) {
    throw new Error('The uploaded dataset has no rows.');
  }

  const columns = Object.keys(rows[0]);
  const numericalColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const dateColumns: string[] = [];
  const columnMeta: ColumnMeta[] = [];

  const numericalStats: Record<string, NumericalStats> = {};
  const categoricalStats: Record<string, CategoricalStats> = {};
  const dateStats: Record<string, DateStats> = {};

  // Inspect each column
  columns.forEach((col) => {
    let nullCount = 0;
    const values: any[] = [];
    const nonNullValues: any[] = [];

    rows.forEach((r) => {
      const val = r[col];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        values.push(val);
        nonNullValues.push(val);
      }
    });

    // Detect type
    let numCount = 0;
    let dateCount = 0;

    const sample = nonNullValues.slice(0, 30);
    sample.forEach((val) => {
      if (typeof val === 'number') {
        numCount++;
      } else if (typeof val === 'string') {
        // check if number string
        const parsedNum = Number(val);
        if (!isNaN(parsedNum) && val.trim() !== '') {
          numCount++;
        } else {
          // check if date
          const parsedDate = Date.parse(val);
          if (!isNaN(parsedDate) && (val.includes('-') || val.includes('/') || val.includes(':'))) {
            dateCount++;
          }
        }
      }
    });

    const isNumeric = sample.length > 0 && numCount / sample.length > 0.7;
    const isDate = !isNumeric && sample.length > 0 && dateCount / sample.length > 0.7;

    const colType = isNumeric ? 'numerical' : isDate ? 'date' : 'categorical';

    if (colType === 'numerical') {
      numericalColumns.push(col);
      // compute stats
      const nums = nonNullValues.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        const sum = nums.reduce((acc, curr) => acc + curr, 0);
        const min = nums[0];
        const max = nums[nums.length - 1];
        const mean = sum / nums.length;
        const mid = Math.floor(nums.length / 2);
        const median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
        const variance = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (nums.length > 1 ? nums.length - 1 : 1);
        const std = Math.sqrt(variance);

        numericalStats[col] = {
          count: nums.length,
          min,
          max,
          mean,
          median,
          std,
          sum,
        };
      }
    } else if (colType === 'date') {
      dateColumns.push(col);
      const parsedDates = nonNullValues.map((v) => new Date(v).getTime()).filter((t) => !isNaN(t));
      if (parsedDates.length > 0) {
        parsedDates.sort((a, b) => a - b);
        const minD = new Date(parsedDates[0]);
        const maxD = new Date(parsedDates[parsedDates.length - 1]);
        const diffDays = Math.round((maxD.getTime() - minD.getTime()) / (1000 * 3600 * 24));
        dateStats[col] = {
          minDate: minD.toISOString().split('T')[0],
          maxDate: maxD.toISOString().split('T')[0],
          daysSpan: diffDays,
        };
      }
    } else {
      categoricalColumns.push(col);
      const freqs: Record<string, number> = {};
      nonNullValues.forEach((v) => {
        const s = String(v);
        freqs[s] = (freqs[s] || 0) + 1;
      });

      let topVal = 'N/A';
      let topCount = 0;
      Object.entries(freqs).forEach(([k, count]) => {
        if (count > topCount) {
          topCount = count;
          topVal = k;
        }
      });

      categoricalStats[col] = {
        uniqueCount: Object.keys(freqs).length,
        topValue: topVal,
        topCount,
        frequencies: freqs,
      };
    }

    const uniqueVals = new Set(nonNullValues);
    columnMeta.push({
      name: col,
      type: colType,
      rawType: typeof nonNullValues[0] || 'unknown',
      nullCount,
      nullPercentage: (nullCount / rows.length) * 100,
      uniqueCount: uniqueVals.size,
      sampleValues: nonNullValues.slice(0, 5),
    });
  });

  // Calculate Data Quality & Anomalies
  const qualityReport = evaluateQuality(rows, columns, numericalColumns, columnMeta);
  const anomalies = detectOutliers(rows, numericalColumns);

  const formattedSize =
    byteSize > 1024 * 1024
      ? `${(byteSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(byteSize / 1024).toFixed(1)} KB`;

  return {
    name,
    rawRows: rows,
    columns,
    columnMeta,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    numericalStats,
    categoricalStats,
    dateStats,
    qualityReport,
    anomalies,
    fileSizeFormatted: formattedSize,
  };
}

function evaluateQuality(
  rows: Record<string, any>[],
  columns: string[],
  numericalColumns: string[],
  columnMeta: ColumnMeta[]
): DataQualityReport {
  const totalCells = rows.length * columns.length;
  let totalMissingCells = 0;
  const missingByColumn: Record<string, number> = {};

  columnMeta.forEach((cm) => {
    if (cm.nullCount > 0) {
      missingByColumn[cm.name] = cm.nullCount;
      totalMissingCells += cm.nullCount;
    }
  });

  // Duplicate rows detection
  const rowSignatures = new Set<string>();
  let duplicateRows = 0;
  rows.forEach((r) => {
    const sig = JSON.stringify(r);
    if (rowSignatures.has(sig)) {
      duplicateRows++;
    } else {
      rowSignatures.add(sig);
    }
  });

  // Empty columns
  const emptyColumns = columnMeta.filter((cm) => cm.nullCount === rows.length).map((cm) => cm.name);

  // Constant columns
  const constantColumns = columnMeta
    .filter((cm) => cm.uniqueCount <= 1 && cm.nullCount < rows.length)
    .map((cm) => cm.name);

  // Outliers
  const outlierCounts: Record<string, number> = {};
  let totalOutliers = 0;

  numericalColumns.forEach((col) => {
    const nums = rows
      .map((r) => Number(r[col]))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    if (nums.length >= 4) {
      const q1 = nums[Math.floor(nums.length * 0.25)];
      const q3 = nums[Math.floor(nums.length * 0.75)];
      const iqr = q3 - q1;
      if (iqr > 0) {
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        const count = nums.filter((n) => n < lower || n > upper).length;
        if (count > 0) {
          outlierCounts[col] = count;
          totalOutliers += count;
        }
      }
    }
  });

  // Calculate Quality Score (100 base)
  let score = 100;
  if (totalCells > 0) {
    const missingRatio = totalMissingCells / totalCells;
    score -= Math.min(30, missingRatio * 150);
  }
  if (rows.length > 0) {
    const dupRatio = duplicateRows / rows.length;
    score -= Math.min(25, dupRatio * 100);
  }
  score -= emptyColumns.length * 10;
  score -= constantColumns.length * 5;
  score -= Math.min(15, (totalOutliers / (rows.length || 1)) * 50);

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Recommendations
  const suggestions: DataQualityReport['suggestions'] = [];
  if (duplicateRows > 0) {
    suggestions.push({
      type: 'duplicates',
      issue: `${duplicateRows} duplicate rows detected in dataset`,
      recommendation: 'De-duplicate records to eliminate double-counted sales or entries.',
    });
  }
  if (Object.keys(missingByColumn).length > 0) {
    Object.entries(missingByColumn).forEach(([col, count]) => {
      suggestions.push({
        type: 'missing',
        issue: `Column '${col}' contains ${count} null or missing entries`,
        recommendation: `Impute missing values using column median/mode or drop incomplete rows.`,
      });
    });
  }
  if (emptyColumns.length > 0) {
    suggestions.push({
      type: 'empty_columns',
      issue: `${emptyColumns.length} completely empty columns: ${emptyColumns.join(', ')}`,
      recommendation: 'Drop empty columns to streamline database schema.',
    });
  }
  if (constantColumns.length > 0) {
    suggestions.push({
      type: 'constant_columns',
      issue: `${constantColumns.length} constant zero-variance columns: ${constantColumns.join(', ')}`,
      recommendation: 'Remove unvarying columns as they contribute no analytical signal.',
    });
  }
  if (totalOutliers > 0) {
    suggestions.push({
      type: 'outliers',
      issue: `${totalOutliers} extreme statistical outliers detected across ${Object.keys(outlierCounts).length} numerical columns`,
      recommendation: 'Audit outlier rows to confirm if they represent high-value enterprise transactions or data entry anomalies.',
    });
  }

  return {
    score: finalScore,
    totalMissingCells,
    missingByColumn,
    duplicateRows,
    emptyColumns,
    constantColumns,
    totalOutliers,
    outlierCounts,
    suggestions,
  };
}

export function detectOutliers(
  rows: Record<string, any>[],
  numericalColumns: string[],
  method: 'iqr' | 'zscore' = 'iqr'
): AnomalyItem[] {
  const anomalies: AnomalyItem[] = [];

  numericalColumns.forEach((col) => {
    const numsWithIdx = rows
      .map((r, idx) => ({ val: Number(r[col]), idx, row: r }))
      .filter((item) => !isNaN(item.val));

    if (numsWithIdx.length < 5) return;

    let flagged: typeof numsWithIdx = [];
    let explanation = '';

    if (method === 'iqr') {
      const sortedVals = [...numsWithIdx].map((item) => item.val).sort((a, b) => a - b);
      const q1 = sortedVals[Math.floor(sortedVals.length * 0.25)];
      const q3 = sortedVals[Math.floor(sortedVals.length * 0.75)];
      const iqr = q3 - q1;
      if (iqr <= 0) return;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      flagged = numsWithIdx.filter((item) => item.val < lower || item.val > upper);
      explanation = `Tukey 1.5x IQR rule: Q1=${q1.toFixed(2)}, Q3=${q3.toFixed(2)}, IQR=${iqr.toFixed(2)}. Flagged outside [${lower.toFixed(2)}, ${upper.toFixed(2)}].`;
    } else {
      const sum = numsWithIdx.reduce((acc, curr) => acc + curr.val, 0);
      const mean = sum / numsWithIdx.length;
      const variance =
        numsWithIdx.reduce((acc, curr) => acc + Math.pow(curr.val - mean, 2), 0) / (numsWithIdx.length - 1);
      const std = Math.sqrt(variance);
      if (std <= 0) return;
      flagged = numsWithIdx.filter((item) => Math.abs((item.val - mean) / std) > 3.0);
      explanation = `Z-score rule: Mean=${mean.toFixed(2)}, Std=${std.toFixed(2)}. Flagged values exceeding 3.0 standard deviations.`;
    }

    if (flagged.length > 0) {
      const vals = flagged.map((f) => f.val);
      anomalies.push({
        column: col,
        count: flagged.length,
        percentage: Number(((flagged.length / numsWithIdx.length) * 100).toFixed(1)),
        minVal: Math.min(...vals),
        maxVal: Math.max(...vals),
        explanation,
        sampleRows: flagged.slice(0, 5).map((f) => f.row),
      });
    }
  });

  return anomalies;
}

export function createCleanedDataset(
  rows: Record<string, any>[],
  options: {
    dropDuplicates: boolean;
    fillMissing: 'median' | 'drop' | 'none';
    numericalColumns: string[];
    categoricalColumns: string[];
    numericalStats: Record<string, NumericalStats>;
    categoricalStats: Record<string, CategoricalStats>;
  }
): Record<string, any>[] {
  let cleaned = [...rows];

  // 1. Drop duplicates
  if (options.dropDuplicates) {
    const seen = new Set<string>();
    cleaned = cleaned.filter((row) => {
      const sig = JSON.stringify(row);
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  // 2. Handle missing
  if (options.fillMissing === 'drop') {
    cleaned = cleaned.filter((row) => {
      return Object.values(row).every((v) => v !== null && v !== undefined && v !== '');
    });
  } else if (options.fillMissing === 'median') {
    cleaned = cleaned.map((row) => {
      const newRow = { ...row };
      options.numericalColumns.forEach((col) => {
        if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
          newRow[col] = options.numericalStats[col]?.median ?? 0;
        }
      });
      options.categoricalColumns.forEach((col) => {
        if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
          newRow[col] = options.categoricalStats[col]?.topValue ?? 'Unknown';
        }
      });
      return newRow;
    });
  }

  return cleaned;
}

export function executeAggregation(
  rows: Record<string, any>[],
  metricCol: string,
  dimensionCol: string | null,
  aggType: 'sum' | 'mean' | 'count' | 'min' | 'max',
  filterText?: string
): Record<string, any>[] {
  let filtered = [...rows];

  // Simple filter
  if (filterText && filterText.trim()) {
    try {
      const term = filterText.toLowerCase();
      filtered = filtered.filter((r) => {
        return Object.values(r).some((v) => String(v).toLowerCase().includes(term));
      });
    } catch {
      // ignore
    }
  }

  if (dimensionCol) {
    const groups: Record<string, number[]> = {};
    filtered.forEach((r) => {
      const key = String(r[dimensionCol] ?? 'Unassigned');
      const val = Number(r[metricCol]);
      if (!isNaN(val)) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(val);
      }
    });

    const result = Object.entries(groups).map(([dim, vals]) => {
      let aggregatedVal = 0;
      if (aggType === 'sum') {
        aggregatedVal = vals.reduce((a, b) => a + b, 0);
      } else if (aggType === 'mean') {
        aggregatedVal = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else if (aggType === 'count') {
        aggregatedVal = vals.length;
      } else if (aggType === 'min') {
        aggregatedVal = Math.min(...vals);
      } else if (aggType === 'max') {
        aggregatedVal = Math.max(...vals);
      }

      return {
        [dimensionCol]: dim,
        [metricCol]: Number(aggregatedVal.toFixed(2)),
      };
    });

    return result.sort((a, b) => Number(b[metricCol]) - Number(a[metricCol]));
  } else {
    const vals = filtered.map((r) => Number(r[metricCol])).filter((n) => !isNaN(n));
    let finalVal = 0;
    if (aggType === 'sum') finalVal = vals.reduce((a, b) => a + b, 0);
    else if (aggType === 'mean') finalVal = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    else if (aggType === 'count') finalVal = vals.length;
    else if (aggType === 'min') finalVal = Math.min(...vals);
    else if (aggType === 'max') finalVal = Math.max(...vals);

    return [
      {
        Metric: `${aggType.toUpperCase()} of ${metricCol}`,
        Value: Number(finalVal.toFixed(2)),
      },
    ];
  }
}
