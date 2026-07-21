export interface ScanResult {
  action: string;
  message: string;
  data?: Record<string, unknown>;
  confidence?: string;
}
