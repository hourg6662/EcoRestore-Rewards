# 🌿 EcoRestore Rewards: Blockchain-Powered Incentives for Environmental Volunteers

Welcome to EcoRestore Rewards, a Web3 project built on the Stacks blockchain using Clarity smart contracts! This initiative tackles the real-world problem of insufficient participation in environmental restoration efforts (like reforestation, cleanups, and habitat preservation) by providing transparent, verifiable reward mechanisms. Volunteers earn tokenized rewards for their contributions, which can be linked to eligibility for external aid programs—such as government subsidies, disaster relief funds, or NGO grants—ensuring that active environmental stewards are prioritized and incentivized.

By leveraging blockchain, we create immutable records of volunteer activities, prevent fraud, and enable seamless integration with aid systems. The project involves 8 smart contracts to handle registration, verification, rewards, governance, and aid linking.

## ✨ Features

🌍 Register as a volunteer and log restoration activities  
✅ Community or oracle-based verification of contributions  
💰 Earn fungible reward tokens (ECO) and achievement NFTs  
🔗 Link rewards to aid eligibility certifications  
🗳️ DAO governance for reward distribution and rule updates  
📊 Track total impact metrics (e.g., trees planted, areas restored)  
🚫 Anti-fraud measures like unique activity hashes and cooldowns  
🔄 Staking rewards for long-term commitment

## 🛠 How It Works

EcoRestore Rewards uses a modular system of 8 Clarity smart contracts to ensure security, scalability, and transparency. Here's a high-level overview:

### Core Smart Contracts
1. **VolunteerRegistry.clar**: Handles volunteer onboarding, storing user profiles (principal, bio, location hash) and preventing duplicate registrations.
2. **ActivityLogger.clar**: Allows volunteers to submit activity details (e.g., description, proof hash, geolocation) with timestamps for immutable logging.
3. **VerificationOracle.clar**: Integrates with external oracles or community votes to verify submitted activities, marking them as approved or rejected.
4. **EcoToken.clar**: An SIP-10 compliant fungible token contract for issuing ECO rewards based on verified activities (e.g., 10 ECO per verified cleanup event).
5. **AchievementNFT.clar**: Mints non-fungible tokens (SIP-09) as badges for milestones (e.g., "100 Trees Planted" NFT), which can be traded or staked.
6. **AidEligibility.clar**: Checks volunteer reward balances and activity history to issue verifiable certificates (as NFTs or signed data) for aid eligibility.
7. **GovernanceDAO.clar**: Enables token holders to propose and vote on changes, like reward rates or aid partnerships, using a simple voting mechanism.
8. **RewardDistributor.clar**: Manages automated distribution of rewards from a treasury pool, including staking pools for compounded earnings.

### For Volunteers
- Register via `VolunteerRegistry` by calling `register-volunteer` with your principal and profile details.
- Log activities using `ActivityLogger`'s `submit-activity` function, providing a unique hash of your proof (e.g., photo/video SHA-256).
- Once verified by `VerificationOracle`, claim rewards from `EcoToken` and NFTs from `AchievementNFT`.
- Stake your ECO in `RewardDistributor` for bonus yields.

Boom! Your contributions are now tokenized and verifiable.

### For Aid Providers (e.g., Governments or NGOs)
- Use `AidEligibility` to query a volunteer's history via `check-eligibility`, which returns a score based on verified activities and rewards.
- Verify certificates on-chain to prioritize aid distribution—e.g., higher scores unlock faster relief funds during environmental disasters.

### For Verifiers/Community
- Participate in verification through `VerificationOracle` by calling `vote-on-activity` (if community mode) or integrate external data feeds.
- Monitor governance proposals in `GovernanceDAO` and vote with your ECO tokens.

## 🚀 Getting Started
1. Install the Clarity development tools and Stacks wallet.
2. Deploy the contracts in order (starting with `EcoToken` and `AchievementNFT` as dependencies).
3. Interact via the Clarinet console or integrate with a frontend dApp.
4. Test with sample activities: e.g., submit a mock reforestation event and verify it to mint rewards.

This project promotes sustainable environmental action while solving incentive gaps in volunteerism. Let's restore the planet, one block at a time! 🌱