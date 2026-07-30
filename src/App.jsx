import { profile } from "./content";
import { useGithubData } from "./github";
import { usePointerMagnet, useReveal, useScrollMotion } from "./motion";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import Work from "./sections/Work";
import Model from "./sections/Model";
import Github from "./sections/Github";
import Toolkit from "./sections/Toolkit";
import Contact from "./sections/Contact";

function App() {
  const { scrolled, active } = useScrollMotion();
  const github = useGithubData();

  useReveal();
  usePointerMagnet();

  return (
    <>
      <div className="curtain" aria-hidden="true" />
      <Nav scrolled={scrolled} active={active} />
      <div className="grain" aria-hidden="true" />
      <main>
        <Hero />
        <Work />
        <Model />
        <Github {...github} />
        <Toolkit />
        <Contact />
      </main>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.location}</span>
      </footer>
    </>
  );
}

export default App;
