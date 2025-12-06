export type UserRole = 'admin' | 'delivery' | 'helpline';
export type RentType = 'daily' | 'hourly';
export type AvailabilityStatus = 'available' | 'booked' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'delivered' | 'returned' | 'cancelled';
export type TransactionType = 'advance' | 'full' | 'refund';
export type PaymentStatus = 'success' | 'failed' | 'refunded';
export type DeliveryAction = 'delivered' | 'picked_up';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved';

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					name: string;
					email: string;
					role: UserRole;
					phone: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					email: string;
					role: UserRole;
					phone?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					email?: string;
					role?: UserRole;
					phone?: string | null;
					created_at?: string;
				};
			};
			vehicles: {
				Row: {
					id: string;
					model: string;
					type: string;
					rent_type: RentType;
					rent_price: number;
					condition: string | null;
					availability_status: AvailabilityStatus;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					model: string;
					type: string;
					rent_type: RentType;
					rent_price: number;
					condition?: string | null;
					availability_status?: AvailabilityStatus;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					model?: string;
					type?: string;
					rent_type?: RentType;
					rent_price?: number;
					condition?: string | null;
					availability_status?: AvailabilityStatus;
					created_at?: string;
					updated_at?: string;
				};
			};
			bookings: {
				Row: {
					id: string;
					vehicle_id: string;
					customer_name: string;
					phone: string;
					email: string;
					driving_license: string;
					delivery_location: string;
					start_date: string;
					end_date: string;
					advance_amount: number;
					status: BookingStatus;
					otp_code: string | null;
					assigned_delivery_agent_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					vehicle_id: string;
					customer_name: string;
					phone: string;
					email: string;
					driving_license: string;
					delivery_location: string;
					start_date: string;
					end_date: string;
					advance_amount: number;
					status?: BookingStatus;
					otp_code?: string | null;
					assigned_delivery_agent_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					vehicle_id?: string;
					customer_name?: string;
					phone?: string;
					email?: string;
					driving_license?: string;
					delivery_location?: string;
					start_date?: string;
					end_date?: string;
					advance_amount?: number;
					status?: BookingStatus;
					otp_code?: string | null;
					assigned_delivery_agent_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			transactions: {
				Row: {
					id: string;
					booking_id: string;
					transaction_type: TransactionType;
					amount: number;
					payment_status: PaymentStatus;
					created_at: string;
				};
				Insert: {
					id?: string;
					booking_id: string;
					transaction_type: TransactionType;
					amount: number;
					payment_status?: PaymentStatus;
					created_at?: string;
				};
				Update: {
					id?: string;
					booking_id?: string;
					transaction_type?: TransactionType;
					amount?: number;
					payment_status?: PaymentStatus;
					created_at?: string;
				};
			};
			delivery_logs: {
				Row: {
					id: string;
					booking_id: string;
					delivery_agent_id: string;
					action: DeliveryAction;
					action_time: string;
					notes: string | null;
				};
				Insert: {
					id?: string;
					booking_id: string;
					delivery_agent_id: string;
					action: DeliveryAction;
					action_time?: string;
					notes?: string | null;
				};
				Update: {
					id?: string;
					booking_id?: string;
					delivery_agent_id?: string;
					action?: DeliveryAction;
					action_time?: string;
					notes?: string | null;
				};
			};
			complaints: {
				Row: {
					id: string;
					booking_id: string;
					description: string;
					priority: ComplaintPriority;
					status: ComplaintStatus;
					helpline_agent_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					booking_id: string;
					description: string;
					priority?: ComplaintPriority;
					status?: ComplaintStatus;
					helpline_agent_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					booking_id?: string;
					description?: string;
					priority?: ComplaintPriority;
					status?: ComplaintStatus;
					helpline_agent_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
		Functions: {
			get_user_role: {
				Args: Record<string, never>;
				Returns: UserRole;
			};
		};
	};
}
