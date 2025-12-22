import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { config } from '../config';

// ABI for PredictionMarket contract events
const PREDICTION_MARKET_ABI = [
  'event MarketCreated(bytes32 indexed marketId, bytes32 polymarketConditionId, string question, uint256 endTime)',
  'event SharesPurchased(bytes32 indexed marketId, address indexed user, bool isYes, uint256 amount, uint256 shares, uint256 price)',
  'event SharesSold(bytes32 indexed marketId, address indexed user, bool isYes, uint256 shares, uint256 amount)',
  'event MarketResolved(bytes32 indexed marketId, uint8 outcome)',
  'event WinningsClaimed(bytes32 indexed marketId, address indexed user, uint256 amount)',
];

export interface MarketCreatedEvent {
  marketId: string;
  polymarketConditionId: string;
  question: string;
  endTime: number;
}

export interface SharesPurchasedEvent {
  marketId: string;
  user: string;
  isYes: boolean;
  amount: bigint;
  shares: bigint;
  price: bigint;
}

export interface SharesSoldEvent {
  marketId: string;
  user: string;
  isYes: boolean;
  shares: bigint;
  amount: bigint;
}

export interface MarketResolvedEvent {
  marketId: string;
  outcome: number;
}

export interface WinningsClaimedEvent {
  marketId: string;
  user: string;
  amount: bigint;
}

/**
 * Listens to events from the Cronos PredictionMarket contract
 */
export class ContractListener extends EventEmitter {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract | null = null;
  private isListening = false;

  constructor() {
    super();
    this.provider = new ethers.JsonRpcProvider(config.cronos.rpcUrl);
  }

  /**
   * Start listening for contract events
   */
  async start(): Promise<void> {
    if (!config.cronos.predictionMarketAddress) {
      console.warn('PredictionMarket address not configured, skipping Cronos listener');
      return;
    }

    if (this.isListening) {
      console.log('Contract listener is already running');
      return;
    }

    console.log('Starting Cronos contract listener...');

    this.contract = new ethers.Contract(
      config.cronos.predictionMarketAddress,
      PREDICTION_MARKET_ABI,
      this.provider
    );

    // Set up event listeners
    this.contract.on('MarketCreated', (marketId, polymarketConditionId, question, endTime) => {
      const event: MarketCreatedEvent = {
        marketId,
        polymarketConditionId,
        question,
        endTime: Number(endTime),
      };
      console.log('MarketCreated event:', event);
      this.emit('marketCreated', event);
    });

    this.contract.on('SharesPurchased', (marketId, user, isYes, amount, shares, price) => {
      const event: SharesPurchasedEvent = {
        marketId,
        user,
        isYes,
        amount,
        shares,
        price,
      };
      console.log('SharesPurchased event:', event);
      this.emit('sharesPurchased', event);
    });

    this.contract.on('SharesSold', (marketId, user, isYes, shares, amount) => {
      const event: SharesSoldEvent = {
        marketId,
        user,
        isYes,
        shares,
        amount,
      };
      console.log('SharesSold event:', event);
      this.emit('sharesSold', event);
    });

    this.contract.on('MarketResolved', (marketId, outcome) => {
      const event: MarketResolvedEvent = {
        marketId,
        outcome: Number(outcome),
      };
      console.log('MarketResolved event:', event);
      this.emit('marketResolved', event);
    });

    this.contract.on('WinningsClaimed', (marketId, user, amount) => {
      const event: WinningsClaimedEvent = {
        marketId,
        user,
        amount,
      };
      console.log('WinningsClaimed event:', event);
      this.emit('winningsClaimed', event);
    });

    this.isListening = true;
    console.log('Cronos contract listener started');
  }

  /**
   * Stop listening for contract events
   */
  stop(): void {
    if (this.contract) {
      this.contract.removeAllListeners();
      this.contract = null;
    }
    this.isListening = false;
    console.log('Cronos contract listener stopped');
  }

  /**
   * Get the current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Query past events (for syncing missed events)
   */
  async queryPastEvents(
    eventName: string,
    fromBlock: number,
    toBlock: number | 'latest' = 'latest'
  ): Promise<ethers.Log[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const filter = this.contract.filters[eventName]?.();
    if (!filter) {
      throw new Error(`Unknown event: ${eventName}`);
    }

    return await this.contract.queryFilter(filter, fromBlock, toBlock);
  }

  /**
   * Check if the listener is active
   */
  isActive(): boolean {
    return this.isListening;
  }
}

export const contractListener = new ContractListener();
