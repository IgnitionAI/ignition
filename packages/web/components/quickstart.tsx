export default function QuickStart() {
  const code = `import { IgnitionEnvTFJS, CartPoleEnv } from 'ignitionai';

const cartpole = new CartPoleEnv();
const env = new IgnitionEnvTFJS(cartpole);

env.train('dqn');      // Zero config. It just works.
// env.infer();        // Switch to inference after training.
// env.setSpeed(50);   // Turbo training (50x faster).`

  return (
    <section id="quickstart" className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 border-t border-slate-800">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <div className="inline-flex font-medium bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-200 pb-3">
              Quick Start
            </div>
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">
              Train your first agent in 7 lines
            </h2>
            <p className="text-lg text-slate-400">
              No neural network code. No hyperparameter tuning. No config files. Describe your world, call <code className="text-indigo-400 font-mono">train()</code>, and the framework does the rest.
            </p>
          </div>

          {/* Code block */}
          <div className="max-w-3xl mx-auto" data-aos="fade-up">
            <div className="relative bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              {/* Window controls */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-slate-500 font-mono">cartpole.ts</span>
              </div>
              {/* Code */}
              <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              That's it. The agent learns. The pole stays up.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
