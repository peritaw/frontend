
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('is_superuser');
        delete api.defaults.headers.common['Authorization'];
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('login/', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('is_superuser', response.data.is_superuser);
            
            // Set default header
            api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;

            if(response.data.is_superuser) {
                navigate('/admin-dashboard');
            } else {
                navigate('/home');
            }
        } catch (err) {
            setError('Credenciales inválidas');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <div className="glass-card">
                <h1>Bienvenido</h1>
                <p className="subtitle">Control de Personal</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input 
                            type="text" 
                            placeholder="Usuario" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p style={{color: '#ff6b6b', marginBottom: '1rem'}}>{error}</p>}
                    <button type="submit" className="btn-primary">Ingresar</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
