import { useState, useEffect } from "react";
import { Award, ExternalLink, Coins, TrendingUp, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfile, getTokenBalance, getBadges, type Badge as BadgeType } from "@/lib/storage";

export const WalletScreen = () => {
  const [profile, setProfile] = useState(getProfile());
  const [tokenBalance, setTokenBalance] = useState(getTokenBalance());
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getProfile());
    setTokenBalance(getTokenBalance());
    const loadedBadges = getBadges();
    setBadges(loadedBadges);
    
    // Check if there's a newly earned badge (earned in last 5 seconds)
    const recentBadge = loadedBadges.find(b => 
      b.obtained && b.earnedDate && 
      (new Date().getTime() - new Date(b.earnedDate).getTime()) < 5000
    );
    if (recentBadge) {
      setNewlyEarnedBadge(recentBadge.id);
      setTimeout(() => setNewlyEarnedBadge(null), 2000);
    }
  }, []);

  const earnedBadges = badges.filter(b => b.obtained);

  return (
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Ví điện tử & Thành tích</h1>
        <p className="text-muted-foreground">LearnTokens và huy hiệu thành tích học thuật của bạn</p>
      </div>
      
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 space-y-6 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-xs text-muted-foreground font-mono mb-2">{profile.did}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">{profile.major}</Badge>
                  <Badge variant="outline" className="text-xs">{profile.classYear}</Badge>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5" />
                <p className="text-sm opacity-90">Số dư LearnToken</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{tokenBalance}</span>
                <span className="text-lg opacity-90">LT</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3 space-y-6">
          <Card className="p-6 shadow-md border-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Huy hiệu thành tích (SBT)
              </h3>
              <Badge variant="secondary" className="text-xs">{earnedBadges.length}/{badges.length} đạt được</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className={`group aspect-square rounded-xl ${badge.color} p-4 flex flex-col items-center justify-center text-center relative transition-all duration-300 cursor-pointer ${
                    !badge.obtained 
                      ? "opacity-30 grayscale" 
                      : newlyEarnedBadge === badge.id
                      ? "shadow-2xl ring-4 ring-yellow-400 animate-pulse"
                      : "shadow-lg hover:shadow-2xl hover:scale-105"
                  }`}
                  onClick={() => badge.obtained && setSelectedBadge(badge)}
                  style={badge.obtained && newlyEarnedBadge === badge.id ? {
                    boxShadow: `0 0 30px rgba(234, 179, 8, 0.6)`
                  } : {}}
                >
                  <Award className="w-10 h-10 text-white mb-2 transition-transform group-hover:scale-110" />
                  <span className="text-xs text-white font-semibold leading-tight">{badge.name}</span>
                  {badge.obtained && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs font-bold text-green-600">✓</span>
                    </div>
                  )}
                  {badge.obtained && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Info className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => setShowMetadata(true)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Xem hoạt động Smart Contract
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Badge Detail Popup */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Chi tiết huy hiệu</DialogTitle>
          </DialogHeader>
          {selectedBadge && (
            <div className="py-4">
              <div className={`w-32 h-32 mx-auto ${selectedBadge.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                <Award className="w-16 h-16 text-white" />
              </div>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{selectedBadge.name}</h3>
                  <Badge className="bg-success text-success-foreground">Soulbound NFT</Badge>
                </div>
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Loại:</span>
                    <span className="text-sm font-semibold text-foreground">SBT (Không thể chuyển nhượng)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ngày cấp:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedBadge.earnedDate ? new Date(selectedBadge.earnedDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mã Token:</span>
                    <span className="text-sm font-mono font-semibold text-foreground">#{selectedBadge.id.padStart(3, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cấp bởi:</span>
                    <span className="text-sm font-semibold text-foreground">EduDAO Nexus</span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Mã giao dịch:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono bg-background p-2 rounded flex-1 truncate">
                        0x{Math.random().toString(16).substring(2, 42)}
                      </code>
                      <button className="text-primary hover:text-primary/80">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Smart Contract Activity Popup */}
      <Dialog open={showMetadata} onOpenChange={setShowMetadata}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hoạt động Smart Contract</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
            {earnedBadges.map((badge, idx) => (
              <div key={badge.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${badge.color} rounded-lg flex items-center justify-center`}>
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {badge.earnedDate ? new Date(badge.earnedDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Đã mint</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background p-2 rounded flex-1 truncate">
                    0x{Math.random().toString(16).substring(2, 42)}
                  </code>
                  <button className="text-primary hover:text-primary/80">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {earnedBadges.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Chưa có huy hiệu nào</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
