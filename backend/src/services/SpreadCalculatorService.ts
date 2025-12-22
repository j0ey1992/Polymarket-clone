import { config } from '../config';
import { SpreadConfig, SpreadCalculation, OrderSide, OrderOutcome } from '../types';

/**
 * Service responsible for calculating spreads on orders
 * This is how the platform captures profit from each trade
 */
export class SpreadCalculatorService {
  private config: SpreadConfig;

  constructor() {
    this.config = {
      baseSpread: config.spread.baseSpread,
      minSpread: config.spread.minSpread,
      maxSpread: config.spread.maxSpread,
      volumeDiscountThreshold: config.spread.volumeDiscountThreshold,
      volumeDiscount: config.spread.volumeDiscount,
      volatilityPremium: config.spread.volatilityPremium,
    };
  }

  /**
   * Calculate the spread for an order
   *
   * For BUY orders: User pays more than market price
   * For SELL orders: User receives less than market price
   */
  calculateSpread(
    orderSize: number,
    marketPrice: number,
    side: OrderSide,
    volatility = 0
  ): SpreadCalculation {
    // Start with base spread
    let spread = this.config.baseSpread;

    // Apply volume discount for large orders
    if (orderSize >= this.config.volumeDiscountThreshold) {
      spread -= this.config.volumeDiscount;
    }

    // Apply volatility premium
    spread += volatility * this.config.volatilityPremium;

    // Clamp spread to min/max bounds
    spread = Math.max(this.config.minSpread, Math.min(this.config.maxSpread, spread));

    // Calculate effective price after spread
    let effectivePrice: number;
    let userReceives: number;
    let platformProfit: number;

    if (side === 'BUY') {
      // User buys at a higher price (worse for user)
      effectivePrice = marketPrice * (1 + spread);
      userReceives = orderSize / effectivePrice; // Number of shares user gets
      platformProfit = orderSize - (userReceives * marketPrice);
    } else {
      // User sells at a lower price (worse for user)
      effectivePrice = marketPrice * (1 - spread);
      userReceives = orderSize * effectivePrice; // USDC user gets back
      platformProfit = (orderSize * marketPrice) - userReceives;
    }

    return {
      spread,
      effectivePrice,
      userReceives,
      platformProfit,
    };
  }

  /**
   * Get the spread-adjusted price for displaying to users
   */
  getDisplayPrice(
    marketPrice: number,
    side: OrderSide,
    orderSize: number = 100
  ): { price: number; spread: number } {
    const calculation = this.calculateSpread(orderSize, marketPrice, side);
    return {
      price: calculation.effectivePrice,
      spread: calculation.spread,
    };
  }

  /**
   * Calculate the total cost for a buy order including spread
   */
  calculateBuyCost(
    shares: number,
    marketPrice: number,
    volatility = 0
  ): {
    totalCost: number;
    effectivePrice: number;
    spread: number;
    platformFee: number;
  } {
    const orderSize = shares * marketPrice;
    const calculation = this.calculateSpread(orderSize, marketPrice, 'BUY', volatility);

    return {
      totalCost: shares * calculation.effectivePrice,
      effectivePrice: calculation.effectivePrice,
      spread: calculation.spread,
      platformFee: calculation.platformProfit,
    };
  }

  /**
   * Calculate the proceeds from a sell order after spread
   */
  calculateSellProceeds(
    shares: number,
    marketPrice: number,
    volatility = 0
  ): {
    proceeds: number;
    effectivePrice: number;
    spread: number;
    platformFee: number;
  } {
    const orderSize = shares * marketPrice;
    const calculation = this.calculateSpread(orderSize, marketPrice, 'SELL', volatility);

    return {
      proceeds: shares * calculation.effectivePrice,
      effectivePrice: calculation.effectivePrice,
      spread: calculation.spread,
      platformFee: calculation.platformProfit,
    };
  }

  /**
   * Calculate the break-even price for a position
   * Takes into account the spread on both entry and exit
   */
  calculateBreakEvenPrice(
    entryPrice: number,
    side: OrderSide,
    outcome: OrderOutcome
  ): number {
    const spread = this.config.baseSpread;

    if (side === 'BUY') {
      // For a long position, need price to rise enough to cover spread on both sides
      const entryWithSpread = entryPrice * (1 + spread);
      const exitSpread = spread;
      return entryWithSpread * (1 + exitSpread);
    } else {
      // For a short position (selling shares)
      const exitWithSpread = entryPrice * (1 - spread);
      const entrySpread = spread;
      return exitWithSpread * (1 - entrySpread);
    }
  }

  /**
   * Estimate profit/loss for a potential trade
   */
  estimatePnL(
    shares: number,
    entryPrice: number,
    currentPrice: number,
    side: OrderSide
  ): {
    grossPnL: number;
    netPnL: number;
    spreadCosts: number;
  } {
    // Calculate entry cost with spread
    const entryCost = this.calculateBuyCost(shares, entryPrice);

    // Calculate exit proceeds with spread
    const exitProceeds = this.calculateSellProceeds(shares, currentPrice);

    // Gross P&L (without spread)
    const grossPnL = (currentPrice - entryPrice) * shares;

    // Net P&L (with spread on both entry and exit)
    const netPnL = exitProceeds.proceeds - entryCost.totalCost;

    // Total spread costs
    const spreadCosts = entryCost.platformFee + exitProceeds.platformFee;

    return {
      grossPnL,
      netPnL,
      spreadCosts,
    };
  }

  /**
   * Get current spread configuration
   */
  getConfig(): SpreadConfig {
    return { ...this.config };
  }

  /**
   * Update spread configuration (for admin use)
   */
  updateConfig(newConfig: Partial<SpreadConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Calculate the maximum spread that would still make an order profitable
   * (for order validation)
   */
  calculateMaxAllowableSpread(
    marketPrice: number,
    side: OrderSide,
    targetPrice: number
  ): number {
    if (side === 'BUY') {
      // For buys, max spread is how much higher user is willing to pay
      return (targetPrice / marketPrice) - 1;
    } else {
      // For sells, max spread is how much less user is willing to receive
      return 1 - (targetPrice / marketPrice);
    }
  }
}

export const spreadCalculator = new SpreadCalculatorService();
