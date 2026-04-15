import Logo from './logo'

export default function Footer() {
  return (
    <footer>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Blocks */}
        <div className="grid sm:grid-cols-12 gap-8 py-8 md:py-12">

          {/* 1st block */}
          <div className="sm:col-span-12 lg:col-span-5 order-1 lg:order-none">
            <div className="h-full flex flex-col sm:flex-row lg:flex-col justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="mb-4">
                  <Logo />
                </div>
                <div className="text-sm text-slate-300 max-w-xs">
                  The ML-Agents of the JavaScript creative ecosystem. MIT licensed — use it for anything.
                </div>
                <div className="text-sm text-slate-500 mt-3">
                  © {new Date().getFullYear()} — A project by{' '}
                  <a
                    href="https://www.ignitionai.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition duration-150 ease-in-out"
                  >
                    IgnitionAI
                  </a>
                </div>
              </div>
              {/* Social links */}
              <ul className="flex">
                <li>
                  <a className="flex justify-center items-center text-indigo-500 hover:text-indigo-400 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition" target="_blank" rel="noopener noreferrer" aria-label="Github">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                    </svg>
                  </a>
                </li>
                <li className="ml-2">
                  <a className="flex justify-center items-center text-indigo-500 hover:text-indigo-400 transition duration-150 ease-in-out" href="https://www.npmjs.com/package/@ignitionai/core" target="_blank" rel="noopener noreferrer" aria-label="npm">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12v7h3v-5h2v5h1v-7H9Zm7 0v8h3v-1h3v-7h-6Zm2 1h2v5h-2v-5ZM2 12v7h3v-5h2v5h1v-7H2Zm21 0v7h3v-5h2v5h1v-5h2v5h1v-7H23Z" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Project */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h6 className="text-sm text-slate-50 font-medium mb-2">Project</h6>
            <ul className="text-sm space-y-2">
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition" target="_blank" rel="noopener noreferrer">GitHub</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://www.npmjs.com/package/@ignitionai/core" target="_blank" rel="noopener noreferrer">@ignitionai/core</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://www.npmjs.com/package/@ignitionai/backend-tfjs" target="_blank" rel="noopener noreferrer">@ignitionai/backend-tfjs</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="/changelog">Changelog</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition/blob/main/roadmap.md" target="_blank" rel="noopener noreferrer">Roadmap</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">License (MIT)</a>
              </li>
            </ul>
          </div>

          {/* Docs */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h6 className="text-sm text-slate-50 font-medium mb-2">Docs</h6>
            <ul className="text-sm space-y-2">
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="#quickstart">Quick Start</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition#readme" target="_blank" rel="noopener noreferrer">API Reference</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition#algorithms" target="_blank" rel="noopener noreferrer">Algorithms</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition#train-in-the-browser-deploy-everywhere" target="_blank" rel="noopener noreferrer">ONNX Export</a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-3">
            <h6 className="text-sm text-slate-50 font-medium mb-2">Community</h6>
            <ul className="text-sm space-y-2">
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition/issues" target="_blank" rel="noopener noreferrer">Issues</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition/discussions" target="_blank" rel="noopener noreferrer">Discussions</a>
              </li>
              <li>
                <a className="text-slate-400 hover:text-slate-200 transition duration-150 ease-in-out" href="https://github.com/IgnitionAI/ignition/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </footer>
  )
}
