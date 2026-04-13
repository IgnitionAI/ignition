const DEMOS = [
  {
    title: 'GridWorld',
    description: 'Agent finds the shortest path in a 7×7 grid. Your first RL "hello world".',
    tech: '2D Canvas',
    algos: 'Q-Table · DQN · PPO',
    accent: '#22c55e',
  },
  {
    title: 'CartPole',
    description: 'Classic pole-balancing benchmark with Euler physics. Converges fast.',
    tech: '2D Canvas',
    algos: 'DQN · PPO',
    accent: '#3b82f6',
  },
  {
    title: 'MountainCar',
    description: 'Sparse reward challenge. Agent discovers the counterintuitive momentum strategy.',
    tech: '2D Canvas',
    algos: 'DQN · PPO',
    accent: '#f59e0b',
  },
  {
    title: 'CartPole 3D',
    description: 'Classic CartPole rendered in 3D with React Three Fiber. Metallic materials and shadows.',
    tech: 'R3F',
    algos: 'DQN · PPO',
    accent: '#6366f1',
  },
  {
    title: 'Car Circuit',
    description: 'A 3D car learns to drive an oval circuit. Chase cam, minimap, trail, 1×–50× speed. The hero demo.',
    tech: 'R3F',
    algos: 'DQN · PPO',
    accent: '#ec4899',
    featured: true,
  },
]

export default function Demos() {
  return (
    <section id="demos" className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 border-t border-slate-800">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
              Live Demos
            </div>
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
              Watch agents learn in real time
            </h2>
            <p className="text-lg text-slate-400">
              Five interactive environments showing IgnitionAI in action. Each runs in your browser, trains locally, and demonstrates a different RL challenge.
            </p>
          </div>

          {/* Demo grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMOS.map((demo) => (
              <div
                key={demo.title}
                data-aos="fade-up"
                className={`relative group p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-colors ${
                  demo.featured ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: demo.accent, boxShadow: `0 0 12px ${demo.accent}` }}
                    />
                    <span className="text-xs text-slate-500 font-mono">{demo.tech}</span>
                  </div>
                  {demo.featured && (
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full px-2 py-0.5 font-medium">
                      HERO DEMO
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{demo.title}</h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{demo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">{demo.algos}</span>
                  <span className="text-indigo-400 text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
