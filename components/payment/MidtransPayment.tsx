'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

declare global {
    interface Window {
        snap: {
            pay: (
                token: string,
                options: {
                    onSuccess?: (result: MidtransResult) => void;
                    onPending?: (result: MidtransResult) => void;
                    onError?: (result: MidtransResult) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}

interface MidtransResult {
    order_id: string;
    transaction_status: string;
    payment_type: string;
    gross_amount: string;
    status_code: string;
    status_message: string;
}

interface MidtransPaymentProps {
    transactionId: number;
    onSuccess?: (result: MidtransResult) => void;
    onPending?: (result: MidtransResult) => void;
    onError?: (result: MidtransResult) => void;
    onClose?: () => void;
    disabled?: boolean;
}

export default function MidtransPayment({
    transactionId,
    onSuccess,
    onPending,
    onError,
    onClose,
    disabled = false
}: MidtransPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snapReady, setSnapReady] = useState(false);
    const [clientKey, setClientKey] = useState<string | null>(null);
    const [isProduction, setIsProduction] = useState(false);

    // Load Midtrans Snap JS
    useEffect(() => {
        const loadSnapScript = async () => {
            try {
                // Get client key from backend
                const response = await paymentsAPI.getClientKey();
                const { client_key, is_production } = response.data.data;
                setClientKey(client_key);
                setIsProduction(is_production);

                // Check if script already loaded
                if (window.snap) {
                    setSnapReady(true);
                    return;
                }

                // Load Midtrans Snap script
                const script = document.createElement('script');
                const baseUrl = is_production
                    ? 'https://app.midtrans.com'
                    : 'https://app.sandbox.midtrans.com';
                script.src = `${baseUrl}/snap/snap.js`;
                script.setAttribute('data-client-key', client_key);
                script.async = true;

                script.onload = () => {
                    setSnapReady(true);
                };

                script.onerror = () => {
                    setError('Failed to load payment script');
                };

                document.body.appendChild(script);

                return () => {
                    // Cleanup if needed
                };
            } catch (err) {
                console.error('Error loading Midtrans:', err);
                setError('Failed to initialize payment');
            }
        };

        loadSnapScript();
    }, []);

    const handlePayment = useCallback(async () => {
        if (!snapReady || !clientKey) {
            setError('Payment system not ready');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create payment and get snap token
            const response = await paymentsAPI.createPayment(transactionId);
            const { token, order_id } = response.data.data;

            if (!token) {
                throw new Error('Failed to get payment token');
            }

            console.log('Opening Midtrans popup for order:', order_id);

            // Open Midtrans Snap popup
            window.snap.pay(token, {
                onSuccess: (result) => {
                    console.log('Payment success:', result);
                    setLoading(false);
                    onSuccess?.(result);
                },
                onPending: (result) => {
                    console.log('Payment pending:', result);
                    setLoading(false);
                    onPending?.(result);
                },
                onError: (result) => {
                    console.log('Payment error:', result);
                    setLoading(false);
                    setError('Payment failed');
                    onError?.(result);
                },
                onClose: () => {
                    console.log('Payment popup closed');
                    setLoading(false);
                    onClose?.();
                }
            });
        } catch (err: unknown) {
            console.error('Payment error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
            setError(errorMessage);
            setLoading(false);
        }
    }, [snapReady, clientKey, transactionId, onSuccess, onPending, onError, onClose]);

    return (
        <div className="space-y-3">
            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <Button
                onClick={handlePayment}
                disabled={disabled || loading || !snapReady}
                className="w-full gap-2"
                size="lg"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                    </>
                ) : !snapReady ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-4 h-4" />
                        Bayar dengan Midtrans
                    </>
                )}
            </Button>

            {!isProduction && (
                <p className="text-xs text-center text-muted-foreground">
                    Mode Sandbox - Gunakan kartu test untuk testing
                </p>
            )}
        </div>
    );
}
