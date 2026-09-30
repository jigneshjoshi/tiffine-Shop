import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import RegisterVendor from './pages/RegisterVendor';
import RegisterCustomer from './pages/RegisterCustomer';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import TiffinDetails from './pages/TiffinDetails';
import OrderDetails from './pages/OrderDetails';
import DeclarationModal from './components/DeclarationModal';
import LocationPickerModal from './components/LocationPickerModal';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [selectedArea, setSelectedArea] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  const handleLocationSelected = (loc) => {
    setSelectedArea(loc.area);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar
          selectedArea={selectedArea}
          onOpenLocationModal={() => setShowLocationModal(true)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                selectedArea={selectedArea}
                setSelectedArea={setSelectedArea}
                onOpenLocationModal={() => setShowLocationModal(true)}
              />
            }
          />
          <Route path="/tiffin/:id" element={<TiffinDetails onOpenLocationModal={() => setShowLocationModal(true)} />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/order-details/:orderId" element={<OrderDetails />} />
          <Route path="/register-vendor" element={<RegisterVendor />} />
          <Route path="/register-customer" element={<RegisterCustomer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />
        </Routes>
      </div>

      <Footer onOpenDeclaration={() => setShowDeclarationModal(true)} />

      {/* Global Modals */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelected}
      />

      <DeclarationModal
        isOpen={showDeclarationModal}
        onClose={() => setShowDeclarationModal(false)}
      />

      {/* Modern Global Notification System */}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'inherit',
          },
        }}
      />
    </div>
  );
}
