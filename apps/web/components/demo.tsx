"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  Bell,
  Box,
  ChevronDown,
  CircleHelp,
  Code2,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
export function Demo() {
  const [scenario, setScenario] = useState<"healthy" | "down">("healthy");
  const reduced = useReducedMotion();
  const down = scenario === "down";
  const values = [
    28,
    30,
    26,
    31,
    29,
    35,
    30,
    28,
    32,
    29,
    31,
    42,
    33,
    28,
    30,
    32,
    29,
    34,
    28,
    31,
    30,
    down ? 85 : 33,
    down ? 95 : 31,
    down ? 99 : 30,
  ];
  return (
    <motion.div
      className="console"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.6 }}
    >
      <aside className="demo-sidebar">
        <div className="workspace">
          <span className="workspace-icon">N</span>
          <span>
            Acme workspace<small>Illustrative workspace</small>
          </span>
          <ChevronDown size={13} />
        </div>
        <div className="search">
          Quick search <kbd>⌘ K</kbd>
        </div>
        <span className="nav-caption">WORKSPACE</span>
        {[
          [LayoutDashboard, "Overview"],
          [Activity, "RPC monitors"],
          [Bell, "Incidents"],
          [Code2, "API keys"],
          [Box, "Projects"],
        ].map(([Icon, label], i) => {
          const I = Icon as typeof Activity;
          return (
            <div
              key={String(label)}
              className={"demo-nav " + (!i ? "selected" : "")}
            >
              <I size={15} />
              {String(label)}
              {i === 1 && <small>3</small>}
            </div>
          );
        })}
        <div className="sidebar-bottom">
          <div className="demo-nav">
            <Settings size={15} />
            Settings
          </div>
          <div className="demo-nav">
            <CircleHelp size={15} />
            Help & documentation
          </div>
          <div className="profile">
            <span>AC</span>Alex Chen<small>Demo</small>
          </div>
        </div>
      </aside>
      <div className="demo-main">
        <div className="console-top">
          <span>
            Workspace <span className="slash">/</span> Overview
          </span>
          <span className="demo-label">DEMO DATA</span>
        </div>
        <div className="console-title">
          <div>
            <h3>Infrastructure overview</h3>
            <p>Your endpoints. One clear picture.</p>
          </div>
          <div className="demo-switch">
            <button aria-pressed={!down} onClick={() => setScenario("healthy")}>
              Healthy
            </button>
            <button aria-pressed={down} onClick={() => setScenario("down")}>
              Simulate outage
            </button>
          </div>
        </div>
        <div className="demo-stats">
          {[
            [Radio, "Active monitors", "3"],
            [ShieldCheck, "Availability", down ? "98.6%" : "99.98%"],
            [Zap, "Avg. response", "124 ms"],
            [Bell, "Open incidents", down ? "1" : "0"],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Activity;
            return (
              <div key={String(label)}>
                <span>
                  <I size={14} />
                  {String(label)}
                </span>
                <strong>{String(value)}</strong>
                <small>Illustrative last 24 hours</small>
              </div>
            );
          })}
        </div>
        <div className="chart-panel">
          <div className="panel-heading">
            <span>
              <Activity size={15} />
              Response time
            </span>
            <span className="chart-legend">
              <i /> Ethereum Mainnet <small>Last 24 hours</small>
            </span>
          </div>
          <div className="chart">
            <div className="chart-axis">
              <span>300 ms</span>
              <span>200 ms</span>
              <span>100 ms</span>
              <span>0 ms</span>
            </div>
            <svg
              viewBox="0 0 720 130"
              role="img"
              aria-label={
                down
                  ? "Demo latency rises during a simulated outage"
                  : "Demo response latency around 124 milliseconds"
              }
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#607bff" stopOpacity=".3" />
                  <stop offset="100%" stopColor="#607bff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[15, 50, 85, 120].map((v) => (
                <line
                  key={v}
                  x1="0"
                  y1={v}
                  x2="720"
                  y2={v}
                  stroke="#232a3c"
                  strokeDasharray="3 5"
                />
              ))}
              <polygon
                points={
                  "0,130 " +
                  values
                    .map((v, i) => `${(i * 720) / 23},${130 - v}`)
                    .join(" ") +
                  " 720,130"
                }
                fill="url(#area)"
              />
              <polyline
                points={values
                  .map((v, i) => `${(i * 720) / 23},${130 - v}`)
                  .join(" ")}
                fill="none"
                stroke={down ? "#f58b86" : "#7c91ff"}
                strokeWidth="2.3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="chart-times">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </div>
        <div className="endpoints-heading">
          <b>Your endpoints</b>
          <span>3 monitors · Demo</span>
        </div>
        <div className="endpoint-table">
          <div className="endpoint-header">
            <span>ENDPOINT / NETWORK</span>
            <span>STATUS</span>
            <span>LATENCY</span>
            <span>LAST 24 HOURS</span>
          </div>
          {["Ethereum Mainnet", "Base Mainnet", "Arbitrum One"].map(
            (name, i) => (
              <div className="endpoint" key={name}>
                <span className="endpoint-name">
                  <span className={"chain-icon chain-" + i}>
                    {["Ξ", "B", "A"][i]}
                  </span>
                  <span>
                    {name}
                    <small>
                      {["eth-mainnet", "base-primary", "arb-primary"][i]}
                    </small>
                  </span>
                </span>
                <span className={down && !i ? "bad" : "good"}>
                  <i />
                  {down && !i ? "Down" : "Healthy"}
                </span>
                <span>
                  {down && !i ? "—" : ["124 ms", "89 ms", "106 ms"][i]}
                </span>
                <div
                  className="uptime-bars"
                  aria-label="Illustrative check history"
                >
                  {Array.from({ length: 32 }, (_, j) => (
                    <i
                      className={down && !i && j > 28 ? "failed" : ""}
                      key={j}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
        <div className="demo-foot">
          <span>
            <span className="dot" /> Interactive preview · no real endpoints
          </span>
          <span>Monitoring region: example only</span>
        </div>
      </div>
    </motion.div>
  );
}
