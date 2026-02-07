"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "./UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserMenu() {
  const { user, isLoading, login, logout } = useUser();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
      setShowLogin(false);
      setUsername("");
    }
  };

  if (isLoading) {
    return (
      <div data-design-id="user-menu-loading" className="h-10 w-32 animate-pulse bg-slate-700/50 rounded-lg" />
    );
  }

  if (!user) {
    return (
      <div data-design-id="user-menu-login" className="relative">
        <AnimatePresence>
          {!showLogin ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setShowLogin(true)}
                data-design-id="login-button"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Anmelden
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleLogin}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              data-design-id="login-form"
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder="Ihr Name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-design-id="username-input"
                className="w-40 h-9 bg-slate-800/80 border-slate-600 text-slate-200 placeholder:text-slate-500"
                autoFocus
              />
              <Button 
                type="submit" 
                size="sm"
                data-design-id="login-submit"
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                OK
              </Button>
              <Button 
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowLogin(false)}
                data-design-id="login-cancel"
                className="text-slate-400 hover:text-slate-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div data-design-id="user-menu-logged-in" className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        data-design-id="user-avatar-button"
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
      >
        <div data-design-id="user-avatar" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
          {user.profile.username.charAt(0).toUpperCase()}
        </div>
        <span data-design-id="user-name" className="text-slate-200 font-medium hidden sm:block">
          {user.profile.username}
        </span>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-design-id="user-dropdown"
            className="absolute right-0 mt-2 w-64 p-4 rounded-xl bg-slate-800/95 border border-slate-700/50 backdrop-blur-xl shadow-xl z-50"
          >
            <div data-design-id="user-info" className="mb-4 pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                  {user.profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold">{user.profile.username}</p>
                  <p className="text-xs text-slate-500">
                    Dabei seit {new Date(user.profile.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            </div>

            <div data-design-id="saved-indicator" className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Daten werden automatisch gespeichert</span>
              </div>
            </div>

            <Button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              variant="ghost"
              data-design-id="logout-button"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Abmelden
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}