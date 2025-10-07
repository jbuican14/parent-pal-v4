import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Baby, Settings } from 'lucide-react';
import BottomNav from './ui/BottomNav';
import type { NavItem } from './ui/BottomNav';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={24} />,
      path: '/',
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar size={24} />,
      path: '/events',
    },
    {
      id: 'children',
      label: 'Children',
      icon: <Baby size={24} />,
      path: '/children',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={24} />,
      path: '/settings',
    },
  ];

  const activeId = navItems.find(item => item.path === location.pathname)?.id || 'dashboard';

  const handleNavigation = (id: string) => {
    const item = navItems.find(nav => nav.id === id);
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      width: '100%',
    }}>
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <Outlet />
      </div>
      <BottomNav
        items={navItems}
        activeId={activeId}
        onItemPress={handleNavigation}
      />
    </div>
  );
}
