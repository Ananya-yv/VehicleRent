import { supabase } from '$lib/supabase';
import type { TransactionType, PaymentStatus } from '$lib/database.types';

export interface Transaction {
	id: string;
	booking_id: string;
	transaction_type: TransactionType;
	amount: number;
	payment_status: PaymentStatus;
	created_at: string;
	// Joined fields
	booking?: {
		id: string;
		customer_name: string;
		phone: string;
		vehicle: {
			model: string;
			type: string;
		};
	};
}

export interface TransactionFilters {
	booking_id?: string;
	transaction_type?: TransactionType;
	payment_status?: PaymentStatus;
}

export interface CreateTransactionData {
	booking_id: string;
	transaction_type: TransactionType;
	amount: number;
	payment_status?: PaymentStatus;
}

export interface UpdateTransactionData {
	payment_status?: PaymentStatus;
}

function createTransactionStore() {
	let transactions = $state<Transaction[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const selectQuery = `
		*,
		booking:bookings(
			id, customer_name, phone,
			vehicle:vehicles(model, type)
		)
	`;

	async function fetchAll(filters?: TransactionFilters): Promise<Transaction[]> {
		loading = true;
		error = null;

		try {
			let query = supabase
				.from('transactions')
				.select(selectQuery)
				.order('created_at', { ascending: false });

			if (filters?.booking_id) {
				query = query.eq('booking_id', filters.booking_id);
			}
			if (filters?.transaction_type) {
				query = query.eq('transaction_type', filters.transaction_type);
			}
			if (filters?.payment_status) {
				query = query.eq('payment_status', filters.payment_status);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			transactions = (data as Transaction[]) || [];
			return transactions;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch transactions';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchById(id: string): Promise<Transaction | null> {
		const { data, error: fetchError } = await supabase
			.from('transactions')
			.select(selectQuery)
			.eq('id', id)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as Transaction;
	}

	async function fetchByBooking(bookingId: string): Promise<Transaction[]> {
		return fetchAll({ booking_id: bookingId });
	}

	async function create(transactionData: CreateTransactionData): Promise<Transaction | null> {
		loading = true;
		error = null;

		try {
			const { data, error: insertError } = await supabase
				.from('transactions')
				.insert({
					...transactionData,
					payment_status: transactionData.payment_status || 'success'
				})
				.select(selectQuery)
				.single();

			if (insertError) throw insertError;

			const newTransaction = data as Transaction;
			transactions = [newTransaction, ...transactions];
			return newTransaction;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create transaction';
			return null;
		} finally {
			loading = false;
		}
	}

	async function update(id: string, updates: UpdateTransactionData): Promise<Transaction | null> {
		loading = true;
		error = null;

		const previousTransactions = [...transactions];
		transactions = transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));

		try {
			const { data, error: updateError } = await supabase
				.from('transactions')
				.update(updates)
				.eq('id', id)
				.select(selectQuery)
				.single();

			if (updateError) throw updateError;

			const updatedTransaction = data as Transaction;
			transactions = transactions.map((t) => (t.id === id ? updatedTransaction : t));
			return updatedTransaction;
		} catch (e) {
			transactions = previousTransactions;
			error = e instanceof Error ? e.message : 'Failed to update transaction';
			return null;
		} finally {
			loading = false;
		}
	}

	async function markAsRefunded(id: string): Promise<Transaction | null> {
		return update(id, { payment_status: 'refunded' });
	}

	async function createRefund(bookingId: string, amount: number): Promise<Transaction | null> {
		return create({
			booking_id: bookingId,
			transaction_type: 'refund',
			amount,
			payment_status: 'refunded'
		});
	}

	function getByType(type: TransactionType): Transaction[] {
		return transactions.filter((t) => t.transaction_type === type);
	}

	function getByStatus(status: PaymentStatus): Transaction[] {
		return transactions.filter((t) => t.payment_status === status);
	}

	function getTotalRevenue(): number {
		return transactions
			.filter((t) => t.payment_status === 'success' && t.transaction_type !== 'refund')
			.reduce((sum, t) => sum + t.amount, 0);
	}

	function getTotalRefunds(): number {
		return transactions
			.filter((t) => t.transaction_type === 'refund')
			.reduce((sum, t) => sum + t.amount, 0);
	}

	return {
		get transactions() {
			return transactions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchAll,
		fetchById,
		fetchByBooking,
		create,
		update,
		markAsRefunded,
		createRefund,
		getByType,
		getByStatus,
		getTotalRevenue,
		getTotalRefunds
	};
}

export const transactionStore = createTransactionStore();
