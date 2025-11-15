import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, User, ChevronRight, Wallet, Shield } from "lucide-react";

interface MockUser {
  did: string;
  name: string;
  major: string;
  classYear: string;
  gpa: number;
  email: string;
  avatar: string;
}

const MOCK_USERS: MockUser[] = [
  {
    did: "did:byteedu:0x98F7B3C2E1D5A8F4E9C6B2A7D3E5F1A3E",
    name: "Nguyen Duc Khanh",
    major: "Computer Science",
    classYear: "2025",
    gpa: 3.76,
    email: "khanh.nguyen@byteedu.edu",
    avatar: "NK"
  },
  {
    did: "did:byteedu:0xA7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E",
    name: "Tran Minh Anh",
    major: "Data Science",
    classYear: "2026",
    gpa: 3.92,
    email: "anh.tran@byteedu.edu",
    avatar: "TMA"
  },
  {
    did: "did:byteedu:0xF1E2D3C4B5A6F7E8D9C0B1A2F3E4D5C6B",
    name: "Le Hoang Nam",
    major: "Information Technology",
    classYear: "2025",
    gpa: 3.54,
    email: "nam.le@byteedu.edu",
    avatar: "LHN"
  },
  {
    did: "did:byteedu:0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7",
    name: "Pham Thu Huong",
    major: "Software Engineering",
    classYear: "2024",
    gpa: 3.88,
    email: "huong.pham@byteedu.edu",
    avatar: "PTH"
  }
];

interface AuthScreenProps {
  onLogin: (user: MockUser) => void;
}

export const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [customDID, setCustomDID] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleQuickLogin = (user: MockUser) => {
    setSelectedUser(user);
    setTimeout(() => {
      onLogin(user);
    }, 500);
  };

  const handleCustomLogin = () => {
    if (!customDID) return;
    
    const user: MockUser = {
      did: customDID,
      name: "Guest User",
      major: "Computer Science",
      classYear: "2025",
      gpa: 3.50,
      email: "guest@byteedu.edu",
      avatar: "GU"
    };
    
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EduDAO Nexus
              </h1>
              <p className="text-lg text-muted-foreground mt-1">Nền tảng thành tích học thuật</p>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kết nối Danh tính phi tập trung (DID) để truy cập hộ chiếu học thuật,
            xác minh thành tích và tham gia quản trị.
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Quick Login with Mock Users */}
          <Card className="p-8 border-2 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Đăng nhập nhanh</h2>
                <p className="text-sm text-muted-foreground">Chọn tài khoản demo</p>
              </div>
            </div>

            <div className="space-y-3">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.did}
                  onClick={() => handleQuickLogin(user)}
                  disabled={selectedUser === user}
                  className="w-full group relative overflow-hidden"
                >
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedUser === user
                      ? "border-primary bg-primary/10 scale-95"
                      : "border-border hover:border-primary/50 hover:bg-accent hover:scale-[1.02]"
                  }`}>
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                      {user.avatar}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground text-lg">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.major} • Khóa {user.classYear}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {user.did.substring(0, 35)}...
                      </p>
                    </div>
                    <ChevronRight className={`w-6 h-6 transition-all ${
                      selectedUser === user ? "text-primary" : "text-muted-foreground group-hover:translate-x-1"
                    }`} />
                  </div>
                  
                  {selectedUser === user && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-xl pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Custom DID Login */}
          <Card className="p-8 border-2 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Kết nối DID</h2>
                <p className="text-sm text-muted-foreground">Nhập danh tính phi tập trung của bạn</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Danh tính phi tập trung (DID)
                </label>
                <Input
                  type="text"
                  placeholder="did:byteedu:0x..."
                  value={customDID}
                  onChange={(e) => setCustomDID(e.target.value)}
                  className="h-14 text-base font-mono"
                  onFocus={() => setIsCustomMode(true)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Nhập DID hoặc địa chỉ ví để xác thực
                </p>
              </div>

              <Button
                onClick={handleCustomLogin}
                disabled={!customDID || customDID.length < 10}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Kết nối & Xác minh
              </Button>

              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground">Cần một DID?</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setCustomDID("did:byteedu:0x" + Math.random().toString(16).substring(2, 42))}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Tạo DID Demo
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 text-center border-primary/20 hover:shadow-lg transition-all hover:scale-105">
            <Shield className="w-10 h-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">An toàn & Phi tập trung</h3>
            <p className="text-sm text-muted-foreground">
              Danh tính của bạn được xác minh on-chain và hoàn toàn do bạn kiểm soát
            </p>
          </Card>
          <Card className="p-6 text-center border-secondary/20 hover:shadow-lg transition-all hover:scale-105">
            <GraduationCap className="w-10 h-10 mx-auto text-secondary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Xác minh học thuật</h3>
            <p className="text-sm text-muted-foreground">
              Xác minh bằng AI cho tất cả thành tích học thuật của bạn
            </p>
          </Card>
          <Card className="p-6 text-center border-warning/20 hover:shadow-lg transition-all hover:scale-105">
            <User className="w-10 h-10 mx-auto text-warning mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Quản trị sinh viên</h3>
            <p className="text-sm text-muted-foreground">
              Sử dụng LearnTokens để bỏ phiếu về các quyết định và đề xuất của trường
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

