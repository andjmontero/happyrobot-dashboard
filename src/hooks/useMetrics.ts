import { useState, useEffect, useCallback } from "react";
import { MetricsSummary } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

export function useMetrics() {
  const [data, setData] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/metrics/summary`, {
        headers: { "x-api-key": API_KEY },
      });
      console.log("Status:", res.status);
      console.log(data);
      const text = await res.text();
      console.log("Response:", text.slice(0, 200));
      const json: MetricsSummary = JSON.parse(text);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
