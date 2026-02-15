"use client";

import type { Outlet } from "@/lib/types";
import { useRouter } from "next/navigation";

interface OutletCardProps {
  outlet: Outlet;
  onManageOutlet?: (outlet: Outlet) => void; // Optional for backward compatibility
  onDelete?: (outletId: string) => void; // Delete handler for owners
}

export function OutletCard({ outlet, onManageOutlet, onDelete }: OutletCardProps) {
  const router = useRouter();
  
  const handleManageClick = () => {
    // Use new page route instead of dialog
    router.push(`/outlets/${outlet.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(outlet.id);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 truncate">{outlet.name}</h3>
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex items-start gap-2 text-muted-foreground">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="break-words">{outlet.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">PIN: {outlet.pincode}</span>
            </div>
            {outlet.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{outlet.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {outlet.isActive ? (
            <span className="px-2 py-1 text-xs font-medium bg-secondary/50 text-secondary-foreground rounded-full">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              Inactive
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex gap-2">
        <button
          onClick={handleManageClick}
          className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
        >
          Manage Outlet
        </button>
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title="Delete outlet"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
