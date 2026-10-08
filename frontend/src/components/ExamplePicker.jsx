import BrandMark from './BrandMark';
import { DEMO_EXAMPLES } from '../constants/demoExamples';

function ExamplePicker({ onChoose, onSkip }) {
  return (
    <div className="example-picker">
      <div className="pl-topbar">
        <div className="app-container pl-topbar-inner">
          <BrandMark variant="pl" />
        </div>
      </div>

      <main className="app-container example-picker-body">
        <h1 className="example-picker-title">Try RAISE with an example</h1>
        <p className="example-picker-intro">
          Pick one. RAISE reads the sentence, shows what it flags, and sets up a checklist you
          can work through with made-up data.
        </p>

        <div className="example-picker-grid">
          {DEMO_EXAMPLES.map((ex) => (
            <div key={ex.key} className={`example-card ${ex.recommended ? 'example-card-recommended' : ''}`}>
              <div className="example-card-header">
                <h2 className="example-card-title">{ex.title}</h2>
                {ex.recommended && <span className="example-card-badge">Recommended</span>}
              </div>
              <p className="example-card-sentence">&ldquo;{ex.sentence}&rdquo;</p>
              <button className="btn-primary example-card-btn" onClick={() => onChoose(ex)}>
                Try this example
              </button>
            </div>
          ))}
        </div>

        <button className="btn-link example-picker-skip" onClick={onSkip}>
          Skip, show me the app
        </button>
      </main>
    </div>
  );
}

export default ExamplePicker;
