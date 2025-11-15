import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AuthScreen } from "@/components/AuthScreen";
import { VerificationScreen } from "@/components/VerificationScreen";
import { WalletScreen } from "@/components/WalletScreen";
import { GovernanceScreen } from "@/components/GovernanceScreen";
import { PassportScreen } from "@/components/PassportScreen";
import { ContributionHistoryScreen } from "@/components/ContributionHistoryScreen";
import { Button } from "@/components/ui/button";
import { initializeStorage, isAuthenticated, setCurrentUser, logout } from "@/lib/storage";
import { Upload, Wallet, Vote, User, History, LogOut } from "lucide-react";

const Index = () => {
  const [activeScreen, setActiveScreen] = useState<"verify" | "wallet" | "governance" | "passport" | "history">("verify");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initializeStorage();
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser({
      name: user.name,
      did: user.did,
      major: user.major,
      classYear: user.classYear,
      gpa: user.gpa,
      semester: "Spring 2025",
      email: user.email,
    });
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setActiveScreen("verify");
  };

  if (!authenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex justify-center gap-3 py-8 sticky top-[88px] z-40 bg-background/95 backdrop-blur-sm border-b border-border pb-6 mb-6">
          <Button
            variant={activeScreen === "verify" ? "default" : "outline"}
            onClick={() => setActiveScreen("verify")}
            className={`rounded-full px-6 h-11 font-semibold transition-all ${
              activeScreen === "verify" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
            size="lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            AI Xác minh
          </Button>
          <Button
            variant={activeScreen === "wallet" ? "default" : "outline"}
            onClick={() => setActiveScreen("wallet")}
            className={`rounded-full px-6 h-11 font-semibold transition-all ${
              activeScreen === "wallet" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
            size="lg"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Ví & Mint
          </Button>
          <Button
            variant={activeScreen === "governance" ? "default" : "outline"}
            onClick={() => setActiveScreen("governance")}
            className={`rounded-full px-6 h-11 font-semibold transition-all ${
              activeScreen === "governance" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
            size="lg"
          >
            <Vote className="w-4 h-4 mr-2" />
            Quản trị
          </Button>
          <Button
            variant={activeScreen === "passport" ? "default" : "outline"}
            onClick={() => setActiveScreen("passport")}
            className={`rounded-full px-6 h-11 font-semibold transition-all ${
              activeScreen === "passport" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
            size="lg"
          >
            <User className="w-4 h-4 mr-2" />
            Hộ chiếu
          </Button>
          <Button
            variant={activeScreen === "history" ? "default" : "outline"}
            onClick={() => setActiveScreen("history")}
            className={`rounded-full px-6 h-11 font-semibold transition-all ${
              activeScreen === "history" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
            size="lg"
          >
            <History className="w-4 h-4 mr-2" />
            Lịch sử
          </Button>
          
          <div className="flex-1" />
          
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-full px-6 h-11 font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all hover:scale-105"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </div>

      <div className="pb-16 animate-in fade-in duration-300">
        {activeScreen === "verify" && <VerificationScreen />}
        {activeScreen === "wallet" && <WalletScreen />}
        {activeScreen === "governance" && <GovernanceScreen />}
        {activeScreen === "passport" && <PassportScreen />}
        {activeScreen === "history" && <ContributionHistoryScreen />}
      </div>
    </div>
  );
};

export default Index;
