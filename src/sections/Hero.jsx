import Words from "../components/Words";
import { profile } from "../content";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-a" />
        <span className="aurora-b" />
      </div>

      <div className="hero-inner">
        <p className="hero-eyebrow rise" style={{ "--d": "80ms" }}>
          {profile.role} · {profile.location}
        </p>

        <h1 className="hero-title">
          <span className="hero-line">
            <Words text="I build editors, dev tools," from={220} />
          </span>
          <span className="hero-line">
            <Words text="and language models." from={430} />
          </span>
        </h1>

        <p className="hero-lede rise" style={{ "--d": "680ms" }}>
          BSc Computer Science student, University of London. Everything below is a repo you can
          clone and run.
        </p>
      </div>
    </section>
  );
}
