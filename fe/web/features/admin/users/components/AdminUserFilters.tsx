"use client";

import React from "react";
import { Search, Users, Wrench } from "lucide-react";
import {
  AdminUserRoleFilter,
  AdminUserStatusFilter,
} from "../types/admin-user.types";

interface AdminUserFiltersProps {
  roleFilter: AdminUserRoleFilter;
  setRoleFilter: (role: AdminUserRoleFilter) => void;
  statusFilter: AdminUserStatusFilter;
  setStatusFilter: (status: AdminUserStatusFilter) => void;
  statusCounts: {
    total: number;
    active: number;
    pending: number;
    locked: number;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function AdminUserFilters({
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  statusCounts,
  searchTerm,
  setSearchTerm,
}: AdminUserFiltersProps) {
  const roleTabs = [
    { value: "CUSTOMER" as const, label: "Khách hàng", icon: Users },
    { value: "PROVIDER" as const, label: "Thợ (Đối tác)", icon: Wrench },
  ];

  const statusTabs = [
    { value: "ALL" as const, label: `Tất cả (${statusCounts.total})` },
    { value: "ACTIVE" as const, label: `Hoạt động (${statusCounts.active})` },
    { value: "PENDING" as const, label: `Chờ duyệt (${statusCounts.pending})` },
    { value: "LOCKED" as const, label: `Bị khóa (${statusCounts.locked})` },
  ];

  return (
    <div className="space-y-4">
      {/* Role Tabs */}
      <div className="flex border-b border-slate-200">
        {roleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = roleFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value)}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

