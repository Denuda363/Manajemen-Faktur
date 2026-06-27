import React, { useState } from 'react';
import { useApp } from '../store';
import { Page } from '../types';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Settings,
  Menu,
  X,
  Building2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export function Layout({ children, currentPage, setCurrentPage }: LayoutProps) {
  const { settings, currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Input Faktur Baru', icon: FilePlus2 },
    { type: 'header', label: 'Master Data' },
    { id: 'suppliers', label: 'Data Supplier', icon: Building2 },
    { type: 'header', label: 'Laporan' },
    { id: 'due', label: 'Jatuh Tempo', icon: Clock },
    { id: 'overdue', label: 'Lewat Jatuh Tempo', icon: AlertCircle },
    { type: 'header', label: 'Keuangan' },
    { id: 'payment', label: 'Pembayaran', icon: CreditCard },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  const navPosition = settings.navigationPosition || 'left';
  const navStyle = settings.navigationStyle || 'solid';
  const navColor = settings.navigationColor || 'slate';

  const isHorizontal = navPosition === 'top' || navPosition === 'bottom';
  const isMinimal = navStyle === 'minimalist';
  const isGlass = navStyle === 'glass';
  const isFloating = navStyle === 'floating';

  const getNavBgClass = () => {
    if (isMinimal) {
      const colors: Record<string, string> = {
        slate: 'bg-white border-slate-200 text-slate-800',
        indigo: 'bg-white border-indigo-100 text-indigo-950',
        rose: 'bg-white border-rose-100 text-rose-950',
        emerald: 'bg-white border-emerald-100 text-emerald-950',
        amber: 'bg-white border-amber-100 text-amber-950',
        sky: 'bg-white border-sky-100 text-sky-950',
      };
      return cn(colors[navColor] || colors.slate, isFloating ? 'border rounded-xl shadow-lg' : (isHorizontal ? 'border-b' : 'border-r'));
    }
    
    const colors: Record<string, string> = {
      slate: 'bg-slate-900',
      indigo: 'bg-indigo-900',
      rose: 'bg-rose-900',
      emerald: 'bg-emerald-900',
      amber: 'bg-amber-900',
      sky: 'bg-sky-900',
    };
    
    const glassColors: Record<string, string> = {
      slate: 'bg-slate-900/80 backdrop-blur-md',
      indigo: 'bg-indigo-900/80 backdrop-blur-md',
      rose: 'bg-rose-900/80 backdrop-blur-md',
      emerald: 'bg-emerald-900/80 backdrop-blur-md',
      amber: 'bg-amber-900/80 backdrop-blur-md',
      sky: 'bg-sky-900/80 backdrop-blur-md',
    };

    return cn(
      isGlass ? glassColors[navColor] : colors[navColor],
      'text-white',
      isFloating ? 'rounded-xl shadow-lg border border-white/10' : ''
    );
  };

  const getActiveItemClass = () => {
    if (isMinimal) {
      const colors: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-900 font-bold',
        indigo: 'bg-indigo-50 text-indigo-700 font-bold',
        rose: 'bg-rose-50 text-rose-700 font-bold',
        emerald: 'bg-emerald-50 text-emerald-700 font-bold',
        amber: 'bg-amber-50 text-amber-700 font-bold',
        sky: 'bg-sky-50 text-sky-700 font-bold',
      };
      return colors[navColor] || colors.slate;
    }

    const colors: Record<string, string> = {
      slate: 'bg-slate-700 text-white font-bold',
      indigo: 'bg-indigo-600 text-white font-bold',
      rose: 'bg-rose-600 text-white font-bold',
      emerald: 'bg-emerald-600 text-white font-bold',
      amber: 'bg-amber-600 text-white font-bold',
      sky: 'bg-sky-600 text-white font-bold',
    };
    return colors[navColor] || colors.slate;
  };

  const getHoverItemClass = () => {
    if (isMinimal) return 'hover:bg-slate-50 text-slate-500';
    return 'hover:bg-white/10 text-white/70 hover:text-white';
  };

  const Navigation = ({ isMobile = false }: { isMobile?: boolean }) => {
    const horizontalLayout = isHorizontal && !isMobile;
    return (
      <nav className={cn(
        "flex-1 py-4 text-sm font-medium",
        horizontalLayout ? "flex space-x-2 overflow-x-auto px-4 items-center" : "flex flex-col overflow-y-auto"
      )}>
        {navItems.map((item, idx) => {
          if ('type' in item && item.type === 'header') {
            return horizontalLayout ? null : (
              <div key={`header-${idx}`} className={cn(
                "mt-6 px-6 mb-2 text-[10px] uppercase font-bold tracking-widest",
                isMinimal ? "text-slate-400" : "text-white/40"
              )}>
                {item.label}
              </div>
            );
          }

          const navItem = item as { id: Page; label: string; icon: any };
          const Icon = navItem.icon;
          const isActive = currentPage === navItem.id;

          return (
            <button
              key={navItem.id}
              onClick={() => {
                setCurrentPage(navItem.id);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center transition-all duration-200",
                horizontalLayout 
                  ? cn("px-4 py-2 rounded-lg whitespace-nowrap", isActive ? getActiveItemClass() : getHoverItemClass())
                  : cn("px-6 py-2.5 mx-3 mb-1 rounded-lg text-left w-[calc(100%-24px)]", isActive ? getActiveItemClass() : getHoverItemClass())
              )}
            >
              <Icon className={cn("w-4 h-4 mr-3 shrink-0", isActive ? "opacity-100" : "opacity-70")} />
              <span className="whitespace-nowrap">{navItem.label}</span>
            </button>
          );
        })}
      </nav>
    );
  };

  // Desktop navigation wrapper
  const DesktopNav = () => (
    <aside className={cn(
      "hidden lg:flex flex-col shrink-0 transition-all duration-300 z-30",
      getNavBgClass(),
      isHorizontal ? "w-full" : "w-64 h-full",
      isFloating && isHorizontal ? "m-4 w-[calc(100%-32px)]" : "",
      isFloating && !isHorizontal ? "m-4 h-[calc(100vh-32px)]" : ""
    )}>
      <div className={cn("p-6", isMinimal ? "border-b border-slate-200" : "border-b border-white/10")}>
        <h1 className={cn("text-xl font-bold tracking-tight", isMinimal ? "text-indigo-600" : "text-indigo-400")}>Manajemen Faktur</h1>
        <p className={cn("text-[10px] uppercase tracking-widest mt-1 truncate", isMinimal ? "text-slate-500" : "text-white/50")}>{settings.companyProfile.name}</p>
      </div>
      <Navigation />
      {!isHorizontal && (
        <div className={cn("p-4 text-[11px] text-center", isMinimal ? "border-t border-slate-200 text-slate-500" : "border-t border-white/10 text-white/50")}>
          Versi 2.4.0 • Enterprise Edition
        </div>
      )}
    </aside>
  );

  const isRight = navPosition === 'right';
  const isBottom = navPosition === 'bottom';

  return (
    <div 
      className={cn(
        "flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden",
        isHorizontal ? "flex-col" : (isRight ? "flex-row-reverse" : "flex-row")
      )}
      style={settings.backgroundUrl ? {
        backgroundImage: `url(${settings.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {/* Pre-Content Navigation */}
      {(!isHorizontal && !isRight) && <DesktopNav />}
      {(isHorizontal && !isBottom) && <DesktopNav />}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Mobile Header (only visible on small screens) */}
        <div className={cn(
          "lg:hidden flex items-center justify-between p-4 shrink-0 z-20 relative shadow-sm",
          getNavBgClass()
        )}>
          <div>
            <h1 className={cn("text-xl font-bold tracking-tight", isMinimal ? "text-indigo-600" : "text-indigo-400")}>Manajemen Faktur</h1>
            <p className={cn("text-[10px] uppercase", isMinimal ? "text-slate-500" : "text-white/50")}>{currentUser?.name} • {currentUser?.role}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className={cn("p-2 rounded-lg transition-colors", isMinimal ? "text-slate-700 hover:bg-slate-100" : "text-white/80 hover:bg-white/10")}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay & Drawer */}
        <div 
          className={cn(
            "lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300",
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        <div 
          className={cn(
            "lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
            getNavBgClass(),
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className={cn("p-6 flex items-center justify-between shrink-0", isMinimal ? "border-b border-slate-200" : "border-b border-white/10")}>
            <div>
              <h1 className={cn("text-xl font-bold tracking-tight", isMinimal ? "text-indigo-600" : "text-indigo-400")}>Manajemen Faktur</h1>
              <p className={cn("text-[10px] uppercase tracking-widest mt-1", isMinimal ? "text-slate-500" : "text-white/50")}>{settings.companyProfile.name}</p>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className={cn("p-2 rounded-lg transition-colors", isMinimal ? "text-slate-700 hover:bg-slate-100" : "text-white/80 hover:bg-white/10")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Navigation isMobile={true} />
          <div className={cn("p-4 border-t shrink-0", isMinimal ? "border-slate-200" : "border-white/10")}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase shadow-sm shrink-0">
                {currentUser?.name?.substring(0, 2) || 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className={cn("text-xs font-bold truncate", isMinimal ? "text-slate-800" : "text-white")}>{currentUser?.name}</p>
                <p className={cn("text-[10px] truncate capitalize", isMinimal ? "text-slate-500" : "text-white/70")}>{currentUser?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 transition-colors text-white rounded-lg font-bold text-sm shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Top Header Bar (Desktop only) */}
        <header className="hidden lg:flex h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-700 capitalize tracking-wide">{currentPage.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium capitalize">{currentUser?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase shadow-sm">
              {currentUser?.name?.substring(0, 2) || 'AD'}
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-all shadow-sm active:scale-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className={cn(
          "flex-1 p-4 lg:p-8 flex flex-col overflow-y-auto",
          settings.backgroundUrl ? "bg-white/95 backdrop-blur-md" : "bg-transparent"
        )}>
          {children}
        </div>
      </main>

      {/* Post-Content Navigation */}
      {(!isHorizontal && isRight) && <DesktopNav />}
      {(isHorizontal && isBottom) && <DesktopNav />}
    </div>
  );
}
