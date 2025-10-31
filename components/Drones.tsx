
import React, { useState, useEffect } from 'react';
import type { Drone } from '../types';
import { DroneStatus } from '../types';
import { Bot, Battery, Thermometer, Package } from 'lucide-react';

const initialDrones: Drone[] = Array.from({ length: 10 }, (_, i) => ({
    id: `AEX-${700 + i}`,
    model: i % 3 === 0 ? 'HeavyLift V2' : 'SkyHopper Pro',
    status: DroneStatus.Idle,
    battery: 100,
    position: { x: Math.random() * 95, y: Math.random() * 95 },
    payload: 0,
}));

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

const DroneIcon = ({ drone }: { drone: Drone }) => (
    <div 
        className="absolute transition-all duration-1000 ease-in-out" 
        style={{ left: `${drone.position.x}%`, top: `${drone.position.y}%` }}
        title={`Drone ${drone.id}`}
    >
        <Bot className={`h-6 w-6 ${getStatusColor(drone.status)}`} />
    </div>
);

const Drones: React.FC = () => {
    const [drones, setDrones] = useState<Drone[]>(initialDrones);
    const [selectedDrone, setSelectedDrone] = useState<Drone | null>(drones[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDrones(prevDrones => prevDrones.map(drone => {
                let { x, y } = drone.position;
                const status = drone.status;

                if (status === DroneStatus.InTransit || status === DroneStatus.Delivering || status === DroneStatus.Returning) {
                    x += (Math.random() - 0.5) * 2;
                    y += (Math.random() - 0.5) * 2;
                }
                
                x = Math.max(0, Math.min(95, x));
                y = Math.max(0, Math.min(95, y));

                return { ...drone, position: { x, y } };
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6">
            <h1 className="text-3xl font-bold text-white">Drone Fleet Command</h1>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg p-4 relative overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-transparent"
                        style={{
                            backgroundSize: '40px 40px',
                            backgroundImage: 'linear-gradient(to right, #4a5568 1px, transparent 1px), linear-gradient(to bottom, #4a5568 1px, transparent 1px)'
                        }}
                    ></div>
                    {drones.map(drone => <DroneIcon key={drone.id} drone={drone} />)}
                </div>
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Fleet Status</h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {drones.map(drone => (
                             <div key={drone.id} className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${selectedDrone?.id === drone.id ? 'bg-cyan-900/50' : 'hover:bg-gray-700'}`} onClick={() => setSelectedDrone(drone)}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{drone.id}</span>
                                    <span className={`text-sm font-medium ${getStatusColor(drone.status)}`}>{drone.status}</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${drone.battery}%`}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {selectedDrone && (
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-2xl font-bold text-cyan-400">{selectedDrone.id}</h3>
                    <p className="text-gray-400">{selectedDrone.model}</p>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                           <Bot className={`h-6 w-6 ${getStatusColor(selectedDrone.status)}`} />
                           <div>
                                <p className="text-xs text-gray-400">Status</p>
                                <p className="font-semibold">{selectedDrone.status}</p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                           <Battery className="h-6 w-6 text-green-400" />
                            <div>
                                <p className="text-xs text-gray-400">Battery</p>
                                <p className="font-semibold">{selectedDrone.battery}%</p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                           <Package className="h-6 w-6 text-yellow-400" />
                            <div>
                                <p className="text-xs text-gray-400">Payload</p>
                                <p className="font-semibold">{selectedDrone.payload} kg</p>
                           </div>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default Drones;
