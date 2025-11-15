# 🎓 EduDAO Nexus - Smart Contracts

> **AI + Blockchain Platform cho Sinh viên**  
> Chứng minh thành tích học tập, nhận token & NFT, tham gia quản trị DAO

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Smart Contracts](#smart-contracts)
- [Cài Đặt](#cài-đặt)
- [Deploy](#deploy)
- [Sử Dụng](#sử-dụng)
- [API Reference](#api-reference)

---

## 🎯 Tổng Quan

**EduDAO Nexus** là một nền tảng kết hợp AI và Blockchain để:

- ✅ **Xác minh đóng góp** bằng AI (chống gian lận)
- ✅ **Mint token & NFT** khi sinh viên đóng góp
- ✅ **Quản trị DAO** - sinh viên dùng token để vote
- ✅ **Hồ sơ uy tín on-chain** - không thể làm giả
- ✅ **Quỹ tài trợ** với Quadratic Funding
- ✅ **Local Impact Boost** - bonus vote weight cho sinh viên vùng ĐBSCL/miền núi
- ✅ **Integration Web2 → Web3** - import sinh viên từ CSV/Excel

### Luồng Hoạt Động

```
Sinh viên đóng góp 
    ↓
AI xác minh (face recognition, quiz check, image analysis)
    ↓
Smart Contract mint LearnToken + BadgeNFT
    ↓
Sinh viên dùng token để vote DAO & nhận quyền lợi
    ↓
Hồ sơ uy tín được cập nhật on-chain
```

---

## 🏗️ Kiến Trúc Hệ Thống

### Smart Contracts

```
┌─────────────────────────────────────────────────────────┐
│                    EduDAO Nexus                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ LearnToken   │    │  BadgeNFT    │                  │
│  │  (ERC-20)    │    │  (SBT)       │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                           │
│         └─────────┬─────────┘                           │
│                   │                                     │
│         ┌─────────▼─────────┐                          │
│         │ ContributionVerifier│                         │
│         │  (AI Integration)   │                         │
│         └─────────┬───────────┘                         │
│                   │                                     │
│  ┌─────────────────┴─────────────────┐                 │
│  │                                   │                 │
│  ▼                                   ▼                 │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │DAOGovernance │    │ReputationSys │                 │
│  │(WeightedVote)│    │  (Profile)   │                 │
│  └──────┬───────┘    └──────────────┘                 │
│         │                                             │
│         │  ┌──────────────┐                          │
│         └──►StudentRegistry│                          │
│            │(Local Boost) │                          │
│            └──────────────┘                          │
│         │                                             │
│         └──────────────┬──────────────┐               │
│                        ▼              ▼               │
│              ┌──────────────┐  ┌──────────────┐     │
│              │ FundingPool   │  │  (Future)    │     │
│              │ (Quadratic)   │  │              │     │
│              └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────┘
```

---

## 📦 Smart Contracts

### 1. **LearnToken** (`contracts/LearnToken.sol`)

ERC-20 token dùng để thưởng sinh viên.

**Chức năng:**
- Mint token khi đóng góp được xác minh
- Burn token (nếu cần)
- Pause/Unpause transfers
- Track tổng token đã kiếm của mỗi sinh viên

**Roles:**
- `MINTER_ROLE`: Quyền mint token (gán cho ContributionVerifier)
- `PAUSER_ROLE`: Quyền pause contract
- `DEFAULT_ADMIN_ROLE`: Quyền quản trị

### 2. **BadgeNFT** (`contracts/BadgeNFT.sol`)

Soulbound Token (SBT) - NFT không thể chuyển nhượng.

**Chức năng:**
- Mint badge NFT cho thành tích
- Lưu metadata: loại badge, impact score, timestamp
- Không thể transfer (Soulbound)

**Thông tin Badge:**
- `badgeType`: "quiz", "club", "project", "volunteer", "research", etc.
- `impactScore`: Điểm tác động từ AI (0-100)
- `contributionId`: ID của đóng góp liên quan

### 3. **ContributionVerifier** (`contracts/ContributionVerifier.sol`)

Contract xác minh đóng góp từ AI backend.

**Chức năng:**
- Nhận kết quả xác minh từ AI
- Mint LearnToken và BadgeNFT tự động
- Tính token reward dựa trên loại đóng góp và impact score
- Lưu lịch sử đóng góp

**Loại đóng góp:**
- `quiz`: Làm bài quiz (10 tokens base)
- `club`: Tham gia CLB (20 tokens)
- `project`: Dự án học tập (50 tokens)
- `volunteer`: Tình nguyện (30 tokens)
- `research`: Nghiên cứu (100 tokens)
- `workshop`: Workshop/Seminar (25 tokens)

**Công thức reward:**
```
Token Reward = Base Reward × (Impact Score / 100)
```

### 4. **DAOGovernance** (`contracts/DAOGovernance.sol`)

Hệ thống quản trị DAO dùng OpenZeppelin Governor.

**Chức năng:**
- Tạo proposal (cần threshold token)
- Vote bằng LearnToken (1 token = 1 vote)
- Execute proposal sau khi vote thành công
- Phân loại proposal: Scholarship, Club Fund, Major Open/Close, etc.

**Loại Proposal:**
- `SCHOLARSHIP_FUND`: Phân bổ quỹ học bổng
- `CLUB_FUND`: Quỹ CLB
- `MAJOR_OPEN_CLOSE`: Mở/đóng ngành
- `PROJECT_FUNDING`: Đầu tư dự án sinh viên
- `TEACHER_AWARD`: Chọn giảng viên xuất sắc
- `RESOURCE_ACCESS`: Cấp độ truy cập tài nguyên

### 5. **ReputationSystem** (`contracts/ReputationSystem.sol`)

Hệ thống tính toán và lưu trữ hồ sơ uy tín on-chain.

**Chức năng:**
- Tính toán các chỉ số uy tín:
  - `ContributionScore`: Tổng token đã kiếm
  - `GovernanceScore`: Mức độ tham gia DAO
  - `LearnScore`: Điểm học tập (từ badges)
  - `ProjectIndex`: Số lượng dự án
  - `LeadershipIndex`: Số lần làm leader
- Ghi nhận dự án của sinh viên
- Tính tổng điểm uy tín (composite score)

**Công thức Composite Score:**
```
Total Score = 
  ContributionScore × 30% +
  GovernanceScore × 20% +
  LearnScore × 30% +
  ProjectIndex × 15% +
  LeadershipIndex × 5%
```

### 6. **FundingPool** (`contracts/FundingPool.sol`)

Quỹ tài trợ với cơ chế Quadratic Funding (tương tự Gitcoin).

**Chức năng:**
- Tạo funding project
- Đóng góp cho project (Quadratic Funding)
- Phân phối matching funds
- Tạo funding rounds

**Quadratic Funding:**
- Mỗi contribution có giá trị `sqrt(amount)`
- Matching pool được phân phối theo tỷ lệ quadratic value
- Khuyến khích nhiều người đóng góp nhỏ thay vì ít người đóng góp lớn

### 7. **StudentRegistry** (`contracts/StudentRegistry.sol`)

Quản lý thông tin sinh viên và vùng miền để hỗ trợ **Local Impact Boost**.

**Chức năng:**
- Đăng ký sinh viên với thông tin vùng miền
- Tính vote weight multiplier dựa trên vùng miền
- Batch register từ CSV/Excel (Web2 → Web3 integration)
- Quản lý metadata và DID cho sinh viên

**Local Impact Boost - Vote Weight Multipliers:**
- **ĐBSCL (MEKONG)**: 1.2x vote weight (12000 basis points)
- **Miền núi (MOUNTAINOUS)**: 1.2x vote weight (12000 basis points)
- **Tây Nguyên (HIGHLAND)**: 1.15x vote weight (11500 basis points)
- **Các vùng khác**: 1.0x vote weight (10000 basis points)

**Vùng miền (Region enum):**
- `NONE` (0): Chưa đăng ký
- `HANOI` (1): Hà Nội
- `HOCHIMINH` (2): TP. Hồ Chí Minh
- `CENTRAL` (3): Miền Trung
- `HIGHLAND` (4): Tây Nguyên
- `MEKONG` (5): Đồng bằng sông Cửu Long
- `MOUNTAINOUS` (6): Miền núi phía Bắc

**Ví dụ:**
- Sinh viên ĐBSCL có 100 tokens → vote weight = 120 tokens (1.2x)
- Sinh viên Hà Nội có 100 tokens → vote weight = 100 tokens (1.0x)

---

## 🚀 Cài Đặt

### Yêu Cầu

- Node.js >= 18
- npm hoặc yarn
- Hardhat

### Bước 1: Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd backendxamlon

# Install dependencies
npm install
```

### Bước 2: Cấu Hình

Tạo file `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

### Bước 3: Compile Contracts

```bash
npm run compile
```

### Bước 4: Test (Optional)

```bash
npm run test
```

---

## 📤 Deploy

### Deploy Local Network

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npm run deploy:local
```

### Deploy Sepolia Testnet

```bash
npm run deploy:sepolia
```

Sau khi deploy, địa chỉ contracts sẽ được lưu trong `deployments/<network>.json`.

---

## 💻 Sử Dụng

### 1. AI Backend Xác Minh Đóng Góp

Khi AI xác minh thành công một đóng góp, gọi:

```javascript
// Pseudo code
await contributionVerifier.verifyContribution(
  "contribution_123",           // contributionId
  studentAddress,                // student address
  "project",                     // contributionType
  85,                            // impactScore (0-100)
  "https://ipfs.io/.../metadata" // metadataURI
);
```

Contract sẽ tự động:
- Mint LearnToken cho sinh viên
- Mint BadgeNFT nếu impactScore >= 70

### 2. Sinh Viên Tạo Proposal

```javascript
await daoGovernance.proposeSimple(
  "Tăng quỹ học bổng lên 1000 ETH",
  ProposalType.SCHOLARSHIP_FUND,
  ethers.parseEther("1000"),
  scholarshipPoolAddress
);
```

### 3. Vote Proposal

```javascript
await daoGovernance.castVote(proposalId, 1); // 1 = For, 0 = Against, 2 = Abstain
```

### 4. Cập Nhật Reputation

```javascript
await reputationSystem.updateStudentProfile(studentAddress);
```

### 5. Tạo Funding Project

```javascript
await fundingPool.createProject(
  "project_ai_research",
  "AI Research Project",
  "Nghiên cứu về AI trong giáo dục",
  ethers.parseEther("5000"),
  30 // 30 days
);
```

### 6. Đăng Ký Sinh Viên (Local Impact Boost)

```javascript
// Đăng ký sinh viên đơn lẻ
await studentRegistry.registerStudent(
  studentAddress,
  "ST001",                    // studentId
  "Nguyen Van A",             // name
  5,                          // region: 5 = MEKONG (ĐBSCL)
  "https://ipfs.io/.../did"   // metadataURI
);

// Batch register từ CSV
// Sử dụng script: node scripts/importStudents.js data/students.csv
```

### 7. Import Sinh Viên Từ CSV (Web2 → Web3)

**Bước 1:** Tạo file CSV mẫu:
```bash
node scripts/createSampleCSV.js data/students.csv
```

**Bước 2:** Chỉnh sửa CSV với dữ liệu thật:
```csv
studentAddress,studentId,name,region,metadataURI
0x1111...,ST001,Nguyen Van A,5,https://ipfs.io/.../student1
0x2222...,ST002,Tran Thi B,6,https://ipfs.io/.../student2
```

**Bước 3:** Import vào blockchain:
```bash
node scripts/importStudents.js data/students.csv localhost
```

**Lưu ý:** Region codes:
- `1` = HANOI
- `2` = HOCHIMINH
- `3` = CENTRAL
- `4` = HIGHLAND (Tây Nguyên - 1.15x)
- `5` = MEKONG (ĐBSCL - 1.2x)
- `6` = MOUNTAINOUS (Miền núi - 1.2x)

### 8. Weighted Voting với Local Impact Boost

Khi weighted voting được bật, vote weight tự động được tính:
```javascript
// Sinh viên ĐBSCL có 100 tokens
// Vote weight = 100 * 1.2 = 120 tokens

// Lấy vote weight của một account
const voteWeight = await daoGovernance.getVoteWeight(
  studentAddress,
  blockNumber
);
```

---

## 📚 API Reference

### LearnToken

```solidity
function mint(address to, uint256 amount, string memory contributionId)
function batchMint(address[] recipients, uint256[] amounts, string[] contributionIds)
function pause()
function unpause()
```

### BadgeNFT

```solidity
function mintBadge(
  address to,
  string memory badgeType,
  string memory tokenURI,
  uint256 impactScore,
  string memory contributionId
) returns (uint256)
```

### ContributionVerifier

```solidity
function verifyContribution(
  string memory contributionId,
  address student,
  string memory contributionType,
  uint256 impactScore,
  string memory metadataURI
)
```

### DAOGovernance

```solidity
function proposeSimple(
  string memory description,
  ProposalType proposalType,
  uint256 targetAmount,
  address recipient
) returns (uint256)

function castVote(uint256 proposalId, uint8 support)
```

### ReputationSystem

```solidity
function updateStudentProfile(address student)
function recordProject(
  string memory projectId,
  address student,
  string memory projectType,
  uint256 impactScore,
  bool isLeader
)
function getTotalReputationScore(address student) returns (uint256)
```

### FundingPool

```solidity
function createProject(
  string memory projectId,
  string memory title,
  string memory description,
  uint256 targetAmount,
  uint256 durationDays
)

function contribute(string memory projectId, uint256 amount)
```

### StudentRegistry

```solidity
function registerStudent(
  address student,
  string memory studentId,
  string memory name,
  Region region,
  string memory metadataURI
)

function batchRegisterStudents(
  address[] calldata studentAddresses,
  string[] calldata studentIds,
  string[] calldata names,
  Region[] calldata regions,
  string[] calldata metadataURIs
)

function getVoteWeightMultiplier(address student) returns (uint256)

function calculateVoteWeight(address student, uint256 tokenBalance) returns (uint256)

function getStudentInfo(address student) returns (StudentInfo memory)
```

### DAOGovernance (Weighted Voting)

```solidity
function getVoteWeight(address account, uint256 blockNumber) returns (uint256)

function setStudentRegistry(address _studentRegistry)

function setWeightedVotingEnabled(bool enabled)
```

---

## 🔒 Security

- ✅ Sử dụng OpenZeppelin Contracts (audited)
- ✅ Access Control với Roles
- ✅ ReentrancyGuard cho FundingPool
- ✅ Pausable cho LearnToken
- ✅ Soulbound Token (không thể transfer)

**Lưu ý:** Đây là backend giả (mock) cho mục đích demo. Trước khi deploy production, cần:
- Audit smart contracts
- Test kỹ lưỡng
- Xem xét gas optimization
- Thêm các security checks

---

## 📝 License

MIT License

---

## 👥 Team

EduDAO Nexus Team

---

## 🔗 Links

- [Documentation](#)
- [Website](#)
- [Discord](#)
- [Twitter](#)

---

**⭐ Nếu thấy hữu ích, hãy star repo này!**

