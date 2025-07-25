# Frontend Structure (React)

This project uses a modular, organized folder structure for clarity and maintainability.

## Folder Structure

```
src/
│
├── components/
│   ├── layout/         # Layout and loading overlays
│   ├── grid/           # Paginated tables for customers, payments, invoices
│   ├── dialogs/        # Dialog components (TokenManager, PaymentHistory, etc.)
│   ├── popovers/       # Popover components (payment, outstanding, etc.)
│   └── kpi/            # KPI card component
│
├── utils/              # Utility functions (date formatting, API helpers)
│
├── App.js              # Main dashboard logic and state
├── index.js            # React entry point
├── App.css, index.css  # Styles
└── ...
```

## Main Components

- **App.js**: Main dashboard, state management, and high-level logic.
- **components/layout/**: Loading overlays (full page, grid).
- **components/grid/**: Paginated tables for customers, payments, invoices.
- **components/dialogs/**: Dialogs for token management, payment history, etc.
- **components/popovers/**: Popovers for payment and outstanding details.
- **components/kpi/KpiCard.js**: Reusable card for dashboard KPIs.
- **utils/dateUtils.js**: Date formatting and month label utilities.

## How to Add New Components
- Place new dialogs in `components/dialogs/`.
- Place new popovers in `components/popovers/`.
- Place new utility functions in `utils/`.

## Best Practices
- Keep components small and focused.
- Use JSDoc comments for all exported functions/components.
- Use the provided utility functions for date formatting.

---

For questions or contributions, see the main project README or contact the maintainer. 