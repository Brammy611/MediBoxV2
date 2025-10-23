import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Dashboard = () => {
    const [reminders, setReminders] = useState([]);
    const [healthStatus, setHealthStatus] = useState(null);
    const [intakeConfirmed, setIntakeConfirmed] = useState(false);

    useEffect(() => {
        fetchReminders();
        fetchHealthStatus();
    }, []);

    const fetchReminders = async () => {
        try {
            const response = await api.get('get_reminders');
            setReminders(response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    const fetchHealthStatus = async () => {
        try {
            const response = await api.get('get_health_report');
            const data = Array.isArray(response.data) ? response.data[0] : response.data;
            setHealthStatus(data);
        } catch (error) {
            console.error('Error fetching health status:', error);
        }
    };

    const confirmIntake = async () => {
        try {
            await api.post('log_intake', { confirmed: true });
            setIntakeConfirmed(true);
            fetchReminders(); // Refresh reminders after confirming intake
        } catch (error) {
            console.error('Error logging intake:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="mt-4">
                <h2 className="text-xl">Medicine Reminders</h2>
                <ul>
                    {reminders.map((reminder, index) => (
                        <li key={index} className="border p-2 my-2">
                            {reminder.message}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-4">
                <h2 className="text-xl">Health Status</h2>
                {healthStatus && (
                    <div className="border p-2 my-2">
                        <p>Adherence Risk: {healthStatus.adherence_risk}</p>
                        <p>Recommendations:</p>
                        <ul>
                            {healthStatus.recommendation.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <button
                onClick={confirmIntake}
                className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
                Confirm Medicine Intake
            </button>
            {intakeConfirmed && <p className="text-green-500">Intake confirmed!</p>}
        </div>
    );
};

export default Dashboard;