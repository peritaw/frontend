
import React, { useEffect, useState } from 'react';
import api from '../api';
import './AdminDashboard.css';

// --- HELPERS ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

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
    // Frecuencia is kept for record keeping but not strictly binding for payment logic now
    const [frecuencia, setFrecuencia] = useState('MENSUAL');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('empleados/', {
                username, password, first_name: firstName, cargo: cargoId, frecuencia_pago: frecuencia
            });
            setUsername(''); setPassword(''); setFirstName(''); setCargoId(''); setFrecuencia('MENSUAL');
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

            {/* List */}
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

const ReporteLiquidacion = ({ empleados, asistencias, refreshData }) => {
    // --- ReporteLiquidacion: Now handles its own data fetching ---
    const [selectedEmp, setSelectedEmp] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
    const [totalPagar, setTotalPagar] = useState(0);

    const buscarLiquidacion = async () => {
        if (selectedEmp && fechaDesde && fechaHasta) {
            try {
                // Fetch ALL matching unpaid records for calculation (using large page size or filtering)
                // Since we added pagination, we need to request "all for this filter".
                // Ideally backend should support ?no_page=true or large limit.
                // For now asking for page_size=1000 to cover typical month.
                const res = await api.get(`asistencias/?empleado=${selectedEmp}&fecha_start=${fechaDesde}&fecha_end=${fechaHasta}&pagado=false&page_size=1000`);
                
                const filtered = res.data.results; // DRF pagination structure
                setRegistrosFiltrados(filtered);
                const total = filtered.reduce((acc, curr) => acc + parseFloat(curr.monto_total || 0), 0);
                setTotalPagar(total);
            } catch (error) {
                console.error("Error buscando liquidacion", error);
            }
        } else {
             setRegistrosFiltrados([]);
             setTotalPagar(0);
        }
    };
    
    // Auto-search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
             buscarLiquidacion();
        }, 500); // Debounce
        return () => clearTimeout(timer);
    }, [selectedEmp, fechaDesde, fechaHasta]);

    const handleLiquidar = async () => {
        if(registrosFiltrados.length === 0) return;
        
        const ids = registrosFiltrados.map(r => r.id);
        const empName = empleados.find(e => e.id.toString() === selectedEmp)?.user.first_name;

        if(window.confirm(`¿Confirmar pago de $${totalPagar.toLocaleString()} a ${empName}? \n(Se marcarán como pagados ${registrosFiltrados.length} días)`)) {
            try {
                await api.post('asistencias/pagar_empleado/', { ids });
                alert("Liquidación exitosa");
                buscarLiquidacion(); // Refresh local list
                refreshData(); // Refresh main list if visible
            } catch (error) {
                alert("Error al liquidar");
                console.error(error);
            }
        }
    };

    return (
        <div>
            <h3>💰 Liquidación por Fechas</h3>
            
            <div className="form-card" style={{borderLeft: '5px solid #28a745'}}>
                <div className="form-row">
                    <div className="form-group">
                        <label>1. Seleccionar Empleado</label>
                        <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}>
                            <option value="">Seleccione...</option>
                            {empleados.map(e => (
                                <option key={e.id} value={e.id}>{e.user.first_name || e.user.username}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>2. Fecha Desde</label>
                        <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>3. Fecha Hasta</label>
                        <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} />
                    </div>
                </div>
            </div>

            {selectedEmp && (
                <div className="card">
                     <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <h4>Turnos Pendientes en el Periodo</h4>
                        <div style={{textAlign:'right'}}>
                            <span style={{fontSize:'1.5rem', fontWeight:'bold', display:'block'}}>
                                ${totalPagar.toLocaleString()}
                            </span>
                            <small>{registrosFiltrados.length} registros seleccionados</small>
                        </div>
                    </div>

                    {registrosFiltrados.length > 0 ? (
                        <>
                        <div className="table-responsive" style={{maxHeight:'300px', overflowY:'auto'}}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Entrada/Salida</th>
                                        <th>Horas</th>
                                        <th>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrosFiltrados.map(r => (
                                        <tr key={r.id}>
                                            <td>{formatDate(r.fecha)}</td>
                                            <td>{r.hora_ingreso?.substring(0,5)} - {r.hora_salida?.substring(0,5)}</td>
                                            <td>{r.horas_trabajadas}</td>
                                            <td>${r.monto_total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <br/>
                        <button onClick={handleLiquidar} className="btn-submit" style={{width:'100%'}}>
                            ✅ Confirmar Pago de seleccionados
                        </button>
                        </>
                    ) : (
                        <p style={{color:'#666', fontStyle:'italic'}}>No hay registros pendientes de pago en este rango de fechas.</p>
                    )}
                </div>
            )}

            <h4 style={{marginTop: '3rem'}}>Historial Reciente (Últimos movimientos)</h4>
            {/* Displaying simple list from props (current page of main list) */}
             <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {asistencias.map(asis => (
                        <tr key={asis.id}>
                            <td>{asis.empleado_nombre}</td>
                            <td>{formatDate(asis.fecha)}</td>
                            <td>{asis.monto_total ? `$${asis.monto_total}` : '-'}</td>
                            <td>
                                {asis.pagado ? 
                                    <span className="badge-paid">PAGADO</span> : 
                                    <span className="badge-pending">PENDIENTE</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
};


// --- CrudAsistencias with Pagination ---

const CrudAsistencias = ({ asistencias, empleados, refreshData, pagination }) => {
    const [editingId, setEditingId] = useState(null);
    const [editFecha, setEditFecha] = useState('');
    const [editIngreso, setEditIngreso] = useState('');
    const [editSalida, setEditSalida] = useState('');

    const startEdit = (asis) => {
        setEditingId(asis.id);
        setEditFecha(asis.fecha);
        setEditIngreso(asis.hora_ingreso ? asis.hora_ingreso.substring(0,5) : ''); 
        setEditSalida(asis.hora_salida ? asis.hora_salida.substring(0,5) : '');
    };

    const saveEdit = async () => {
        try {
            await api.patch(`asistencias/${editingId}/`, {
                fecha: editFecha,
                hora_ingreso: editIngreso,
                hora_salida: editSalida || null
            });
            setEditingId(null);
            refreshData(pagination.current); // Maintain current page
        } catch (error) {
            alert("Error actualizando asistencia");
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("¿Eliminar este registro de asistencia?")) {
            try {
                await api.delete(`asistencias/${id}/`);
                refreshData();
            } catch (err) { alert("Error al eliminar"); }
        }
    }

    // --- Create State ---
    const [newEmp, setNewEmp] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newIn, setNewIn] = useState('');
    const [newOut, setNewOut] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('asistencias/', {
                empleado: newEmp,
                fecha: newDate,
                hora_ingreso: newIn,
                hora_salida: newOut || null
            });
            setNewEmp(''); setNewDate(''); setNewIn(''); setNewOut('');
            refreshData();
        } catch (error) {
            alert("Error al crear asistencia");
            console.error(error);
        }
    };

    return (
        <div>
            <h3>Gestionar Asistencias (Entradas/Salidas)</h3>
            
            <div className="form-card">
                <h4>Nueva Asistencia Manual</h4>
                <form onSubmit={handleCreate}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Empleado</label>
                            <select value={newEmp} onChange={e=>setNewEmp(e.target.value)} required>
                                <option value="">Seleccione...</option>
                                {empleados.map(e => (
                                    <option key={e.id} value={e.id}>{e.user.first_name || e.user.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha</label>
                            <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Entrada</label>
                            <input type="time" value={newIn} onChange={e=>setNewIn(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Salida (Opcional)</label>
                            <input type="time" value={newOut} onChange={e=>setNewOut(e.target.value)} />
                        </div>
                    </div>
                    <small style={{display:'block', marginBottom:'1rem', color:'#6c757d'}}>
                        * Si la hora de salida es menor a la entrada (ej. entra 23:00, sale 02:00), el sistema asume automáticamente que es al día siguiente.
                    </small>
                    <button type="submit" className="btn-submit">Crear Registros</button>
                </form>
            </div>

            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Fecha</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Horas</th>
                            <th>Monto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asistencias.map(a => (
                            <tr key={a.id} style={{backgroundColor: editingId===a.id ? 'rgba(251, 191, 36, 0.2)' : (a.pagado ? 'rgba(16, 185, 129, 0.15)' : 'transparent')}}>
                                <td>{a.empleado_nombre}</td>
                                
                                {editingId === a.id ? (
                                    <>
                                        <td><input type="date" value={editFecha} onChange={e=>setEditFecha(e.target.value)} /></td>
                                        <td><input type="time" value={editIngreso} onChange={e=>setEditIngreso(e.target.value)} /></td>
                                        <td><input type="time" value={editSalida} onChange={e=>setEditSalida(e.target.value)} /></td>
                                        <td colSpan="2">Calculado al guardar</td>
                                        <td>
                                            <button className="action-btn" onClick={saveEdit} style={{backgroundColor:'#28a745'}}>Guardar</button>
                                            <button className="action-btn" onClick={()=>setEditingId(null)} style={{backgroundColor:'#6c757d'}}>Cancelar</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{formatDate(a.fecha)}</td>
                                        <td>{a.hora_ingreso?.substring(0,5)}</td>
                                        <td>{a.hora_salida?.substring(0,5) || <span style={{color:'red', fontWeight:'bold'}}>SIN SALIDA</span>}</td>
                                        <td>{a.horas_trabajadas}</td>
                                        <td>${a.monto_total}</td>
                                        <td>
                                            {!a.pagado && (
                                                <button className="action-btn" onClick={()=>startEdit(a)}>Editar</button>
                                            )}
                                            {a.pagado ? 
                                                <span className="badge-paid">PAGADO</span> : 
                                                <button className="action-btn btn-delete" onClick={()=>handleDelete(a.id)}>Borrar</button>
                                            }
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="pagination">
                <button disabled={!pagination.previous} onClick={() => refreshData(pagination.current - 1)} className="btn-page"> Anterior </button>
                <span> Página {pagination.current} </span>
                <button disabled={!pagination.next} onClick={() => refreshData(pagination.current + 1)} className="btn-page"> Siguiente </button>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD ---

const AdminDashboard = () => {
    const [tab, setTab] = useState('liquidacion'); 
    const [asistencias, setAsistencias] = useState([]); // This will now contain only the current page results
    const [pagination, setPagination] = useState({ current: 1, next: null, previous: null, count: 0 });
    const [empleados, setEmpleados] = useState([]);
    const [cargos, setCargos] = useState([]);
    
    useEffect(() => {
        fetchData(1);
    }, []);

    const fetchData = async (page = 1) => {
        try {
            const [asistRes, emplRes, cargoRes] = await Promise.all([
                api.get(`asistencias/?page=${page}`),
                api.get('empleados/'),
                api.get('cargos/')
            ]);
            
            // Handle Pagination Response
            if(asistRes.data.results) {
                setAsistencias(asistRes.data.results);
                setPagination({
                    current: page,
                    next: asistRes.data.next,
                    previous: asistRes.data.previous,
                    count: asistRes.data.count
                });
            } else {
                // Fallback if not paginated (shouldn't happen with our changes)
                setAsistencias(asistRes.data);
            }

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
                <button className={`tab-btn ${tab==='liquidacion'?'active':''}`} onClick={()=>setTab('liquidacion')}>💵 Liquidación</button>
                <button className={`tab-btn ${tab==='asistencias'?'active':''}`} onClick={()=>setTab('asistencias')}>⏱️ Asistencias</button>
                <button className={`tab-btn ${tab==='empleados'?'active':''}`} onClick={()=>setTab('empleados')}>👨‍🍳 Empleados</button>
                <button className={`tab-btn ${tab==='cargos'?'active':''}`} onClick={()=>setTab('cargos')}>💰 Cargos</button>
            </div>

            <div className="dashboard-content">
                {tab === 'liquidacion' && <ReporteLiquidacion empleados={empleados} asistencias={asistencias} refreshData={fetchData} />}
                {tab === 'asistencias' && <CrudAsistencias asistencias={asistencias} empleados={empleados} refreshData={fetchData} pagination={pagination} />}
                {tab === 'empleados' && <CrudEmpleados empleados={empleados} cargos={cargos} refreshData={fetchData} />}
                {tab === 'cargos' && <CrudCargos cargos={cargos} refreshData={fetchData} />}
            </div>
        </div>
    );
};

export default AdminDashboard;
