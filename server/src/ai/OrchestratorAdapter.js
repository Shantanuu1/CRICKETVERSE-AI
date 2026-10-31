/**
 * OrchestratorAdapter.js
 * Bridges Node.js server with the Python FastAPI AI Orchestrator service.
 * Handles timeouts, network retries, and high-fidelity deterministic fallbacks.
 */

const providerManager = require('./ProviderManager');

class OrchestratorAdapter {
  constructor() {
    this.baseUrl = process.env.AI_ORCHESTRATOR_URL || 'http://127.0.0.1:8000';
  }

  async analyzeMatch(matchData, userQuery = null) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(`${this.baseUrl}/coach/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_data: matchData, user_query: userQuery }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsedMs = Date.now() - startTime;

      if (resp.ok) {
        const data = await resp.json();
        providerManager.recordRequest(elapsedMs, data.is_fallback, true);
        return data;
      }
    } catch (err) {
      // Orchestrator unavailable; invoke deterministic engine
    }

    const elapsedMs = Date.now() - startTime;
    providerManager.recordRequest(elapsedMs, true, false);
    return this._getFallbackAnalysis(matchData, elapsedMs);
  }

  async chatCoach(message, matchData = null) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(`${this.baseUrl}/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, match_data: matchData }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsedMs = Date.now() - startTime;
      if (resp.ok) {
        const data = await resp.json();
        providerManager.recordRequest(elapsedMs, data.is_fallback, true);
        return data;
      }
    } catch (err) {
      // Unreachable
    }

    const elapsedMs = Date.now() - startTime;
    providerManager.recordRequest(elapsedMs, true, false);
    return this._getFallbackChat(message, matchData, elapsedMs);
  }

  async generateCommentary(eventType, runs = 0, shotType = 'SHOT', context = null) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(`${this.baseUrl}/commentary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          runs,
          shot_type: shotType,
          context
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsedMs = Date.now() - startTime;
      if (resp.ok) {
        const data = await resp.json();
        providerManager.recordRequest(elapsedMs, data.is_fallback, true);
        return data;
      }
    } catch (err) {
      // Fallback
    }

    const elapsedMs = Date.now() - startTime;
    providerManager.recordRequest(elapsedMs, true, false);
    return this._getFallbackCommentary(eventType, runs, shotType, elapsedMs);
  }

  async askRules(question) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(`${this.baseUrl}/rules/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsedMs = Date.now() - startTime;
      if (resp.ok) {
        const data = await resp.json();
        providerManager.recordRequest(elapsedMs, data.is_fallback, true);
        return data;
      }
    } catch (err) {
      // Fallback
    }

    const elapsedMs = Date.now() - startTime;
    providerManager.recordRequest(elapsedMs, true, false);
    return this._getFallbackRules(question, elapsedMs);
  }

  // Fallback implementations
  _getFallbackAnalysis(data, latencyMs) {
    const runs = Number(data.runs || 0);
    const balls = Number(data.balls || 0);
    const wickets = Number(data.wickets || 0);
    const fours = Number(data.fours || 0);
    const sixes = Number(data.sixes || 0);
    const dots = Number(data.dot_balls || 0);
    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
    const dotPct = balls > 0 ? ((dots / balls) * 100).toFixed(1) : '0.0';

    return {
      success: true,
      report: {
        summary: `### 1. Match Performance Summary\nScored **${runs} runs** from **${balls} balls** at a Strike Rate of **${sr}** with **${wickets} wickets** lost.\n\n### 2. Batting Strengths\n- Secured ${fours + sixes} boundaries (${fours}x4, ${sixes}x6).\n- Maintained attacking intent on loose deliveries.\n\n### 3. Vulnerabilities & Weaknesses\n- Registered ${dots} dot balls (${dotPct}% of deliveries faced).\n- Susceptible to early-over strike stagnation.\n\n### 4. Technical Corrections\n- Open stance slightly to pierce the cover-point gap on rising deliveries.\n- Keep bat face angled towards the ground on defensive blocks.\n\n### 5. Recommended Drills\n- **Strike Rotation Grid**: 3 sets of 12 drop-and-run singles.\n- **Off-Side Extension**: 25 cover-drives against half-volleys.\n\n### 6. Next-Match Blueprint\nTarget a boundary within the first 3 balls of each over while rotating strike on deliveries 4-6.`,
        metrics: {
          runs,
          balls,
          wickets,
          fours,
          sixes,
          dot_balls: dots,
          strike_rate: Number(sr),
          dot_percentage: Number(dotPct)
        },
        patterns: [
          `Dot ball ratio at ${dotPct}%`,
          `Scoring velocity at SR ${sr}`
        ],
        corrections: [
          'Rotate strike with push singles instead of dead blocks',
          'Avoid pre-meditating lofted shots before ball pitching'
        ],
        drills: [
          { name: 'Strike Rotation Grid', focus: 'Quick singles', reps: '3 sets of 12 balls' }
        ]
      },
      is_fallback: true,
      provider: 'nodejs-deterministic-engine',
      latency_ms: latencyMs,
      telemetry: providerManager.getTelemetry()
    };
  }

  _getFallbackChat(message, matchData, latencyMs) {
    const q = (message || '').toLowerCase();
    let reply = 'Batting requires patience and precise hand-eye coordination. Watch the seam closely out of the bowler\'s hand and play as late as possible under your eyes.';
    if (q.includes('strike rate')) {
      reply = 'To boost your strike rate without throwing away your wicket, work the field: aim your defensive pushes into empty spaces in the inner ring for swift singles.';
    } else if (q.includes('improve') || q.includes('drill')) {
      reply = 'Focus on the "Top Hand Control" drill: drive half-volleys through cone gates with your top hand dominating the grip for carpet-hugging precision.';
    } else if (q.includes('weakness') || q.includes('out')) {
      reply = 'Dismissals in early overs typically stem from reaching away from the body. Keep your head positioned right above the line of contact.';
    }
    return {
      reply,
      is_fallback: true,
      provider: 'nodejs-deterministic-engine',
      latency_ms: latencyMs,
      telemetry: providerManager.getTelemetry()
    };
  }

  _getFallbackCommentary(eventType, runs, shotType, latencyMs) {
    const pool = {
      DOT: [
        'Solid forward defensive stroke right back to the bowler. Dot ball!',
        'Beaten outside the off stump! Good carry to the wicketkeeper.',
        'Pushed into the offside, fielder attacks the ball quickly. No run.'
      ],
      SINGLE: [
        'Nudged softly into the leg-side gap for a brisk single.',
        'Pushed into the covers and they scamper through safely!'
      ],
      DOUBLE: [
        'Driven nicely into deep extra cover, good aggressive turn for two!',
        'Clipped off the pads, excellent running between the wickets.'
      ],
      FOUR: [
        'CRACK! Pierced the cover gap with pinpoint precision, that is FOUR!',
        'Short ball pulled away aggressively into the square leg fence!'
      ],
      SIX: [
        'HIGH AND HANDSOME! Launched straight over long-on for a MAXIMUM!',
        'WHAT A SHOT! Clean connection, sailing way back into the stands!'
      ],
      WICKET: [
        'BOWLED HIM! The bails go flying as the off-stump is knocked back!',
        'CAUGHT! Spliced in the air and taken cleanly in the deep!'
      ]
    };
    const key = (eventType || 'DOT').toUpperCase();
    const lines = pool[key] || pool.DOT;
    const commentary = lines[Math.floor(Math.random() * lines.length)];

    return {
      success: true,
      commentary,
      is_fallback: true,
      provider: 'nodejs-deterministic-commentary-engine',
      event_type: key,
      latency_ms: latencyMs,
      telemetry: providerManager.getTelemetry()
    };
  }

  _getFallbackRules(question, latencyMs) {
    const q = (question || '').toLowerCase();
    let name = 'Leg Before Wicket (LBW)';
    let summary = 'A batter is out LBW if the ball pitches in line or outside off stump, misses the bat, and strikes the pad in line with the stumps projected to hit.';
    let tip = 'Never pad away deliveries outside off stump without offering a stroke.';

    if (q.includes('no ball') || q.includes('free hit')) {
      name = 'No Ball & Free Hit';
      summary = 'A delivery where the bowler oversteps the popping crease or bowls an illegal high full toss. Awards 1 run and a Free Hit.';
      tip = 'Take full advantage of Free Hit balls by attempting lofted boundaries.';
    } else if (q.includes('powerplay')) {
      name = 'Fielding Restrictions (Powerplay)';
      summary = 'Overs 1-6 in standard T20 allow only 2 fielders outside the 30-yard circle.';
      tip = 'Loft deliveries over the 30-yard ring during powerplays.';
    }

    return {
      success: true,
      answer: `### ${name}\n\n${summary}\n\n**Tactical Tip:** ${tip}\n\n*(Note: Curated MCC rule fallback delivered while AI service is offline)*`,
      matched_rules: [{ name, summary, tactical_tip: tip }],
      is_fallback: true,
      provider: 'nodejs-deterministic-rules-engine',
      latency_ms: latencyMs,
      telemetry: providerManager.getTelemetry()
    };
  }
}

module.exports = new OrchestratorAdapter();
