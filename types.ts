
export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: number;
}

export enum DroneStatus {
    Idle = 'Idle',
    InTransit = 'In-Transit',
    Delivering = 'Delivering',
    Returning = 'Returning',
    Charging = 'Charging',
    Maintenance = 'Maintenance'
}

export interface Drone {
    id: string;
    model: string;
    status: DroneStatus;
    battery: number;
    position: {
        x: number;
        y: number;
    };
    payload: number;
}

export interface FeedbackItem {
    id: string;
    customerName: string;
    date: string;
    comment: string;
    rating: number;
}

export interface AnalyzedFeedback {
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    summary: string;
    keywords: string[];
}
