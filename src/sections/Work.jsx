import { Install, Terminal } from "../components/Terminal";
import Words from "../components/Words";
import { projects } from "../content";

function Shot({ src, alt, depth = 1 }) {
  return (
    <figure className="shot" data-parallax={depth} data-scale>
      <div className="frame-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="shot-img">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    </figure>
  );
}

function Project({ project, index }) {
  return (
    <article className="project" data-reveal data-rail>
      <div className="project-rail" aria-hidden="true">
        <span className="project-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="project-track">
          <span className="project-fill" />
        </span>
      </div>

      <div className="project-main">
        <header className="project-head" data-stagger>
          <h3>{project.title}</h3>
          <span className="project-year">{project.year}</span>
        </header>

        <p className="project-role" data-stagger>
          {project.role}
        </p>
        <p className="project-summary" data-stagger>
          {project.summary}
        </p>
        <p className="project-proof" data-stagger>
          {project.proof}
        </p>

        {project.npm && (
          <div data-stagger>
            <Install pkg={project.npm} />
          </div>
        )}

        <ul className="stack" data-stagger>
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="project-links" data-stagger>
          <a href={project.repo} target="_blank" rel="noreferrer">
            View source<span className="arrow">→</span>
          </a>
          {project.secondaryRepo && (
            <a href={project.secondaryRepo.url} target="_blank" rel="noreferrer">
              {project.secondaryRepo.label}
              <span className="arrow">→</span>
            </a>
          )}
        </div>

        {/*
          One visual per project. A real screenshot always wins over the
          recreated terminal, so dropping a `shot` on the Codexa entry upgrades
          it with no code change — and never renders both.
        */}
        {(project.shot || project.startup) && (
          <div data-stagger>
            {project.shot ? (
              <Shot src={project.shot} alt={project.shotAlt} depth={index % 2 ? 0.6 : 1} />
            ) : (
              <Terminal
                screen={project.startup}
                compact={project.startupCompact}
                depth={index % 2 ? 0.6 : 1}
              />
            )}
            <p className="caption">
              {project.caption}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Work() {
  return (
    <section id="work" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Work
        </p>
        <h2 data-stagger>
          <Words text="What I built" />
        </h2>
        <p className="lede" data-stagger>
          Five projects. All of them run.
        </p>
      </div>

      <div className="projects">
        {projects.map((project, index) => (
          <Project key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
