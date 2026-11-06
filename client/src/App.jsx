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
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
//import ComingSoonPage from './pages/ComingSoonPage';
import OrdersPage from './pages/OrdersPage';
import StaffRoute from './components/StaffRoute';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminTutorialsPage from './pages/AdminTutorialsPage';
import TutorialsPage from './pages/TutorialsPage';
import TutorialDetailPage from './pages/TutorialDetailPage';
import ContactPage from './pages/ContactPage';
import AdminMessagesPage from './pages/AdminMessagesPage';

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
          path="/pedido"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedidos/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutoriales"
          element={<TutorialsPage />}
        />
        <Route
          path="/tutoriales/:id"
          element={<TutorialDetailPage />}
        />
        <Route
          path="/contacto"
          element={<ContactPage />}
        />
        <Route
          path="/admin/productos"
          element={
            <StaffRoute>
              <AdminProductsPage />
            </StaffRoute>
          }
        />
       <Route
          path="/admin/pedidos"
          element={
            <StaffRoute>
              <AdminOrdersPage />
            </StaffRoute>
          }
        />
        <Route
          path="/admin/tutoriales"
          element={
            <StaffRoute>
              <AdminTutorialsPage />
            </StaffRoute>
          }
        />
        <Route
          path="/admin/mensajes"
          element={
            <StaffRoute>
              <AdminMessagesPage />
            </StaffRoute>
          }
        /> 
      </Routes>
      <Footer />
    </>
  );
}

export default App;