import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Home", path: "/" },
    { name: "Usage & Benefits", path: "/usage-benefits" },
    { name: "Subscription Model", path: "/subscription-model" },
    { name: "Blogs", path: "/blogs" },
    { name: "Contact Us", path: "/contact-us" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('Successfully signed out!');
      navigate("/login");
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src="/lovable-uploads/adc708a3-75ca-4634-8eaa-778c22587ac5.png" 
                alt="Zoss Water Logo" 
                className="h-12 w-auto group-hover:shadow-xl transition-shadow"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-all duration-200 hover:text-zoss-green relative group ${
                  isActive(item.path)
                    ? "text-zoss-green"
                    : "text-zoss-gray"
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-zoss-green to-blue-500 transition-all duration-300 group-hover:w-full ${
                  isActive(item.path) ? "w-full" : ""
                }`}></span>
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.user_metadata?.name || user.email || 'Dashboard'}</span>
                  </Button>
                </Link>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-zoss-green mr-2"></span>Signing Out...</span>
                  ) : (
                    'Sign Out'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-zoss-green via-green-500 to-blue-500 hover:from-zoss-green/90 hover:via-green-500/90 hover:to-blue-500/90 text-white font-semibold tracking-wider px-6 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-zoss-gray" />
            ) : (
              <Menu className="h-6 w-6 text-zoss-gray" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-3 text-base font-medium transition-colors rounded-lg ${
                    isActive(item.path)
                      ? "text-zoss-green bg-zoss-green/10"
                      : "text-zoss-gray hover:text-zoss-green hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleSignOut}
                      variant="ghost"
                      className="w-full"
                      disabled={signingOut}
                    >
                      {signingOut ? (
                        <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-zoss-green mr-2"></span>Signing Out...</span>
                      ) : (
                        'Sign Out'
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="w-full bg-gradient-to-r from-zoss-green to-blue-500 hover:from-zoss-green/90 hover:to-blue-500/90 text-white font-medium tracking-wider">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;