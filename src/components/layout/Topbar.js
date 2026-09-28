import React from "react";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../../context/NotificationContext";

export default function Topbar({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success("Signed out.");
      navigate("/login");
    } catch (e) {
      notify.error(e.message || "Failed to sign out.");
    }
  };

  return (
    <header className="topbar">
      <button className="icon-button topbar__menu" onClick={onMenuClick} aria-label="Toggle navigation">
        <Menu size={20} />
      </button>
      <div className="topbar__spacer" />
      <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="topbar__user">
        <span className="topbar__user-email">{user?.email || "Guest"}</span>
        <button className="icon-button" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
