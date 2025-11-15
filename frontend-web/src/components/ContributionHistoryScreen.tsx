import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Award, Coins, ExternalLink, FileText, Image as ImageIcon, Video, FileIcon } from "lucide-react";
import { getContributions, getBadges, type Contribution } from "@/lib/storage";

export const ContributionHistoryScreen = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [badges, setBadges] = useState(getBadges());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Refresh data periodically
    const interval = setInterval(() => {
      setContributions(getContributions());
      setBadges(getBadges());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-primary" />;
    } else if (['mp4', 'mov', 'avi'].includes(ext || '')) {
      return <Video className="w-5 h-5 text-primary" />;
    }
    return <FileIcon className="w-5 h-5 text-primary" />;
  };

  const getBadgeForContribution = (contribution: Contribution) => {
    // Simple logic to assign badge based on contribution type and score
    if (contribution.impactScore >= 90) {
      return badges.find(b => b.name === "Research Excellence" || b.name === "Academic Excellence");
    } else if (contribution.type === "volunteer") {
      return badges.find(b => b.name === "Volunteer Star");
    } else if (contribution.type === "leadership") {
      return badges.find(b => b.name === "Leadership");
    }
    return badges.find(b => b.obtained);
  };

  const totalTokensEarned = contributions.reduce((sum, c) => sum + Math.floor(c.impactScore / 3), 0);
  const avgImpactScore = contributions.length > 0 
    ? Math.round(contributions.reduce((sum, c) => sum + c.impactScore, 0) / contributions.length) 
    : 0;

  const filteredContributions = filter === "all" 
    ? contributions 
    : contributions.filter(c => c.type === filter);

  const contributionTypes = Array.from(new Set(contributions.map(c => c.type)));

  return (
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Lịch sử đóng góp</h1>
        <p className="text-muted-foreground">Lịch sử đầy đủ các đóng góp học thuật đã được xác minh của bạn</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 text-center border-primary/20 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <FileText className="w-10 h-10 mx-auto text-primary mb-3" />
          <p className="text-3xl font-bold text-foreground">{contributions.length}</p>
          <p className="text-sm text-muted-foreground">Tổng bằng chứng</p>
          <p className="text-xs text-muted-foreground mt-2">{contributionTypes.length} danh mục</p>
        </Card>
        <Card className="p-6 text-center border-success/20 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3 animate-pulse" />
          <p className="text-3xl font-bold text-foreground">
            {contributions.filter(c => c.verified).length}
          </p>
          <p className="text-sm text-muted-foreground">Đã xác minh</p>
          <p className="text-xs text-success mt-2">100% thành công</p>
        </Card>
        <Card className="p-6 text-center border-warning/20 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <Coins className="w-10 h-10 mx-auto text-warning mb-3" />
          <p className="text-3xl font-bold text-foreground">{totalTokensEarned}</p>
          <p className="text-sm text-muted-foreground">Tổng LT kiếm được</p>
          <p className="text-xs text-muted-foreground mt-2">Từ {contributions.length} bài nộp</p>
        </Card>
        <Card className="p-6 text-center border-secondary/20 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <Award className="w-10 h-10 mx-auto text-secondary mb-3" />
          <p className="text-3xl font-bold text-foreground">{avgImpactScore}<span className="text-lg text-muted-foreground">/100</span></p>
          <p className="text-sm text-muted-foreground">ImpactScore TB</p>
          <Progress value={avgImpactScore} className="h-1.5 mt-2" />
        </Card>
      </div>

      {/* Contribution Timeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Dòng thời gian nộp bài
            <span className="text-sm font-normal text-muted-foreground">({filteredContributions.length} kết quả)</span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              Tất cả
            </button>
            {contributionTypes.slice(0, 4).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 text-sm rounded-lg transition-all capitalize ${
                  filter === type
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredContributions.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground mb-2">Chưa có đóng góp nào</p>
              <p className="text-sm text-muted-foreground">
                Upload bằng chứng học thuật đầu tiên để bắt đầu!
              </p>
            </div>
          ) : (
            filteredContributions.map((contribution, index) => {
              const badge = getBadgeForContribution(contribution);
              const tokensEarned = Math.floor(contribution.impactScore / 3);
              const txHash = `0x${Math.random().toString(16).substring(2, 42)}`;

              return (
                <Card key={contribution.id} className="p-6 hover:shadow-lg transition-shadow border-2">
                  <div className="flex gap-6">
                    {/* Left side - Visual */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                        {getFileIcon(contribution.fileName)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{String(contributions.length - index).padStart(3, '0')}
                      </Badge>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground text-lg">
                              {contribution.fileName}
                            </h4>
                            <Badge className="bg-success text-success-foreground text-xs">
                              {contribution.verified ? "Đã xác minh" : "Đang xử lý"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="capitalize">{contribution.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{new Date(contribution.uploadDate).toLocaleDateString('vi-VN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">ImpactScore</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                              {contribution.impactScore}
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                          <Progress value={contribution.impactScore} className="h-1.5 mt-2" />
                        </div>

                        <div className="bg-success/10 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">LearnTokens</p>
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-success" />
                            <span className="text-2xl font-bold text-success">
                              +{tokensEarned}
                            </span>
                            <span className="text-sm text-muted-foreground">LT</span>
                          </div>
                        </div>

                        {badge && (
                          <div className={`${badge.color} rounded-lg p-3`}>
                            <p className="text-xs text-white/80 mb-1">SBT đã mint</p>
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-white" />
                              <span className="text-sm font-semibold text-white truncate">
                                {badge.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Transaction Hash */}
                      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                        <span className="text-xs text-muted-foreground">Mã GD:</span>
                        <code className="text-xs font-mono flex-1 truncate text-foreground">
                          {txHash}
                        </code>
                        <button className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

