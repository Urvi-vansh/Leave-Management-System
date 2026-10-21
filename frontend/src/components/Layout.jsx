import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">L</span>
          LeaveFlow
        </div>

        <nav className="app-nav" aria-label="Main navigation">
          <span className="app-nav-label">Workspace</span>
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/dashboard">
            Dashboard
          </NavLink>

          {role === "admin" && (
            <>
              <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/employees">
                Employees
              </NavLink>

              <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/leave-types">
                Leave Types
              </NavLink>

              <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/manage-leaves">
                Manage Leaves
              </NavLink>
            </>
          )}

          {role === "employee" && (
            <>
              <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/apply-leave">
                Apply Leave
              </NavLink>

              <NavLink className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`} to="/my-leaves">
                My Leaves
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header-title">
            Leave Management System
          </h1>

          <div className="app-header-actions">
            <span className="app-role">{role}</span>
            <button onClick={handleLogout} className="app-logout">
              Log out
            </button>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;