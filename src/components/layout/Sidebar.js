import React from "react";
import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { navItems } from "../navigation/navItems";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <ShieldCheck size={22} />
          <div>
            <div className="sidebar__brand-title">StegaVault</div>
            <div className="sidebar__brand-subtitle">Secure • Local • Private</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
              onClick={onClose}
              end={to === "/image" || to === "/audio"}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="sidebar__scrim" onClick={onClose} />}
    </>
  );
}
