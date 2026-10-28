import { lazy, useEffect } from 'react';
import AuraBackground from './components/AuraBackground.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Mission from './components/Mission.jsx';
import Deferred from './components/Deferred.jsx';
import { pageLoaded, showSectionsWhenIdle } from './lazyLoad.js';

// Below-the-fold sections are separate files, downloaded and rendered on demand (see Deferred).
const TeamGallery = lazy(() => import('./components/TeamGallery.jsx'));
const OfficerContacts = lazy(() => import('./components/OfficerContacts.jsx'));
const Contact = lazy(() => import('./components/Contact.jsx'));

export default function App() {
  // Once the first load is done, render the remaining sections one per idle moment (their
  // photos, the gallery and Turnstile still wait until they're near), so find-in-page and
  // screen readers see the whole page.
  useEffect(() => {
    pageLoaded.then(showSectionsWhenIdle);
  }, []);

  return (
    <>
      <AuraBackground />
      <Navbar />
      {/* Sits above the fixed aura layers. */}
      <div className="page">
        <main>
          <Hero />
          <Mission />
          <Deferred>
            <TeamGallery />
          </Deferred>
          <Deferred>
            <OfficerContacts />
          </Deferred>
          <Deferred>
            <Contact />
          </Deferred>
        </main>
        <footer className="footer">
          © {new Date().getFullYear()} Crimson Lotus Lion Dance
        </footer>
      </div>
    </>
  );
}
