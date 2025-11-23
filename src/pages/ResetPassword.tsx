import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [hasValidToken, setHasValidToken] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasValidToken(true);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
        });
        navigate("/forgot-password");
      }
    });
  }, [navigate, toast]);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.match(/[A-Z]/)) strength += 25;
    if (pwd.match(/[a-z]/)) strength += 25;
    if (pwd.match(/[0-9]/)) strength += 12.5;
    if (pwd.match(/[^A-Za-z0-9]/)) strength += 12.5;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid password",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasValidToken) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                autoComplete="new-password"
              />
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {passwordStrength < 50 && "Weak"}
                      {passwordStrength >= 50 && passwordStrength < 75 && "Medium"}
                      {passwordStrength >= 75 && "Strong"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
