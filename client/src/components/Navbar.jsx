import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, LogOut, User } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../redux/slices/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
          <BrainCircuit className="w-8 h-8" />
          <span>InterVueAI</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Dashboard
          </Link>
          <Link to="/resume" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Resume
          </Link>
          <div className="flex items-center gap-3 ml-4">
            {token ? (
              <>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                   <User className="w-5 h-5" />
                   <span>{user?.name || 'User'}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
