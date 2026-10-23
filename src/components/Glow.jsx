import BorderGlow from './BorderGlow.jsx';

// BorderGlow preset in Crimson Lotus colors (gold glow, gold/crimson border sweep).
// Defaults to a transparent fill so it can wrap see-through elements like the glass navbar.
export default function Glow({ className = '', ...props }) {
  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor="45 85 72"
      backgroundColor="transparent"
      borderRadius={8}
      glowRadius={24}
      glowIntensity={1}
      coneSpread={25}
      colors={['#f3d77a', '#c9a227', '#e0453a']}
      {...props}
      className={`glow-ring ${className}`}
    />
  );
}
