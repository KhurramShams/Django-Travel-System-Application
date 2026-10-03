"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
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
import { AlertCircle, Lock, Mail, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid business email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const { refreshProfile } = useAuth();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      if (authData.session) {
        // Refresh local user profile via context
        await refreshProfile();
        router.push(redirectTarget);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Login failure:", err);
      setServerError("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (role: "admin" | "agent" | "accountant") => {
    const credentials = {
      admin: { email: "admin@karwan-travels.com", pass: "Admin@123456" },
      agent: { email: "agent@karwan-travels.com", pass: "Agent@123456" },
      accountant: { email: "accountant@karwan-travels.com", pass: "Accountant@123456" },
    };
    setValue("email", credentials[role].email, { shouldValidate: true });
    setValue("password", credentials[role].pass, { shouldValidate: true });
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Sign In to System
        </CardTitle>
        <CardDescription className="text-slate-400">
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

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="email">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@karwan-travels.com"
                className="border-slate-700 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
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
                className="border-slate-700 bg-slate-950/70 pl-9 pr-10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                error={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* RBAC Autofill Quick Selector */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-slate-400">
              <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium">Quick Credentials Preset:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("admin")}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("agent")}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors"
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("accountant")}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
              >
                Accountant
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            variant="brand"
            className="w-full text-sm font-semibold tracking-wide"
            isLoading={isSubmitting}
          >
            Authenticate & Proceed
          </Button>

          <p className="text-center text-[11px] text-slate-500">
            Karwan-e-Asotvi Travels Internal Enterprise Access
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

