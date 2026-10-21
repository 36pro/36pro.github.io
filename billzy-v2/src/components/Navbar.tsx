import React from 'react';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Chip
} from '@heroui/react';
import {
  Sun,
  Moon,
  Cloud,
  CloudOff,
  LogOut,
  LogIn,
  LayoutDashboard,
  Database,
  BarChart3,
  Plus
} from 'lucide-react';
import { useApp, AppTab } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    user,
    syncStatus,
    loginWithGoogle,
    logout,
    openPaymentModal
  } = useApp();

  return (
    <HeroNavbar
      maxWidth="xl"
      isBordered
      className="bg-surface/85 backdrop-blur-md border-b border-border sticky top-0 z-50 px-2 sm:px-6"
    >
      {/* Brand */}
      <NavbarBrand className="gap-2 sm:gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent flex items-center justify-center font-bold text-accent-foreground font-logo text-base sm:text-lg shadow-sm">
          B
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-logo font-black tracking-tight text-lg sm:text-xl text-foreground">
              BILLZY
            </span>
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-accent/20 text-accent">
              v2.0
            </span>
          </div>
          <span className="text-[10px] text-muted hidden sm:inline">Dhaka Utility HQ</span>
        </div>
      </NavbarBrand>

      {/* Navigation Tabs */}
      <NavbarContent className="flex gap-1 sm:gap-2" justify="center">
        <NavbarItem>
          <Button
            size="sm"
            variant={activeTab === 'dashboard' ? 'solid' : 'light'}
            color={activeTab === 'dashboard' ? 'primary' : 'default'}
            className={`font-semibold rounded-[var(--radius)] h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${
              activeTab === 'dashboard'
                ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                : 'text-foreground/80 hover:text-foreground'
            }`}
            startContent={<LayoutDashboard size={16} />}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
        </NavbarItem>

        <NavbarItem>
          <Button
            size="sm"
            variant={activeTab === 'database' ? 'solid' : 'light'}
            color={activeTab === 'database' ? 'primary' : 'default'}
            className={`font-semibold rounded-[var(--radius)] h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${
              activeTab === 'database'
                ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                : 'text-foreground/80 hover:text-foreground'
            }`}
            startContent={<Database size={16} />}
            onClick={() => setActiveTab('database')}
          >
            Database
          </Button>
        </NavbarItem>

        <NavbarItem>
          <Button
            size="sm"
            variant={activeTab === 'analytics' ? 'solid' : 'light'}
            color={activeTab === 'analytics' ? 'primary' : 'default'}
            className={`font-semibold rounded-[var(--radius)] h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${
              activeTab === 'analytics'
                ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                : 'text-foreground/80 hover:text-foreground'
            }`}
            startContent={<BarChart3 size={16} />}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* Right Content: Add Payment, Sync Status, Theme, Auth */}
      <NavbarContent justify="end" className="gap-1 sm:gap-2">
        {/* Quick Add Button */}
        <NavbarItem className="hidden md:flex">
          <Button
            size="sm"
            color="primary"
            className="bg-accent text-accent-foreground font-bold rounded-[var(--radius)] h-9 px-3"
            startContent={<Plus size={16} />}
            onClick={() => openPaymentModal()}
          >
            New Payment
          </Button>
        </NavbarItem>

        {/* Sync Status Chip */}
        <NavbarItem className="hidden sm:flex">
          <Chip
            size="sm"
            variant="flat"
            className="font-mono-code text-[11px] h-7 border border-border"
            startContent={
              syncStatus === 'online' ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-500 ml-1" />
              )
            }
          >
            {syncStatus === 'online' ? 'Cloud Synced' : 'Offline Cache'}
          </Chip>
        </NavbarItem>

        {/* Theme Toggle */}
        <NavbarItem>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label="Toggle Theme"
            className="text-foreground/80 hover:text-foreground rounded-[var(--radius)]"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </NavbarItem>

        {/* Google User Avatar or Login Button */}
        <NavbarItem>
          {user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="flex items-center gap-1.5 focus:outline-none cursor-pointer">
                  <Avatar
                    src={user.photoURL || undefined}
                    name={user.displayName || user.email || 'User'}
                    size="sm"
                    className="w-8 h-8 text-xs font-bold border border-border"
                  />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User Account Actions" className="p-1">
                <DropdownItem key="profile" isReadOnly className="opacity-100 cursor-default">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground">
                      {user.displayName || 'Google User'}
                    </span>
                    <span className="text-xs text-muted font-mono-code truncate max-w-[180px]">
                      {user.email}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-500">
                      <Cloud size={12} />
                      <span>Firestore Connected</span>
                    </div>
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-danger"
                  startContent={<LogOut size={14} />}
                  onClick={logout}
                >
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button
              size="sm"
              variant="flat"
              className="bg-surface-secondary text-foreground text-xs font-semibold rounded-[var(--radius)] h-9 px-2 sm:px-3 border border-border"
              startContent={<LogIn size={15} className="text-accent" />}
              onClick={loginWithGoogle}
            >
              <span className="hidden sm:inline">Google Login</span>
              <span className="sm:hidden">Login</span>
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
