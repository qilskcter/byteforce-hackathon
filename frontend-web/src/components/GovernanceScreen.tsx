import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ThumbsUp, ThumbsDown, Vote, Clock, CheckCircle2, ChevronLeft, ChevronRight, Filter, HelpCircle, Copy, ExternalLink, CheckCheck, TrendingUp, Award, Users, Zap, BookOpen, Heart, Leaf } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTokenBalance, getVotes, addVote, deductTokens } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface Proposal {
  id: number;
  title: string;
  status: string;
  timeLeft: string;
  support: number;
  category: string;
  description: string;
}

const initialProposals: Proposal[] = [
  { 
    id: 12, 
    title: "Phân bổ 20M VNĐ cho thiết bị Câu lạc bộ Robotics", 
    status: "OPEN", 
    timeLeft: "02:13:45", 
    support: 62, 
    category: "Funding",
    description: "Tài trợ thiết bị mới cho câu lạc bộ robotics của trường để tham gia các cuộc thi quốc gia và nâng cao trải nghiệm học tập thực hành." 
  },
  { 
    id: 13, 
    title: "Mua 2 GPU NVIDIA A100 cho phòng thí nghiệm AI", 
    status: "OPEN", 
    timeLeft: "01:45:22", 
    support: 48, 
    category: "Infrastructure",
    description: "Mua GPU hiệu suất cao để nâng cao khả năng nghiên cứu AI cho sinh viên và giảng viên làm việc với các dự án deep learning." 
  },
  { 
    id: 14, 
    title: "Chương trình học bổng cho sinh viên vùng Đồng bằng sông Cửu Long", 
    status: "OPEN", 
    timeLeft: "03:30:18", 
    support: 83, 
    category: "Scholarship",
    description: "Thành lập quỹ học bổng hỗ trợ sinh viên có hoàn cảnh khó khăn từ vùng Đồng bằng sông Cửu Long, hỗ trợ tài chính cho học phí và sinh hoạt." 
  },
  { 
    id: 15, 
    title: "Nâng cấp hạ tầng Wi-Fi toàn trường", 
    status: "OPEN", 
    timeLeft: "04:15:30", 
    support: 71, 
    category: "Infrastructure",
    description: "Hiện đại hóa mạng lưới trường với công nghệ Wi-Fi 6E để đáp ứng nhu cầu học tập số và hoạt động nghiên cứu tăng cao." 
  },
  { 
    id: 16, 
    title: "Tài trợ chương trình hỗ trợ sức khỏe tâm thần sinh viên", 
    status: "OPEN", 
    timeLeft: "05:22:10", 
    support: 89, 
    category: "Wellness",
    description: "Phân bổ nguồn lực cho dịch vụ tư vấn chuyên nghiệp, hội thảo sức khỏe tâm thần và nhóm hỗ trợ đồng đẳng cho sinh viên." 
  },
  { 
    id: 17, 
    title: "Thành lập vườn ươm đổi mới sáng tạo & khởi nghiệp", 
    status: "OPEN", 
    timeLeft: "06:45:55", 
    support: 55, 
    category: "Entrepreneurship",
    description: "Tạo không gian chuyên dụng và quỹ tài trợ để hỗ trợ startup sinh viên với mentorship, tài nguyên và vốn khởi nghiệp." 
  },
  {
    id: 18,
    title: "Mở rộng giờ hoạt động thư viện 24/7",
    status: "OPEN",
    timeLeft: "07:30:15",
    support: 76,
    category: "Facilities",
    description: "Mở cửa thư viện 24 giờ mỗi ngày trong kỳ thi và giai đoạn deadline dự án lớn để hỗ trợ nhu cầu học tập của sinh viên."
  },
  {
    id: 19,
    title: "Tạo quỹ sáng kiến trường học xanh bền vững",
    status: "OPEN",
    timeLeft: "08:12:40",
    support: 68,
    category: "Environment",
    description: "Phân bổ ngân sách cho tấm pin mặt trời, chương trình tái chế và cơ sở hạ tầng xanh để giảm lượng khí thải carbon trong trường."
  },
  {
    id: 20,
    title: "Thành lập sân đấu eSports & câu lạc bộ game",
    status: "OPEN",
    timeLeft: "09:05:20",
    support: 54,
    category: "Recreation",
    description: "Xây dựng cơ sở eSports chuyên dụng với PC gaming cao cấp và thiết bị streaming cho thi đấu chuyên nghiệp."
  },
  {
    id: 21,
    title: "Khởi động học bổng trao đổi quốc tế",
    status: "OPEN",
    timeLeft: "10:22:35",
    support: 81,
    category: "Scholarship",
    description: "Tạo chương trình học bổng cho sinh viên đi du học tại các trường đối tác ở Mỹ, EU và châu Á."
  },
  {
    id: 22,
    title: "Nâng cấp căng tin với đa dạng lựa chọn món ăn",
    status: "OPEN",
    timeLeft: "11:18:50",
    support: 72,
    category: "Facilities",
    description: "Cải tạo căng tin sinh viên và bổ sung món ăn quốc tế, lựa chọn thuần chay và dịch vụ ăn uống buổi tối."
  },
  {
    id: 23,
    title: "Tài trợ xuất bản nghiên cứu khoa học sinh viên",
    status: "OPEN",
    timeLeft: "12:45:10",
    support: 79,
    category: "Funding",
    description: "Hỗ trợ sinh viên xuất bản bài báo nghiên cứu trên tạp chí quốc tế và tham dự hội nghị khoa học."
  },
  {
    id: 24,
    title: "Xây dựng trung tâm thể dục & giải trí hiện đại",
    status: "OPEN",
    timeLeft: "13:30:25",
    support: 65,
    category: "Wellness",
    description: "Xây dựng phòng gym mới với thiết bị hiện đại, phòng yoga, bể bơi và sân thể thao."
  },
  {
    id: 25,
    title: "Triển khai nền tảng trợ giảng AI",
    status: "OPEN",
    timeLeft: "14:15:40",
    support: 58,
    category: "Technology",
    description: "Triển khai nền tảng được cung cấp bởi AI để hỗ trợ bài tập, dạy kèm và học tập cá nhân hóa 24/7."
  },
  {
    id: 26,
    title: "Tạo quỹ hỗ trợ chi phí nhà ở sinh viên",
    status: "OPEN",
    timeLeft: "15:08:55",
    support: 85,
    category: "Scholarship",
    description: "Thành lập quỹ trợ cấp chi phí nhà ở cho sinh viên có thu nhập thấp sống trong ký túc xá."
  },
  {
    id: 27,
    title: "Ra mắt trung tâm phát triển nghề nghiệp",
    status: "OPEN",
    timeLeft: "16:25:30",
    support: 73,
    category: "Career",
    description: "Tạo trung tâm cung cấp workshop viết CV, phỏng vấn thử, tư vấn nghề nghiệp và sự kiện kết nối với doanh nghiệp."
  },
  {
    id: 28,
    title: "Thành lập phòng lab phần mềm nguồn mở",
    status: "OPEN",
    timeLeft: "17:42:15",
    support: 61,
    category: "Technology",
    description: "Thiết lập phòng lab chuyên về phát triển nguồn mở, dạy sinh viên đóng góp vào các dự án thực tế."
  },
  {
    id: 29,
    title: "Tài trợ lễ hội văn hóa & chương trình nghệ thuật",
    status: "OPEN",
    timeLeft: "18:20:45",
    support: 69,
    category: "Culture",
    description: "Hỗ trợ lễ hội đa văn hóa hàng năm, triển lãm nghệ thuật, biểu diễn âm nhạc và hoạt động trao đổi văn hóa."
  },
  {
    id: 30,
    title: "Tạo quỹ dự phòng hỗ trợ tài chính khẩn cấp",
    status: "OPEN",
    timeLeft: "19:10:00",
    support: 87,
    category: "Funding",
    description: "Thành lập quỹ khẩn cấp để giúp đỡ sinh viên gặp khó khăn tài chính bất ngờ hoặc khẩn cấp gia đình."
  },
];

const PROPOSALS_PER_PAGE = 5;

// Category metadata for better visualization
const categoryMetadata: Record<string, { icon: React.ReactNode; color: string; colorClass: string }> = {
  "Funding": { 
    icon: <TrendingUp className="w-4 h-4" />, 
    color: "bg-blue-500", 
    colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20" 
  },
  "Infrastructure": { 
    icon: <Zap className="w-4 h-4" />, 
    color: "bg-yellow-500", 
    colorClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" 
  },
  "Scholarship": { 
    icon: <Award className="w-4 h-4" />, 
    color: "bg-purple-500", 
    colorClass: "bg-purple-500/10 text-purple-600 border-purple-500/20" 
  },
  "Wellness": { 
    icon: <Heart className="w-4 h-4" />, 
    color: "bg-pink-500", 
    colorClass: "bg-pink-500/10 text-pink-600 border-pink-500/20" 
  },
  "Entrepreneurship": { 
    icon: <Zap className="w-4 h-4" />, 
    color: "bg-orange-500", 
    colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/20" 
  },
  "Facilities": { 
    icon: <Users className="w-4 h-4" />, 
    color: "bg-green-500", 
    colorClass: "bg-green-500/10 text-green-600 border-green-500/20" 
  },
  "Environment": { 
    icon: <Leaf className="w-4 h-4" />, 
    color: "bg-emerald-500", 
    colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
  },
  "Recreation": { 
    icon: <Users className="w-4 h-4" />, 
    color: "bg-indigo-500", 
    colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
  },
  "Technology": { 
    icon: <Zap className="w-4 h-4" />, 
    color: "bg-cyan-500", 
    colorClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" 
  },
  "Career": { 
    icon: <TrendingUp className="w-4 h-4" />, 
    color: "bg-violet-500", 
    colorClass: "bg-violet-500/10 text-violet-600 border-violet-500/20" 
  },
  "Culture": { 
    icon: <BookOpen className="w-4 h-4" />, 
    color: "bg-rose-500", 
    colorClass: "bg-rose-500/10 text-rose-600 border-rose-500/20" 
  },
};

// Category Vietnamese names
const categoryVietnameseNames: Record<string, string> = {
  "Funding": "Tài trợ",
  "Infrastructure": "Cơ sở hạ tầng",
  "Scholarship": "Học bổng",
  "Wellness": "Sức khỏe",
  "Entrepreneurship": "Khởi nghiệp",
  "Facilities": "Cơ sở vật chất",
  "Environment": "Môi trường",
  "Recreation": "Giải trí",
  "Technology": "Công nghệ",
  "Career": "Nghề nghiệp",
  "Culture": "Văn hóa",
};

export const GovernanceScreen = () => {
  const [votes, setVotes] = useState(getVotes());
  const [tokenBalance, setTokenBalance] = useState(getTokenBalance());
  const [proposals, setProposals] = useState(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteAmount, setVoteAmount] = useState([10]);
  const [voteChoice, setVoteChoice] = useState<"approve" | "reject">("approve");
  const [isVoting, setIsVoting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const { toast } = useToast();

  // Filter proposals by category
  const filteredProposals = selectedCategory === "all" 
    ? proposals 
    : proposals.filter(p => p.category === selectedCategory);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProposals.length / PROPOSALS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPOSALS_PER_PAGE;
  const endIndex = startIndex + PROPOSALS_PER_PAGE;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  // Get unique categories
  const categories = Array.from(new Set(proposals.map(p => p.category)));

  useEffect(() => {
    setVotes(getVotes());
    setTokenBalance(getTokenBalance());
    
    // Countdown timer simulation
    const timer = setInterval(() => {
      setProposals(prev => prev.map(p => {
        const [hours, minutes, seconds] = p.timeLeft.split(':').map(Number);
        let totalSeconds = hours * 3600 + minutes * 60 + seconds - 1;
        if (totalSeconds < 0) totalSeconds = 0;
        const newHours = Math.floor(totalSeconds / 3600);
        const newMinutes = Math.floor((totalSeconds % 3600) / 60);
        const newSeconds = totalSeconds % 60;
        return {
          ...p,
          timeLeft: `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`
        };
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle page change with loading simulation
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setCurrentPage(newPage);
    setIsLoading(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle category filter
  const handleCategoryChange = async (category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setCurrentPage(1);
    setIsLoading(false);
  };

  const handleVote = async () => {
    if (!selectedProposal) return;
    
    const voteWeight = voteAmount[0];
    
    // Validate sufficient balance
    if (voteWeight > tokenBalance) {
      toast({
        title: "❌ Không đủ LearnTokens",
        description: `Bạn cần ${voteWeight} LT nhưng chỉ có ${tokenBalance} LT khả dụng.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsVoting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Calculate new support percentage
    const supportChange = voteChoice === "approve" ? voteWeight / 10 : -voteWeight / 10;
    
    setProposals(prev => prev.map(p => 
      p.id === selectedProposal.id 
        ? { ...p, support: Math.max(0, Math.min(100, p.support + supportChange)) }
        : p
    ));
    
    // Save vote
    const newVote = {
      proposalId: selectedProposal.id,
      amount: voteWeight,
      choice: voteChoice,
      date: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    addVote(newVote);
    setVotes(getVotes());
    
    // Deduct tokens from balance
    deductTokens(voteWeight);
    setTokenBalance(getTokenBalance());
    
    setIsVoting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedProposal(null);
      setVoteAmount([10]);
      setVoteChoice("approve");
    }, 2000);
    
    toast({
      title: "✅ Phiếu bầu đã được ghi nhận On-Chain",
      description: `Đã sử dụng ${voteWeight} LT để ${voteChoice === "approve" ? "ủng hộ" : "phản đối"} Đề xuất #${selectedProposal.id}. Số dư mới: ${getTokenBalance()} LT`,
    });
  };

  // Loading skeleton component
  const ProposalSkeleton = () => (
    <Card className="p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
          </div>
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
        </div>
      </div>
      <div className="h-10 bg-muted/50 rounded-lg" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>
      <div className="h-12 bg-muted rounded" />
    </Card>
  );

  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(true);
    toast({
      title: "✅ Đã sao chép",
      description: "Transaction hash đã được sao chép vào clipboard",
    });
    setTimeout(() => setCopiedTxHash(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quản trị sinh viên</h1>
            <p className="text-muted-foreground">Sử dụng LearnTokens để bỏ phiếu cho các quyết định của trường</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <HelpCircle className="w-5 h-5 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Bỏ phiếu trong các đề xuất DAO để ảnh hưởng đến quyết định của trường. Càng nhiều token, càng lớn sức ảnh hưởng!</p>
            </TooltipContent>
          </Tooltip>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-primary/20 hover:shadow-lg transition-all">
          <p className="text-sm text-muted-foreground mb-1">Tổng đề xuất</p>
          <p className="text-3xl font-bold text-foreground">{proposals.length}</p>
        </Card>
        <Card className="p-4 border-success/20 hover:shadow-lg transition-all">
          <p className="text-sm text-muted-foreground mb-1">Phiếu của bạn</p>
          <p className="text-3xl font-bold text-foreground">{votes.length}</p>
        </Card>
        <Card className="p-4 border-warning/20 hover:shadow-lg transition-all">
          <p className="text-sm text-muted-foreground mb-1">Quyền biểu quyết</p>
          <p className="text-3xl font-bold text-primary">{tokenBalance} LT</p>
        </Card>
        <Card className="p-4 border-secondary/20 hover:shadow-lg transition-all">
          <p className="text-sm text-muted-foreground mb-1">Danh mục</p>
          <p className="text-3xl font-bold text-foreground">{categories.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Filter & Info Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Đề xuất đang mở</h2>
              <Badge variant="outline" className="text-sm">
                {filteredProposals.length} kết quả
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Vote className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{tokenBalance} LT</span>
              <span className="text-xs text-muted-foreground">Quyền biểu quyết</span>
            </div>
          </div>

          {/* Category Filter */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Lọc theo danh mục</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange("all")}
                className="rounded-full"
              >
                Tất cả
              </Button>
              {categories.slice(0, 8).map((category) => {
                const metadata = categoryMetadata[category];
                const vietnameseName = categoryVietnameseNames[category] || category;
                return (
                  <Tooltip key={category}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategoryChange(category)}
                        className={`rounded-full flex items-center gap-1.5 ${
                          selectedCategory === category ? "" : metadata?.colorClass
                        }`}
                      >
                        {metadata?.icon}
                        {vietnameseName}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Hiển thị các đề xuất về {vietnameseName}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </Card>

          {/* Proposals List */}
          {isLoading ? (
            // Loading Skeletons
            <>
              {[...Array(PROPOSALS_PER_PAGE)].map((_, i) => (
                <ProposalSkeleton key={i} />
              ))}
            </>
          ) : currentProposals.length === 0 ? (
            <Card className="p-12 text-center">
              <Vote className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy đề xuất</h3>
              <p className="text-sm text-muted-foreground">
                Thử chọn danh mục khác
              </p>
            </Card>
          ) : (
            currentProposals.map((proposal) => {
              const categoryMeta = categoryMetadata[proposal.category];
              const vietnameseCategoryName = categoryVietnameseNames[proposal.category] || proposal.category;
              return (
                <Card key={proposal.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: categoryMeta?.color.replace('bg-', '#') }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-success text-success-foreground text-xs">
                          {proposal.status === "OPEN" ? "MỞ" : proposal.status}
                        </Badge>
                        <Badge className={`text-xs flex items-center gap-1 border ${categoryMeta?.colorClass || "variant-outline"}`}>
                          {categoryMeta?.icon}
                          {vietnameseCategoryName}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">Đề xuất #{proposal.id}</h3>
                      <p className="text-base font-medium text-foreground mb-2">{proposal.title}</p>
                      <p className="text-sm text-muted-foreground">{proposal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Clock className="w-4 h-4 text-warning animate-pulse" />
                    <span>Kết thúc sau: <span className="font-mono font-semibold text-foreground">{proposal.timeLeft}</span></span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Độ ủng hộ cộng đồng</span>
                      <span className="font-semibold text-foreground">{proposal.support.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={proposal.support} 
                      className="h-3 transition-all duration-500" 
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={() => setSelectedProposal(proposal)}
                    size="lg"
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    Bỏ phiếu ngay
                  </Button>
                </Card>
              );
            })
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Hiển thị <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredProposals.length)}</span> trong{" "}
                  <span className="font-semibold text-foreground">{filteredProposals.length}</span> đề xuất
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-full"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-10 h-10 rounded-full ${
                          currentPage === i + 1 ? "shadow-lg" : ""
                        }`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Vote className="w-5 h-5 text-primary" />
              Lịch sử bỏ phiếu
            </h3>
            <div className="space-y-3">
              {votes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có phiếu bầu nào
                </p>
              ) : (
                votes.slice(0, 5).map((vote) => (
                  <div key={vote.txHash} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        Đề xuất #{vote.proposalId}
                      </span>
                      <Badge 
                        variant={vote.choice === "approve" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {vote.choice === "approve" ? "Ủng hộ" : "Phản đối"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vote.amount} LT • {new Date(vote.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Voting Popup */}
      <Dialog open={!!selectedProposal && !showSuccess} onOpenChange={(open) => {
        if (!open) {
          setSelectedProposal(null);
          setVoteAmount([10]);
          setVoteChoice("approve");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bỏ phiếu của bạn</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="py-4 space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">
                  Đề xuất #{selectedProposal.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedProposal.title}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  Bạn muốn sử dụng bao nhiêu LearnTokens?
                </label>
                <div className="space-y-3">
                  <Slider
                    value={voteAmount}
                    onValueChange={setVoteAmount}
                    max={Math.min(tokenBalance, 50)}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sức mạnh biểu quyết</span>
                    <span className="text-2xl font-bold text-primary">{voteAmount[0]} LT</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  Quyết định của bạn
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVoteChoice("approve")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      voteChoice === "approve"
                        ? "border-success bg-success/10 text-success"
                        : "border-border hover:border-success/50"
                    }`}
                  >
                    <ThumbsUp className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Ủng hộ</p>
                  </button>
                  <button
                    onClick={() => setVoteChoice("reject")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      voteChoice === "reject"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border hover:border-destructive/50"
                    }`}
                  >
                    <ThumbsDown className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Phản đối</p>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleVote}
                disabled={isVoting}
                className="w-full"
                size="lg"
              >
                {isVoting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang gửi phiếu...
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4 mr-2" />
                    Gửi phiếu bầu
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Popup */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="mb-4">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-20 h-20 text-success relative z-10" />
            </div>
            <DialogTitle className="text-2xl text-center text-success">
              Phiếu bầu đã được ghi nhận!
            </DialogTitle>
            <DialogDescription className="text-center">
              Vote của bạn đã được ghi nhận trên blockchain
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className="text-success font-semibold flex items-center gap-1">
                  <CheckCheck className="w-4 h-4" />
                  Đã xác nhận
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đề xuất:</span>
                <span className="text-foreground font-semibold">#{votes[0]?.proposalId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lựa chọn:</span>
                <Badge variant={votes[0]?.choice === "approve" ? "default" : "destructive"}>
                  {votes[0]?.choice === "approve" ? "Ủng hộ" : "Phản đối"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Voting Power:</span>
                <span className="text-primary font-semibold">{votes[0]?.amount} LT</span>
              </div>
              
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background p-2 rounded border border-border truncate">
                    {votes[0]?.txHash}
                  </code>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => copyTxHash(votes[0]?.txHash)}
                        className="p-2 hover:bg-background rounded transition-colors flex-shrink-0"
                      >
                        {copiedTxHash ? (
                          <CheckCheck className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{copiedTxHash ? "Đã sao chép!" : "Sao chép TX Hash"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 hover:bg-background rounded transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Xem trên Blockchain Explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            
            <Button onClick={() => setShowSuccess(false)} className="w-full" size="lg">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};
