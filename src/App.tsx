import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Trust from "./components/Trust";
import Menu from "./components/Menu";
import Events from "./components/Events";
import Reviews from "./components/Reviews";
import FAQ from "./components/FAQ";
import Location from "./components/Location";
import FinalCTA from "./components/FinalCTA";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <Trust />
      <Menu />
      <Events />
      <Reviews />
      <FAQ />
      <Location />
      <FinalCTA />
    </div>
  );
}
