
import React, { useState } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import { PlusCircle, Search } from 'lucide-react';

const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'John Doe', date: '2023-10-27', status: OrderStatus.Delivered, total: 250.00, items: 3 },
  { id: 'ORD-002', customerName: 'Jane Smith', date: '2023-10-26', status: OrderStatus.Shipped, total: 150.50, items: 2 },
  { id: 'ORD-003', customerName: 'Sam Wilson', date: '2023-10-26', status: OrderStatus.Processing, total: 75.00, items: 1 },
  { id: 'ORD-004', customerName: 'Alice Johnson', date: '2023-10-25', status: OrderStatus.Pending, total: 320.00, items: 5 },
  { id: 'ORD-005', customerName: 'Robert Brown', date: '2023-10-24', status: OrderStatus.Cancelled, total: 50.00, items: 1 },
];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Delivered: return 'bg-green-500 text-green-900';
    case OrderStatus.Shipped: return 'bg-blue-500 text-blue-900';
    case OrderStatus.Processing: return 'bg-yellow-500 text-yellow-900';
    case OrderStatus.Pending: return 'bg-orange-500 text-orange-900';
    case OrderStatus.Cancelled: return 'bg-red-500 text-red-900';
    default: return 'bg-gray-500 text-gray-900';
  }
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <button className="flex items-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
          <PlusCircle className="h-5 w-5 mr-2" />
          New Order
        </button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by Order ID or Customer..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 font-mono text-cyan-400">{order.id}</td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4">{order.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">{order.items}</td>
                  <td className="p-4 text-right font-medium">${order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
