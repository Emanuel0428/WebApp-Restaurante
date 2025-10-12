import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Contextos
import { CartProvider } from './context/CartContext';

// Componentes generales
import Layout from './components/Layout';

// Páginas públicas
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import CheckoutPage from './pages/CheckoutPage';
import Confirmation from './pages/Confirmation';

// Autenticación
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';

// Panel de administración
import AdminPage from './pages/admin/AdminPage';
import UserManagement from './pages/admin/UserManagement';
import AddProductForm from './pages/admin/AddProductForm';
import ManageProducts from './pages/admin/ManageProducts';
import ManageIngredients from './pages/admin/manageIngredients';
import ManageInventory from './pages/admin/ManageInventory';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminStatisticsPage from './pages/admin/AdminStadisticsPage';
import AdminCashHistoryPage from './pages/admin/AdminCashHistoryPage';
import SalesChartPage from './pages/admin/SalesChartPage';

import MeseroPage from './pages/admin/MeseroPage';

// confrimación de mesa
import TableConfirmation from './pages/TableConfirmation';

// (Opcional) componente para rutas protegidas
// import PrivateRoute from './components/PrivateRoute';
import HistoryTab from './pages/HistoryTab';

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>

          {/** RUTAS QUE USAN EL LAYOUT GENERAL */}
          <Route element={<Layout />}>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation" element={<Confirmation />} />

            {/* Perfil (requiere sesión) */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<HistoryTab />} />
          </Route>

          {/** RUTAS DE AUTENTICACIÓN (sin Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/** PANEL ADMINISTRACIÓN */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/usuarios" element={<UserManagement />} />
          <Route path="/admin/add-product" element={<AddProductForm />} />
          <Route path="/admin/manage-products" element={<ManageProducts />} />
          <Route path="/admin/manage-ingredients" element={<ManageIngredients />} />
          <Route path="/admin/manage-inventory" element={<ManageInventory />} />
          <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
          <Route path="/admin/estadisticas" element={<AdminStatisticsPage />} />
          <Route path="/admin/caja-historial" element={<AdminCashHistoryPage />} />
          <Route path="/admin/ventas" element={<SalesChartPage />} />

          <Route path="/mesero" element={<MeseroPage />} />

          {/* Other routes */}
          <Route path="/table-confirmation" element={<TableConfirmation />} />

        </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;
