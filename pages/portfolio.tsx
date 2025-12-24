import Head from "next/head";
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import Navbar from "../components/Navbar";
import { PortfolioMarketCard } from "../components/PortfolioMarketCard";
import { useData } from "../contexts/DataContext";

export interface MarketProps {
  id: string;
  title?: string;
  imageHash?: string;
  totalAmount?: string;
  totalYes?: string;
  totalNo?: string;
  userYes?: string;
  hasResolved?: boolean;
  userNo?: string;
  timestamp?: string;
  endTimestamp?: string;
}

export interface QuestionsProps {
  id: string;
  title?: string;
  imageHash?: string;
  totalAmount?: string;
  totalYes?: string;
  totalNo?: string;
  hasResolved?: boolean;
  endTimestamp?: string;
}

// Icon components
const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Portfolio = () => {
  const { polymarket, account, loadWeb3, loading } = useData();
  const [markets, setMarkets] = useState<MarketProps[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [allQuestions, setAllQuestions] = useState<QuestionsProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      var totalQuestions = await polymarket.methods
        .totalQuestions()
        .call({ from: account });

      const questionsData: QuestionsProps[] = [];
      for (var i = 0; i < totalQuestions; i++) {
        var questions = await polymarket.methods
          .questions(i)
          .call({ from: account });
        questionsData.push({
          id: questions.id,
          title: questions.question,
          imageHash: questions.creatorImageHash,
          totalAmount: questions.totalAmount,
          totalYes: questions.totalYesAmount,
          totalNo: questions.totalNoAmount,
          hasResolved: questions.eventCompleted,
          endTimestamp: questions.endTimestamp,
        });
      }
      setAllQuestions(questionsData);

      var dataArray: MarketProps[] = [];
      var totalPortValue = 0;
      for (var i = 0; i < totalQuestions; i++) {
        var data = await polymarket.methods
          .getGraphData(i)
          .call({ from: account });
        data["0"].forEach((item: any) => {
          if (item[0] == account) {
            dataArray.push({
              id: i.toString(),
              userYes: item[1].toString(),
              timestamp: item[2].toString(),
            });
            totalPortValue += parseInt(item[1]);
          }
        });
        data["1"].forEach((item: any) => {
          if (item[0] == account) {
            dataArray.push({
              id: i.toString(),
              userNo: item[1].toString(),
              timestamp: item[2].toString(),
            });
            totalPortValue += parseInt(item[1]);
          }
        });
      }
      setPortfolioValue(totalPortValue);

      for (var i = 0; i < dataArray.length; i++) {
        var question = questionsData.find((item) => item.id == dataArray[i].id);
        if (question) {
          dataArray[i].title = question.title;
          dataArray[i].imageHash = question.imageHash;
          dataArray[i].totalAmount = question.totalAmount;
          dataArray[i].totalYes = question.totalYes;
          dataArray[i].totalNo = question.totalNo;
          dataArray[i].hasResolved = question.hasResolved;
          dataArray[i].endTimestamp = question.endTimestamp;
        }
      }
      setMarkets(dataArray);
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, polymarket]);

  useEffect(() => {
    loadWeb3().then(() => {
      if (!loading) {
        getMarkets();
      }
    });
  }, [loading]);

  const portfolioValueFormatted = Web3.utils.fromWei(portfolioValue.toString());

  return (
    <div className="min-h-screen bg-dark-900">
      <Head>
        <title>Portfolio - PredictMarket</title>
        <meta name="description" content="Your prediction market portfolio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="container-app py-6">
        {/* Portfolio Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Portfolio</h1>
          <p className="text-text-muted">Track your positions and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Portfolio Value */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-sm">Portfolio Value</span>
                <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                  <WalletIcon />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {parseFloat(portfolioValueFormatted).toFixed(2)}
                <span className="text-lg text-text-muted ml-2">POLY</span>
              </p>
            </div>
          </div>

          {/* Open Positions */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-sm">Open Positions</span>
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success-light">
                  <ChartIcon />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {markets.length}
                <span className="text-lg text-text-muted ml-2">markets</span>
              </p>
            </div>
          </div>

          {/* Performance */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-sm">Total Returns</span>
                <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                  <TrendingUpIcon />
                </div>
              </div>
              <p className="text-3xl font-bold text-success-light">
                +0.00%
              </p>
            </div>
          </div>
        </div>

        {/* Positions Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Your Positions</h2>
            <span className="text-sm text-text-muted">{markets.length} position(s)</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-dark-600 border-t-accent-blue rounded-full animate-spin" />
              <p className="text-text-muted mt-4">Loading your positions...</p>
            </div>
          ) : markets.length > 0 ? (
            <div className="space-y-4">
              {markets.map((market, index) => (
                <PortfolioMarketCard
                  key={`${market.id}-${index}`}
                  id={market.id}
                  title={market.title!}
                  imageHash={market.imageHash!}
                  totalAmount={market.totalAmount!}
                  totalYes={market.totalYes!}
                  totalNo={market.totalNo!}
                  userYes={market.userYes!}
                  userNo={market.userNo!}
                  hasResolved={market.hasResolved!}
                  timestamp={market.timestamp!}
                  endTimestamp={market.endTimestamp!}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
                <WalletIcon />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No positions yet</h3>
              <p className="text-text-muted mb-6">
                Start trading on prediction markets to build your portfolio
              </p>
              <a href="/" className="btn-primary inline-block">
                Explore Markets
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Portfolio;
