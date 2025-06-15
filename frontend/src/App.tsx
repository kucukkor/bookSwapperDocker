import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header, ProtectedRoute } from './components';
import { useAuthStore } from './store';
import useSocket from './hooks/useSocket';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ListingDetails } from './pages/ListingDetails';
import { MyListings } from './pages/MyListings';
import { CreateListing } from './pages/CreateListing';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Privacy } from './pages/Privacy';
import { HelpCenter } from './pages/HelpCenter';
import { ContactUs } from './pages/ContactUs';
import { ReviewsPending } from './pages/ReviewsPending';
import { ReviewsGiven } from './pages/ReviewsGiven';

function App() {
  const { isAuthenticated, token, loadProfile, initializeAuth } = useAuthStore();
  
  // Initialize socket connection - hook will handle auth internally
  const {
    isConnected,
    notifications,
    getUnreadNotificationCount,
  } = useSocket();

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Load user profile on app start if token exists
  useEffect(() => {
    if (token && isAuthenticated) {
      loadProfile();
    }
  }, [token, isAuthenticated, loadProfile]);

  // Log socket connection status
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Socket connection status:', isConnected ? 'Connected' : 'Disconnected');
      if (notifications.length > 0) {
        console.log(`${getUnreadNotificationCount()} unread notifications`);
      }
    }
  }, [isConnected, notifications, isAuthenticated, getUnreadNotificationCount]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            } 
          />

          {/* Protected routes with header */}
          <Route 
            path="/*" 
            element={
              <>
                <Header />
                <main>
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/listings" 
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/listing/:id" 
                      element={
                        <ProtectedRoute>
                          <ListingDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/my-listings" 
                      element={
                        <ProtectedRoute>
                          <MyListings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/add-listing" 
                      element={
                        <ProtectedRoute>
                          <CreateListing />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/messages" 
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/messages/:conversationId" 
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/notifications" 
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile/:userId" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile/privacy" 
                      element={
                        <ProtectedRoute>
                          <Privacy />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile/help" 
                      element={
                        <ProtectedRoute>
                          <HelpCenter />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile/contact" 
                      element={
                        <ProtectedRoute>
                          <ContactUs />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/reviews/pending" 
                      element={
                        <ProtectedRoute>
                          <ReviewsPending />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/reviews/given" 
                      element={
                        <ProtectedRoute>
                          <ReviewsGiven />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="*" 
                      element={
                        <ProtectedRoute>
                          <Navigate to="/" replace />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
              </>
            } 
          />
        </Routes>
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
