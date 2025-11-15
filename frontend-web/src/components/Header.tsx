import { useState, useEffect } from "react";
import { GraduationCap, Coins } from "lucide-react";
import { getTokenBalance, getProfile } from "@/lib/storage";

export const Header = () => {
  const [tokenBalance, setTokenBalance] = useState(getTokenBalance());
  const [profile, setProfile] = useState(getProfile());

  useEffect(() => {
    // Update balance periodically to reflect changes
    const interval = setInterval(() => {
      setTokenBalance(getTokenBalance());
      setProfile(getProfile());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/byte-logo.png" 
              alt="ByteEdu - Academic Achievement Platform" 
              className="h-16 object-contain hover:scale-105 transition-transform"
            />
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground">Chào mừng trở lại,</p>
              <p className="text-sm font-semibold text-foreground">{profile.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 hover:shadow-lg transition-all">
              <Coins className="w-5 h-5 text-primary animate-pulse" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">LearnTokens</p>
                <p className="text-lg font-bold text-primary">{tokenBalance} LT</p>
              </div>
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Học kỳ hiện tại</p>
              <p className="text-sm font-semibold text-foreground">Xuân 2025</p>
            </div>
            
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md hover:shadow-xl hover:scale-110 transition-all cursor-pointer">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
