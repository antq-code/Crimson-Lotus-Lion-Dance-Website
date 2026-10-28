import AuraBackground from './components/AuraBackground.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Mission from './components/Mission.jsx';
import TeamGallery from './components/TeamGallery.jsx';
import OfficerContacts from './components/OfficerContacts.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <>
      <AuraBackground />
      <Navbar />
      {/* Sits above the fixed aura layers. */}
      <div className="page">
        <main>
          <Hero />
          <Mission />
          <TeamGallery />
          <OfficerContacts />
          <Contact />
        </main>
        <footer className="footer">
          © {new Date().getFullYear()} Crimson Lotus Lion Dance
        </footer>
      </div>
    </>
  );
}
