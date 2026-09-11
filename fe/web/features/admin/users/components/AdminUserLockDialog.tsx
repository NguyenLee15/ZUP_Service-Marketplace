"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminUserItem, LockUserFormData } from "../types/admin-user.types";

const lockSchema = z.object({
  reason: z.string().min(10, "Lý do phải có ít nhất 10 ký tự"),
  duration: z.string().optional(),
});

interface AdminUserLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  onSubmit: (data: LockUserFormData) => void;
  actionLoading: boolean;
}

export function AdminUserLockDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  actionLoading,
}: AdminUserLockDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LockUserFormData>({
    resolver: zodResolver(lockSchema),
    defaultValues: {
      reason: "",
      duration: "PERMANENT",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: "", duration: "PERMANENT" });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-rose-600">Khóa tài khoản</DialogTitle>
          <DialogDescription>
            Bạn đang chuẩn bị khóa tài khoản của{" "}
            <strong>{user?.fullName}</strong> ({user?.email}). Tài khoản sẽ bị
            thu hồi mọi phiên đăng nhập và không thể thực hiện giao dịch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Lý do khóa <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("reason")}
              placeholder="Nhập chi tiết lý do khóa tài khoản (tối thiểu 10 ký tự)..."
              className={errors.reason ? "border-rose-500" : ""}
            />
            {errors.reason && (
              <p className="text-xs text-rose-500 font-medium">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={actionLoading}
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận khóa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

