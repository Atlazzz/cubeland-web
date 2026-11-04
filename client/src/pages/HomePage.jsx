import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import Tutorials from '../components/Tutorials';
import About from '../components/About';

function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Tutorials />
      <About />
    </>
  );
}

export default HomePage;