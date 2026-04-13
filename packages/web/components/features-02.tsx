import Particles from './particles'
import Highlighter, { HighlighterItem } from './highlighter'

export default function Features02() {
  return (
    <section className="relative">

      {/* Particles animation */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-80 h-80 -mt-24 -ml-32">
        <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />    
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-16 md:pt-32">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <h2 className="h2 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4">Everything you need to ship RL.</h2>
            <p className="text-lg text-slate-400">Three algorithms, auto-configuration, ONNX export, HuggingFace storage, and five working demos. All TypeScript, all open source.</p>
          </div>

          {/* Highlighted boxes */}
          <div className="relative pb-12 md:pb-20">
            {/* Blurred shape */}
            <div className="absolute bottom-0 -mb-20 left-1/2 -translate-x-1/2 blur-2xl opacity-50 pointer-events-none" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
                <defs>
                  <linearGradient id="bs2-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path fill="url(#bs2-a)" fillRule="evenodd" d="m346 898 461 369-284 58z" transform="translate(-346 -898)" />
              </svg>
            </div>
            {/* Grid */}
            <Highlighter className="grid md:grid-cols-12 gap-6 group">
              {/* Box #1 */}
              <div className="md:col-span-12" data-aos="fade-down">
                <HighlighterItem>
                  <div className="relative h-full bg-slate-900 rounded-[inherit] z-20 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      {/* Blurred shape */}
                      <div className="absolute right-0 top-0 blur-2xl" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="342" height="393">
                          <defs>
                            <linearGradient id="bs-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
                              <stop offset="0%" stopColor="#6366F1" />
                              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path fill="url(#bs-a)" fillRule="evenodd" d="m104 .827 461 369-284 58z" transform="translate(0 -112.827)" opacity=".7" />
                        </svg>
                      </div>
                      {/* Radial gradient */}
                      <div className="absolute flex items-center justify-center bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 h-full aspect-square" aria-hidden="true">
                        <div className="absolute inset-0 translate-z-0 bg-indigo-500 rounded-full blur-[120px] opacity-70" />
                        <div className="absolute w-1/4 h-1/4 translate-z-0 bg-indigo-400 rounded-full blur-[40px]" />
                      </div>
                      {/* Text */}
                      <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8 md:pr-0">
                        <div className="mb-5">
                          <div>
                            <h3 className="inline-flex text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-1">Train → ONNX → deploy anywhere</h3>
                            <p className="text-slate-400">Train in the browser with TensorFlow.js, then export to ONNX and deploy in Unity (Sentis), Unreal (NNE), Python, C++, or edge devices. One pipeline from prototype to production.</p>
                          </div>
                        </div>
                        <div>
                          <a className="btn-sm text-slate-300 hover:text-white transition duration-150 ease-in-out group [background:linear-gradient(var(--color-slate-900),var(--color-slate-900))_padding-box,conic-gradient(var(--color-slate-400),var(--color-slate-700)_25%,var(--color-slate-700)_75%,var(--color-slate-400)_100%)_border-box] relative before:absolute before:inset-0 before:bg-slate-800/30 before:rounded-full before:pointer-events-none" href="#0">
                            <span className="relative inline-flex items-center">
                              Learn more <span className="tracking-normal text-indigo-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">-&gt;</span>
                            </span>
                          </a>
                        </div>
                      </div>
                      {/* Deploy diagram */}
                      <div className="relative w-full h-64 md:h-auto overflow-hidden flex items-center justify-center p-6 md:p-8">
                        <svg
                          viewBox="0 0 504 400"
                          className="w-full h-auto max-w-[504px]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-label="Train in browser, export ONNX, deploy anywhere"
                        >
                          <defs>
                            <linearGradient id="deploy-node" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#1e293b" />
                              <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <linearGradient id="deploy-onnx" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818CF8" />
                              <stop offset="100%" stopColor="#4338CA" />
                            </linearGradient>
                          </defs>

                          {/* Connection lines */}
                          <g stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.55">
                            <line x1="120" y1="200" x2="220" y2="200" />
                            <line x1="284" y1="200" x2="384" y2="120" />
                            <line x1="284" y1="200" x2="384" y2="200" />
                            <line x1="284" y1="200" x2="384" y2="280" />
                            <line x1="252" y1="232" x2="252" y2="330" />
                          </g>

                          {/* Browser (source) */}
                          <g>
                            <rect x="40" y="168" width="80" height="64" rx="10" fill="url(#deploy-node)" stroke="#334155" strokeWidth="1" />
                            <rect x="48" y="176" width="64" height="10" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                            <circle cx="53" cy="181" r="1.5" fill="#f87171" />
                            <circle cx="58" cy="181" r="1.5" fill="#fbbf24" />
                            <circle cx="63" cy="181" r="1.5" fill="#34d399" />
                            <text x="80" y="208" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">Browser</text>
                            <text x="80" y="222" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">TF.js</text>
                          </g>

                          {/* ONNX core */}
                          <g>
                            <rect x="220" y="168" width="64" height="64" rx="14" fill="url(#deploy-onnx)" />
                            <rect x="220" y="168" width="64" height="64" rx="14" fill="none" stroke="#A5B4FC" strokeWidth="1" opacity="0.6" />
                            <text x="252" y="196" fill="#ffffff" fontSize="13" fontFamily="ui-sans-serif, system-ui" fontWeight="700" textAnchor="middle">ONNX</text>
                            <text x="252" y="212" fill="#C7D2FE" fontSize="8" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">.onnx</text>
                          </g>

                          {/* Deploy targets */}
                          <g>
                            {/* Unity */}
                            <rect x="384" y="92" width="92" height="56" rx="10" fill="url(#deploy-node)" stroke="#334155" strokeWidth="1" />
                            <text x="430" y="118" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">Unity</text>
                            <text x="430" y="132" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">Sentis</text>

                            {/* Unreal */}
                            <rect x="384" y="172" width="92" height="56" rx="10" fill="url(#deploy-node)" stroke="#334155" strokeWidth="1" />
                            <text x="430" y="198" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">Unreal</text>
                            <text x="430" y="212" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">NNE</text>

                            {/* Python */}
                            <rect x="384" y="252" width="92" height="56" rx="10" fill="url(#deploy-node)" stroke="#334155" strokeWidth="1" />
                            <text x="430" y="278" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">Python</text>
                            <text x="430" y="292" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">ORT</text>

                            {/* Edge */}
                            <rect x="206" y="320" width="92" height="48" rx="10" fill="url(#deploy-node)" stroke="#334155" strokeWidth="1" />
                            <text x="252" y="342" fill="#e2e8f0" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">Edge / C++</text>
                            <text x="252" y="356" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">Mobile · WASM</text>
                          </g>

                          {/* Train arrow label */}
                          <text x="170" y="192" fill="#818CF8" fontSize="9" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">train</text>
                          <text x="334" y="150" fill="#818CF8" fontSize="9" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle">export</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </HighlighterItem>
              </div>
              {/* Box #2 */}
              <div className="md:col-span-7" data-aos="fade-down">
                <HighlighterItem>
                  <div className="relative h-full bg-slate-900 rounded-[inherit] z-20 overflow-hidden">
                    <div className="flex flex-col">
                      {/* Radial gradient */}
                      <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square" aria-hidden="true">
                        <div className="absolute inset-0 translate-z-0 bg-slate-800 rounded-full blur-[80px]" />
                      </div>
                      {/* Text */}
                      <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                        <div>
                          <h3 className="inline-flex text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-1">Three algorithms, one API</h3>
                          <p className="text-slate-400">DQN, PPO, and tabular Q-Learning. Switch with one word: <code className="text-indigo-300">env.train(&apos;ppo&apos;)</code>. Override hyperparameters only when you need fine control.</p>
                        </div>
                      </div>
                      {/* Algorithms diagram */}
                      <div className="relative w-full h-64 md:h-auto overflow-hidden md:pb-8 flex items-center justify-center p-6">
                        <svg
                          viewBox="0 0 536 230"
                          className="w-full h-auto max-w-[536px]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-label="DQN, PPO, Q-Table — three algorithms, one API"
                        >
                          <defs>
                            <linearGradient id="algo-card" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#1e293b" />
                              <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <linearGradient id="algo-dqn" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.9" />
                            </linearGradient>
                            <linearGradient id="algo-ppo" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#4338CA" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.9" />
                            </linearGradient>
                            <linearGradient id="algo-qtable" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#312E81" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
                            </linearGradient>
                          </defs>

                          {/* DQN card — reward curve */}
                          <g>
                            <rect x="24" y="30" width="152" height="170" rx="12" fill="url(#algo-card)" stroke="#334155" strokeWidth="1" />
                            <text x="40" y="54" fill="#e2e8f0" fontSize="13" fontFamily="ui-sans-serif, system-ui" fontWeight="700">DQN</text>
                            <text x="40" y="70" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui">Value-based</text>
                            {/* curve */}
                            <path d="M 40 165 Q 70 155, 85 135 T 130 95 T 160 75" stroke="#818CF8" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <path d="M 40 165 Q 70 155, 85 135 T 130 95 T 160 75 L 160 180 L 40 180 Z" fill="url(#algo-dqn)" opacity="0.5" />
                            {/* baseline */}
                            <line x1="40" y1="180" x2="160" y2="180" stroke="#334155" strokeWidth="1" />
                            <text x="100" y="195" fill="#64748b" fontSize="8" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">episodes</text>
                          </g>

                          {/* PPO card — policy curve */}
                          <g>
                            <rect x="192" y="30" width="152" height="170" rx="12" fill="url(#algo-card)" stroke="#334155" strokeWidth="1" />
                            <text x="208" y="54" fill="#e2e8f0" fontSize="13" fontFamily="ui-sans-serif, system-ui" fontWeight="700">PPO</text>
                            <text x="208" y="70" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui">Policy gradient</text>
                            <path d="M 208 170 Q 232 165, 248 150 Q 268 135, 284 110 Q 304 88, 328 78" stroke="#A5B4FC" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <path d="M 208 170 Q 232 165, 248 150 Q 268 135, 284 110 Q 304 88, 328 78 L 328 180 L 208 180 Z" fill="url(#algo-ppo)" opacity="0.5" />
                            <line x1="208" y1="180" x2="328" y2="180" stroke="#334155" strokeWidth="1" />
                            <text x="268" y="195" fill="#64748b" fontSize="8" fontFamily="ui-sans-serif, system-ui" textAnchor="middle">episodes</text>
                          </g>

                          {/* Q-Table card — tiny table */}
                          <g>
                            <rect x="360" y="30" width="152" height="170" rx="12" fill="url(#algo-card)" stroke="#334155" strokeWidth="1" />
                            <text x="376" y="54" fill="#e2e8f0" fontSize="13" fontFamily="ui-sans-serif, system-ui" fontWeight="700">Q-Table</text>
                            <text x="376" y="70" fill="#94a3b8" fontSize="9" fontFamily="ui-sans-serif, system-ui">Tabular</text>
                            {/* 4x4 grid */}
                            <g transform="translate(384 88)">
                              <rect width="112" height="92" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                              {/* cells — shade increases with "value" */}
                              <rect x="4"  y="4"  width="24" height="20" rx="2" fill="#6366F1" opacity="0.15" />
                              <rect x="32" y="4"  width="24" height="20" rx="2" fill="#6366F1" opacity="0.3" />
                              <rect x="60" y="4"  width="24" height="20" rx="2" fill="#6366F1" opacity="0.55" />
                              <rect x="88" y="4"  width="20" height="20" rx="2" fill="#6366F1" opacity="0.85" />

                              <rect x="4"  y="28" width="24" height="20" rx="2" fill="#6366F1" opacity="0.2" />
                              <rect x="32" y="28" width="24" height="20" rx="2" fill="#6366F1" opacity="0.4" />
                              <rect x="60" y="28" width="24" height="20" rx="2" fill="#6366F1" opacity="0.7" />
                              <rect x="88" y="28" width="20" height="20" rx="2" fill="#A5B4FC" opacity="0.9" />

                              <rect x="4"  y="52" width="24" height="20" rx="2" fill="#6366F1" opacity="0.1" />
                              <rect x="32" y="52" width="24" height="20" rx="2" fill="#6366F1" opacity="0.25" />
                              <rect x="60" y="52" width="24" height="20" rx="2" fill="#6366F1" opacity="0.5" />
                              <rect x="88" y="52" width="20" height="20" rx="2" fill="#6366F1" opacity="0.75" />

                              <rect x="4"  y="76" width="24" height="12" rx="2" fill="#6366F1" opacity="0.08" />
                              <rect x="32" y="76" width="24" height="12" rx="2" fill="#6366F1" opacity="0.2" />
                              <rect x="60" y="76" width="24" height="12" rx="2" fill="#6366F1" opacity="0.35" />
                              <rect x="88" y="76" width="20" height="12" rx="2" fill="#6366F1" opacity="0.55" />
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </HighlighterItem>
              </div>
              {/* Box #3 */}
              <div className="md:col-span-5" data-aos="fade-down">
                <HighlighterItem>
                  <div className="relative h-full bg-slate-900 rounded-[inherit] z-20 overflow-hidden">
                    <div className="flex flex-col">
                      {/* Radial gradient */}
                      <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square" aria-hidden="true">
                        <div className="absolute inset-0 translate-z-0 bg-slate-800 rounded-full blur-[80px]" />
                      </div>
                      {/* Text */}
                      <div className="md:max-w-[480px] shrink-0 order-1 md:order-none p-6 pt-0 md:p-8">
                        <div>
                          <h3 className="inline-flex text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-1">R3F-first</h3>
                          <p className="text-slate-400">Pair it with your Three.js scene — training loop runs independently of the render loop.</p>
                        </div>
                      </div>
                      {/* R3F logo diagram */}
                      <div className="relative w-full h-64 md:h-auto overflow-hidden md:pb-8 flex items-center justify-center p-6">
                        <svg
                          viewBox="0 0 230 230"
                          className="w-full h-auto max-w-[230px]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-label="React Three Fiber integration"
                        >
                          <defs>
                            <linearGradient id="r3f-cube-top" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#A5B4FC" />
                              <stop offset="100%" stopColor="#6366F1" />
                            </linearGradient>
                            <linearGradient id="r3f-cube-left" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4338CA" />
                              <stop offset="100%" stopColor="#312E81" />
                            </linearGradient>
                            <linearGradient id="r3f-cube-right" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#6366F1" />
                              <stop offset="100%" stopColor="#3730A3" />
                            </linearGradient>
                          </defs>

                          {/* React atom orbitals */}
                          <g stroke="#818CF8" strokeWidth="1.5" fill="none" opacity="0.85">
                            <ellipse cx="115" cy="115" rx="95" ry="35" />
                            <ellipse cx="115" cy="115" rx="95" ry="35" transform="rotate(60 115 115)" />
                            <ellipse cx="115" cy="115" rx="95" ry="35" transform="rotate(120 115 115)" />
                          </g>

                          {/* Isometric cube */}
                          <g transform="translate(115 115)">
                            {/* top face */}
                            <path d="M 0 -38 L 38 -19 L 0 0 L -38 -19 Z" fill="url(#r3f-cube-top)" stroke="#A5B4FC" strokeWidth="0.8" strokeLinejoin="round" />
                            {/* left face */}
                            <path d="M -38 -19 L 0 0 L 0 38 L -38 19 Z" fill="url(#r3f-cube-left)" stroke="#818CF8" strokeWidth="0.8" strokeLinejoin="round" />
                            {/* right face */}
                            <path d="M 38 -19 L 0 0 L 0 38 L 38 19 Z" fill="url(#r3f-cube-right)" stroke="#818CF8" strokeWidth="0.8" strokeLinejoin="round" />
                          </g>

                          {/* Nucleus */}
                          <circle cx="115" cy="115" r="4" fill="#F8FAFC" opacity="0.9" />

                          {/* Label */}
                          <text x="115" y="218" fill="#94a3b8" fontSize="10" fontFamily="ui-sans-serif, system-ui" fontWeight="600" textAnchor="middle" letterSpacing="2">R3F</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </HighlighterItem>
              </div>
            </Highlighter>
          </div>

          {/* Features list */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M7.999 2.34a4.733 4.733 0 0 0-6.604 6.778l5.904 5.762a1 1 0 0 0 1.4 0l5.915-5.77a4.733 4.733 0 0 0-6.615-6.77Zm5.208 5.348-5.208 5.079-5.2-5.07a2.734 2.734 0 0 1 3.867-3.864c.182.19.335.404.455.638a1.04 1.04 0 0 0 1.756 0 2.724 2.724 0 0 1 5.122 1.294 2.7 2.7 0 0 1-.792 1.923Z" />
                </svg>
                <h4 className="font-medium text-slate-50">Auto-configuration</h4>
              </div>
              <p className="text-sm text-slate-400">Input size deduced from <code>observe()</code>, action size from <code>actions.length</code>. You never touch network code.</p>
            </div>
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0ZM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12Zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2Z" />
                </svg>
                <h4 className="font-medium text-slate-50">WebGPU acceleration</h4>
              </div>
              <p className="text-sm text-slate-400">TensorFlow.js auto-selects WebGPU → WebGL → WASM → CPU. No CUDA, no install.</p>
            </div>
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M14 0a2 2 0 0 1 2 2v4a1 1 0 0 1-2 0V2H2v12h4a1 1 0 0 1 0 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12Zm-1.957 10.629 3.664 3.664a1 1 0 0 1-1.414 1.414l-3.664-3.664-.644 2.578a.5.5 0 0 1-.476.379H9.5a.5.5 0 0 1-.48-.362l-2-7a.5.5 0 0 1 .618-.618l7 2a.5.5 0 0 1-.017.965l-2.578.644Z" />
                </svg>
                <h4 className="font-medium text-slate-50">Turbo training</h4>
              </div>
              <p className="text-sm text-slate-400"><code>env.setSpeed(50)</code> — 50× faster convergence. Drop back to 1× to watch the agent play.</p>
            </div>
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M14.3.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-8 8c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l8-8ZM15 7c.6 0 1 .4 1 1 0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c.6 0 1 .4 1 1s-.4 1-1 1C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6c0-.6.4-1 1-1Z" />
                </svg>
                <h4 className="font-medium text-slate-50">HuggingFace storage</h4>
              </div>
              <p className="text-sm text-slate-400">Save and load trained models from HF Hub with one line. Share weights like a dataset.</p>
            </div>
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12Zm0 14V2H2v12h12Zm-3-7H5a1 1 0 1 1 0-2h6a1 1 0 0 1 0 2Zm0 4H5a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2Z" />
                </svg>
                <h4 className="font-medium text-slate-50">Strict TypeScript</h4>
              </div>
              <p className="text-sm text-slate-400">No <code>any</code>, Zod-validated configs, 184+ tests, CI/CD. Production-ready from day one.</p>
            </div>
            {/* Feature */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <svg className="shrink-0 fill-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M14.574 5.67a13.292 13.292 0 0 1 1.298 1.842 1 1 0 0 1 0 .98C15.743 8.716 12.706 14 8 14a6.391 6.391 0 0 1-1.557-.2l1.815-1.815C10.97 11.82 13.06 9.13 13.82 8c-.163-.243-.39-.56-.669-.907l1.424-1.424ZM.294 15.706a.999.999 0 0 1-.002-1.413l2.53-2.529C1.171 10.291.197 8.615.127 8.49a.998.998 0 0 1-.002-.975C.251 7.29 3.246 2 8 2c1.331 0 2.515.431 3.548 1.038L14.293.293a.999.999 0 1 1 1.414 1.414l-14 14a.997.997 0 0 1-1.414 0ZM2.18 8a12.603 12.603 0 0 0 2.06 2.347l1.833-1.834A1.925 1.925 0 0 1 6 8a2 2 0 0 1 2-2c.178 0 .348.03.512.074l1.566-1.566C9.438 4.201 8.742 4 8 4 5.146 4 2.958 6.835 2.181 8Z" />
                </svg>
                <h4 className="font-medium text-slate-50">Five working demos</h4>
              </div>
              <p className="text-sm text-slate-400">GridWorld, CartPole, MountainCar, CartPole 3D, and Car Circuit. Clone, run, learn.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}