import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToHash from './components/ScrollToHash';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import ComingSoonPage from './pages/ComingSoonPage';

function App() {
  return (
    <>
      <ScrollToHash />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/producto/:id" element={<ProductDetailPage />} />
        <Route path="/iniciar-sesion" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutoriales"
          element={
            <ComingSoonPage
              titulo="Tutoriales"
              descripcion="Estamos preparando guías paso a paso con imágenes, por tipo de cubo y nivel de dificultad."
            />
          }
        />
        <Route
          path="/contacto"
          element={
            <ComingSoonPage
              titulo="Contacto"
              descripcion="Pronto podrás ver nuestros datos de contacto, la ubicación en el mapa y enviarnos un mensaje."
            />
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

export default App;