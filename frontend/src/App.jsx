
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  Bell,
  ChevronDown,
  CircleDollarSign,
  Cloud,
  Database,
  Gauge,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  Wallet,
  Zap,
  Clock,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  X,
  RefreshCw
} from "lucide-react";

import {
  getHealth,
  getSafety,
  getMetrics,
  getAlerts,
  getLogs,
  getAwsCosts
} from "./services/api";

import "./App.css";

// AWS costs are loaded from the backend at runtime. Resource recommendations below remain illustrative.
const chartColors = ["#4778f5", "#14b88a", "#9466f6", "#f5a34b", "#9ba8c7", "#ef6b73"];

const resources = [
  {
    id: "r1",
    name: "dev-web-server",
    type: "EC2 Instance",
    region: "ap-south-1",
    saving: "₹420/mo",
    risk: "Low",
    status: "Review"
  },
  {
    id: "r2",
    name: "staging-db",
    type: "RDS Instance",
    region: "ap-south-1",
    saving: "₹310/mo",
    risk: "Medium",
    status: "Approval"
  },
  {
    id: "r3",
    name: "old-backup-bucket",
    type: "S3 Bucket",
    region: "ap-south-1",
    saving: "₹180/mo",
    risk: "Low",
    status: "Review"
  }
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Cost Analysis", icon: Wallet },
  { label: "Resources", icon: Server },
  { label: "Recommendations", icon: Leaf, count: 3 },
  { label: "Alerts", icon: Bell },
  { label: "Approvals", icon: ShieldCheck, count: 2 },
  { label: "Audit Logs", icon: ClipboardList },
  { label: "Settings", icon: Settings }
];

function MetricCard({
  icon: Icon,
  title,
  value,
  note,
  trend,
  tone,
  progress
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={20} />
      </div>

      <div className="metric-label">{title}</div>
      <div className="metric-value">{value}</div>

      {typeof progress === "number" ? (
        <>
          <div className="progress-track">
            <div
              className="progress-value"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="metric-note">{note}</div>
        </>
      ) : (
        <div className={`metric-note ${trend === "good" ? "good" : ""}`}>
          {trend === "good" && <ArrowDownRight size={14} />}
          {note}
        </div>
      )}
    </article>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="section-title">
      <div className="section-title-icon">
        <Icon size={18} />
      </div>

      <div className="section-title-copy">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action}
    </div>
  );
}

function getAlertTitle(alert) {
  return (
    alert.title ||
    alert.message ||
    alert.description ||
    alert.action ||
    alert.event ||
    "Backend activity"
  );
}

function getAlertTime(item) {
  const value = item.time || item.createdAt || item.timestamp;

  if (!value) return "Time not provided";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("cloudguard-theme") || "light";
    } catch {
      return "light";
    }
  });

  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const [backendHealth, setBackendHealth] = useState(null);
  const [safety, setSafety] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [awsCosts, setAwsCosts] = useState(null);
  const [awsCostError, setAwsCostError] = useState("");
  const [backendAlerts, setBackendAlerts] = useState([]);
  const [backendLogs, setBackendLogs] = useState([]);

  const [apiLoading, setApiLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("cloudguard-theme", theme);
    } catch {
      // The app still works if browser storage is unavailable.
    }
  }, [theme]);

  const loadBackendData = useCallback(async () => {
    setRefreshing(true);
    setApiError("");

    const results = await Promise.allSettled([
      getHealth(),
      getSafety(),
      getMetrics(),
      getAlerts(),
      getLogs(),
      getAwsCosts()
    ]);

    const [
      healthResult,
      safetyResult,
      metricsResult,
      alertsResult,
      logsResult,
      awsCostsResult
    ] = results;

    const failures = results.filter(
      (result) => result.status === "rejected"
    );

    if (healthResult.status === "fulfilled") {
      setBackendHealth(healthResult.value);
    }

    if (safetyResult.status === "fulfilled") {
      setSafety(safetyResult.value);
    }

    if (metricsResult.status === "fulfilled") {
      setMetrics(metricsResult.value);
    }

    if (alertsResult.status === "fulfilled") {
      const data = alertsResult.value;

      setBackendAlerts(
        Array.isArray(data) ? data : data.alerts || []
      );
    }

    if (logsResult.status === "fulfilled") {
      const data = logsResult.value;

      setBackendLogs(
        Array.isArray(data) ? data : data.logs || []
      );
    }

    if (awsCostsResult.status === "fulfilled") {
      setAwsCosts(awsCostsResult.value);
      setAwsCostError("");
    } else {
      setAwsCostError(awsCostsResult.reason?.message || "AWS costs could not be loaded.");
    }

    if (failures.length > 0) {
      setApiError(
        `${6 - failures.length}/6 backend requests responding. ` +
        "Check the backend terminal and API configuration."
      );
    }

    setApiLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const filteredResources = resources.filter((resource) =>
    `${resource.name} ${resource.type} ${resource.region}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function requestReview(resource) {
    setNotice(
      `Demo only: ${resource.name} added to the review queue. ` +
      "No AWS action was executed."
    );
  }

  const healthOnline = backendHealth?.status === "ok";
  const dryRunEnabled = safety?.dryRun === true;
  const isDemoMetrics = metrics?.source === "demo";
  const currency = metrics?.currency || "USD";
  const awsMonths = Array.isArray(awsCosts?.months) ? awsCosts.months : [];
  const latestAwsMonth = awsMonths.length ? awsMonths[awsMonths.length - 1] : null;
  const costTrend = awsMonths.map((month) => ({
    day: month.start
      ? new Date(`${month.start}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
      : "Month",
    amount: Number(month.totalCost || 0),
    estimated: month.estimated,
  }));
  const serviceCosts = (latestAwsMonth?.services || [])
    .filter((service) => Number(service.cost) > 0)
    .slice(0, 6)
    .map((service, index) => ({
      name: service.service,
      value: Number(service.cost),
      color: chartColors[index % chartColors.length],
    }));

  function formatAmount(amount) {
    return `${currency} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  function formatAwsAmount(amount) {
    return `${awsCosts?.currency || "USD"} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }

  return (
    <div className={`cg-app ${theme}`}>
      <aside className={`cg-sidebar ${mobileOpen ? "open" : ""}`}>
        <a
          className="cg-brand"
          href="#dashboard"
          onClick={() => setActive("Dashboard")}
        >
          <span className="brand-mark">
            <Cloud size={25} fill="currentColor" />
          </span>

          <span>
            <strong>CloudGuard</strong>
            <small>Optimize · Secure · Save</small>
          </span>
        </a>

        <div className="nav-caption">WORKSPACE</div>

        <nav className="cg-nav">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              className={`cg-nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                setMobileOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="nav-caption account-caption">ACCOUNT</div>

        <div className="account-card">
          <div className="account-avatar">
            <Cloud size={19} />
          </div>

          <div>
            <strong>AWS Account</strong>
            <small>
              <span className="online-dot" />
              {isDemoMetrics ? "Demo Mode" : "Backend Connected"}
            </small>
          </div>
        </div>

        <button
          className="region-button"
          onClick={() =>
            setNotice(
              "Displayed region: ap-south-1 (Mumbai). " +
              "No AWS region change was made."
            )
          }
        >
          <span className="region-pin">⌖</span>
          <span>ap-south-1</span>
          <ChevronDown size={15} />
        </button>

        <div className="sidebar-spacer" />

        <div className="safety-box">
          <div className="safety-symbol">
            <ShieldCheck size={23} />
          </div>

          <div>
            <strong>Safety Mode</strong>
            <span>
              {safety
                ? dryRunEnabled
                  ? "Dry-run enabled"
                  : "Check safety configuration"
                : "Checking safety..."}
            </span>
            <small>
              {safety?.automaticResourceChangesEnabled === false
                ? "No automatic resource changes."
                : "Verify backend safety status."}
            </small>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="avatar">CG</span>
          <span className="user-copy">
            <strong>CloudGuard Admin</strong>
            <small>Local development</small>
          </span>
          <Settings size={17} />
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="cg-main">
        <header className="cg-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <Menu size={21} />
          </button>

          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="Search resources"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources, costs, or recommendations..."
            />
            <kbd>Ctrl K</kbd>
          </div>

          <div className="topbar-actions">
            <button
              className="round-action"
              onClick={loadBackendData}
              disabled={refreshing}
              title="Refresh backend data"
              aria-label="Refresh backend data"
            >
              <RefreshCw
                size={19}
                className={refreshing ? "refresh-spinning" : ""}
              />
            </button>

            <button
              className="round-action"
              onClick={() =>
                setTheme(theme === "light" ? "dark" : "light")
              }
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } theme`}
              title="Switch theme"
            >
              {theme === "light" ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
            </button>

            <button
              className="round-action notification-action"
              onClick={() => setActive("Alerts")}
              aria-label="View alerts"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="top-user">
              <span className="avatar">CG</span>
              <span>
                <strong>CloudGuard Admin</strong>
                <small>Local Development</small>
              </span>
            </div>
          </div>
        </header>

        <div className="cg-content">
          {notice && (
            <div className="inline-notice" role="status">
              <AlertTriangle size={17} />
              <span>{notice}</span>
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notice"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="inline-notice" role="status">
            <Activity size={17} />
            <span>
              {apiLoading
                ? "Connecting to CloudGuard backend..."
                : apiError
                  ? apiError
                  : `Backend ${
                      healthOnline ? "online" : "unavailable"
                    } · ${
                      dryRunEnabled
                        ? "Dry-run enabled"
                        : "Verify safety configuration"
                    } · AWS actions disabled`}
            </span>
          </div>

          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="welcome-eyebrow">
                <Zap size={13} /> WELCOME TO CLOUDGUARD
              </span>

              <h1>
                {active === "Dashboard"
                  ? "Smarter Cloud. Lower Costs."
                  : active}
              </h1>

              <p>
                {active === "Dashboard"
                  ? "Monitor your AWS usage, detect waste, and optimize resources with actionable insights."
                  : `Explore ${active.toLowerCase()} and review your cloud optimization workspace.`}
              </p>

              <span className="demo-pill">
                {awsCosts?.source === "aws-cost-explorer"
                  ? "LIVE AWS COST EXPLORER DATA"
                  : "AWS COST DATA UNAVAILABLE"}
              </span>
            </div>

            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />

              <div className="cloud-stack">
                <Cloud size={94} strokeWidth={1.1} />
              </div>

              <div className="server-stack">
                <div />
                <div />
                <div />
              </div>

              <div className="art-base" />
            </div>
          </section>

          <section className="metric-grid">
            <MetricCard
              icon={CircleDollarSign}
              title="Latest Completed Month"
              value={
                latestAwsMonth
                  ? formatAwsAmount(latestAwsMonth.totalCost)
                  : apiLoading
                    ? "Loading..."
                    : "Unavailable"
              }
              note={
                latestAwsMonth
                  ? `Actual Cost Explorer data · ${latestAwsMonth.start}`
                  : awsCostError || "AWS billing data unavailable"
              }
              tone="blue"
            />

            <MetricCard
              icon={Gauge}
              title="Budget Usage"
              value={
                metrics
                  ? `${Number(metrics.budgetUsedPercent || 0).toFixed(1)}%`
                  : apiLoading
                    ? "Loading..."
                    : "Unavailable"
              }
              note={
                metrics
                  ? `Budget: ${formatAmount(metrics.monthlyBudget)}`
                  : "Waiting for backend"
              }
              progress={
                metrics
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        Number(metrics.budgetUsedPercent) || 0
                      )
                    )
                  : undefined
              }
              tone="violet"
            />

            <MetricCard
              icon={Leaf}
              title="Potential Savings"
              value={
                metrics
                  ? formatAmount(metrics.potentialSavings)
                  : apiLoading
                    ? "Loading..."
                    : "Unavailable"
              }
              note="Backend-reported estimate"
              tone="green"
            />

            <MetricCard
              icon={Server}
              title="Monitored Resources"
              value={
                metrics
                  ? Number(metrics.resourcesMonitored || 0).toLocaleString()
                  : apiLoading
                    ? "Loading..."
                    : "Unavailable"
              }
              note={
                metrics
                  ? `${Number(metrics.activeAlerts || 0)} active backend alerts`
                  : "Waiting for backend"
              }
              tone="orange"
            />
          </section>

          <section className="analytics-grid">
            <article className="cg-panel trend-panel">
              <SectionTitle
                icon={Activity}
                title="Monthly Cost Trend"
                subtitle="Actual AWS Cost Explorer totals · USD"
                action={<span className="period-chip">{awsCosts?.period?.start || "AWS"} – {awsCosts?.period?.endExclusive || ""}</span>}
              />

              <div className="chart-summary">
                <strong>{latestAwsMonth ? formatAwsAmount(latestAwsMonth.totalCost) : "No AWS data"}</strong>
                <span className="summary-positive">
                  <Activity size={14} />
                  <small>{latestAwsMonth ? `Latest completed month${latestAwsMonth.estimated ? " · estimated" : " · not estimated"}` : (awsCostError || "Waiting for AWS Cost Explorer")}</small>
                </span>
              </div>

              <div className="trend-chart">
                {costTrend.length === 0 ? (
                  <div className="empty-state">{awsCostError || "Loading real AWS cost history..."}</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={costTrend}
                    margin={{
                      top: 12,
                      right: 8,
                      left: -18,
                      bottom: 0
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="cgTrendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#626cf4"
                          stopOpacity={0.27}
                        />
                        <stop
                          offset="100%"
                          stopColor="#626cf4"
                          stopOpacity={0.015}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="var(--line)"
                      strokeDasharray="3 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="day"
                      tick={{
                        fill: "var(--muted)",
                        fontSize: 10
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "var(--muted)",
                        fontSize: 10
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text)"
                      }}
                      formatter={(value) => [
                        formatAwsAmount(value),
                        "AWS cost"
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#626cf4"
                      strokeWidth={2.5}
                      fill="url(#cgTrendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="cg-panel service-panel">
              <SectionTitle
                icon={Wallet}
                title="Cost by Service"
                subtitle={latestAwsMonth ? `Actual service costs · ${latestAwsMonth.start}` : "Waiting for AWS Cost Explorer"}
              />

              <div className="donut-layout">
                <div className="donut-chart">
                  {serviceCosts.length === 0 ? (
                    <div className="empty-state">{awsCostError || "No service costs to display"}</div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceCosts}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="66%"
                        outerRadius="91%"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {serviceCosts.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          formatAwsAmount(value),
                          "AWS cost"
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  )}

                  <div className="donut-center">
                    <strong>{latestAwsMonth ? formatAwsAmount(latestAwsMonth.totalCost) : "—"}</strong>
                    <span>Monthly total</span>
                  </div>
                </div>

                <div className="legend-list">
                  {serviceCosts.length > 0 ? serviceCosts.map((item) => (
                    <div className="legend-item" key={item.name}>
                      <span
                        className="legend-dot"
                        style={{ background: item.color }}
                      />
                      <span>{item.name}</span>
                      <strong>{formatAwsAmount(item.value)}</strong>
                    </div>
                  )) : <div className="empty-state">No service data available.</div>}
                </div>
              </div>
            </article>
          </section>

          <section className="cg-panel opportunities-panel">
            <SectionTitle
              icon={Leaf}
              title="Top Optimization Opportunities"
              subtitle="Sample resources only · Validate before taking action"
              action={
                <button
                  className="view-all"
                  onClick={() => setActive("Recommendations")}
                >
                  View all <ExternalLink size={14} />
                </button>
              }
            />

            <div className="table-scroll">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>RESOURCE</th>
                    <th>TYPE</th>
                    <th>REGION</th>
                    <th>EST. SAVINGS</th>
                    <th>RISK</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredResources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <div className="resource-cell">
                          <span className="resource-type-icon">
                            <Server size={16} />
                          </span>
                          <strong>{resource.name}</strong>
                        </div>
                      </td>

                      <td>{resource.type}</td>

                      <td>
                        <span className="region-label">
                          {resource.region}
                        </span>
                      </td>

                      <td className="saving-value">{resource.saving}</td>

                      <td>
                        <span className={`risk-tag ${resource.risk.toLowerCase()}`}>
                          {resource.risk}
                        </span>
                      </td>

                      <td>
                        <span className={`status-tag ${resource.status.toLowerCase()}`}>
                          {resource.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="review-button"
                          onClick={() => requestReview(resource)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredResources.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No sample resources match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-disclaimer">
              <ShieldCheck size={15} />
              Sample recommendations only. No AWS resources have been changed or stopped.
            </div>
          </section>

          <section className="bottom-grid">
            <article className="cg-panel compact-panel">
              <SectionTitle
                icon={Bell}
                title="Recent Alerts"
                subtitle="From backend API"
                action={
                  <button
                    className="mini-link"
                    onClick={() => setActive("Alerts")}
                  >
                    View all
                  </button>
                }
              />

              <div className="alert-list">
                {apiLoading ? (
                  <div className="empty-state">Loading alerts...</div>
                ) : backendAlerts.length > 0 ? (
                  backendAlerts.map((alert, index) => (
                    <div
                      className="alert-row"
                      key={alert._id || alert.id || index}
                    >
                      <span className="alert-icon warning">
                        <AlertTriangle size={16} />
                      </span>

                      <span className="alert-copy">
                        <strong>{getAlertTitle(alert)}</strong>
                        <small>{getAlertTime(alert)}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    {apiError
                      ? "Alerts could not be loaded."
                      : "No alerts returned by the backend."}
                  </div>
                )}
              </div>
            </article>

            <article className="cg-panel compact-panel">
              <SectionTitle
                icon={ClipboardList}
                title="Backend Activity Logs"
                subtitle={`${backendLogs.length} returned`}
                action={
                  <button
                    className="mini-link"
                    onClick={() => setActive("Audit Logs")}
                  >
                    View all
                  </button>
                }
              />

              <div className="approval-list">
                {apiLoading ? (
                  <div className="empty-state">Loading logs...</div>
                ) : backendLogs.length > 0 ? (
                  backendLogs.slice(0, 3).map((log, index) => (
                    <div
                      className="approval-row"
                      key={log._id || log.id || index}
                    >
                      <span className="approval-resource-icon">
                        <Activity size={16} />
                      </span>

                      <span className="alert-copy">
                        <strong>{getAlertTitle(log)}</strong>
                        <small>{getAlertTime(log)}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    {apiError
                      ? "Logs could not be loaded."
                      : "No activity logs returned by the backend."}
                  </div>
                )}

                <div className="approval-footnote">
                  <Clock size={13} />
                  Backend logs only; no AWS actions are triggered.
                </div>
              </div>
            </article>

            <article className="cg-panel compact-panel">
              <SectionTitle
                icon={ShieldCheck}
                title="System Status"
              />

              <div className="system-list">
                <div>
                  <span>
                    <Activity size={15} />
                    Backend API
                  </span>
                  <strong className={healthOnline ? "system-online" : "system-off"}>
                    {apiLoading
                      ? "Checking"
                      : healthOnline
                        ? "Online"
                        : "Unavailable"}
                  </strong>
                </div>

                <div>
                  <span>
                    <LayoutDashboard size={15} />
                    Frontend
                  </span>
                  <strong className="system-online">Online</strong>
                </div>

                <div>
                  <span>
                    <Cloud size={15} />
                    AWS Connection
                  </span>
                  <strong className={awsCosts?.source === "aws-cost-explorer" ? "system-online" : "system-demo"}>
                    {awsCosts?.source === "aws-cost-explorer" ? "Cost data connected" : "Unavailable"}
                  </strong>
                </div>

                <div>
                  <span>
                    <Database size={15} />
                    Automation
                  </span>
                  <strong
                    className={
                      safety?.automaticResourceChangesEnabled === false
                        ? "system-off"
                        : "system-demo"
                    }
                  >
                    {safety
                      ? safety.automaticResourceChangesEnabled === false
                        ? "Disabled"
                        : "Verify status"
                      : "Checking"}
                  </strong>
                </div>
              </div>
            </article>
          </section>

          <footer className="cg-footer">
            <span>
              CloudGuard <span>·</span> Local development
            </span>

            <span>
              <ShieldCheck size={14} />
              {dryRunEnabled
                ? "Dry-run safety controls active"
                : "Verify safety configuration"}
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
