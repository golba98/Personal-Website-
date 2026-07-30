import { navItems, profile } from "../content";

/**
 * The JV monogram, geometry identical to public/favicon.svg — edit both together.
 * Drawn white-chip-on-black because the page background is black, which is the
 * same form the favicon takes on a dark tab bar.
 */
function Mark() {
  return (
    <svg className="nav-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <g fill="none" stroke="var(--bg)" strokeWidth="4.4" strokeLinecap="butt">
        <path d="M5.6 9.6h7.8" />
        <path d="M11.2 9.6v8.4c0 3.2-2.6 4.4-5.2 2.9" />
        <path d="M18.6 9.6 22.4 22.4 26.2 9.6" />
      </g>
    </svg>
  );
}

export default function Nav({ scrolled, active }) {
  return (
    <header className={`nav${scrolled ? " nav-on" : ""}`}>
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          <Mark />
          <span className="nav-brand-name">{profile.name}</span>
        </a>
        <nav aria-label="Sections">
          <ul className="nav-links">
            {navItems.map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  className={active === href.slice(1) ? "is-active" : ""}
                  aria-current={active === href.slice(1) ? "true" : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <span className="nav-progress" aria-hidden="true" />
    </header>
  );
}
