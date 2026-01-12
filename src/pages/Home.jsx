
import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import './Home.css';

const Home = () => {
    const [message, setMessage] = useState('');
    const username = localStorage.getItem('username');
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Error clearing scanner on unmount", e);
                }
            }
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isProcessingRef.current) return;
        
        console.log("Scanned:", decodedText);
        if (decodedText === "PUERTA_ACCESO_CAFETERIA") {
            isProcessingRef.current = true;
            
            // Stop scanning immediately
            if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                    setScanning(false);
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
            }

            setMessage("⏳ Procesando...");
            await handleAttendance();
            
            // Allow scanning again after a delay or just by user action
            isProcessingRef.current = false;
        } else {
             // Optional: Don't stop for invalid QR, just warn
             // But to be safe against loops, better to stop or throttle.
             // We'll just show a message and keep scanning or stop?
             // Let's stop to avoid confusion.
             if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                    setScanning(false);
                } catch(e){}
             }
             setMessage("❌ QR Inválido. Escaneaste: " + decodedText);
             isProcessingRef.current = false;
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };
    
    const startScanner = () => {
         setMessage(""); // Clear previous messages
         setScanning(true);
         isProcessingRef.current = false;

         setTimeout(() => {
             // If a scanner instance already exists, clear it first
             if (scannerRef.current) {
                 try { scannerRef.current.clear(); } catch(e){}
             }

             const scanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    videoConstraints: { facingMode: "environment" } 
                },
                /* verbose= */ false);
            
            scannerRef.current = scanner;
            scanner.render(onScanSuccess, onScanFailure);
         }, 100);
    };

    const handleAttendance = async () => {
        try {
            // Note: We send username just in case, but backend uses Token now.
            const response = await api.post('asistencias/registrar_scan/', { username });
            const { status, data } = response.data;
            if (status === 'entrada') {
                const time = data.hora_ingreso ? data.hora_ingreso.substring(0, 5) : '';
                setMessage(`✅ ¡Bienvenido! \n🕒 Hora de ingreso: ${time}`);
            } else {
                const time = data.hora_salida ? data.hora_salida.substring(0, 5) : '';
                setMessage(`👋 ¡Hasta luego! \n🕒 Hora de salida: ${time} \n⏱️ Horas trabajadas: ${data.horas_trabajadas}`);
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
                {!scanning && (
                // <button onClick={() => handleAttendance()} className="btn-debug">
                //     (Simular Escaneo)
                // </button>
                )}
            </div>
        </div>
    );
};

export default Home;
