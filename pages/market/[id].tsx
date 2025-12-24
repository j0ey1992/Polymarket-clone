import moment from "moment";
import Head from "next/head";
import Img from "next/image";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import ChartContainer from "../../components/Chart/ChartContainer";
import Navbar from "../../components/Navbar";
import { useData } from "../../contexts/DataContext";

export interface MarketProps {
  id: string;
  title: string;
  imageHash: string;
  totalAmount: number;
  totalYes: number;
  totalNo: number;
  description: string;
  endTimestamp: number;
  resolverUrl: string;
}

// Icon components
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VolumeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Details = () => {
  const router = useRouter();
  const { id } = router.query;
  const { polymarket, account, loadWeb3, loading, polyToken } = useData();
  const [market, setMarket] = useState<MarketProps>();
  const [selected, setSelected] = useState<"YES" | "NO">("YES");
  const [dataLoading, setDataLoading] = useState(true);
  const [button, setButton] = useState<string>("Place Trade");
  const [input, setInput] = useState("");

  const getMarketData = useCallback(async () => {
    var data = await polymarket.methods.questions(id).call({ from: account });
    setMarket({
      id: data.id,
      title: data.question,
      imageHash: data.creatorImageHash,
      totalAmount: parseInt(data.totalAmount),
      totalYes: parseInt(data.totalYesAmount),
      totalNo: parseInt(data.totalNoAmount),
      description: data.description,
      endTimestamp: parseInt(data.endTimestamp),
      resolverUrl: data.resolverUrl,
    });
    setDataLoading(false);
  }, [account, id, polymarket]);

  const handleTrade = async () => {
    var bal = await polyToken.methods.balanceOf(account).call();
    setButton("Processing...");

    if (input && selected === "YES") {
      if (parseInt(input) < parseInt(Web3.utils.fromWei(bal, "ether"))) {
        await polyToken.methods
          .approve(polymarket._address, Web3.utils.toWei(input, "ether"))
          .send({ from: account });
        await polymarket.methods
          .addYesBet(id, Web3.utils.toWei(input, "ether"))
          .send({ from: account });
      }
    } else if (input && selected === "NO") {
      if (parseInt(input) < parseInt(Web3.utils.fromWei(bal, "ether"))) {
        await polyToken.methods
          .approve(polymarket._address, Web3.utils.toWei(input, "ether"))
          .send({ from: account });
        await polymarket.methods
          .addNoBet(id, Web3.utils.toWei(input, "ether"))
          .send({ from: account });
      }
    }
    await getMarketData();
    setButton("Place Trade");
    setInput("");
  };

  useEffect(() => {
    loadWeb3().then(() => {
      if (!loading) getMarketData();
    });
  }, [loading]);

  const yesPercent = market?.totalAmount
    ? ((market.totalYes * 100) / market.totalAmount).toFixed(1)
    : "50.0";
  const noPercent = market?.totalAmount
    ? ((market.totalNo * 100) / market.totalAmount).toFixed(1)
    : "50.0";

  return (
    <div className="min-h-screen bg-dark-900">
      <Head>
        <title>{market?.title || "Market"} - PredictMarket</title>
        <meta name="description" content="Trade on prediction markets" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="container-app py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors duration-200 mb-6"
        >
          <BackIcon />
          <span>Back to Markets</span>
        </button>

        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-dark-600 border-t-accent-blue rounded-full animate-spin" />
            <p className="text-text-muted mt-4">Loading market data...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Market Header Card */}
              <div className="glass-card p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0 ring-1 ring-dark-600">
                    <Img
                      src={`https://ipfs.infura.io/ipfs/${market?.imageHash}`}
                      width={64}
                      height={64}
                      className="object-cover"
                      alt={market?.title || "Market"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-accent-blue/20 text-accent-blue rounded-full mb-2">
                      Active Market
                    </span>
                    <h1 className="text-xl font-bold text-text-primary mb-2">
                      {market?.title}
                    </h1>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-dark-750 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-text-muted mb-1">
                      <CalendarIcon />
                      <span className="text-xs uppercase tracking-wider">Ends On</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {market?.endTimestamp
                        ? moment(market.endTimestamp).format("MMM D, YYYY")
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-dark-750 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-text-muted mb-1">
                      <VolumeIcon />
                      <span className="text-xs uppercase tracking-wider">Volume</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {Web3.utils.fromWei(market?.totalAmount.toString() ?? "0", "ether")} POLY
                    </p>
                  </div>
                  <div className="bg-dark-750 rounded-xl p-4">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Yes Price</span>
                    <p className="text-lg font-bold text-success-light">{yesPercent}%</p>
                  </div>
                  <div className="bg-dark-750 rounded-xl p-4">
                    <span className="text-xs text-text-muted uppercase tracking-wider">No Price</span>
                    <p className="text-lg font-bold text-danger-light">{noPercent}%</p>
                  </div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Price History</h2>
                <div className="h-[300px]">
                  <ChartContainer questionId={market?.id ?? "0"} />
                </div>
              </div>

              {/* Description Card */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">About this Market</h2>
                <p className="text-text-secondary leading-relaxed">
                  {market?.description || "No description available."}
                </p>

                {market?.resolverUrl && (
                  <a
                    href={market.resolverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-dark-750 hover:bg-dark-700 rounded-lg text-accent-blue transition-colors duration-200"
                  >
                    <LinkIcon />
                    <span className="text-sm">Resolution Source</span>
                  </a>
                )}
              </div>
            </div>

            {/* Trading Panel */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <div className="glass-card p-6 sticky top-24">
                <h2 className="text-lg font-bold text-text-primary mb-6">Trade</h2>

                {/* Outcome Selection */}
                <div className="space-y-3 mb-6">
                  <label className="text-sm text-text-muted">Select Outcome</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelected("YES")}
                      className={`py-4 rounded-xl font-semibold transition-all duration-200 ${
                        selected === "YES"
                          ? "bg-success text-white ring-2 ring-success/50 shadow-glow-green"
                          : "bg-dark-750 text-text-secondary hover:bg-dark-700"
                      }`}
                    >
                      <span className="block text-lg">YES</span>
                      <span className={`text-sm ${selected === "YES" ? "text-white/80" : "text-text-muted"}`}>
                        {yesPercent}%
                      </span>
                    </button>
                    <button
                      onClick={() => setSelected("NO")}
                      className={`py-4 rounded-xl font-semibold transition-all duration-200 ${
                        selected === "NO"
                          ? "bg-danger text-white ring-2 ring-danger/50 shadow-glow-red"
                          : "bg-dark-750 text-text-secondary hover:bg-dark-700"
                      }`}
                    >
                      <span className="block text-lg">NO</span>
                      <span className={`text-sm ${selected === "NO" ? "text-white/80" : "text-text-muted"}`}>
                        {noPercent}%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-2 block">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="0.00"
                      className="input-dark pr-20 text-lg"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center space-x-2">
                      <span className="text-text-muted text-sm">POLY</span>
                      <button
                        onClick={() => setInput("100")}
                        className="text-accent-blue text-sm font-medium hover:text-accent-cyan transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trade Summary */}
                {input && parseFloat(input) > 0 && (
                  <div className="bg-dark-750 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">You Pay</span>
                      <span className="text-text-primary font-medium">{input} POLY</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Est. Shares</span>
                      <span className="text-text-primary font-medium">
                        {(parseFloat(input) / (parseFloat(selected === "YES" ? yesPercent : noPercent) / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-dark-600 pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Potential Return</span>
                        <span className="text-success-light font-semibold">
                          {(parseFloat(input) / (parseFloat(selected === "YES" ? yesPercent : noPercent) / 100)).toFixed(2)} POLY
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trade Button */}
                <button
                  onClick={handleTrade}
                  disabled={button !== "Place Trade" || !input || parseFloat(input) <= 0}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                    button !== "Place Trade" || !input || parseFloat(input) <= 0
                      ? "bg-dark-600 text-text-muted cursor-not-allowed"
                      : selected === "YES"
                      ? "bg-success hover:bg-success-dark shadow-glow-green"
                      : "bg-danger hover:bg-danger-dark shadow-glow-red"
                  }`}
                >
                  {button}
                </button>

                <p className="text-xs text-text-muted text-center mt-4">
                  By trading, you agree to the terms and conditions.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Details;
