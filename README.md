# MediBox Project

MediBox is a smart medicine box system designed to assist elderly users in managing their medication schedules. The system allows family members and pharmacists to monitor and manage medicine schedules remotely, ensuring timely medication intake and adherence.

## Project Structure

```
medibox-project
├── esp32_firmware
│   └── esp32_firmware.py
├── server
│   ├── routes
│   ├── services
│   ├── models
│   ├── utils
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── client
│   ├── public
│   ├── src
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
├── ai_model
│   ├── model.py
│   ├── requirements.txt
│   ├── qualcomm_deploy.md
│   └── flask_integration_sample.py
├── architecture_diagram.png
└── README.md
```

## Features

- **Elderly User Dashboard**: Displays medicine schedules, health status, and alerts for reminders and missed doses.
- **Family Member Monitoring**: Allows family members to monitor adherence logs and receive notifications for missed medications.
- **Pharmacist Management**: Enables pharmacists to update medicines, view refill requests, and manage linked MediBoxes.
- **AI Health Analysis**: Utilizes AI to analyze user behavior and provide personalized recommendations for better health adherence.

## Hardware Components

- **ESP32 IoT Device**: Equipped with sensors (LDR, DHT11), an OLED display, a buzzer, and a button for user interaction.
- **MQTT Communication**: Facilitates real-time data exchange between the ESP32 device and the Flask backend.

## Software Components

- **Backend**: Built with Flask, providing REST APIs and MQTT communication for managing user data, medicine schedules, and health reports.
- **Frontend**: Developed using React and TailwindCSS, ensuring an accessible and user-friendly interface for elderly users.
- **AI Model**: Deployed on Qualcomm AI Hub for health prediction and adherence analysis.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd medibox-project
   ```

2. Set up the backend:
   - Navigate to the `server` directory.
   - Install dependencies:
     ```
     pip install -r requirements.txt
     ```
   - Configure environment variables in `.env` file.

3. Set up the frontend:
   - Navigate to the `client` directory.
   - Install dependencies:
     ```
     npm install
     ```

4. Seed and run the backend:
   - (Optional) Seed MongoDB with demo data:
     ```powershell
     cd server
     python -m scripts.seed_data
     ```
   - Copy `.env.example` to `.env` and provide `JWT_SECRET_KEY`, `MONGO_URI`, and optional `AI_HUB_URL`.
   - Start the Flask server (auto-falls back to `mongodb://localhost:27017/medibox` if Atlas is unreachable):
     ```powershell
     python app.py
     ```

5. Run automated type/syntax checks (optional but recommended):
   ```powershell
   cd server
   python -m compileall routes services
   ```

6. Run the React application:
   ```powershell
   cd client
   npm run dev
   ```

## REST API Overview

The backend now exposes consistent REST-style endpoints used by the React dashboard:

| Purpose | Method & Path | Notes |
| --- | --- | --- |
| Session login | `POST /api/auth/login` | Body `{ "email"|"username", "password" }` → `{ access_token, user, role }` |
| Session profile | `GET /api/auth/me` | Requires `Authorization: Bearer <token>`, returns current user summary |
| Reminders | `GET /api/reminders?scope=active&limit=50` | Accepts `scope`, `user_id`, `box_id`; returns normalized reminders |
| Create reminder | `POST /api/reminders` | Body `{ box_id, medicineName, time }` |
| Intake log | `POST /api/intake/logs` | Body `{ reminder_id, confirmed }` updates adherence history |
| Adherence history | `GET /api/adherence/logs?limit=100` | Returns latest ingestion events |
| Health check | `POST /api/health/check` | Stores AI/fallback risk analysis and returns `{ adherence_risk, recommendation }` |
| Health reports | `GET /api/health/reports?limit=20` | Returns flattened summaries used by the dashboard |
| Refill queue | `GET /api/refill/requests?scope=managed` | Filter by `scope`, `status`, `box_id` |
| Create refill | `POST /api/refill/requests` | Body `{ medicineName, quantity, box_id }` |
| Refill actions | `POST /api/refill/requests/<id>/<approve|reject|fulfill>` | Updates status with optional `{ notes }` |
| MediBox register | `POST /api/mediboxes/register` | Registers device + persists hashed `box_secret` |
| MediBox authenticate | `POST /api/mediboxes/auth` | Validates device using `box_secret` |
| Sensor ingest | `POST /api/mediboxes/<box_id>/sensor` | Stores telemetry, updates `last_sensor_at` |

The React client expects all responses to be JSON and uses JWT bearer tokens for authenticated routes.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.