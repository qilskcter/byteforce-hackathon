import { useEffect, useState } from "react";
import { Award, Vote, TrendingUp, GraduationCap, QrCode, ExternalLink, Info, HelpCircle, Target, Sparkles, Trophy, BookOpen, Users, Star, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getProfile, getBadges, getVotes, getContributions, getTokenBalance, type Badge as BadgeType } from "@/lib/storage";

export const PassportScreen = () => {
  const [profile, setProfile] = useState(getProfile());
  const [badges, setBadges] = useState(getBadges());
  const [votes, setVotes] = useState(getVotes());
  const [contributions, setContributions] = useState(getContributions());
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(getTokenBalance());
  const [showImpactScoreInfo, setShowImpactScoreInfo] = useState(false);

  useEffect(() => {
    // Refresh data periodically
    const interval = setInterval(() => {
      setProfile(getProfile());
      setBadges(getBadges());
      setVotes(getVotes());
      setContributions(getContributions());
      setTokenBalance(getTokenBalance());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const impactScore = contributions.length > 0 ? Math.round(contributions.reduce((sum, c) => sum + c.impactScore, 0) / contributions.length) : 0;
  const earnedBadges = badges.filter(b => b.obtained);
  const governanceScore = Math.min(votes.length * 10, 100);
  const contributionScore = Math.min(contributions.length * 15, 100);
  const totalTokensEarned = contributions.reduce((sum, c) => sum + Math.floor(c.impactScore / 3), 0);

  // Badge icon mapping
  const badgeIcons: Record<string, React.ReactNode> = {
    "First Contribution": <Sparkles className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
    "Research Pioneer": <BookOpen className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
    "Active Voter": <Vote className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
    "Top Contributor": <Trophy className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
    "Community Leader": <Users className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
    "Excellence Star": <Star className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />,
  };

  return (
    <TooltipProvider>
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Hộ chiếu học thuật</h1>
          <p className="text-muted-foreground">Danh tính học thuật on-chain có thể xác minh của bạn</p>
        </div>
      
      <div className="space-y-6">
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h2>
                <p className="text-sm text-muted-foreground font-mono mb-3">{profile.did}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">{profile.major}</Badge>
                  <Badge variant="outline">{profile.classYear}</Badge>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQR(true)}
              className="flex flex-col items-center gap-2 p-4 hover:bg-white/50 rounded-lg transition-colors group"
            >
              <div className="w-24 h-24 bg-white rounded-lg p-2 shadow-md group-hover:shadow-lg transition-shadow">
                <QrCode className="w-full h-full text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Quét mã DID</span>
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-primary/20 relative group">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowImpactScoreInfo(true)}
                  className="absolute top-2 right-2 p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Nhấn để xem cách tính ImpactScore</p>
              </TooltipContent>
            </Tooltip>
            <TrendingUp className="w-10 h-10 mx-auto text-primary mb-3 animate-bounce" />
            <p className="text-4xl font-bold text-foreground">{impactScore}</p>
            <p className="text-sm text-muted-foreground">ImpactScore</p>
            <Progress value={impactScore} className="h-2 mt-3" />
          </Card>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-secondary/20">
                <Vote className="w-10 h-10 mx-auto text-secondary mb-3" />
                <p className="text-4xl font-bold text-foreground">{governanceScore}</p>
                <p className="text-sm text-muted-foreground">GovernanceScore</p>
                <p className="text-xs text-muted-foreground mt-1">{votes.length} lượt bỏ phiếu</p>
                <Progress value={governanceScore} className="h-2 mt-3" />
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Điểm tham gia quản trị: +10 điểm/lượt vote</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-warning/20">
                <Award className="w-10 h-10 mx-auto text-warning mb-3" />
                <p className="text-4xl font-bold text-foreground">{contributionScore}</p>
                <p className="text-sm text-muted-foreground">ContributionScore</p>
                <p className="text-xs text-muted-foreground mt-1">{contributions.length} đóng góp</p>
                <Progress value={contributionScore} className="h-2 mt-3" />
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Điểm đóng góp: +15 điểm/bài nộp được xác minh</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-6 text-center hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-success/20">
                <GraduationCap className="w-10 h-10 mx-auto text-success mb-3" />
                <p className="text-4xl font-bold text-foreground">{earnedBadges.length}<span className="text-xl text-muted-foreground">/{badges.length}</span></p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
                <p className="text-xs text-muted-foreground mt-1">{totalTokensEarned} LT đã kiếm</p>
                <Progress value={(earnedBadges.length / badges.length) * 100} className="h-2 mt-3" />
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">NFT Soulbound đạt được - không thể chuyển nhượng</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Huy hiệu thành tích</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Badges là NFT Soulbound - không thể chuyển nhượng</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={`group aspect-square rounded-xl ${badge.color} p-5 flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 ${
                      !badge.obtained 
                        ? "opacity-30 grayscale" 
                        : "shadow-lg hover:shadow-2xl hover:scale-105"
                    }`}
                    onClick={() => badge.obtained && setSelectedBadge(badge)}
                  >
                    {badgeIcons[badge.name] || <Award className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />}
                    <span className="text-sm text-white font-semibold text-center">{badge.name}</span>
                    {badge.obtained && (
                      <>
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Info className="w-8 h-8 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{badge.obtained ? "Nhấn để xem chi tiết badge" : "Chưa đạt được badge này"}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </Card>
      </div>

      {/* Badge Detail Popup */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Chi tiết huy hiệu Soulbound</DialogTitle>
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
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Chủ sở hữu:</span>
                    <span className="text-sm font-mono font-semibold text-foreground truncate max-w-[200px]">
                      {profile.did.substring(0, 30)}...
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Mã giao dịch:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono bg-background p-2 rounded flex-1 truncate">
                        {selectedBadge.txHash || '0x' + selectedBadge.id.repeat(10).substring(0, 40)}
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

      {/* QR Code DID Popup */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Danh tính phi tập trung (DID)</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-white rounded-xl p-4 shadow-xl">
                <QrCode className="w-full h-full text-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Quét để xác minh danh tính</p>
                <p className="text-lg font-bold text-foreground">{profile.name}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã DID:</span>
                </div>
                <code className="text-xs font-mono bg-background p-2 rounded block break-all">
                  {profile.did}
                </code>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Huy hiệu:</span>
                  <span className="font-semibold text-foreground">{earnedBadges.length} đạt được</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ImpactScore:</span>
                  <span className="font-semibold text-foreground">{impactScore}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đóng góp:</span>
                  <span className="font-semibold text-foreground">{contributions.length}</span>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm font-medium">
                <ExternalLink className="w-4 h-4" />
                Xem trên Blockchain Explorer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ImpactScore Info Dialog */}
      <Dialog open={showImpactScoreInfo} onOpenChange={setShowImpactScoreInfo}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Target className="w-6 h-6 text-primary" />
              ImpactScore - Cách tính điểm
            </DialogTitle>
            <DialogDescription>
              Tìm hiểu cách ImpactScore của bạn được tính toán và làm thế nào để cải thiện nó
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Current Score Display */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/20">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Điểm ImpactScore hiện tại của bạn</p>
                <div className="text-6xl font-bold text-primary mb-2">{impactScore}</div>
                <Progress value={impactScore} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Trung bình</p>
                  <p className="text-lg font-bold text-foreground">
                    {contributions.length > 0
                      ? Math.round(contributions.reduce((sum, c) => sum + c.impactScore, 0) / contributions.length)
                      : 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tổng đóng góp</p>
                  <p className="text-lg font-bold text-foreground">{contributions.length}</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Token kiếm được</p>
                  <p className="text-lg font-bold text-success">{totalTokensEarned} LT</p>
                </div>
              </div>
            </div>

            {/* How it's calculated */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Cách tính ImpactScore
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Chất lượng đóng góp</p>
                    <p className="text-xs text-muted-foreground">AI đánh giá nội dung học thuật: 70-100 điểm</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Loại đóng góp</p>
                    <p className="text-xs text-muted-foreground">Research & Competition: +5 điểm thưởng</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Tần suất đóng góp</p>
                    <p className="text-xs text-muted-foreground">Điểm trung bình của tất cả đóng góp được xác minh</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Improvement suggestions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Cách cải thiện ImpactScore
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-success mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">Nộp bài chất lượng cao</p>
                  <p className="text-xs text-muted-foreground">Research papers và competition awards mang lại điểm cao nhất</p>
                </div>
                
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Vote className="w-6 h-6 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">Tham gia Governance</p>
                  <p className="text-xs text-muted-foreground">Bỏ phiếu trong các đề xuất DAO để tăng điểm tổng thể</p>
                </div>
                
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <Users className="w-6 h-6 text-secondary mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">Hoạt động đều đặn</p>
                  <p className="text-xs text-muted-foreground">Duy trì tần suất đóng góp ổn định qua thời gian</p>
                </div>
                
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <Star className="w-6 h-6 text-warning mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">Đa dạng hoạt động</p>
                  <p className="text-xs text-muted-foreground">Tham gia nhiều loại hoạt động học thuật khác nhau</p>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {contributions.length > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-3">Phân tích 5 đóng góp gần nhất</p>
                <div className="space-y-2">
                  {contributions.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate flex-1">{c.fileName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{c.type}</Badge>
                        <span className="font-bold text-primary">{c.impactScore}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};
