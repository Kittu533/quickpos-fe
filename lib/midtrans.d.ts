// Midtrans TypeScript declarations

export interface MidtransResult {
    order_id: string;
    transaction_status: string;
    payment_type: string;
    gross_amount?: string;
    status_code?: string;
    status_message?: string;
}

export interface MidtransSnap {
    pay: (
        token: string,
        options: {
            onSuccess?: (result: MidtransResult) => void;
            onPending?: (result: MidtransResult) => void;
            onError?: (result: MidtransResult) => void;
            onClose?: () => void;
        }
    ) => void;
}

declare global {
    interface Window {
        snap?: MidtransSnap;
    }
}

export { };
