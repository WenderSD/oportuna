import { NavLink } from "react-router-dom";
import { House, PlusCircle, UserRound } from "lucide-react";
import styles from "./Navbar.module.css";

const navigationItems = [
  {
    label: "Início",
    path: "/home",
    icon: House,
  },
  {
    label: "Publicar",
    path: "/publicar",
    icon: PlusCircle,
  },
  {
    label: "Perfil",
    path: "/perfil",
    icon: UserRound,
  },
];

export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <NavLink to="/home" className={styles.logo}>
          <span>OportUna</span>
        </NavLink>

        <nav className={styles.navigation}>
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ""}`
                }
              >
                <Icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
