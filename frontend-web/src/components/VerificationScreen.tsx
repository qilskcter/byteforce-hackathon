import { useState, useEffect } from "react";
import { Upload, Sparkles, CheckCircle2, FileText, Image, Video, FileIcon, X, Coins, ExternalLink, Copy, CheckCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getContributions, addContribution, addTokens, type Contribution } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export const VerificationScreen = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [impactScore, setImpactScore] = useState(0);
  const [earnedTokens, setEarnedTokens] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContributions(getContributions());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Create preview for images
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(droppedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleVerify = async () => {
    if (!file || !contributionType) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please upload a file and select a contribution category.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    setVerificationStep(0);
    
    const steps = ["Checking identity...", "Analyzing content...", "Generating ImpactScore..."];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setVerificationStep(i + 1);
    }
    
    // Generate random impact score with better distribution
    const baseScore = Math.floor(Math.random() * 25) + 70;
    const bonusScore = contributionType === "research" || contributionType === "competition" ? 5 : 0;
    const score = Math.min(100, baseScore + bonusScore);
    setImpactScore(score);
    
    // Calculate token reward based on score (more generous)
    const tokenReward = Math.floor(score / 3) + Math.floor(Math.random() * 5);
    setEarnedTokens(tokenReward);
    
    // Generate transaction hash
    const generatedTxHash = `0x${Math.random().toString(16).substring(2, 42)}${Date.now().toString(16)}`.substring(0, 66);
    setTxHash(generatedTxHash);
    
    // Save contribution to storage
    const newContribution: Contribution = {
      id: Date.now().toString(),
      fileName: file.name,
      type: contributionType,
      uploadDate: new Date().toISOString(),
      impactScore: score,
      verified: true,
    };
    
    addContribution(newContribution);
    addTokens(tokenReward);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsVerifying(false);
    setShowSuccess(true);
    
    // Refresh contributions list
    setContributions(getContributions());
    
    toast({
      title: "✅ Xác minh thành công",
      description: `Đã kiếm được ${tokenReward} LearnTokens! ImpactScore: ${score}/100`,
    });
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setFile(null);
    setFilePreview(null);
    setContributionType("");
    setCopied(false);
  };

  const copyTxHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    toast({
      title: "✅ Đã sao chép",
      description: "Transaction hash đã được sao chép vào clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-14 h-14 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />;
    
    if (file.type.startsWith('image/')) return <Image className="w-10 h-10 text-primary" />;
    if (file.type.startsWith('video/')) return <Video className="w-10 h-10 text-primary" />;
    return <FileIcon className="w-10 h-10 text-primary" />;
  };

  return (
    <TooltipProvider>
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nộp đóng góp học thuật
            </h1>
            <p className="text-muted-foreground">
              Upload bằng chứng thành tích học thuật để AI xác minh và kiếm LearnTokens
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <HelpCircle className="w-5 h-5 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">AI sẽ xác minh đóng góp của bạn và tính ImpactScore. Càng chất lượng cao, càng nhiều LearnToken!</p>
            </TooltipContent>
          </Tooltip>
        </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6 text-center border-primary/20 bg-primary-light/30">
          <div className="text-3xl font-bold text-primary mb-1">{contributions.length}</div>
          <p className="text-sm text-muted-foreground">Total Submissions</p>
        </Card>
        <Card className="p-6 text-center border-secondary/20 bg-secondary-light/30">
          <div className="text-3xl font-bold text-secondary mb-1">
            {contributions.filter(c => c.verified).length}
          </div>
          <p className="text-sm text-muted-foreground">Verified</p>
        </Card>
        <Card className="p-6 text-center border-warning/20 bg-warning-light/30">
          <div className="text-3xl font-bold text-warning mb-1">
            {contributions.length > 0
              ? Math.round(contributions.reduce((sum, c) => sum + c.impactScore, 0) / contributions.length)
              : 0}
          </div>
          <p className="text-sm text-muted-foreground">Avg ImpactScore</p>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <Card className="p-6">
            <div
              className={`group relative w-full h-[220px] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                isDragging 
                  ? "border-primary bg-[#eef0ff] scale-[1.02]" 
                  : file 
                  ? "border-success bg-success/5" 
                  : "border-border bg-accent/50 hover:border-primary/50 hover:bg-[#eef0ff]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.mp4,.pdf"
                onChange={handleFileChange}
              />
              
              {!file ? (
                <>
                  <Upload className="w-14 h-14 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
                  <p className="text-base text-foreground font-medium mb-1">
                    Drop your file here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported: .jpg, .png, .mp4, .pdf (Max 20MB)
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getFileIcon()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-base text-foreground font-medium mb-1 max-w-[300px] truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold mb-3 text-foreground">
                Contribution Category
              </label>
              <Select value={contributionType} onValueChange={setContributionType}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz/Exam Result</SelectItem>
                  <SelectItem value="volunteer">Volunteer Activity</SelectItem>
                  <SelectItem value="research">Research Project</SelectItem>
                  <SelectItem value="leadership">Club Leadership</SelectItem>
                  <SelectItem value="attendance">Course Attendance</SelectItem>
                  <SelectItem value="competition">Competition Award</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold text-base py-6 shadow-lg"
              onClick={handleVerify}
              disabled={!file || !contributionType || isVerifying}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Verify with AI
            </Button>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Submissions
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No contributions yet. Upload your first one!
                </p>
              ) : (
                contributions.slice(0, 5).map((contribution) => (
                  <div
                    key={contribution.id}
                    className="p-3 bg-accent rounded-lg border border-border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-foreground truncate flex-1">
                        {contribution.fileName}
                      </p>
                      <span className="text-xs font-semibold text-success ml-2">
                        {contribution.impactScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground capitalize">
                        {contribution.type}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(contribution.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isVerifying || showSuccess} onOpenChange={(open) => {
        if (!open && showSuccess) {
          handleCloseSuccess();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          {!showSuccess ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Verification in Progress
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Please wait while we verify your contribution</p>
              <div className="space-y-4 text-left max-w-xs mx-auto">
                {["Checking identity...", "Analyzing content...", "Calculating ImpactScore..."].map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                      verificationStep > idx 
                        ? "bg-success/10 text-success" 
                        : verificationStep === idx
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {verificationStep > idx ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : verificationStep === idx ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted rounded-full flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6">
              <DialogHeader className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-success/20 rounded-full animate-ping"></div>
                  <CheckCircle2 className="w-20 h-20 text-success relative z-10" />
                </div>
                <DialogTitle className="text-3xl text-center bg-gradient-to-r from-success to-secondary bg-clip-text text-transparent">
                  🎉 Xác minh thành công!
                </DialogTitle>
                <DialogDescription className="text-center">
                  Đóng góp của bạn đã được AI xác minh và ghi nhận on-chain
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Score Display */}
                <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl">
                  <div className="text-5xl font-bold text-foreground mb-2 text-center">
                    {impactScore}<span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 text-center">ImpactScore</p>
                  <Progress value={impactScore} className="h-3 bg-muted mb-4" />
                  <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg">
                    <Coins className="w-5 h-5 text-success" />
                    <span className="text-lg font-bold text-success">+{earnedTokens} LearnTokens</span>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Chi tiết giao dịch
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <span className="text-success font-semibold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />
                        Đã xác nhận
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loại:</span>
                      <span className="text-foreground font-semibold capitalize">{contributionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token nhận:</span>
                      <span className="text-success font-semibold">+{earnedTokens} LT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span className="text-foreground font-semibold">{new Date().toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-background p-2 rounded border border-border truncate">
                        {txHash}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={copyTxHash}
                            className="p-2 hover:bg-background rounded transition-colors flex-shrink-0"
                          >
                            {copied ? (
                              <CheckCheck className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{copied ? "Đã sao chép!" : "Sao chép TX Hash"}</p>
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

                <Button onClick={handleCloseSuccess} className="w-full" size="lg">
                  Tiếp tục
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};
