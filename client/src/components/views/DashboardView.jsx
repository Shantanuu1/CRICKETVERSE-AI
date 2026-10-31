/**
 * DashboardView.jsx
 * Professional Match Analytics Dashboard using Chart.js.
 * Visualizes runs progression, run rates, shot distribution, and boundary metrics.
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ShieldAlert, 
  Flame, 
  Gamepad2, 
  Sparkles,
  Database
} from 'lucide-react';
import { computeSummaryMetrics } from '../../game/gameState';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ matchState, setMatchState, setActiveTab }) {
  const hasData = matchState && matchState.balls > 0;
  const metrics = computeSummaryMetrics(matchState);

  // Load Sample Match for demo purposes
  const handleLoadSampleMatch = () => {
    setMatchState({
      runs: 48,
      balls: 24,
      wickets: 2,
      fours: 4,
      sixes: 5,
      dot_balls: 6,
      oversLimit: 4,
      maxBalls: 24,
      target: 45,
      status: 'COMPLETED',
      resultMessage: 'Sample Match: Won by 8 wickets chasing 45!',
      shot_distribution: {
        defensive: 5,
        leg_side: 7,
        off_side: 6,
        lofted: 6,
        leave: 0
      },
      timeline: [
        { ballNumber: 1, runs: 0, isWicket: false, totalScoreAfter: 0, oversAfter: '0.1' },
        { ballNumber: 2, runs: 1, isWicket: false, totalScoreAfter: 1, oversAfter: '0.2' },
        { ballNumber: 3, runs: 4, isWicket: false, totalScoreAfter: 5, oversAfter: '0.3' },
        { ballNumber: 4, runs: 0, isWicket: false, totalScoreAfter: 5, oversAfter: '0.4' },
        { ballNumber: 5, runs: 6, isWicket: false, totalScoreAfter: 11, oversAfter: '0.5' },
        { ballNumber: 6, runs: 1, isWicket: false, totalScoreAfter: 12, oversAfter: '1.0' },
        { ballNumber: 7, runs: 4, isWicket: false, totalScoreAfter: 16, oversAfter: '1.1' },
        { ballNumber: 8, runs: 0, isWicket: true, totalScoreAfter: 16, oversAfter: '1.2' },
        { ballNumber: 9, runs: 2, isWicket: false, totalScoreAfter: 18, oversAfter: '1.3' },
        { ballNumber: 10, runs: 6, isWicket: false, totalScoreAfter: 24, oversAfter: '1.4' },
        { ballNumber: 11, runs: 1, isWicket: false, totalScoreAfter: 25, oversAfter: '1.5' },
        { ballNumber: 12, runs: 0, isWicket: false, totalScoreAfter: 25, oversAfter: '2.0' },
        { ballNumber: 13, runs: 4, isWicket: false, totalScoreAfter: 29, oversAfter: '2.1' },
        { ballNumber: 14, runs: 1, isWicket: false, totalScoreAfter: 30, oversAfter: '2.2' },
        { ballNumber: 15, runs: 6, isWicket: false, totalScoreAfter: 36, oversAfter: '2.3' },
        { ballNumber: 16, runs: 0, isWicket: true, totalScoreAfter: 36, oversAfter: '2.4' },
        { ballNumber: 17, runs: 0, isWicket: false, totalScoreAfter: 36, oversAfter: '2.5' },
        { ballNumber: 18, runs: 2, isWicket: false, totalScoreAfter: 38, oversAfter: '3.0' },
        { ballNumber: 19, runs: 4, isWicket: false, totalScoreAfter: 42, oversAfter: '3.1' },
        { ballNumber: 20, runs: 6, isWicket: false, totalScoreAfter: 48, oversAfter: '3.2' }
      ]
    });
  };

  // 1. Runs Progression Line Chart Data
  const runsProgressionData = useMemo(() => {
    if (!hasData) return null;
    const labels = matchState.timeline.map((b) => `B${b.ballNumber}`);
    const dataPoints = matchState.timeline.map((b) => b.totalScoreAfter);

    return {
      labels,
      datasets: [
        {
          label: 'Cumulative Score',
          data: dataPoints,
          borderColor: '#a3e635',
          backgroundColor: 'rgba(163, 230, 53, 0.15)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#a3e635',
          pointBorderColor: '#ffffff',
          pointRadius: 4
        }
      ]
    };
  }, [matchState, hasData]);

  // 2. Runs Per Over Bar Chart Data
  const runsPerOverData = useMemo(() => {
    if (!hasData) return null;
    const overTotals = {};
    matchState.timeline.forEach((b) => {
      const overIndex = Math.floor((b.ballNumber - 1) / 6) + 1;
      overTotals[overIndex] = (overTotals[overIndex] || 0) + b.runs;
    });

    const labels = Object.keys(overTotals).map((o) => `Over ${o}`);
    const data = Object.values(overTotals);

    return {
      labels,
      datasets: [
        {
          label: 'Runs Scored',
          data,
          backgroundColor: ['#38bdf8', '#818cf8', '#a3e635', '#f472b6', '#fbbf24'],
          borderRadius: 8
        }
      ]
    };
  }, [matchState, hasData]);

  // 3. Shot Distribution Doughnut Data
  const shotDistributionData = useMemo(() => {
    if (!hasData) return null;
    const dist = matchState.shot_distribution;
    return {
      labels: ['Defensive', 'Leg-Side', 'Off-Side', 'Lofted', 'Leave'],
      datasets: [
        {
          data: [
            dist.defensive || 0,
            dist.leg_side || 0,
            dist.off_side || 0,
            dist.lofted || 0,
            dist.leave || 0
          ],
          backgroundColor: ['#94a3b8', '#06b6d4', '#3b82f6', '#a855f7', '#eab308'],
          borderWidth: 2,
          borderColor: '#0f172a'
        }
      ]
    };
  }, [matchState, hasData]);

  // Chart common dark options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-lime-400">Match Intelligence</span>
          <h1 className="text-3xl font-black font-display text-white">Performance Analytics</h1>
          <p className="text-sm text-slate-400">
            Real-time telemetry, boundary run ratios, and stroke execution distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSampleMatch}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Database className="w-3.5 h-3.5 text-lime-400" />
            <span>Load Sample Match</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze with Gemma Coach</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="glass-card p-12 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
            <BarChart3 className="w-10 h-10 text-lime-400/50" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display text-white">No Match Data Recorded Yet</h2>
            <p className="text-sm text-slate-400">
              Step into the 3D Play Arena to bowl deliveries and hit shots with your hands, or click below to populate the dashboard with sample tournament telemetry.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('game')}
              className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Go to Play Arena</span>
            </button>

            <button
              onClick={handleLoadSampleMatch}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Database className="w-4 h-4 text-lime-400" />
              <span>Load Tournament Scenario</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Data Dashboard */
        <div className="space-y-8">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
              <div className="text-2xl font-black font-display text-white">
                {matchState.runs}<span className="text-sm font-semibold text-rose-400">/{matchState.wickets}</span>
              </div>
            </div>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Balls Faced</span>
              <div className="text-2xl font-black font-display text-lime-400">
                {matchState.balls} <span className="text-xs text-slate-400">({metrics.oversFormatted} ov)</span>
              </div>
            </div>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Strike Rate</span>
              <div className="text-2xl font-black font-display text-cyan-400">
                {metrics.strikeRate}
              </div>
            </div>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Boundaries</span>
              <div className="text-2xl font-black font-display text-purple-400">
                {matchState.fours + matchState.sixes} <span className="text-xs text-slate-400 font-medium">({matchState.fours}x4, {matchState.sixes}x6)</span>
              </div>
            </div>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Boundary Runs %</span>
              <div className="text-2xl font-black font-display text-amber-400">
                {matchState.runs > 0 ? (((matchState.fours * 4 + matchState.sixes * 6) / matchState.runs) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dot Ball %</span>
              <div className="text-2xl font-black font-display text-rose-400">
                {matchState.balls > 0 ? ((matchState.dot_balls / matchState.balls) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Cumulative Runs Progression */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-lime-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cumulative Runs Progression</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Ball-by-Ball</span>
              </div>
              <div className="h-64">
                {runsProgressionData && <Line data={runsProgressionData} options={chartOptions} />}
              </div>
            </div>

            {/* Chart 2: Runs Per Over */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Runs Per Over Acceleration</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Overs</span>
              </div>
              <div className="h-64">
                {runsPerOverData && <Bar data={runsPerOverData} options={chartOptions} />}
              </div>
            </div>

            {/* Chart 3: Shot Type Distribution */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shot Execution Breakdown</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Gesture Frequency</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                {shotDistributionData && (
                  <Doughnut
                    data={shotDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Chart 4: Tactical Insights Summary */}
            <div className="glass-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scoring Efficiency Summary</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Balls Per Boundary:</span>
                    <strong className="text-white font-mono">
                      {matchState.fours + matchState.sixes > 0 
                        ? (matchState.balls / (matchState.fours + matchState.sixes)).toFixed(1) 
                        : matchState.balls} deliveries
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Scoring Velocity:</span>
                    <strong className="text-lime-400 font-mono">
                      {metrics.strikeRate > 150 ? 'Elite Acceleration' : 'Steady Pacing'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Dot Pressure Index:</span>
                    <strong className={matchState.dot_balls > matchState.balls * 0.4 ? 'text-rose-400' : 'text-emerald-400'}>
                      {matchState.dot_balls > matchState.balls * 0.4 ? 'High Vulnerability' : 'Well Controlled'}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('coach')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>Consult Gemma 4 Tactical Coach</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
