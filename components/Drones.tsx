import React, { useState, useEffect, useRef } from 'react';
import type { Drone } from '../types';
import { DroneStatus } from '../types';
import { Bot, Battery, Thermometer, Package, HeartPulse, Signal, ArrowUpCircle, Clock, Hash, AlertTriangle, XCircle, Edit, Settings, BatteryWarning } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const initialDrones: Drone[] = Array.from({ length: 10 }, (_, i) => ({
    id: `AEX-${700 + i}`,
    model: i % 3 === 0 ? 'HeavyLift V2' : 'SkyHopper Pro',
    status: DroneStatus.Idle,
    battery: 100,
    health: 100,
    estimatedFlightTime: 60,
    position: { x: Math.random() * 95, y: Math.random() * 95 },
    payload: 0,
    telemetry: {
        signalStrength: 98,
        temperature: 25,
        altitude: 0,
    },
}));

type TelemetryPoint = {
    time: number;
    signal: number;
    temp: number;
    alt: number;
};
type TelemetryHistory = Record<string, TelemetryPoint[]>;

interface Geofence {
    x: number;
    y: number;
    width: number;
    height: number;
}

type AlertType = 'geofence' | 'battery' | 'temperature';

interface SystemAlert {
    droneId: string;
    timestamp: number;
    type: AlertType;
    message: string;
}

const MAX_HISTORY_LENGTH = 30;
const BASE_STATION = { x: 0, y: 0 };
const CRUISING_ALTITUDE = 120; // meters
const MAX_TEMP = 45; // Celsius
const AMBIENT_TEMP = 25; // Celsius

const getStatusColor = (status: DroneStatus) => {
    const colors: Record<DroneStatus, string> = {
        [DroneStatus.Idle]: 'text-green-400',
        [DroneStatus.InTransit]: 'text-blue-400',
        [DroneStatus.Delivering]: 'text-cyan-400',
        [DroneStatus.Returning]: 'text-purple-400',
        [DroneStatus.Charging]: 'text-yellow-400',
        [DroneStatus.Maintenance]: 'text-red-400',
    };
    return colors[status];
};

const DroneIcon = ({ drone, isAlerting }: { drone: Drone, isAlerting: boolean }) => (
    <div 
        className="absolute transition-all duration-1000 ease-in-out" 
        style={{ left: `${drone.position.x}%`, top: `${drone.position.y}%` }}
        title={`Drone ${drone.id}`}
    >
        <Bot className={`h-6 w-6 ${isAlerting ? 'text-red-500 animate-pulse' : getStatusColor(drone.status)}`} />
    </div>
);

const DetailCard: React.FC<{ icon: React.ElementType, label: string, value: string | number, iconClass?: string }> = ({ icon: Icon, label, value, iconClass = "text-cyan-400" }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
        <Icon className={`h-7 w-7 ${iconClass}`} />
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-base">{value}</p>
        </div>
    </div>
);

const TelemetryChart: React.FC<{
  data: TelemetryPoint[];
  dataKey: keyof Omit<TelemetryPoint, 'time'>;
  strokeColor: string;
  title: string;
  unit: string;
}> = ({ data, dataKey, strokeColor, title, unit }) => (
  <div className="bg-gray-700 p-3 rounded-lg flex-1">
    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">{title}</h4>
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis dataKey="time" hide={true} />
        <YAxis stroke="#a0aec0" tick={{ fontSize: 10 }} unit={unit} domain={['dataMin - 5', 'dataMax + 5']} allowDataOverflow={true} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', borderRadius: '0.5rem' }}
          labelFormatter={(label) => new Date(label).toLocaleTimeString()}
          formatter={(value) => [`${(value as number).toFixed(1)}${unit}`, null]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const AlertIcon: React.FC<{type: AlertType}> = ({ type }) => {
    switch (type) {
        case 'geofence': return <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />;
        case 'battery': return <BatteryWarning className="h-5 w-5 text-orange-400 flex-shrink-0" />;
        case 'temperature': return <Thermometer className="h-5 w-5 text-red-400 flex-shrink-0" />;
        default: return null;
    }
}

const Drones: React.FC = () => {
    const [drones, setDrones] = useState<Drone[]>(initialDrones);
    const [selectedDrone, setSelectedDrone] = useState<Drone | null>(drones[0]);
    const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistory>({});
    
    const [geofence, setGeofence] = useState<Geofence | null>({ x: 5, y: 5, width: 90, height: 90 });
    const [isDefiningGeofence, setIsDefiningGeofence] = useState(false);
    const [drawingFence, setDrawingFence] = useState<Geofence | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [alertThresholds, setAlertThresholds] = useState({
        battery: 20, // percentage
        temperature: 40, // Celsius
    });
    
    const mapRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const startPos = useRef({x: 0, y: 0});

    useEffect(() => {
        const interval = setInterval(() => {
            const currentAlerts: SystemAlert[] = [];

            setDrones(prevDrones => {
                const nextDrones = prevDrones.map(drone => {
                    let { x, y } = drone.position;
                    const { status, battery, health, telemetry } = drone;
                    let newBattery = battery;
                    let newHealth = health;
                    let newTelemetry = { ...telemetry };
                    let newOrderId = drone.orderId;
    
                    const isActive = status === DroneStatus.InTransit || status === DroneStatus.Delivering || status === DroneStatus.Returning;
    
                    if (isActive) {
                        x += (Math.random() - 0.5) * 4;
                        y += (Math.random() - 0.5) * 4;
                        newBattery = Math.max(0, battery - 0.2);
                        newHealth = Math.max(0, health - (Math.random() * 0.01));
                        newTelemetry.altitude = Math.min(CRUISING_ALTITUDE, telemetry.altitude + 5 + Math.random() * 2);
                        newTelemetry.temperature = Math.min(MAX_TEMP, telemetry.temperature + 0.5 + Math.random() * 0.2);
                        if (!newOrderId) newOrderId = `ORD-0${Math.floor(Math.random()*20) + 10}`;
                    } else {
                        newTelemetry.altitude = Math.max(0, telemetry.altitude - 10);
                        newTelemetry.temperature = Math.max(AMBIENT_TEMP, telemetry.temperature - 0.5);
                        if(status === DroneStatus.Idle) newOrderId = undefined;
                    }
                    
                    x = Math.max(0, Math.min(95, x));
                    y = Math.max(0, Math.min(95, y));
                    
                    const distance = Math.sqrt(Math.pow(x - BASE_STATION.x, 2) + Math.pow(y - BASE_STATION.y, 2));
                    newTelemetry.signalStrength = Math.max(0, 100 - (distance * 0.3) - Math.random() * 5);
                    const estimatedFlightTime = Math.floor((newBattery / 100) * 60);
                    
                    if (geofence && isActive) {
                        const isOutside = x < geofence.x || x > geofence.x + geofence.width || y < geofence.y || y > geofence.y + geofence.height;
                        if (isOutside) {
                             currentAlerts.push({ droneId: drone.id, timestamp: Date.now(), type: 'geofence', message: `${drone.id} breached the geofence.` });
                        }
                    }

                    if (isActive && newBattery < alertThresholds.battery) {
                        currentAlerts.push({ droneId: drone.id, timestamp: Date.now(), type: 'battery', message: `${drone.id} has low battery (${newBattery.toFixed(0)}%).` });
                    }

                    if (newTelemetry.temperature > alertThresholds.temperature) {
                        currentAlerts.push({ droneId: drone.id, timestamp: Date.now(), type: 'temperature', message: `${drone.id} is overheating (${newTelemetry.temperature.toFixed(1)}°C).` });
                    }

                    return { ...drone, position: { x, y }, battery: newBattery, health: newHealth, telemetry: newTelemetry, estimatedFlightTime, orderId: newOrderId };
                });
    
                setAlerts(currentAlerts);

                setTelemetryHistory(prevHistory => {
                    const nextHistory = { ...prevHistory };
                    nextDrones.forEach(drone => {
                        const history = nextHistory[drone.id] || [];
                        const newPoint: TelemetryPoint = {
                            time: Date.now(),
                            signal: drone.telemetry.signalStrength,
                            temp: drone.telemetry.temperature,
                            alt: drone.telemetry.altitude,
                        };
                        nextHistory[drone.id] = [...history, newPoint].slice(-MAX_HISTORY_LENGTH);
                    });
                    return nextHistory;
                });
                
                return nextDrones;
            });
        }, 2000);
    
        return () => clearInterval(interval);
    }, [geofence, alertThresholds]);

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAlertThresholds(prev => ({...prev, [name]: parseFloat(value)}));
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDefiningGeofence || !mapRef.current) return;
        isDrawing.current = true;
        const rect = mapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        startPos.current = { x, y };
        setDrawingFence({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing.current || !mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newX = Math.min(startPos.current.x, currentX);
        const newY = Math.min(startPos.current.y, currentY);
        const width = Math.abs(currentX - startPos.current.x);
        const height = Math.abs(currentY - startPos.current.y);

        setDrawingFence({ x: newX, y: newY, width, height });
    };

    const handleMouseUp = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (drawingFence && drawingFence.width > 2 && drawingFence.height > 2) {
            setGeofence(drawingFence);
        }
        setDrawingFence(null);
        setIsDefiningGeofence(false);
    };

    const alertDroneIds = new Set(alerts.map(a => a.droneId));

    return (
        <div className="h-full flex flex-col space-y-6">
            <h1 className="text-3xl font-bold text-white">Drone Fleet Command</h1>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div 
                    className={`lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-4 relative overflow-hidden ${isDefiningGeofence ? 'cursor-crosshair' : ''}`}
                    ref={mapRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div className="absolute inset-0 bg-transparent" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, #4a5568 1px, transparent 1px), linear-gradient(to bottom, #4a5568 1px, transparent 1px)' }}></div>
                    {isDefiningGeofence && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold z-10">Click and drag to define the operational area</div>}
                    {geofence && <div className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/10 pointer-events-none" style={{ left: `${geofence.x}%`, top: `${geofence.y}%`, width: `${geofence.width}%`, height: `${geofence.height}%` }}></div>}
                    {drawingFence && <div className="absolute border-2 border-yellow-500 bg-yellow-500/20 pointer-events-none" style={{ left: `${drawingFence.x}%`, top: `${drawingFence.y}%`, width: `${drawingFence.width}%`, height: `${drawingFence.height}%` }}></div>}
                    {drones.map(drone => <DroneIcon key={drone.id} drone={drone} isAlerting={alertDroneIds.has(drone.id)} />)}
                </div>
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Fleet Status</h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {drones.map(drone => (
                             <div key={drone.id} className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${selectedDrone?.id === drone.id ? 'bg-cyan-900/50' : 'hover:bg-gray-700'} ${alertDroneIds.has(drone.id) ? 'ring-2 ring-red-500' : ''}`} onClick={() => setSelectedDrone(drone)}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{drone.id}</span>
                                    <span className={`text-sm font-medium ${getStatusColor(drone.status)}`}>{drone.status}</span>
                                </div>
                                <div className="space-y-1.5 mt-2">
                                    <div className="w-full bg-gray-600 rounded-full h-1.5"><div title={`Battery: ${drone.battery.toFixed(0)}%`} className="bg-green-500 h-1.5 rounded-full" style={{width: `${drone.battery}%`}}></div></div>
                                    <div className="w-full bg-gray-600 rounded-full h-1.5"><div title={`Health: ${drone.health.toFixed(0)}%`} className="bg-cyan-500 h-1.5 rounded-full" style={{width: `${drone.health}%`}}></div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                     <div>
                        <h3 className="text-xl font-bold text-white mb-3">Geofence Controls</h3>
                        <div className="flex space-x-4">
                            <button onClick={() => setIsDefiningGeofence(true)} disabled={isDefiningGeofence} className="flex items-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Edit className="h-5 w-5 mr-2" /> Define Zone
                            </button>
                            <button onClick={() => setGeofence(null)} disabled={!geofence} className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50">
                                <XCircle className="h-5 w-5 mr-2" /> Clear Zone
                            </button>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Settings className="h-5 w-5 mr-2"/>Alert Thresholds</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label htmlFor="battery" className="text-gray-300">Low Battery Threshold (%)</label>
                                <input type="number" id="battery" name="battery" value={alertThresholds.battery} onChange={handleThresholdChange} className="w-24 bg-gray-700 text-white rounded p-1 text-center"/>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="temperature" className="text-gray-300">High Temp Threshold (°C)</label>
                                <input type="number" id="temperature" name="temperature" value={alertThresholds.temperature} onChange={handleThresholdChange} className="w-24 bg-gray-700 text-white rounded p-1 text-center"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`bg-gray-800 rounded-lg shadow-lg p-6 ${alerts.length > 0 ? 'border border-red-500/50' : 'border border-transparent'}`}>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                        <AlertTriangle className={`h-6 w-6 mr-3 ${alerts.length > 0 ? 'text-red-500' : 'text-gray-500'}`} /> System Alerts ({alerts.length})
                    </h3>
                    <div className="max-h-32 overflow-y-auto pr-2">
                        {alerts.length > 0 ? alerts.map(alert => (
                            <div key={`${alert.droneId}-${alert.type}`} className="flex items-start text-sm p-2 bg-gray-700/50 rounded mb-1 space-x-3">
                                <AlertIcon type={alert.type}/>
                                <p>{alert.message}</p>
                            </div>
                        )) : <p className="text-gray-400">All systems normal.</p>}
                    </div>
                </div>
            </div>

             {selectedDrone && (
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold text-cyan-400">{selectedDrone.id}</h3>
                          <p className="text-gray-400">{selectedDrone.model}</p>
                        </div>
                        <div className="flex items-center space-x-2 p-3 bg-gray-700/50 rounded-lg">
                          <Bot className={`h-6 w-6 ${getStatusColor(selectedDrone.status)}`} />
                          <div><p className="text-xs text-gray-400">Status</p><p className="font-semibold">{selectedDrone.status}</p></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailCard icon={Package} label="Payload" value={`${selectedDrone.payload} kg`} iconClass="text-yellow-400" />
                        <DetailCard icon={Battery} label="Battery" value={`${selectedDrone.battery.toFixed(0)}%`} iconClass="text-green-400" />
                        {/* Fix: Corrected typo from `selected` to `selectedDrone` */}
                        <DetailCard icon={HeartPulse} label="Health" value={`${selectedDrone.health.toFixed(0)}%`} iconClass="text-rose-400" />
                        <DetailCard icon={Clock} label="Est. Flight Time" value={`${selectedDrone.estimatedFlightTime} min`} />
                        {selectedDrone.orderId && <DetailCard icon={Hash} label="Assigned Order" value={selectedDrone.orderId} />}
                      </div>
                    </div>
                    <div className="lg:col-span-3">
                      <h3 className="text-xl font-bold mb-4 text-white">Live Instrument Panel</h3>
                      <div className="flex flex-col space-y-4">
                        <TelemetryChart data={telemetryHistory[selectedDrone.id] || []} dataKey="signal" strokeColor="#06b6d4" title="Signal Strength" unit="%" />
                        <TelemetryChart data={telemetryHistory[selectedDrone.id] || []} dataKey="temp" strokeColor="#f59e0b" title="Core Temperature" unit="°C" />
                        <TelemetryChart data={telemetryHistory[selectedDrone.id] || []} dataKey="alt" strokeColor="#8b5cf6" title="Altitude" unit="m" />
                      </div>
                    </div>
                  </div>
                </div>
             )}
        </div>
    );
};

export default Drones;