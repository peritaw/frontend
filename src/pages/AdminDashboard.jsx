
import React, { useEffect, useState } from 'react';
import api from '../api';
import './AdminDashboard.css';

// --- COMPONENTS ---

const CrudCargos = ({ cargos, refreshData }) => {
    const [nombre, setNombre] = useState('');
    const [valorHora, setValorHora] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('cargos/', { nombre, valor_hora: valorHora });
            setNombre('');
            setValorHora('');
            refreshData();
        } catch (error) {
            alert("Error al crear cargo");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("¿Estás seguro?")) {
             try {
                await api.delete(`cargos/${id}/`);
                refreshData();
             } catch (error) { alert("Error al eliminar"); }
        }
    };
    
    // Note: Update not implemented in UI for brevity, can be added later.

    return (
        <div>
            <h3>Gestionar Cargos y Valores</h3>
            <div className="form-card">
                <h4>Nuevo Cargo</h4>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre del Cargo (Rol)</label>
                            <input value={nombre} onChange={e=>setNombre(e.target.value)} required placeholder="Ej: Cocinero Senior" />
                        </div>
                        <div className="form-group">
                            <label>Valor Hora ($)</label>
                            <input type="number" value={valorHora} onChange={e=>setValorHora(e.target.value)} required placeholder="5000" />
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">Crear Cargo</button>
                </form>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Valor Hora</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {cargos.map(c => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.nombre}</td>
                            <td>${c.valor_hora}</td>
                            <td>
                                <button className="action-btn btn-delete" onClick={()=>handleDelete(c.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CrudEmpleados = ({ empleados, cargos, refreshData }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [cargoId, setCargoId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('empleados/', {
                username, password, first_name: firstName, cargo: cargoId
            });
            setUsername(''); setPassword(''); setFirstName(''); setCargoId('');
            refreshData();
        } catch (error) {
            alert("Error al crear empleado. Revise si el usuario ya existe.");
        }
    };

     const handleDelete = async (id) => {
        if(window.confirm("¿Estás seguro? Se borrará el empleado.")) {
             try {
                await api.delete(`empleados/${id}/`);
                refreshData();
             } catch (error) { alert("Error al eliminar"); }
        }
    };

    return (
        <div>
            <h3>Gestionar Empleados</h3>
             <div className="form-card">
                <h4>Nuevo Empleado</h4>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Usuario (Login)</label>
                            <input value={username} onChange={e=>setUsername(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Contraseña</label>
                            <input value={password} onChange={e=>setPassword(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input value={firstName} onChange={e=>setFirstName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Cargo (Valor Hora)</label>
                            <select value={cargoId} onChange={e=>setCargoId(e.target.value)} required>
                                <option value="">Seleccione...</option>
                                {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.valor_hora}/hr)</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">Crear Empleado</button>
                </form>
            </div>

             <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Valor/Hr</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {empleados.map(e => (
                        <tr key={e.id}>
                            <td>{e.user.username}</td>
                            <td>{e.user.first_name || '-'}</td>
                            <td>{e.cargo_nombre}</td>
                            <td>${cargos.find(c => c.id === e.cargo)?.valor_hora}</td>
                            <td>
                                 <button className="action-btn btn-delete" onClick={()=>handleDelete(e.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AsistenciasTable = ({ asistencias }) => (
    <div>
        <h3>Registro de Asistencia</h3>
        <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Horas</th>
                        <th>Total a Pagar</th>
                    </tr>
                </thead>
                <tbody>
                    {asistencias.map(asis => (
                        <tr key={asis.id}>
                            <td>{asis.empleado_nombre}</td>
                            <td>{asis.fecha}</td>
                            <td>{asis.hora_ingreso}</td>
                            <td>{asis.hora_salida || '-'}</td>
                            <td>{asis.horas_trabajadas || '-'}</td>
                            <td>{asis.monto_total ? `$${asis.monto_total}` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- MAIN DASHBOARD ---

const AdminDashboard = () => {
    const [tab, setTab] = useState('reportes'); // reportes | empleados | cargos
    const [asistencias, setAsistencias] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [cargos, setCargos] = useState([]);
    
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [asistRes, emplRes, cargoRes] = await Promise.all([
                api.get('asistencias/'),
                api.get('empleados/'),
                api.get('cargos/')
            ]);
            setAsistencias(asistRes.data);
            setEmpleados(emplRes.data);
            setCargos(cargoRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Panel de Administración</h1>
                <button onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                }} className="btn-logout">Cerrar Sesión</button>
            </header>

            <div className="tabs">
                <button className={`tab-btn ${tab==='reportes'?'active':''}`} onClick={()=>setTab('reportes')}>📊 Reportes y Pagos</button>
                <button className={`tab-btn ${tab==='empleados'?'active':''}`} onClick={()=>setTab('empleados')}>👨‍🍳 Empleados</button>
                <button className={`tab-btn ${tab==='cargos'?'active':''}`} onClick={()=>setTab('cargos')}>💰 Cargos y Valores</button>
            </div>

            <div className="dashboard-content">
                {tab === 'reportes' && <AsistenciasTable asistencias={asistencias} />}
                {tab === 'empleados' && <CrudEmpleados empleados={empleados} cargos={cargos} refreshData={fetchData} />}
                {tab === 'cargos' && <CrudCargos cargos={cargos} refreshData={fetchData} />}
            </div>
        </div>
    );
};

export default AdminDashboard;
