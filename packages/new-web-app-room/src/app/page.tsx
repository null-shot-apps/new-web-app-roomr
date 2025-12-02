'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export default function SolanaWallet() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Fetch wallet balance
  useEffect(() => {
    if (publicKey) {
      const getBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };
      getBalance();
    }
  }, [publicKey, connection]);

  // Fetch transaction history
  useEffect(() => {
    if (publicKey) {
      const getTransactions = async () => {
        try {
          const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
          const txs = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature);
              return {
                signature: sig.signature,
                slot: sig.slot,
                timestamp: sig.blockTime,
                fee: tx?.meta?.fee || 0,
                status: tx?.meta?.err ? 'Failed' : 'Success'
              };
            })
          );
          setTransactions(txs);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        }
      };
      getTransactions();
    }
  }, [publicKey, connection]);

  // Send SOL transaction
  const sendSOL = async () => {
    if (!publicKey || !recipient || !amount) return;
    
    setLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipient);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh balance and transactions
      const newBalance = await connection.getBalance(publicKey);
      setBalance(newBalance / LAMPORTS_PER_SOL);
      
      setRecipient('');
      setAmount('');
      alert(`Transaction successful! Signature: ${signature}`);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
    }
    setLoading(false);
  };

  // Generate new wallet address
  const generateNewAddress = () => {
    const newKeypair = new PublicKey(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    setNewWalletAddress(newKeypair.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Solana Wallet</h1>
          <WalletMultiButton />
        </div>

        {publicKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wallet Overview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Wallet Overview</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300">Address:</p>
                  <p className="font-mono text-sm break-all bg-black/20 p-2 rounded">
                    {publicKey.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-300">Balance:</p>
                  <p className="text-3xl font-bold">
                    {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Send SOL */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Send SOL</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    placeholder="Enter recipient's public key"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Amount (SOL)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    placeholder="0.00"
                    step="0.001"
                  />
                </div>
                <button
                  onClick={sendSOL}
                  disabled={loading || !recipient || !amount}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-all"
                >
                  {loading ? 'Sending...' : 'Send SOL'}
                </button>
              </div>
            </div>

            {/* Generate New Address */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Generate New Address</h2>
              <div className="space-y-4">
                <button
                  onClick={generateNewAddress}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 py-3 px-6 rounded-lg font-semibold transition-all"
                >
                  Generate New Wallet Address
                </button>
                {newWalletAddress && (
                  <div>
                    <p className="text-gray-300 mb-2">New Address:</p>
                    <p className="font-mono text-sm break-all bg-black/20 p-2 rounded">
                      {newWalletAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={index} className="bg-black/20 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'Success' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {tx.status}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                      <p className="font-mono text-xs break-all text-gray-300">
                        {tx.signature}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Fee: {(tx.fee / LAMPORTS_PER_SOL).toFixed(6)} SOL
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No transactions found</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">
                Connect your Solana wallet to view your balance, send transactions, and manage your assets.
              </p>
              <WalletMultiButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

