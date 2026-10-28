import { LOGO_OPTIONS } from './logoOptions';
import './logoPreview.css';

function Lockup({ mark, tone, size }) {
  const Mark = mark;
  return (
    <span className={`lpv-lockup lpv-${tone}`} style={{ '--size': `${size}px` }}>
      <Mark tone={tone} size={size} />
      <span className="lpv-word">RAISE</span>
    </span>
  );
}

/** Dev-only page at /logo-preview: four logo options, for choosing one. */
function LogoPreview() {
  return (
    <main className="lpv">
      <h1>RAISE logo options</h1>
      <p className="lpv-note">Dev-only preview. The app still uses the current mark. Pick one and it can replace it.</p>
      <div className="lpv-grid">
        {LOGO_OPTIONS.map(({ id, name, idea, Mark: mark }, i) => {
          const Mark = mark;
          return (
          <section key={id} className="lpv-card">
            <h2>{i + 1}. {name}</h2>
            <p>{idea}</p>
            <div className="lpv-row">
              <div className="lpv-panel lpv-panel-light"><Lockup mark={Mark} tone="light" size={72} /></div>
              <div className="lpv-panel lpv-panel-dark"><Lockup mark={Mark} tone="dark" size={72} /></div>
            </div>
            <div className="lpv-row">
              <div className="lpv-panel lpv-panel-light lpv-small">
                <Lockup mark={Mark} tone="light" size={28} />
                <span className="lpv-fav" title="Favicon, 32px"><Mark tone="light" size={32} /></span>
                <span className="lpv-fav" title="Favicon, 16px"><Mark tone="light" size={16} /></span>
              </div>
              <div className="lpv-panel lpv-panel-dark lpv-small">
                <Lockup mark={Mark} tone="dark" size={28} />
                <span className="lpv-fav" title="Favicon, 32px"><Mark tone="dark" size={32} /></span>
                <span className="lpv-fav" title="Favicon, 16px"><Mark tone="dark" size={16} /></span>
              </div>
            </div>
            <div className="lpv-tab">
              <span className="lpv-tab-fav"><Mark tone="light" size={16} /></span>
              <span>RAISE</span>
              <span className="lpv-tab-label">Browser tab at 16px</span>
            </div>
          </section>
          );
        })}
      </div>
    </main>
  );
}

export default LogoPreview;
