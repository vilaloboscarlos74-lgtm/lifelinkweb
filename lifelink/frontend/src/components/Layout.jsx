import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#f3f8fc] dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <main className={`pt-[60px] ${user ? 'pb-[72px] md:pb-8' : 'pb-8'} px-4 sm:px-6 max-w-7xl mx-auto`}>
        {children}
      </main>
    </div>
  );
}
