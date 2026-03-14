# PoultryVision AI

A lightweight frontend-only system built with HTML, CSS, JavaScript, Bootstrap 5, SweetAlert2, TensorFlow.js and MobileNet.

## Included features
- Beautiful login and register pages
- Role-based access: admin, analyst, viewer
- Admin user management
- Dashboard inspired by modern admin layout
- Train model with uploaded images
- Save model to browser localStorage
- Predict chicken disease images
- Reports for training and predictions
- Lightweight local JSON-style data storage using browser localStorage

## Demo accounts
- admin / admin123
- analyst / analyst123
- user / user123

## How to run
Open `index.html` in a browser. For best experience, serve the folder with a simple static server.

Example with Python:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080`

## Important note
This project is frontend-only. Data is stored in the browser, so it is best for demos, prototypes, and lightweight offline-friendly usage.
