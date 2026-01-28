import * as React from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Label } from "@template/ui";
import { OAuthButtons } from "./oauth-buttons";
import { AuthDivider } from "./auth-divider";
import { Loader2, ArrowLeft, BookOpen, Mail } from "lucide-react";

export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"details" | "verify">("details");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 bg-background/50 text-center text-lg tracking-[0.5em]"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full gap-2 text-base"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify email
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("details")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your Quran journey today
          </p>
        </div>

        {/* OAuth buttons */}
        <div>
          <OAuthButtons mode="signUp" disabled={isLoading} />
        </div>

        <AuthDivider />

        {/* Email form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 bg-background/50"
            />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          {/* Clerk CAPTCHA widget placeholder for bot protection */}
          <div id="clerk-captcha" />

          <Button
            type="submit"
            className="h-11 w-full gap-2 text-base"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
