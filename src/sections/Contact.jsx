import Words from "../components/Words";
import { place, profile } from "../content";
import { lengths, lesotho, marker, outline, provinces, viewBox } from "../za-map";

function Where() {
  return (
    <figure className="where" data-reveal>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label="Map of South Africa divided into its nine provinces, with the Eastern Cape filled"
      >
        {/* Internal borders first, so the heavier coastline draws over them. */}
        {provinces.map((province, index) => (
          <path
            key={province.name}
            className={`map-province${province.name === "Eastern Cape" ? " map-ec" : ""}`}
            style={{ "--len": province.len, "--pn": index }}
            d={province.d}
          />
        ))}
        <path className="map-outline" style={{ "--len": lengths.outline }} d={outline} />
        <path className="map-lesotho" style={{ "--len": lengths.lesotho }} d={lesotho} />
        <circle className="map-marker-ping" cx={marker.x} cy={marker.y} r="4" />
        <circle className="map-marker" cx={marker.x} cy={marker.y} r="4" />
      </svg>
      <figcaption><strong>Where I stay</strong><span>{place.caption}. {place.note}</span></figcaption>
    </figure>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="section section-contact">
      <div className="contact-layout">
        <Where />
        <div className="contact" data-reveal>
        <h2 data-stagger>
          <Words text="Get in touch." />
        </h2>
        <div className="contact-actions" data-stagger>
          <a className="button button-primary" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <a className="button" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="button" href={profile.resumeUrl} download>
            Download CV
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
