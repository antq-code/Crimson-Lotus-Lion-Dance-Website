import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Mission from './components/Mission.jsx';
import TeamCarousel from './components/TeamCarousel.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Mission />
        <TeamCarousel />
        <Contact />
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} Crimson Lotus Lion Dance
      </footer>
    </>
  );
}
