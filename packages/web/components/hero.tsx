import Image from 'next/image'
import Particles from './particles'
import Illustration from '@/public/images/glow-bottom.svg'

export default function Hero() {
  return (
    <section>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* Particles animation */}
        <Particles className="absolute inset-0 -z-10" />

        {/* Illustration */}
        <div className="absolute inset-0 -z-10 -mx-28 rounded-b-[3rem] pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 -z-10">
            <Image src={Illustration} className="max-w-none" width={2146} priority alt="Hero Illustration" />
          </div>
        </div>

        <div className="pt-32 pb-16 md:pt-52 md:pb-32">

          {/* Hero content */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6" data-aos="fade-down">
              <div className="inline-flex relative before:absolute before:inset-0 before:bg-indigo-500 before:blur-md">
                <a className="btn-sm py-0.5 text-slate-300 hover:text-white transition duration-150 ease-in-out group [background:linear-gradient(var(--color-indigo-500),var(--color-indigo-500))_padding-box,linear-gradient(var(--color-indigo-500),var(--color-indigo-200)_75%,transparent_100%)_border-box] relative before:absolute before:inset-0 before:bg-slate-800/50 before:rounded-full before:pointer-events-none shadow-sm" href="https://github.com/IgnitionAI/ignition">
                  <span className="relative inline-flex items-center">
                    v0.1 is out — star us on GitHub <span className="tracking-normal text-indigo-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">-&gt;</span>
                  </span>
                </a>
              </div>
            </div>
            <h1 className="h1 bg-clip-text text-transparent bg-linear-to-r from-slate-200/60 via-slate-200 to-slate-200/60 pb-4" data-aos="fade-down">
              Train RL agents in your browser
            </h1>
            <p className="text-lg text-slate-300 mb-8" data-aos="fade-down" data-aos-delay="200">
              IgnitionAI is the ML-Agents of the JavaScript creative ecosystem. Describe your game world, call <code className="text-indigo-400 font-mono">env.train()</code>, and deploy anywhere via ONNX. No Python, no server, no GPU cluster.
            </p>
            <div className="max-w-xs mx-auto sm:max-w-none sm:inline-flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4" data-aos="fade-down" data-aos-delay="400">
              <div>
                <a className="btn text-slate-900 bg-linear-to-r from-white/80 via-white to-white/80 hover:bg-white w-full transition duration-150 ease-in-out group" href="#quickstart">
                  Get Started <span className="tracking-normal text-indigo-500 group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out ml-1">-&gt;</span>
                </a>
              </div>
              <div>
                <a className="btn text-slate-200 hover:text-white bg-slate-900/25 hover:bg-slate-900/30 w-full transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition">
                  <svg className="shrink-0 fill-slate-300 mr-3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>Star on GitHub</span>
                </a>
              </div>
            </div>

            {/* Install command */}
            <div className="mt-12" data-aos="fade-down" data-aos-delay="600">
              <div className="inline-flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-slate-300">
                <span className="text-indigo-400">$</span>
                <span>npm install ignitionai</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
