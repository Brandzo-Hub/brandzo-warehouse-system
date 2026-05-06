# Brandzo Warehouse System

## 1. Project Overview & Tech Stack
**Brandzo Warehouse System** is a specialized Warehouse Management System (WMS) tailored for the Libyan market. It aims to modernize warehouse operations by migrating from traditional Excel/VBA-based systems to a modern, responsive, and real-time web application.

### Tech Stack:
- **Framework:** [Astro](https://astro.build/)
- **UI Library:** [React.js](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & Backend:** [Firebase](https://firebase.google.com/) (Cloud Firestore)
- **Deployment:** GitHub Pages

---

## 2. Repository Structure (AI/Developer Guide)
This project follows a specific structure to separate source code from static assets:

- **`src/`**: Contains the core application logic.
  - **`pages/`**: Astro pages (e.g., `index.astro` for the landing page, `dashboard/` for application routes).
  - **`components/`**: React components for interactive UI elements.
  - **`layouts/`**: Shared Astro layouts (e.g., `DashboardLayout.astro`).
  - **`services/`**: Firebase service layer and business logic.
- **`public/`**: Strictly for static assets and legacy/informational documents.
  - **`forms/`**: Static HTML operational forms (GRN, PO, Bin Cards, etc.).
  - **`Brandzo_Operational_Guide.html`**: The comprehensive operational guide for users.
- **Root Directory**: Contains configuration files like `astro.config.mjs`, `tailwind.config.mjs`, and `package.json`.

**Important Note:** Build artifacts such as the `dist/` folder and `.log` files must **never** be committed to the repository. Ensure they are excluded via `.gitignore`.

---

## 3. Current State (What Has Been Done)
- **Responsive Dashboard and Landing Page UI**: The primary user interface for both the landing page and the main dashboard has been implemented using Astro and React.
- **GitHub Pages Deployment**: Fixed the deployment configuration by setting the correct `base` path (`/brandzo-warehouse-system/`) in `astro.config.mjs`.
- **Static Asset Organization**: Resolved 404 errors for static forms and the operational guide by correctly placing them in the `public/` directory.
- **Firebase Integration (Initial Phase)**: Firebase configuration and basic inventory service logic are in place.

---

## 4. Roadmap (What Remains to be Done)
- **Database Integration**: Complete the integration of Firebase for all modules to support real-time inventory and warehouse management.
- **Core Features**: Build functional React components and logic for:
  - Add New Warehouse
  - Add Item / Item Master
  - Stock Adjustments and Real-time Balance tracking.
- **Digital Transformation**: Gradually convert the static HTML operational forms (GRN, PO, Bin Cards) currently in the `public/forms/` directory into dynamic, interactive React components connected to the Firestore database.

---

## 5. How to Update this README
Any AI tool or developer working on this project **must** update the **'Current State'** and **'Roadmap'** sections whenever a new feature is completed or a new milestone is reached. This file serves as the "Source of Truth" for the project's progress.
