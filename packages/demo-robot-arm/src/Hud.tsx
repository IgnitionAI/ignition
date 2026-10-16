import { useDemoStore, summarize } from './store';
import { makeT } from './i18n';

function RewardSparkline() {
  const hud = useDemoStore((s) => s.hud);
  const rewards = hud?.recentRewards ?? [];
  if (rewards.length < 2) return null;
  const w = 260;
  const h = 48;
  const min = Math.min(...rewards);
  const max = Math.max(...rewards);
  const span = max - min || 1;
  const points = rewards
    .map((r, i) => `${((i / (rewards.length - 1)) * w).toFixed(1)},${(h - ((r - min) / span) * (h - 8) - 4).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" role="img" aria-label={`reward min ${min.toFixed(3)} max ${max.toFixed(3)}`}>
      <polyline points={points} fill="none" stroke="#818cf8" strokeWidth="1.5" />
    </svg>
  );
}

export function Hud() {
  const hud = useDemoStore((s) => s.hud);
  const lang = useDemoStore((s) => s.lang);
  const t = makeT(lang);
  if (!hud) return null;
  const summary = summarize(hud.history);
  const fmt = (v: number) => v.toFixed(3);
  const deg = (r: number) => `${(r / (Math.PI / 180)).toFixed(0)}°`;

  return (
    <section className="hud" aria-label={t.summary}>
      <div className="hud-grid">
        <div className="hud-card">
          <h3>{t.stats}</h3>
          <dl>
            <div><dt>{t.mode}</dt><dd className={`mode-${hud.mode}`}>{t.modes[hud.mode]}</dd></div>
            <div><dt>{t.transitions}</dt><dd>{hud.transitions}</dd></div>
            <div><dt>{t.updates}</dt><dd>{hud.updates}</dd></div>
            <div><dt>{t.epsilon}</dt><dd>{hud.epsilon === null ? '—' : fmt(hud.epsilon)}</dd></div>
            <div><dt>{t.episodes}</dt><dd>{hud.episodes}</dd></div>
          </dl>
        </div>
        <div className="hud-card">
          <h3>{t.angles}</h3>
          <dl>
            <div><dt>{t.base}</dt><dd>{deg(hud.q0)} ({fmt(hud.q0)})</dd></div>
            <div><dt>{t.shoulder}</dt><dd>{deg(hud.q1)} ({fmt(hud.q1)})</dd></div>
            <div><dt>{t.elbow}</dt><dd>{deg(hud.q2)} ({fmt(hud.q2)})</dd></div>
            <div><dt>{t.distance}</dt><dd className={hud.distance <= hud.successDistance ? 'ok' : ''}>{fmt(hud.distance)} m</dd></div>
            <div><dt>{t.reward}</dt><dd>{fmt(hud.reward)}{hud.blocked ? ` (${t.blocked})` : ''}</dd></div>
          </dl>
        </div>
        <div className="hud-card">
          <h3>XYZ</h3>
          <dl>
            <div><dt>{t.tip}</dt><dd>({fmt(hud.tip.x)}, {fmt(hud.tip.y)}, {fmt(hud.tip.z)})</dd></div>
            <div><dt>{t.target}</dt><dd>({fmt(hud.target.x)}, {fmt(hud.target.y)}, {fmt(hud.target.z)})</dd></div>
          </dl>
          <h3 style={{ marginTop: 12 }}>{t.rewardHistory}</h3>
          <RewardSparkline />
        </div>
        <div className="hud-card">
          <h3>{t.summary}</h3>
          <dl>
            <div><dt>{t.successRate}</dt><dd>{summary.successRate === null ? '—' : `${(summary.successRate * 100).toFixed(0)} %`}</dd></div>
            <div><dt>{t.meanFinalDistance}</dt><dd>{summary.meanFinalDistance === null ? '—' : `${summary.meanFinalDistance.toFixed(3)} m`}</dd></div>
            <div><dt>{t.avgCommandsSuccess}</dt><dd>{summary.avgCommandsToSuccess === null ? '—' : summary.avgCommandsToSuccess.toFixed(1)}</dd></div>
            <div><dt>{t.lastEpisode}</dt><dd>
              {hud.lastEpisode
                ? `#${hud.lastEpisode.episode} — ${hud.lastEpisode.success ? t.success : t.truncated}, ${hud.lastEpisode.commands} ${t.commands}, ${hud.lastEpisode.finalDistance.toFixed(3)} m`
                : t.noEpisode}
            </dd></div>
          </dl>
        </div>
      </div>
      {hud.lastError && <p role="alert" className="error">{t.error}: {hud.lastError}</p>}
    </section>
  );
}
