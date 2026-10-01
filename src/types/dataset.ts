export type ColumnType = 'numerical' | 'categorical' | 'date';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  rawType: string;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
}

export interface NumericalStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  sum: number;
}

export interface CategoricalStats {
  uniqueCount: number;
  topValue: string;
  topCount: number;
  frequencies: Record<string, number>;
}

export interface DateStats {
  minDate: string;
  maxDate: string;
  daysSpan: number;
}

export interface DataQualityReport {
  score: number;
  totalMissingCells: number;
  missingByColumn: Record<string, number>;
  duplicateRows: number;
  emptyColumns: string[];
  constantColumns: string[];
  totalOutliers: number;
  outlierCounts: Record<string, number>;
  suggestions: {
    type: 'duplicates' | 'missing' | 'empty_columns' | 'constant_columns' | 'outliers';
    issue: string;
    recommendation: string;
  }[];
}

export interface AnomalyItem {
  column: string;
  count: number;
  percentage: number;
  minVal: number;
  maxVal: number;
  explanation: string;
  sampleRows: Record<string, any>[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  calculation?: string;
  data?: Record<string, any>[];
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram';
    x?: string;
    y?: string;
    names?: string;
    values?: string;
    title: string;
  };
  timestamp: string;
}

export interface DatasetState {
  name: string;
  rawRows: Record<string, any>[];
  cleanedRows?: Record<string, any>[];
  columns: string[];
  columnMeta: ColumnMeta[];
  numericalColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  numericalStats: Record<string, NumericalStats>;
  categoricalStats: Record<string, CategoricalStats>;
  dateStats: Record<string, DateStats>;
  qualityReport: DataQualityReport;
  anomalies: AnomalyItem[];
  fileSizeFormatted: string;
}
