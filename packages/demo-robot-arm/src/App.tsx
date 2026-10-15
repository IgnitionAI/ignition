import { useEffect, useRef, useState } from 'react';
import { RobotArmController } from './controller';
import { useDemoStore } from './store';
import { detectLang, makeT } from './i18n';
import { Scene3D } from './Scene3D';
import { Hud } from './Hud';
import { Controls } from './Controls';
import { maybeRunE2E } from './e2e';

export default function App() {
  const controllerRef = useRef<RobotArmController | null>(null);
  if (controllerRef.current === null) {
    const seed = Math.floor(Math.random() * 1_000_000) + 1;
    controllerRef.current = new RobotArmController(seed);
  }
  const controller = controllerRef.current;

  const lang = useDemoStore((s) => s.lang);
  const setLang = useDemoStore((s) => s.setLang);
  const setHud = useDemoStore((s) => s.setHud);
  const [tfReady, setTfReady] = useState(false);
  const t = makeT(lang);

  useEffect(() => {
    setLang(detectLang());
  }, [setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `IgnitionAI — ${t.title}`;
  }, [lang, t.title]);

  useEffect(() => {
    controller.onUpdate(() => useDemoStore.getState().setHud(controller.snapshot()));
    setHud(controller.snapshot());
    controller
      .initBackend() // warm TF backend; the demo stays stopped at load
      .then(() => setTfReady(true))
      .catch(() => setTfReady(true));
    maybeRunE2E(controller);
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
    // controller lives for the app lifetime (StrictMode remounts recreate it)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, setHud]);

  const localeLink = (path: string) => `/${lang}${path}`;

  return (
    <div className="app">
      <header>
        <a className="back" href={localeLink('/')}>{t.back}</a>
        <h1>
          Ignition<span className="brand">AI</span>
          <span className="subtitle">{t.title}</span>
        </h1>
        <p className="tagline">{t.tagline}</p>
        <div className="lang-switch" role="group" aria-label="lang">
          <a href="?lang=fr" aria-current={lang === 'fr' ? 'true' : undefined}>FR</a>
          <a href="?lang=en" aria-current={lang === 'en' ? 'true' : undefined}>EN</a>
        </div>
      </header>

      {!tfReady && <p className="loading" role="status">{t.loading}</p>}

      <main>
        <Scene3D />
        <Controls controller={controller} />
        <Hud />
      </main>
    </div>
  );
}
