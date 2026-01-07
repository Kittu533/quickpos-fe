"use client";

import { useEffect, useState } from "react";
import { shiftsAPI } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { Clock, Loader2, User } from "lucide-react";

interface Shift {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string | null;
  opening_cash: string;
  closing_cash?: string | null;
  total_sales: string;
  transaction_count: number;
  status: string;
  notes?: string | null;
  user?: { fullname: string };
}

// Helper function to safely parse monetary string to number
function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await shiftsAPI.getAll({ limit: 100 });
        setShifts(res.data.data);
      } catch (error) {
        console.error("Failed to fetch shifts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  const totalItems = shifts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedShifts = shifts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Shifts</h2>
        <p className="text-muted-foreground">Cashier shift history</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Cashier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Start</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">End</th>
                  <th className="px-4 py-3 text-right text-sm font-medium hidden lg:table-cell">Opening</th>
                  <th className="px-4 py-3 text-right text-sm font-medium hidden lg:table-cell">Closing</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Sales</th>
                  <th className="px-4 py-3 text-right text-sm font-medium hidden sm:table-cell">TRX</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No shifts found
                    </td>
                  </tr>
                ) : (
                  paginatedShifts.map((shift) => (
                    <tr key={shift.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-medium">
                            {shift.user?.fullname || `User #${shift.user_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{formatDateTime(shift.start_time)}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">
                        {shift.end_time ? formatDateTime(shift.end_time) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {formatCurrency(parseMoney(shift.opening_cash))}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {shift.closing_cash
                          ? formatCurrency(parseMoney(shift.closing_cash))
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-500">
                        {formatCurrency(parseMoney(shift.total_sales))}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">{shift.transaction_count}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={shift.status === "open" ? "success" : "secondary"}>
                          {shift.status}
                        </Badge>
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
