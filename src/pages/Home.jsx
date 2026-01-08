
import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import './Home.css';

const Home = () => {
    const [message, setMessage] = useState('');
    const username = localStorage.getItem('username');
    const [scanning, setScanning] = useState(false);

    const onScanSuccess = async (decodedText, decodedResult) => {
        // Assume QR contains "PUERTA_ACCESO_CAFETERIA"
        console.log("Scanned:", decodedText);
        if (decodedText === "PUERTA_ACCESO_CAFETERIA") {
            // Stop scanning to prevent multiple hits? 
            // html5-qrcode continues scanning. We can clear it or just ignore subsequent.
            // Ideally we pause.
            handleAttendance();
        } else {
             setMessage("QR Inválido para acceso: " + decodedText);
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };
    
    const startScanner = () => {
         setScanning(true);
         // Use timeout to ensure DOM element exists
         setTimeout(() => {
             const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false);
            scanner.render(onScanSuccess, onScanFailure);
         }, 100);
    };

    const handleAttendance = async () => {
        try {
            const response = await api.post('asistencias/registrar_scan/', { username });
            const { status, data } = response.data;
            if (status === 'entrada') {
                setMessage(`✅ ¡Bienvenido! Hora de ingreso: ${data.hora_ingreso}`);
            } else {
                setMessage(`👋 ¡Hasta luego! Hora de salida: ${data.hora_salida}. \n⏱️ Horas: ${data.horas_trabajadas}. \n💰 A cobrar: $${data.monto_total}`);
            }
        } catch (error) {
            console.error(error);
            setMessage("❌ Error al registrar asistencia. " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="home-container">
            <div className="glass-panel">
                <header>
                    <h2>Hola, {username}</h2>
                    <p>Escanea el código QR de la puerta para registrarte.</p>
                </header>
                
                <div className="scanner-wrapper">
                    <div id="reader"></div>
                    {!scanning && (
                        <button onClick={startScanner} className="btn-scan">
                             📷 Activar Cámara
                        </button>
                    )}
                </div>

                <div className="message-box">
                    {message && <p className="result-text">{message}</p>}
                </div>
                
                {/* Fallback for testing without camera */}
                <button onClick={() => handleAttendance()} className="btn-debug">
                    (Simular Escaneo)
                </button>
            </div>
        </div>
    );
};

export default Home;
