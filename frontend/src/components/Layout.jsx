import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Layout({ children }) {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const loadNotifications = async () => {
    try {
      const res = await API.get("/notifications/mine");
      setNotifications(res.data);
      setNotificationError("");
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Could not load notifications",
      );
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openNotifications = async () => {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (opening) {
      await loadNotifications();
    }
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        const res = await API.patch(`/notifications/${notification._id}/read`);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? res.data : item,
          ),
        );
      }
      setNotificationsOpen(false);
      navigate(notification.link);
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Could not open this notification",
      );
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, readAt })),
      );
      setNotificationError("");
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Could not mark notifications as read",
      );
    }
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
            <div className="notification-wrapper">
              <button
                type="button"
                className="notification-trigger"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={openNotifications}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <section className="notification-panel" aria-label="Notifications">
                  <div className="notification-panel-header">
                    <h2>Notifications</h2>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notificationError && (
                    <p className="notification-error" role="alert">
                      {notificationError}
                    </p>
                  )}

                  {notifications.length ? (
                    <ul className="notification-list">
                      {notifications.map((notification) => (
                        <li key={notification._id}>
                          <button
                            type="button"
                            className={`notification-item${notification.readAt ? "" : " unread"}`}
                            onClick={() => openNotification(notification)}
                          >
                            <span className="notification-item-title">
                              {notification.title}
                            </span>
                            <span className="notification-item-message">
                              {notification.message}
                            </span>
                            <time dateTime={notification.createdAt}>
                              {new Date(notification.createdAt).toLocaleString()}
                            </time>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !notificationError && (
                      <p className="notification-empty">You’re all caught up.</p>
                    )
                  )}
                </section>
              )}
            </div>
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