"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Please enter your username or email address"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const { refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isLoading = isAuthenticating || isFormSubmitting;

  const onSubmit = async (data: LoginFormValues) => {
    setIsAuthenticating(true);
    setServerError(null);

    const inputIdentifier = data.email.trim();
    const inputPassword = data.password;

    try {
      const res = await api.post<{
        access_token: string;
        user: Record<string, unknown>;
        role: string;
      }>("/auth/login/", {
        email: inputIdentifier,
        password: inputPassword,
      });

      if (res?.access_token) {
        localStorage.setItem("auth_token", res.access_token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        document.cookie = `auth_token=${encodeURIComponent(
          res.access_token
        )}; path=/; max-age=2592000; SameSite=Lax`;

        await refreshProfile();
        // Keep loading state active while the router completes transition to the target page
        router.push(redirectTarget);
        router.refresh();
      } else {
        setServerError("Authentication failed. Invalid response from server.");
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      console.error("Login failure:", err);
      const errorMsg = getErrorMessage(
        err,
        "Invalid username/email or password. Please verify your credentials."
      );
      setServerError(errorMsg);
      setIsAuthenticating(false);
    }
  };

  return (
    <Card className="border-slate-800/80 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md rounded-2xl">
      <CardHeader className="space-y-1.5 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Sign In to System
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Enter your authorized enterprise credentials to access management portal
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Error Banner */}
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Email / Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="email">
              Username or Work Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="text"
                placeholder="admin or name@khastravels.com"
                disabled={isLoading}
                className="border-slate-700/80 bg-slate-950/70 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-colors disabled:opacity-50"
                error={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="border-slate-700/80 bg-slate-950/70 pl-9 pr-10 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-colors disabled:opacity-50"
                error={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:pointer-events-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-400">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-1">
          <Button
            type="submit"
            variant="brand"
            className="w-full text-sm font-semibold tracking-wide shadow-md hover:shadow-emerald-950/20"
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Signing in..."
          >
            Authenticate & Proceed
          </Button>

          {/* Minimal Test Login Credentials Block */}
          <div className="w-full rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Demo System Admin Access
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "admin@khastravels.com", { shouldValidate: true });
                  setValue("password", "admin123", { shouldValidate: true });
                }}
                disabled={isLoading}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                Auto-fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono rounded-lg bg-slate-900/90 border border-slate-800/80 p-2.5">
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Email</span>
                <span className="select-all text-slate-200">admin@khastravels.com</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px]">Password</span>
                <span className="select-all text-emerald-400">admin123</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Khas Travels Internal Enterprise Access
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl p-8 flex flex-col justify-center items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-xs text-slate-400">Loading authentication interface...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

