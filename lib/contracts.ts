/**
 * Contract addresses and ABIs for Cronos Prediction Market
 */

// Contract addresses (update these after deployment)
export const CONTRACTS = {
  // Cronos Mainnet
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // USDC on Cronos
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  PREDICTION_MARKET: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
};

// Minimal ERC20 ABI for USDC
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// Treasury ABI (minimal for frontend use)
export const TREASURY_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStats',
    outputs: [
      { name: 'deposits', type: 'uint256' },
      { name: 'profits', type: 'uint256' },
      { name: 'balance', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Withdrawal',
    type: 'event',
  },
] as const;

// PredictionMarket ABI (minimal for frontend use)
export const PREDICTION_MARKET_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'isYes', type: 'bool' },
      { name: 'amount', type: 'uint256' },
      { name: 'minShares', type: 'uint256' },
    ],
    name: 'buyShares',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'isYes', type: 'bool' },
      { name: 'shares', type: 'uint256' },
      { name: 'minAmount', type: 'uint256' },
    ],
    name: 'sellShares',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'bytes32' }],
    name: 'claimWinnings',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    name: 'getUserShares',
    outputs: [
      { name: 'yesShares', type: 'uint256' },
      { name: 'noShares', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'spreadBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// EIP-712 types for order signing
export const ORDER_TYPES = {
  Order: [
    { name: 'marketId', type: 'string' },
    { name: 'side', type: 'string' },
    { name: 'outcome', type: 'string' },
    { name: 'size', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export const DOMAIN = {
  name: 'Kris Market',
  version: '1',
  chainId: 25, // Cronos mainnet
};

// Helper to format USDC amounts (6 decimals)
export const formatUSDC = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / 1e6).toFixed(2);
};

export const parseUSDC = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.floor(num * 1e6).toString();
};
