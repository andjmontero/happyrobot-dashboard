export interface OutcomeCount {
  outcome: string;
  _count: number;
}

export interface SentimentCount {
  sentiment: string;
  _count: number;
}

export interface CallRecord {
  id: number;
  call_id: string | null;
  mc_number: string | null;
  carrier_name: string | null;
  load_id: string | null;
  loadboard_rate: number | null;
  final_agreed_rate: number | null;
  num_negotiations: number;
  outcome: string | null;
  sentiment: string | null;
  call_duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface MetricsSummary {
  totalCalls: number;
  bookedCalls: number;
  conversionRate: string;
  avgFinalRate: number | null;
  avgNegotiations: number | null;
  outcomeBreakdown: OutcomeCount[];
  sentimentBreakdown: SentimentCount[];
  recentCalls: CallRecord[];
  avgCallDuration: number | null;
}
