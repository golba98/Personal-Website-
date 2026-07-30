import Words from "../components/Words";
import { background, toolkitGroups } from "../content";

export default function Toolkit() {
  return (
    <section id="toolkit" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Toolkit
        </p>
        <h2 data-stagger>
          <Words text="What I work with" />
        </h2>
        <p className="lede" data-stagger>
          All of it is used above. I run Fedora.
        </p>
      </div>

      <div className="toolkit" data-reveal>
        {toolkitGroups.map((group) => (
          <div className="toolkit-group" key={group.label} data-stagger>
            <h3>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="section-head section-head-tight" data-reveal>
        <p className="eyebrow" data-stagger>
          Background
        </p>
        <h2 data-stagger>
          <Words text="How I got here" />
        </h2>
      </div>

      <ol className="timeline" data-reveal>
        {background.map((entry) => (
          <li key={entry.title} data-stagger>
            <h3>{entry.title}</h3>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
