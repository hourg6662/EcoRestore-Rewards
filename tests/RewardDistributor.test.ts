import { describe, it, expect, beforeEach } from "vitest";
import { ClarityValue, PrincipalCV, ResponseCV, UIntCV, booleanCV, listCV, noneCV, optionalCV, principalCV, responseErrorCV, responseOkCV, someCV, tupleCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INSUFFICIENT_BALANCE = 101;
const ERR_INVALID_AMOUNT = 102;
const ERR_ACTIVITY_NOT_VERIFIED = 103;
const ERR_ALREADY_STAKED = 104;
const ERR_NOT_STAKED = 105;
const ERR_INVALID_REWARD_RATE = 106;
const ERR_INVALID_YIELD = 107;
const ERR_TREASURY_EMPTY = 108;
const ERR_INVALID_TIMESTAMP = 109;
const ERR_INSUFFICIENT_STAKE = 110;
const ERR_COOLDOWN_NOT_OVER = 111;
const ERR_INVALID_RECIPIENT = 112;
const ERR_CONTRACT_NOT_SET = 113;
const ERR_INVALID_PARAM = 114;
const ERR_MAX_STAKERS_EXCEEDED = 115;
const ERR_INVALID_DURATION = 116;
const ERR_REWARD_ALREADY_CLAIMED = 117;
const ERR_INVALID_ACTIVITY_ID = 118;
const ERR_ORACLE_NOT_VERIFIED = 119;
const ERR_INVALID_TOKEN = 120;

type Result<T> = { ok: boolean; value: T };

interface Stake {
  amount: number;
  startTime: number;
  lastClaim: number;
}

interface ActivityReward {
  claimed: boolean;
  rewardAmount: number;
  verifier: string;
}

interface RewardHistoryEntry {
  timestamp: number;
  amount: number;
}

class RewardDistributorMock {
  state: {
    treasuryBalance: number;
    rewardRate: number;
    stakingYield: number;
    totalStaked: number;
    maxStakers: number;
    cooldownPeriod: number;
    admin: string;
    ecoTokenContract: string;
    verificationOracleContract: string | null;
    userRewards: Map<string, number>;
    userStakes: Map<string, Stake>;
    activityRewards: Map<number, ActivityReward>;
    stakerCooldowns: Map<string, number>;
    pendingClaims: Map<string, number>;
    rewardHistory: Map<string, RewardHistoryEntry[]>;
  } = {
    treasuryBalance: 1000000000,
    rewardRate: 10,
    stakingYield: 5,
    totalStaked: 0,
    maxStakers: 1000,
    cooldownPeriod: 144,
    admin: "ST1TEST",
    ecoTokenContract: "SP000000000000000000002Q6VF78.byzantion-eco-token",
    verificationOracleContract: null,
    userRewards: new Map(),
    userStakes: new Map(),
    activityRewards: new Map(),
    stakerCooldowns: new Map(),
    pendingClaims: new Map(),
    rewardHistory: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  transfers: Array<{ amount: number; from: string; to: string }> = [];
  verifiedActivities: Set<number> = new Set();

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      treasuryBalance: 1000000000,
      rewardRate: 10,
      stakingYield: 5,
      totalStaked: 0,
      maxStakers: 1000,
      cooldownPeriod: 144,
      admin: "ST1TEST",
      ecoTokenContract: "SP000000000000000000002Q6VF78.byzantion-eco-token",
      verificationOracleContract: null,
      userRewards: new Map(),
      userStakes: new Map(),
      activityRewards: new Map(),
      stakerCooldowns: new Map(),
      pendingClaims: new Map(),
      rewardHistory: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.transfers = [];
    this.verifiedActivities = new Set();
  }

  getTreasuryBalance(): Result<number> {
    return { ok: true, value: this.state.treasuryBalance };
  }

  getRewardRate(): Result<number> {
    return { ok: true, value: this.state.rewardRate };
  }

  getStakingYield(): Result<number> {
    return { ok: true, value: this.state.stakingYield };
  }

  getUserReward(user: string): Result<number> {
    return { ok: true, value: this.state.userRewards.get(user) ?? 0 };
  }

  getUserStake(user: string): Result<Stake | null> {
    return { ok: true, value: this.state.userStakes.get(user) ?? null };
  }

  getActivityReward(activityId: number): Result<ActivityReward | null> {
    return { ok: true, value: this.state.activityRewards.get(activityId) ?? null };
  }

  calculatePendingRewards(user: string): Result<number> {
    const stake = this.state.userStakes.get(user);
    if (!stake) return { ok: false, value: ERR_NOT_STAKED };
    const timeElapsed = this.blockHeight - stake.lastClaim;
    const yieldPerBlock = this.state.stakingYield / 525600;
    const pending = Math.floor(stake.amount * yieldPerBlock * timeElapsed);
    return { ok: true, value: pending };
  }

  setEcoTokenContract(contract: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (contract === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_RECIPIENT };
    this.state.ecoTokenContract = contract;
    return { ok: true, value: true };
  }

  setVerificationOracle(contract: string): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (contract === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_RECIPIENT };
    this.state.verificationOracleContract = contract;
    return { ok: true, value: true };
  }

  setRewardRate(newRate: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newRate <= 0 || newRate > 100) return { ok: false, value: ERR_INVALID_REWARD_RATE };
    this.state.rewardRate = newRate;
    return { ok: true, value: true };
  }

  setStakingYield(newYield: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newYield <= 0 || newYield > 20) return { ok: false, value: ERR_INVALID_YIELD };
    this.state.stakingYield = newYield;
    return { ok: true, value: true };
  }

  depositTreasury(amount: number): Result<boolean> {
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    this.transfers.push({ amount, from: this.caller, to: "contract" });
    this.state.treasuryBalance += amount;
    return { ok: true, value: true };
  }

  claimActivityReward(activityId: number): Result<number> {
    if (activityId <= 0) return { ok: false, value: ERR_INVALID_ACTIVITY_ID };
    if (!this.verifiedActivities.has(activityId)) return { ok: false, value: ERR_ACTIVITY_NOT_VERIFIED };
    let rewardInfo = this.state.activityRewards.get(activityId) ?? { claimed: false, rewardAmount: this.state.rewardRate, verifier: this.caller };
    if (rewardInfo.claimed) return { ok: false, value: ERR_REWARD_ALREADY_CLAIMED };
    const rewardAmount = rewardInfo.rewardAmount;
    if (this.state.treasuryBalance < rewardAmount) return { ok: false, value: ERR_TREASURY_EMPTY };
    this.transfers.push({ amount: rewardAmount, from: "contract", to: this.caller });
    this.state.treasuryBalance -= rewardAmount;
    rewardInfo.claimed = true;
    this.state.activityRewards.set(activityId, rewardInfo);
    const currentRewards = this.state.userRewards.get(this.caller) ?? 0;
    this.state.userRewards.set(this.caller, currentRewards + rewardAmount);
    return { ok: true, value: rewardAmount };
  }

  stakeEco(amount: number, duration: number): Result<boolean> {
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (this.state.userStakes.has(this.caller)) return { ok: false, value: ERR_ALREADY_STAKED };
    if (duration <= 0 || duration > 525600) return { ok: false, value: ERR_INVALID_DURATION };
    this.transfers.push({ amount, from: this.caller, to: "contract" });
    this.state.userStakes.set(this.caller, { amount, startTime: this.blockHeight, lastClaim: this.blockHeight });
    this.state.totalStaked += amount;
    return { ok: true, value: true };
  }

  unstakeEco(): Result<number> {
    const stake = this.state.userStakes.get(this.caller);
    if (!stake) return { ok: false, value: ERR_NOT_STAKED };
    const cooldownEnd = this.state.stakerCooldowns.get(this.caller) ?? 0;
    if (this.blockHeight < cooldownEnd) return { ok: false, value: ERR_COOLDOWN_NOT_OVER };
    const claimResult = this.claimStakingRewards();
    if (!claimResult.ok) return claimResult;
    const amount = stake.amount;
    this.state.userStakes.delete(this.caller);
    this.state.totalStaked -= amount;
    this.transfers.push({ amount, from: "contract", to: this.caller });
    return { ok: true, value: amount };
  }

  claimStakingRewards(): Result<number> {
    const stake = this.state.userStakes.get(this.caller);
    if (!stake) return { ok: false, value: ERR_NOT_STAKED };
    const pendingResult = this.calculatePendingRewards(this.caller);
    if (!pendingResult.ok) return pendingResult;
    const pending = pendingResult.value;
    if (pending <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (this.state.treasuryBalance < pending) return { ok: false, value: ERR_TREASURY_EMPTY };
    this.transfers.push({ amount: pending, from: "contract", to: this.caller });
    this.state.treasuryBalance -= pending;
    stake.lastClaim = this.blockHeight;
    this.state.userStakes.set(this.caller, stake);
    const currentRewards = this.state.userRewards.get(this.caller) ?? 0;
    this.state.userRewards.set(this.caller, currentRewards + pending);
    return { ok: true, value: pending };
  }

  initiateUnstake(): Result<boolean> {
    if (!this.state.userStakes.has(this.caller)) return { ok: false, value: ERR_NOT_STAKED };
    this.state.stakerCooldowns.set(this.caller, this.blockHeight + this.state.cooldownPeriod);
    return { ok: true, value: true };
  }

  setCooldownPeriod(newPeriod: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newPeriod <= 0) return { ok: false, value: ERR_INVALID_PARAM };
    this.state.cooldownPeriod = newPeriod;
    return { ok: true, value: true };
  }

  setMaxStakers(newMax: number): Result<boolean> {
    if (this.caller !== this.state.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_PARAM };
    this.state.maxStakers = newMax;
    return { ok: true, value: true };
  }

  getTotalStaked(): Result<number> {
    return { ok: true, value: this.state.totalStaked };
  }
}

describe("RewardDistributor", () => {
  let contract: RewardDistributorMock;

  beforeEach(() => {
    contract = new RewardDistributorMock();
    contract.reset();
  });

  it("deposits to treasury successfully", () => {
    const result = contract.depositTreasury(500000);
    expect(result.ok).toBe(true);
    expect(contract.getTreasuryBalance().value).toBe(1000000000 + 500000);
  });

  it("sets reward rate as admin", () => {
    const result = contract.setRewardRate(15);
    expect(result.ok).toBe(true);
    expect(contract.getRewardRate().value).toBe(15);
  });

  it("rejects reward rate change by non-admin", () => {
    contract.caller = "ST2FAKE";
    const result = contract.setRewardRate(15);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("claims activity reward successfully", () => {
    contract.verifiedActivities.add(1);
    const result = contract.claimActivityReward(1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(10);
    expect(contract.getTreasuryBalance().value).toBe(1000000000 - 10);
    expect(contract.getUserReward("ST1TEST").value).toBe(10);
  });

  it("rejects claim for unverified activity", () => {
    const result = contract.claimActivityReward(2);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ACTIVITY_NOT_VERIFIED);
  });

  it("stakes ECO successfully", () => {
    const result = contract.stakeEco(1000, 100);
    expect(result.ok).toBe(true);
    expect(contract.getTotalStaked().value).toBe(1000);
    const stake = contract.getUserStake("ST1TEST").value;
    expect(stake?.amount).toBe(1000);
  });

  it("rejects staking if already staked", () => {
    contract.stakeEco(1000, 100);
    const result = contract.stakeEco(500, 50);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_STAKED);
  });

  it("initiates unstake and unstakes after cooldown", () => {
    contract.stakeEco(1000, 100);
    const initResult = contract.initiateUnstake();
    expect(initResult.ok).toBe(true);
    contract.blockHeight += 144;
    const unstakeResult = contract.unstakeEco();
    expect(unstakeResult.ok).toBe(true);
    expect(unstakeResult.value).toBe(1000);
    expect(contract.getTotalStaked().value).toBe(0);
  });

  it("rejects unstake before cooldown", () => {
    contract.stakeEco(1000, 100);
    contract.initiateUnstake();
    contract.blockHeight += 100;
    const result = contract.unstakeEco();
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_COOLDOWN_NOT_OVER);
  });

  it("sets cooldown period as admin", () => {
    const result = contract.setCooldownPeriod(200);
    expect(result.ok).toBe(true);
    expect(contract.state.cooldownPeriod).toBe(200);
  });

  it("rejects invalid cooldown period", () => {
    const result = contract.setCooldownPeriod(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PARAM);
  });
});