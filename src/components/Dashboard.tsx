import { useState, useMemo } from "react";
import { useMetrics } from "../hooks/useMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import OutcomeChart from "./OutcomeChart.tsx";
import SentimentChart from "./SentimentChart.tsx";
import VolumeChart from "./VolumeChart.tsx";

const outcomeVariant: Record<string, string> = {
  booked: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  no_load: "bg-amber-100 text-amber-800",
  ineligible: "bg-slate-100 text-slate-600",
  abandoned: "bg-pink-100 text-pink-800",
};

const sentimentVariant: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-slate-100 text-slate-600",
  negative: "bg-red-100 text-red-800",
};

function fmt(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// today's date as yyyy-mm-dd for the max attribute on date inputs
const todayStr = new Date().toISOString().split("T")[0];

export default function Dashboard() {
  const { data, loading, error, refetch } = useMetrics();

  // "preset" drives the dropdown; null means custom range is active
  const [preset, setPreset] = useState<number | "custom" | "all">(30);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Table filters
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  // Derive the actual cutoff window from whichever mode is active
  const { cutoffFrom, cutoffTo, rangeLabel } = useMemo(() => {
    if (preset === "all") {
      return { cutoffFrom: null, cutoffTo: null, rangeLabel: "All time" };
    }
    if (preset !== "custom") {
      const from = new Date();
      from.setDate(from.getDate() - preset);
      return {
        cutoffFrom: from,
        cutoffTo: new Date(),
        rangeLabel: `Last ${preset} days`,
      };
    }
    // Custom range — fall back gracefully if dates aren't filled yet
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : new Date();
    return {
      cutoffFrom: from,
      cutoffTo: to,
      rangeLabel: dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : dateFrom ? `From ${dateFrom}` : "Custom range",
    };
  }, [preset, dateFrom, dateTo]);

  function handlePresetChange(value: string) {
    if (value === "custom") {
      setPreset("custom");
    } else if (value === "all") {
      setPreset("all");
      setDateFrom("");
      setDateTo("");
    } else {
      setPreset(Number(value));
      setDateFrom("");
      setDateTo("");
    }
  }

  // Filter calls to the active window
  const windowCalls = useMemo(() => {
    const calls = data?.recentCalls ?? [];
    return calls.filter((c) => {
      const t = new Date(c.created_at);
      if (cutoffFrom && t < cutoffFrom) return false;
      if (cutoffTo && t > cutoffTo) return false;
      return true;
    });
  }, [data, cutoffFrom, cutoffTo]);

  // Derive KPIs from filtered calls
  const bookedCalls = windowCalls.filter((c) => c.outcome === "booked");
  const bookedWithRate = bookedCalls.filter((c) => c.final_agreed_rate != null);
  const totalCalls = windowCalls.length;
  const totalBooked = bookedCalls.length;
  const convRate = totalCalls > 0 ? ((totalBooked / totalCalls) * 100).toFixed(1) : "0.0";
  const avgFinalRate = bookedWithRate.length > 0 ? bookedWithRate.reduce((s, c) => s + (c.final_agreed_rate ?? 0), 0) / bookedWithRate.length : null;
  const avgDuration = windowCalls.length > 0 ? windowCalls.reduce((s, c) => s + (c.call_duration_seconds ?? 0), 0) / windowCalls.length : null;

  // Aggregate breakdowns from filtered calls
  const outcomeMap: Record<string, number> = {};
  windowCalls.forEach((c) => {
    if (c.outcome) outcomeMap[c.outcome] = (outcomeMap[c.outcome] ?? 0) + 1;
  });
  const outcomeBreakdown = Object.entries(outcomeMap).map(([outcome, _count]) => ({ outcome, _count }));

  const sentimentMap: Record<string, number> = {};
  windowCalls.forEach((c) => {
    if (c.sentiment) sentimentMap[c.sentiment] = (sentimentMap[c.sentiment] ?? 0) + 1;
  });
  const sentimentBreakdown = Object.entries(sentimentMap).map(([sentiment, _count]) => ({ sentiment, _count }));

  // Table-level filtering on top of the date window
  const filteredCalls = useMemo(() => {
    const q = search.toLowerCase().trim();
    return windowCalls.filter((c) => {
      if (outcomeFilter !== "all" && c.outcome !== outcomeFilter) return false;
      if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) return false;
      if (q) {
        const haystack = [c.mc_number, c.carrier_name, c.load_id, c.outcome, c.sentiment].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [windowCalls, search, outcomeFilter, sentimentFilter]);

  const kpiCards = [
    { label: "Total Calls", value: fmt(totalCalls), sub: rangeLabel, valueColor: undefined, subNode: null },
    {
      label: "Loads Booked",
      value: fmt(totalBooked),
      valueColor: "#1D9E75",
      subNode: <span style={{ color: "#1D9E75", fontWeight: 500 }}>successfully closed</span>,
    },
    {
      label: "Conversion Rate",
      value: `${convRate}%`,
      valueColor: "#1D9E75",
      subNode: (
        <span>
          calls → <span style={{ color: "#1D9E75", fontWeight: 500 }}>booked</span>
        </span>
      ),
    },
    {
      label: "Avg Final Rate",
      value: avgFinalRate != null ? `$${fmt(Math.round(avgFinalRate))}` : "—",
      valueColor: "#854F0B",
      subNode: (
        <span>
          on <span style={{ color: "#854F0B", fontWeight: 500 }}>booked</span> loads
        </span>
      ),
    },
    {
      label: "Avg Call Duration",
      value: avgDuration != null ? fmtDuration(Math.round(avgDuration)) : "—",
      valueColor: undefined,
      subNode: null,
    },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">HappyRobot · Apex Freight Brokerage</p>
          <h1 className="text-2xl font-semibold">Inbound Carrier Sales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Call analytics & performance metrics</p>
        </div>

        {/* Date range controls */}
        <div className="flex items-center gap-2">
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="text-xs border rounded px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-foreground/30 transition-colors"
          >
            <option value="all">All time</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>

          {preset === "custom" && (
            <>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || todayStr}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs border rounded px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-foreground/30 transition-colors"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={todayStr}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs border rounded px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-foreground/30 transition-colors"
              />
            </>
          )}

          <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">Failed to load data: {error}</div>}
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</p>
              {loading ? <Skeleton className="h-8 w-24 mb-1" /> : <p className="text-3xl font-semibold font-mono">{kpi.value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{kpi.subNode ?? kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Calls by outcome</CardTitle>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-48 w-full" /> : <OutcomeChart data={outcomeBreakdown} />}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Carrier sentiment</CardTitle>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-48 w-full" /> : <SentimentChart data={sentimentBreakdown} />}</CardContent>
        </Card>
      </div>
      {/* Volume Chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Call volume — {rangeLabel.toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <VolumeChart calls={windowCalls} days={preset === "custom" || preset === "all" ? 30 : preset} />
          )}
        </CardContent>
      </Card>
      {/* Calls Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recent calls</CardTitle>
            <span className="text-xs text-muted-foreground">
              {filteredCalls.length} of {windowCalls.length} call{windowCalls.length !== 1 ? "s" : ""} · {rangeLabel}
            </span>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              placeholder="Search carrier, MC#, load ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs border rounded px-2.5 py-1.5 bg-background text-foreground placeholder:text-muted-foreground/60 hover:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
            />
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-foreground/30 transition-colors"
            >
              <option value="all">All outcomes</option>
              <option value="booked">Booked</option>
              <option value="no_load">No load</option>
              <option value="rejected">Rejected</option>
              <option value="ineligible">Ineligible</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-background text-foreground cursor-pointer hover:border-foreground/30 transition-colors"
            >
              <option value="all">All sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            {(search || outcomeFilter !== "all" || sentimentFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setOutcomeFilter("all");
                  setSentimentFilter("all");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                Clear
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 px-3 font-medium">MC #</th>
                    <th className="text-left py-2 px-3 font-medium">Carrier</th>
                    <th className="text-left py-2 px-3 font-medium">Load ID</th>
                    <th className="text-left py-2 px-3 font-medium">List Rate</th>
                    <th className="text-left py-2 px-3 font-medium">Final Rate</th>
                    <th className="text-left py-2 px-3 font-medium">Rounds</th>
                    <th className="text-left py-2 px-3 font-medium">Outcome</th>
                    <th className="text-left py-2 px-3 font-medium">Sentiment</th>
                    <th className="text-left py-2 px-3 font-medium">Duration</th>
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ filteredCalls instead of windowCalls */}
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{call.mc_number ?? "—"}</td>
                      <td className="py-2.5 px-3 font-medium">{call.carrier_name ?? "—"}</td>
                      <td className="py-2.5 px-3 text-xs font-mono">{call.load_id ?? "—"}</td>
                      <td className="py-2.5 px-3">{call.loadboard_rate ? `$${call.loadboard_rate.toLocaleString()}` : "—"}</td>
                      <td className="py-2.5 px-3 font-semibold">{call.final_agreed_rate ? `$${call.final_agreed_rate.toLocaleString()}` : "—"}</td>
                      <td className="py-2.5 px-3 text-center">{call.num_negotiations ?? 0}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${outcomeVariant[call.outcome ?? ""] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {call.outcome?.replace("_", " ") ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sentimentVariant[call.sentiment ?? ""] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {call.sentiment ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{fmtDuration(call.call_duration_seconds)}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{fmtDate(call.created_at)}</td>
                    </tr>
                  ))}
                  {filteredCalls.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                        {windowCalls.length > 0 ? "No calls match your filters" : "No calls found for this period"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
