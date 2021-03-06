import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { NFT_ADDRESS, NODE_PROVIDER } from "../constant";
import { NFT_ABI } from "../abi/abi";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const createEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(contractABI, signer);

    return transactionsContract;
};

export const TransactionsProvider = ({ children }) => {
    const [formData, setformData] = useState({ addressTo: "", tokenID: "" });
    const [currentAccount, setCurrentAccount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const getAllTransactions = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();

                const availableTransactions = await transactionsContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));

                console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum is not present");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_accounts" });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);

                getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const mintToken = async()=>{
        const WEB3 = new Web3(NODE_PROVIDER);
        const erc721Contract = new WEB3.eth.Contract(NFT_ABI, NFT_ADDRESS)
        const mint = erc721Contract.methods.mint(
            // USER_INPUT
        ).encodeABI()
        params = [{
            from: currentAccount,
            to: NFT_ADDRESS,
            gas: WEB3.utils.toHex('400000'),
            gasPrice: WEB3.utils.toHex(WEB3.utils.toWei('21', 'gwei')),
            data: mint
        }]

        window.ethereum.request({
            method: 'eth_sendTransaction',
            params: params
        })
    }

    const transferToken = async()=>{
        const Web3 = require('web3')
        const WEB3 = new Web3(NODE_PROVIDER);
        const erc721Contract = new WEB3.eth.Contract(NFT_ABI, NFT_ADDRESS)
        const mint = erc721Contract.methods.transferFrom(
            currentAccount,
            formData.addressTo,
            formData.tokenID
        ).encodeABI()
        params = [{
            from: currentAccount,
            to: NFT_ADDRESS,
            gas: WEB3.utils.toHex('200000'),
            gasPrice: WEB3.utils.toHex(WEB3.utils.toWei('21', 'gwei')),
            data: mint
        }]
        
        window.ethereum.request({
            method: 'eth_sendTransaction',
            params: params
        })
    }


    const checkIfTransactionsExists = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                const currentTransactionCount = await transactionsContract.getTransactionCount();

                window.localStorage.setItem("transactionCount", currentTransactionCount);
            }
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_requestAccounts", });

            setCurrentAccount(accounts[0]);
            window.location.reload();
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    const sendTransaction = async () => {
        try {
            if (ethereum) {
                const { addressTo, amount, keyword, message } = formData;
                const transactionsContract = createEthereumContract();
                const parsedAmount = ethers.utils.parseEther(amount);

                await ethereum.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: currentAccount,
                        to: addressTo,
                        gas: "0x5208",
                        value: parsedAmount._hex,
                    }],
                });

                const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

                setIsLoading(true);
                console.log(`Loading - ${transactionHash.hash}`);
                await transactionHash.wait();
                console.log(`Success - ${transactionHash.hash}`);
                setIsLoading(false);

                const transactionsCount = await transactionsContract.getTransactionCount();

                setTransactionCount(transactionsCount.toNumber());
                window.location.reload();
            } else {
                console.log("No ethereum object");
            }
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExists();
    }, [transactionCount]);

    return (
        <TransactionContext.Provider
            value={{
                transactionCount,
                connectWallet,
                transactions,
                currentAccount,
                isLoading,
                sendTransaction,
                handleChange,
                formData,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};