declare let window: any;
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import Web3 from "web3";
import { CONTRACTS, ERC20_ABI, TREASURY_ABI, PREDICTION_MARKET_ABI, parseUSDC, formatUSDC, DOMAIN, ORDER_TYPES } from "../lib/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Market {
  id: string;
  polymarketConditionId: string;
  question: string;
  description?: string;
  imageUrl?: string;
  endDate?: string;
  resolved: boolean;
  outcome?: string;
  volume?: number;
  liquidity?: number;
  currentPrice?: {
    yes: number;
    no: number;
  };
}

export interface Position {
  id: string;
  marketId: string;
  side: "YES" | "NO";
  size: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
}

interface DataContextProps {
  account: string;
  loading: boolean;
  markets: Market[];
  positions: Position[];
  usdcBalance: string;
  treasuryBalance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchMarkets: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  getMarket: (id: string) => Promise<Market | null>;
  refreshBalances: () => Promise<void>;
  approveUSDC: (amount: string) => Promise<boolean>;
  depositUSDC: (amount: string) => Promise<boolean>;
  withdrawUSDC: (amount: string) => Promise<boolean>;
  signOrder: (order: OrderData) => Promise<string | null>;
}

interface OrderData {
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  size: number;
}

const DataContext = createContext<DataContextProps>({
  account: "",
  loading: true,
  markets: [],
  positions: [],
  usdcBalance: "0",
  treasuryBalance: "0",
  connectWallet: async () => {},
  disconnectWallet: () => {},
  fetchMarkets: async () => {},
  fetchPositions: async () => {},
  getMarket: async () => null,
  refreshBalances: async () => {},
  approveUSDC: async () => false,
  depositUSDC: async () => false,
  withdrawUSDC: async () => false,
  signOrder: async () => null,
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useProviderData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export const useData = () => useContext<DataContextProps>(DataContext);

export const useProviderData = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [web3, setWeb3] = useState<Web3 | null>(null);

  // Initialize web3 when account changes
  useEffect(() => {
    if (account && window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    }
  }, [account]);

  // Refresh balances when account changes
  useEffect(() => {
    if (account && web3) {
      refreshBalances();
    }
  }, [account, web3]);

  const refreshBalances = useCallback(async () => {
    if (!account || !web3) return;

    try {
      // Get USDC balance
      if (CONTRACTS.USDC) {
        const usdcContract = new web3.eth.Contract(ERC20_ABI as any, CONTRACTS.USDC);
        const balance = await usdcContract.methods.balanceOf(account).call();
        setUsdcBalance(formatUSDC(balance as string));
      }

      // Get Treasury balance
      if (CONTRACTS.TREASURY) {
        const treasuryContract = new web3.eth.Contract(TREASURY_ABI as any, CONTRACTS.TREASURY);
        const balance = await treasuryContract.methods.getUserBalance(account).call();
        setTreasuryBalance(formatUSDC(balance as string));
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }, [account, web3]);

  const connectWallet = useCallback(async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        // Try to switch to Cronos network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x19' }], // 25 in hex (Cronos mainnet)
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x19',
                chainName: 'Cronos Mainnet',
                rpcUrls: ['https://evm.cronos.org'],
                nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
                blockExplorerUrls: ['https://cronoscan.com']
              }],
            });
          }
        }

        setAccount(accounts[0]);
        setLoading(false);
      } else {
        alert("Please install MetaMask or a Web3 wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount("");
    setPositions([]);
    setUsdcBalance("0");
    setTreasuryBalance("0");
    setWeb3(null);
  }, []);

  const approveUSDC = useCallback(async (amount: string): Promise<boolean> => {
    if (!account || !web3 || !CONTRACTS.USDC || !CONTRACTS.TREASURY) {
      console.error("Missing account, web3, or contract addresses");
      return false;
    }

    try {
      const usdcContract = new web3.eth.Contract(ERC20_ABI as any, CONTRACTS.USDC);
      const amountWei = parseUSDC(amount);

      // Check current allowance
      const currentAllowance = await usdcContract.methods
        .allowance(account, CONTRACTS.TREASURY)
        .call() as string;

      if (BigInt(currentAllowance) >= BigInt(amountWei)) {
        return true; // Already approved
      }

      // Approve max amount for convenience
      const maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      await usdcContract.methods
        .approve(CONTRACTS.TREASURY, maxAmount)
        .send({ from: account });

      return true;
    } catch (error) {
      console.error("Error approving USDC:", error);
      return false;
    }
  }, [account, web3]);

  const depositUSDC = useCallback(async (amount: string): Promise<boolean> => {
    if (!account || !web3 || !CONTRACTS.TREASURY) {
      console.error("Missing account, web3, or Treasury address");
      return false;
    }

    try {
      // First approve
      const approved = await approveUSDC(amount);
      if (!approved) {
        return false;
      }

      const treasuryContract = new web3.eth.Contract(TREASURY_ABI as any, CONTRACTS.TREASURY);
      const amountWei = parseUSDC(amount);

      await treasuryContract.methods
        .deposit(account, amountWei)
        .send({ from: account });

      // Sync deposit with backend
      try {
        await fetch(`${API_BASE_URL}/api/balance/${account}/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount) }),
        });
      } catch (e) {
        console.warn("Failed to sync deposit with backend:", e);
      }

      // Refresh balances
      await refreshBalances();
      return true;
    } catch (error) {
      console.error("Error depositing USDC:", error);
      return false;
    }
  }, [account, web3, approveUSDC, refreshBalances]);

  const withdrawUSDC = useCallback(async (amount: string): Promise<boolean> => {
    if (!account || !web3 || !CONTRACTS.TREASURY) {
      console.error("Missing account, web3, or Treasury address");
      return false;
    }

    try {
      // First sync withdraw with backend to reduce balance
      try {
        const response = await fetch(`${API_BASE_URL}/api/balance/${account}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount) }),
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Insufficient balance');
        }
      } catch (e: any) {
        console.error("Failed to sync withdraw with backend:", e);
        throw new Error(e.message || 'Withdrawal failed');
      }

      const treasuryContract = new web3.eth.Contract(TREASURY_ABI as any, CONTRACTS.TREASURY);
      const amountWei = parseUSDC(amount);

      await treasuryContract.methods
        .withdraw(account, amountWei)
        .send({ from: account });

      // Refresh balances
      await refreshBalances();
      return true;
    } catch (error) {
      console.error("Error withdrawing USDC:", error);
      return false;
    }
  }, [account, web3, refreshBalances]);

  const signOrder = useCallback(async (order: OrderData): Promise<string | null> => {
    if (!account || !window.ethereum) {
      console.error("No account connected");
      return null;
    }

    try {
      const nonce = Date.now();
      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          ...ORDER_TYPES,
        },
        primaryType: 'Order',
        domain: DOMAIN,
        message: {
          marketId: order.marketId,
          side: order.side,
          outcome: order.outcome,
          size: parseUSDC(order.size.toString()),
          nonce: nonce,
          deadline: deadline,
        },
      };

      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [account, JSON.stringify(typedData)],
      });

      return JSON.stringify({
        signature,
        nonce,
        deadline,
      });
    } catch (error) {
      console.error("Error signing order:", error);
      return null;
    }
  }, [account]);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/markets?active=true&limit=50`);
      const data = await response.json();

      if (data.success) {
        setMarkets(data.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    if (!account) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/positions?address=${account}`);
      const data = await response.json();

      if (data.success) {
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  }, [account]);

  const getMarket = useCallback(async (id: string): Promise<Market | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/markets/${id}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching market:", error);
      return null;
    }
  }, []);

  return {
    account,
    loading,
    markets,
    positions,
    usdcBalance,
    treasuryBalance,
    connectWallet,
    disconnectWallet,
    fetchMarkets,
    fetchPositions,
    getMarket,
    refreshBalances,
    approveUSDC,
    depositUSDC,
    withdrawUSDC,
    signOrder,
  };
};
