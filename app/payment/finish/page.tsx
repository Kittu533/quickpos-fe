'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, AlertCircle, Home, Receipt, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsAPI } from '@/lib/api';

function PaymentFinishContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'success' | 'pending' | 'error' | 'unknown'>('unknown');
    const [checking, setChecking] = useState(false);

    const checkPaymentStatus = useCallback(async (orderId: string) => {
        try {
            setChecking(true);
            const response = await paymentsAPI.checkStatus(orderId);
            const { transaction_status } = response.data.data || {};
            
            if (transaction_status === 'settlement' || transaction_status === 'capture') {
                setStatus('success');
            } else if (transaction_status === 'pending') {
                setStatus('pending');
            } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
                setStatus('error');
            }
        } catch (err) {
            console.error('Error checking status:', err);
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const statusCode = searchParams.get('status_code');
        const transactionStatus = searchParams.get('transaction_status');

        if (statusCode === '200' || transactionStatus === 'settlement' || transactionStatus === 'capture') {
            setStatus('success');
        } else if (transactionStatus === 'pending') {
            setStatus('pending');
        } else if (statusCode || transactionStatus) {
            setStatus('error');
        }

        // Poll status dari backend untuk update database
        if (orderId) {
            checkPaymentStatus(orderId);
        }
    }, [searchParams, checkPaymentStatus]);

    const getStatusContent = () => {
        switch (status) {
            case 'success':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    title: 'Pembayaran Berhasil!',
                    description: 'Transaksi Anda telah berhasil diproses.',
                    color: 'text-green-600'
                };
            case 'pending':
                return {
                    icon: <Clock className="w-16 h-16 text-yellow-500" />,
                    title: 'Menunggu Pembayaran',
                    description: 'Silakan selesaikan pembayaran sesuai instruksi.',
                    color: 'text-yellow-600'
                };
            case 'error':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Pembayaran Gagal',
                    description: 'Terjadi kesalahan saat memproses pembayaran.',
                    color: 'text-red-600'
                };
            default:
                return {
                    icon: <AlertCircle className="w-16 h-16 text-gray-500" />,
                    title: 'Status Tidak Diketahui',
                    description: 'Silakan cek status transaksi Anda.',
                    color: 'text-gray-600'
                };
        }
    };

    const content = getStatusContent();
    const orderId = searchParams.get('order_id');

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    {content.icon}
                </div>
                <CardTitle className={content.color}>{content.title}</CardTitle>
                <CardDescription>{content.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {orderId && (
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-mono font-semibold">{orderId}</p>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {status === 'pending' && orderId && (
                        <Button
                            variant="secondary"
                            onClick={() => checkPaymentStatus(orderId)}
                            disabled={checking}
                            className="w-full gap-2"
                        >
                            {checking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            Cek Status Pembayaran
                        </Button>
                    )}

                    <Button
                        onClick={() => router.push('/pos')}
                        className="w-full gap-2"
                    >
                        <Receipt className="w-4 h-4" />
                        Kembali ke POS
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="w-full gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Ke Dashboard
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingFallback() {
    return (
        <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-muted-foreground">Loading payment status...</p>
            </CardContent>
        </Card>
    );
}

export default function PaymentFinishPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<LoadingFallback />}>
                <PaymentFinishContent />
            </Suspense>
        </div>
    );
}
