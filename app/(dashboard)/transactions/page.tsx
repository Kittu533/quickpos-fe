"use client";

import { useEffect, useState } from "react";
import { transactionsAPI } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { Receipt, Search, Loader2 } from "lucide-react";

interface Transaction {
  id: number;
  transaction_code: string;
  total: number;
  payment_method: string;
  status: string;
  transaction_date: string;
  customer?: { name: string; member_code: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await transactionsAPI.getAll({ limit: 100 });
        setTransactions(res.data.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
    (t) =>
      t.transaction_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getPaymentBadge = (method: string) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      cash: "default",
      debit: "secondary",
      credit: "secondary",
      ewallet: "outline",
    };
    return <Badge variant={colors[method] || "secondary"}>{method.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Transactions</h2>
        <p className="text-muted-foreground">View transaction history</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by code or customer..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Transaction</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-mono text-sm">{transaction.transaction_code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {transaction.customer ? (
                          <div>
                            <p>{transaction.customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.customer.member_code}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getPaymentBadge(transaction.payment_method)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(parseFloat(String(transaction.total)))}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <Badge variant={transaction.status === "completed" ? "success" : "destructive"}>
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {formatDateTime(transaction.transaction_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
