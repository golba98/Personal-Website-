import { useEffect, useRef, useState } from "react";
import Words from "../components/Words";
import { lossCurve, modelSpec } from "../content";
import { reduced, useCountUp } from "../motion";

/** Real validation-loss curve, drawn from lossCurve.points. */
function LossChart() {
  const { points } = lossCurve;
  const w = 720;
  const h = 320;
  const pad = { top: 24, right: 28, bottom: 62, left: 52 };

  const xMax = Math.max(...points.map((p) => p.step));
  const yMin = 0.8;
  const yMax = Math.max(...points.map((p) => p.loss));

  const px = (v) => pad.left + (v / xMax) * (w - pad.left - pad.right);
  const py = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.top - pad.bottom);

  const line = points.map((p, i) => `${i ? "L" : "M"}${px(p.step)},${py(p.loss)}`).join(" ");
  const area = `${line} L${px(xMax)},${h - pad.bottom} L${px(points[0].step)},${h - pad.bottom} Z`;

  return (
    <figure className="chart" data-reveal>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Validation loss falling from 1.75 to 0.99 over 7,630 optimizer steps"
      >
        {[1.8, 1.5, 1.2, 0.9].map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.left} y1={py(t)} x2={w - pad.right} y2={py(t)} />
            <text className="axis" x={pad.left - 10} y={py(t) + 4} textAnchor="end">
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {[0, 2000, 4000, 6000, 7630].map((t) => (
          <text className="axis" key={t} x={px(t)} y={h - pad.bottom + 22} textAnchor="middle">
            {t.toLocaleString("en")}
          </text>
        ))}

        <path className="chart-area" d={area} />
        <path className="chart-line" d={line} />

        {points.map((p, i) => (
          <circle
            className="chart-dot"
            key={p.step}
            cx={px(p.step)}
            cy={py(p.loss)}
            r="3.5"
            style={{ "--dn": i }}
          >
            <title>{`step ${p.step.toLocaleString("en")} · loss ${p.loss} · perplexity ${p.ppl}`}</title>
          </circle>
        ))}

        <text
          className="chart-final"
          x={px(xMax) - 6}
          y={py(points.at(-1).loss) - 14}
          textAnchor="end"
        >
          0.9931
        </text>
        <text className="axis axis-title" x={w / 2} y={h - 14} textAnchor="middle">
          optimizer step
        </text>
      </svg>
      <figcaption>
        Validation loss, phase15-500m. Read from{" "}
        <code>logs/phase15-500m/evaluations/step_*.json</code>.
      </figcaption>
    </figure>
  );
}

function Counter({ metric }) {
  const [active, setActive] = useState(reduced());
  const ref = useRef(null);
  const display = useCountUp(metric, active);
  useEffect(() => {
    if (reduced() || !ref.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.45 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  /*
   * Screen readers get the real figure once, from the .sr-only span. The
   * animating copy is hidden from them so a count-up doesn't get announced as
   * dozens of wrong intermediate numbers.
   */
  return (
    <div ref={ref} data-stagger>
      <dt>
        <span className="sr-only">
          {metric.display} {metric.unit}
        </span>
        <span aria-hidden="true">
          {display} {metric.unit}
        </span>
      </dt>
      <dd>{metric.label}</dd>
    </div>
  );
}

export default function Model() {
  return (
    <section id="model" className="section section-model">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Model
        </p>
        <h2 data-stagger>
          <Words text="I trained a model" />
        </h2>
        <p className="lede" data-stagger>
          248M parameters, trained from scratch on one 16 GB GPU. 7,630 steps, bf16, no crashes.
        </p>
      </div>

      <dl className="spec" data-reveal aria-label={`Model architecture from ${modelSpec.source}`}>
        {modelSpec.rows.map(([label, value]) => (
          <div key={label} data-stagger>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <LossChart />

      <dl className="gpu" data-reveal>
        {lossCurve.gpu.map((metric) => <Counter key={metric.label} metric={metric} />)}
      </dl>

      <p className="caveat" data-reveal>
        <strong>What it can't do.</strong> {lossCurve.caveat}
      </p>
    </section>
  );
}
