
import React from 'react';
import { Truck, MapPin } from 'lucide-react';

const Shipping: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Shipping & Logistics</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Live Shipments Map</h2>
        <div className="relative h-96 w-full bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
          <img src="https://picsum.photos/seed/map/1200/600" alt="World Map" className="absolute h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-lg">Live map data loading...</p>
          </div>
          {/* Mock truck icons */}
          <div className="absolute" style={{ top: '20%', left: '30%' }}>
            <Truck className="h-8 w-8 text-cyan-400 animate-pulse" />
            <span className="text-xs text-white bg-black/50 p-1 rounded">ORD-002</span>
          </div>
          <div className="absolute" style={{ top: '50%', left: '50%' }}>
            <Truck className="h-8 w-8 text-cyan-400 animate-pulse" />
             <span className="text-xs text-white bg-black/50 p-1 rounded">ORD-007</span>
          </div>
          <div className="absolute" style={{ top: '70%', left: '80%' }}>
            <Truck className="h-8 w-8 text-cyan-400 animate-pulse" />
             <span className="text-xs text-white bg-black/50 p-1 rounded">ORD-011</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tracking Details</h2>
        <div className="space-y-4">
            <div className="flex items-start p-4 bg-gray-700 rounded-lg">
                <Truck className="h-6 w-6 text-cyan-400 mt-1 mr-4" />
                <div>
                    <p className="font-bold">ORD-002 - Jane Smith</p>
                    <p className="text-sm text-gray-300">En route to: New York, NY</p>
                    <div className="mt-2 flex items-center text-xs text-gray-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>Last update: 5 mins ago</span>
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <p className="font-semibold">Status: In Transit</p>
                    <p className="text-sm text-gray-300">ETA: 2 hours</p>
                </div>
            </div>
            {/* Add more tracking items */}
        </div>
      </div>
    </div>
  );
};

export default Shipping;
